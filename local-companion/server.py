#!/usr/bin/env python3
"""Quest Intelligence 360 local companion.

Runs only on 127.0.0.1, serves the frontend, stores uploaded files and extracted
text on the local computer, and can watch a locally synchronized SharePoint
folder. No API key or paid service is required.
"""

from __future__ import annotations

import argparse
import hashlib
import html
import io
import json
import mimetypes
import os
import re
import shutil
import sqlite3
import sys
import threading
import time
import urllib.request
import uuid
import webbrowser
import zipfile
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "local-data"
UPLOAD_DIR = DATA_DIR / "uploads"
CACHE_DIR = DATA_DIR / "frontend-cache"
DB_PATH = DATA_DIR / "quest-local.db"
BASE_URL = "https://atanubarik.github.io/quest-intelligence-360/"
DEFAULT_PORT = 8765
MAX_UPLOAD = 250 * 1024 * 1024

FRONTEND_ASSETS = [
    "index.html",
    *(f"chunks/chunk-{index:02d}.txt" for index in range(7)),
    "integrations/laboratory-news-monitor.js",
    "integrations/enterprise-insights-engine/loader.js",
    "integrations/competitor-intelligence-profiles/loader.js",
    "integrations/strategic-news-social-hubs.js",
    "integrations/laboratory-news-sync.js",
    "integrations/quest-brand-system.js",
    "integrations/local-data-fetch-bridge.js",
    "integrations/no-cost-live-operations.js",
    "integrations/live-governance-panels.js",
    "integrations/microsoft-local-bridge.js",
    "data/project-tracker.json",
    "data/laboratory-news.json",
    "data/laboratory-email-status.json",
    "data/laboratory-ai-health.json",
    "data/social-intelligence.json",
    "data/live-operations-status.json",
    "data/microsoft-integration.json",
]


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def ensure_dirs() -> None:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)


def db_connect() -> sqlite3.Connection:
    ensure_dirs()
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS documents (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          stored_name TEXT NOT NULL,
          project TEXT,
          evidence_type TEXT,
          approved INTEGER NOT NULL DEFAULT 1,
          size INTEGER NOT NULL DEFAULT 0,
          sha256 TEXT NOT NULL,
          mime_type TEXT,
          uploaded_at TEXT NOT NULL,
          source_path TEXT,
          extracted_text TEXT
        )
        """
    )
    connection.execute("CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project)")
    connection.execute("CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(evidence_type)")
    connection.commit()
    return connection


def safe_name(name: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._ -]+", "_", Path(name).name).strip(" .")
    return cleaned[:180] or "uploaded-file"


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def xml_text(payload: bytes) -> str:
    try:
        root = ET.fromstring(payload)
    except ET.ParseError:
        return ""
    return " ".join(text.strip() for text in root.itertext() if text and text.strip())


def extract_zip_office(path: Path, extension: str) -> str:
    try:
        with zipfile.ZipFile(path) as archive:
            names = archive.namelist()
            if extension == ".docx":
                targets = [name for name in names if name == "word/document.xml" or name.startswith("word/header") or name.startswith("word/footer")]
            elif extension == ".pptx":
                targets = sorted(name for name in names if name.startswith("ppt/slides/slide") and name.endswith(".xml"))
            elif extension == ".xlsx":
                targets = [name for name in names if name == "xl/sharedStrings.xml" or (name.startswith("xl/worksheets/sheet") and name.endswith(".xml"))]
            else:
                targets = []
            return "\n\n".join(xml_text(archive.read(name)) for name in targets if name in names)
    except (OSError, zipfile.BadZipFile):
        return ""


def extract_text(path: Path) -> str:
    extension = path.suffix.lower()
    if extension in {".txt", ".md", ".csv", ".tsv", ".json", ".html", ".htm", ".xml"}:
        try:
            value = path.read_text(encoding="utf-8", errors="replace")
            if extension in {".html", ".htm"}:
                value = re.sub(r"<script[\s\S]*?</script>|<style[\s\S]*?</style>", " ", value, flags=re.I)
                value = html.unescape(re.sub(r"<[^>]+>", " ", value))
            return re.sub(r"\s+", " ", value).strip()
        except OSError:
            return ""
    if extension in {".docx", ".pptx", ".xlsx"}:
        return re.sub(r"\s+", " ", extract_zip_office(path, extension)).strip()
    return ""


def upsert_document(file_path: Path, name: str, project: str, evidence_type: str, approved: bool, extracted: str = "", source_path: str = "") -> dict:
    data = file_path.read_bytes()
    digest = sha256_bytes(data)
    connection = db_connect()
    existing = connection.execute("SELECT * FROM documents WHERE sha256 = ?", (digest,)).fetchone()
    if existing:
        connection.close()
        return dict(existing)
    identifier = uuid.uuid4().hex
    stored_name = f"{identifier}_{safe_name(name)}"
    destination = UPLOAD_DIR / stored_name
    if file_path.resolve() != destination.resolve():
        shutil.copy2(file_path, destination)
    text = extracted.strip() or extract_text(destination)
    mime_type = mimetypes.guess_type(name)[0] or "application/octet-stream"
    uploaded_at = utc_now()
    connection.execute(
        """INSERT INTO documents
        (id,name,stored_name,project,evidence_type,approved,size,sha256,mime_type,uploaded_at,source_path,extracted_text)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
        (identifier, safe_name(name), stored_name, project, evidence_type, 1 if approved else 0, len(data), digest, mime_type, uploaded_at, source_path, text),
    )
    connection.commit()
    row = connection.execute("SELECT * FROM documents WHERE id = ?", (identifier,)).fetchone()
    connection.close()
    return dict(row)


