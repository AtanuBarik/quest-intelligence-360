#!/usr/bin/env python3
"""Zero-cost weekly public-source watcher for Strategic Analysis.

This does not attempt to replace analyst/LLM synthesis. It watches high-value official
source pages for meaningful filing/presentation/result links and records changes for the
weekly ChatGPT review and the dashboard publication pipeline.
"""
from __future__ import annotations

import hashlib
import json
import re
import ssl
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "strategic-analysis.json"
STATE = ROOT / "data" / "strategic-source-watch.json"
UA = "QuestIntelligence360-StrategicSourceWatch/1.0 (+public research demo)"
KEYWORDS = re.compile(
    r"annual|10-k|10-q|8-k|quarter|result|presentation|investor|strategy|strategic|"
    r"acqui|merger|guidance|earnings|financial|oncology|mrd|artificial intelligence|\bai\b|"
    r"digital|laborator|diagnostic|product|launch|partnership|collaboration",
    re.I,
)


def utcnow() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def clean_html(html: str, base: str) -> str:
    html = re.sub(r"(?is)<script\b.*?</script>|<style\b.*?</style>", " ", html)
    hits: list[str] = []
    for match in re.finditer(r'(?is)<a\b[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', html):
        href, label = match.groups()
        label = re.sub(r"(?is)<[^>]+>", " ", label)
        label = re.sub(r"\s+", " ", label).strip()
        full = urllib.parse.urljoin(base, href)
        if KEYWORDS.search(label) or KEYWORDS.search(full):
            hits.append(f"{label[:240]} | {full}")
    if not hits:
        text = re.sub(r"(?is)<[^>]+>", " ", html)
        text = re.sub(r"\s+", " ", text)
        chunks = [x.strip() for x in re.split(r"[.|•]", text) if KEYWORDS.search(x)]
        hits.extend(chunks[:250])
    normalized = "\n".join(dict.fromkeys(hits))
    return normalized[:500_000]


def fetch(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html,application/xhtml+xml"})
    ctx = ssl.create_default_context()
    with urllib.request.urlopen(req, timeout=35, context=ctx) as response:
        raw = response.read(2_500_000)
        final_url = response.geturl()
        charset = response.headers.get_content_charset() or "utf-8"
        html = raw.decode(charset, errors="replace")
        normalized = clean_html(html, final_url)
        digest = hashlib.sha256(normalized.encode("utf-8")).hexdigest()
        return {
            "url": url,
            "final_url": final_url,
            "status": getattr(response, "status", 200),
            "digest": digest,
            "evidence_preview": normalized.splitlines()[:12],
        }


def main() -> None:
    strategic = json.loads(DATA.read_text(encoding="utf-8"))
    sources = strategic.get("source_watch", [])
    old = json.loads(STATE.read_text(encoding="utf-8")) if STATE.exists() else {"sources": []}
    old_by_url = {x.get("url"): x for x in old.get("sources", [])}
    results = []
    changes = []
    checked = utcnow()

    for url in sources:
        previous = old_by_url.get(url, {})
        try:
            current = fetch(url)
            current["checked_at"] = checked
            current["changed"] = bool(previous.get("digest") and previous.get("digest") != current["digest"])
            current["previous_digest"] = previous.get("digest")
            current["error"] = None
            if current["changed"]:
                changes.append({"url": url, "previous_digest": previous.get("digest"), "digest": current["digest"]})
        except Exception as exc:  # network failures should be visible but should not fail all monitoring
            current = {
                "url": url,
                "final_url": previous.get("final_url", url),
                "status": None,
                "digest": previous.get("digest"),
                "previous_digest": previous.get("digest"),
                "checked_at": checked,
                "changed": False,
                "evidence_preview": previous.get("evidence_preview", []),
                "error": f"{type(exc).__name__}: {exc}",
            }
        results.append(current)

    state = {
        "last_checked": checked,
        "last_material_source_change": checked if changes else old.get("last_material_source_change"),
        "changed_source_count": len(changes),
        "changed_sources": changes,
        "sources": results,
        "note": "Source changes are a research trigger. Strategic synthesis is updated separately after evidence review; a changed page is not automatically treated as a strategic change."
    }
    STATE.write_text(json.dumps(state, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Checked {len(results)} strategic sources; detected {len(changes)} changed source pages.")


if __name__ == "__main__":
    main()