def parse_multipart(headers, body: bytes) -> tuple[dict[str, str], tuple[str, bytes, str] | None]:
    content_type = headers.get("Content-Type", "")
    match = re.search(r"boundary=(?:\"([^\"]+)\"|([^;]+))", content_type)
    if not match:
        raise ValueError("Missing multipart boundary")
    boundary = (match.group(1) or match.group(2)).encode()
    fields: dict[str, str] = {}
    upload = None
    for part in body.split(b"--" + boundary):
        part = part.strip(b"\r\n-")
        if not part or b"\r\n\r\n" not in part:
            continue
        header_bytes, payload = part.split(b"\r\n\r\n", 1)
        payload = payload.rstrip(b"\r\n")
        header_text = header_bytes.decode("utf-8", errors="replace")
        name_match = re.search(r'name="([^"]+)"', header_text)
        if not name_match:
            continue
        field_name = name_match.group(1)
        filename_match = re.search(r'filename="([^"]*)"', header_text)
        if filename_match:
            mime_match = re.search(r"Content-Type:\s*([^\r\n]+)", header_text, flags=re.I)
            upload = (safe_name(filename_match.group(1)), payload, (mime_match.group(1).strip() if mime_match else "application/octet-stream"))
        else:
            fields[field_name] = payload.decode("utf-8", errors="replace")
    return fields, upload


def file_public(row: sqlite3.Row | dict) -> dict:
    item = dict(row)
    item.pop("stored_name", None)
    item.pop("extracted_text", None)
    item["approved"] = bool(item.get("approved"))
    return item


def search_documents(query: str, limit: int = 20) -> list[dict]:
    terms = [term.lower() for term in re.findall(r"[A-Za-z0-9][A-Za-z0-9_-]{2,}", query)][:20]
    if not terms:
        return []
    connection = db_connect()
    rows = connection.execute("SELECT * FROM documents ORDER BY uploaded_at DESC").fetchall()
    connection.close()
    results = []
    for row in rows:
        haystack = " ".join([row["name"] or "", row["project"] or "", row["evidence_type"] or "", row["extracted_text"] or ""]).lower()
        score = sum(haystack.count(term) for term in terms)
        if not score:
            continue
        text = row["extracted_text"] or ""
        lower = text.lower()
        positions = [lower.find(term) for term in terms if lower.find(term) >= 0]
        start = max(0, (min(positions) if positions else 0) - 130)
        snippet = re.sub(r"\s+", " ", text[start:start + 520]).strip()
        results.append({**file_public(row), "score": score, "snippet": snippet})
    results.sort(key=lambda item: (-item["score"], item.get("uploaded_at", "")), reverse=False)
    return results[: max(1, min(limit, 100))]


def cache_frontend(force: bool = False) -> dict:
    ensure_dirs()
    fetched, failed = [], []
    for asset in FRONTEND_ASSETS:
        target = CACHE_DIR / asset
        if target.exists() and not force:
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        try:
            request = urllib.request.Request(BASE_URL + asset, headers={"User-Agent": "QuestLocalCompanion/1.0", "Cache-Control": "no-cache"})
            with urllib.request.urlopen(request, timeout=45) as response:
                target.write_bytes(response.read())
            fetched.append(asset)
        except Exception as exc:  # noqa: BLE001
            failed.append({"asset": asset, "error": str(exc)})
    return {"fetched": fetched, "failed": failed, "cache_dir": str(CACHE_DIR)}


def scan_watch_folder(folder: Path) -> int:
    if not folder.exists():
        return 0
    count = 0
    allowed = {".pdf", ".docx", ".pptx", ".xlsx", ".xls", ".csv", ".tsv", ".json", ".txt", ".md", ".html", ".htm"}
    for path in folder.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in allowed:
            continue
        project = path.parent.name if path.parent != folder else "SharePoint sync"
        before = db_connect().execute("SELECT COUNT(*) FROM documents").fetchone()[0]
        upsert_document(path, path.name, project, "SharePoint synchronized file", True, source_path=str(path))
        connection = db_connect()
        after = connection.execute("SELECT COUNT(*) FROM documents").fetchone()[0]
        connection.close()
        if after > before:
            count += 1
    return count


class Handler(SimpleHTTPRequestHandler):
    server_version = "QuestLocalCompanion/1.0"

    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(HTTPStatus.NO_CONTENT)
        self.end_headers()

    def json_response(self, payload: dict | list, status: int = 200) -> None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def body_bytes(self) -> bytes:
        length = int(self.headers.get("Content-Length", "0"))
        if length > MAX_UPLOAD:
            raise ValueError("Upload exceeds the 250 MB local limit")
        return self.rfile.read(length)

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        if parsed.path == "/api/health":
            connection = db_connect()
            file_count = connection.execute("SELECT COUNT(*) FROM documents").fetchone()[0]
            total_bytes = connection.execute("SELECT COALESCE(SUM(size),0) FROM documents").fetchone()[0]
            connection.close()
            return self.json_response({"status":"ready","base_url":f"http://127.0.0.1:{self.server.server_port}","file_count":file_count,"stored_bytes":total_bytes,"watch_folder":str(getattr(self.server, "watch_folder", "") or ""),"time":utc_now()})
        if parsed.path == "/api/files":
            connection = db_connect()
            rows = connection.execute("SELECT * FROM documents ORDER BY uploaded_at DESC").fetchall()
            connection.close()
            return self.json_response({"files":[file_public(row) for row in rows]})
        if parsed.path.startswith("/api/files/") and parsed.path.endswith("/download"):
            identifier = unquote(parsed.path.split("/")[3])
            connection = db_connect()
            row = connection.execute("SELECT * FROM documents WHERE id = ?", (identifier,)).fetchone()
            connection.close()
            if not row:
                return self.json_response({"error":"File not found"}, 404)
            path = UPLOAD_DIR / row["stored_name"]
            if not path.exists():
                return self.json_response({"error":"Stored file is missing"}, 404)
            data = path.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", row["mime_type"] or "application/octet-stream")
            self.send_header("Content-Disposition", f'attachment; filename="{row["name"]}"')
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            return self.wfile.write(data)
        if parsed.path == "/api/cache-status":
            present = [asset for asset in FRONTEND_ASSETS if (CACHE_DIR / asset).exists()]
            return self.json_response({"present":len(present),"expected":len(FRONTEND_ASSETS),"cache_dir":str(CACHE_DIR)})
        return self.serve_static(parsed.path)

    def serve_static(self, request_path: str) -> None:
        relative = request_path.lstrip("/") or "index.html"
        candidates = [ROOT / relative, CACHE_DIR / relative]
        for candidate in candidates:
            try:
                resolved = candidate.resolve()
                base = ROOT.resolve() if candidate.is_relative_to(ROOT) else CACHE_DIR.resolve()
            except (OSError, ValueError):
                continue
            if not str(resolved).startswith(str(base)) or not resolved.is_file():
                continue
            data = resolved.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", mimetypes.guess_type(str(resolved))[0] or "application/octet-stream")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            return self.wfile.write(data)
        self.send_error(404, "File not found")

    def do_POST(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        try:
            if parsed.path == "/api/upload":
                fields, upload = parse_multipart(self.headers, self.body_bytes())
                if not upload:
                    return self.json_response({"error":"No file supplied"}, 400)
                name, data, _mime = upload
                temporary = DATA_DIR / f".upload-{uuid.uuid4().hex}"
                temporary.write_bytes(data)
                try:
                    row = upsert_document(temporary, name, fields.get("project", "Unclassified"), fields.get("evidence_type", "Other"), fields.get("approved", "true").lower() != "false", fields.get("extracted_text", ""))
                finally:
                    temporary.unlink(missing_ok=True)
                return self.json_response({"status":"stored","file":file_public(row)}, 201)
            if parsed.path == "/api/search":
                payload = json.loads(self.body_bytes().decode("utf-8") or "{}")
                return self.json_response({"results":search_documents(str(payload.get("query", "")), int(payload.get("limit", 20)))})
            if parsed.path == "/api/cache-frontend":
                payload = json.loads(self.body_bytes().decode("utf-8") or "{}")
                return self.json_response(cache_frontend(bool(payload.get("force"))))
            if parsed.path == "/api/scan-watch-folder":
                folder = getattr(self.server, "watch_folder", None)
                return self.json_response({"indexed":scan_watch_folder(folder) if folder else 0})
        except (ValueError, json.JSONDecodeError) as exc:
            return self.json_response({"error":str(exc)}, 400)
        except Exception as exc:  # noqa: BLE001
            return self.json_response({"error":str(exc)}, 500)
        self.send_error(404)

    def do_DELETE(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        if not parsed.path.startswith("/api/files/"):
            return self.send_error(404)
        identifier = unquote(parsed.path.split("/")[3])
        connection = db_connect()
        row = connection.execute("SELECT * FROM documents WHERE id = ?", (identifier,)).fetchone()
        if not row:
            connection.close()
            return self.json_response({"error":"File not found"}, 404)
        connection.execute("DELETE FROM documents WHERE id = ?", (identifier,))
        connection.commit()
        connection.close()
        (UPLOAD_DIR / row["stored_name"]).unlink(missing_ok=True)
        return self.json_response({"status":"deleted","id":identifier})

    def log_message(self, format_string: str, *args) -> None:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {format_string % args}")


def watcher_loop(folder: Path, interval: int) -> None:
    while True:
        try:
            indexed = scan_watch_folder(folder)
            if indexed:
                print(f"Indexed {indexed} new file(s) from {folder}")
        except Exception as exc:  # noqa: BLE001
            print(f"Watch-folder scan failed: {exc}")
        time.sleep(interval)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run Quest Intelligence 360 locally with persistent storage.")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    parser.add_argument("--watch-folder", type=Path, default=None, help="Optional locally synchronized SharePoint folder")
    parser.add_argument("--watch-interval", type=int, default=60)
    parser.add_argument("--cache-frontend", action="store_true", help="Download/cache the latest GitHub Pages assets before starting")
    parser.add_argument("--refresh-cache", action="store_true")
    parser.add_argument("--no-browser", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    ensure_dirs()
    db_connect().close()
    if args.cache_frontend or not (ROOT / "index.html").exists():
        result = cache_frontend(force=args.refresh_cache)
        print(f"Frontend cache: {len(result['fetched'])} fetched, {len(result['failed'])} failed")
        for failure in result["failed"]:
            print(" -", failure["asset"], failure["error"])
    server = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    server.watch_folder = args.watch_folder.resolve() if args.watch_folder else None
    if server.watch_folder:
        threading.Thread(target=watcher_loop, args=(server.watch_folder, max(15, args.watch_interval)), daemon=True).start()
    url = f"http://127.0.0.1:{args.port}/?local=1"
    print("Quest Intelligence 360 local companion")
    print("Open:", url)
    print("Storage:", DATA_DIR)
    if server.watch_folder:
        print("Watching:", server.watch_folder)
    if not args.no_browser:
        threading.Timer(1.0, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping local companion.")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
