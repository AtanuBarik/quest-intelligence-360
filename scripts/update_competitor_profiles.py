#!/usr/bin/env python3
"""Daily public-web refresh for Quest Intelligence 360 competitor profiles.

No paid API or LLM key is required. The script checks authoritative company /
investor pages plus Google News RSS, extracts high-confidence current signals,
compares them with the previous snapshot, and changes each competitor's
last_updated_at only when normalized monitored information changes.
"""

from __future__ import annotations

import hashlib
import html
import json
import re
import sys
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
REGISTRY_PATH = ROOT / "data" / "competitor-source-registry.json"
OUTPUT_PATH = ROOT / "data" / "competitor-daily-refresh.json"
LOG_PATH = ROOT / "data" / "competitor-refresh-log.json"

USER_AGENT = (
    "QuestIntelligence360/1.0 public-market-research "
    "(+https://github.com/AtanuBarik/quest-intelligence-360)"
)
BROWSER_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0 Safari/537.36"
)
REQUEST_TIMEOUT = 24
MAX_SOURCE_TEXT = 450_000
MAX_NEWS = 6

SIGNAL_TERMS = re.compile(
    r"\b(revenue|net sales|sales|guidance|employee|employees|workforce|chief executive|\bceo\b|"
    r"president|launch|launched|approval|approved|acquire|acquisition|partnership|collaboration|"
    r"expand|expansion|contract|agreement|diagnostic|test|assay|platform|artificial intelligence|\bai\b|"
    r"clinical|laboratory|lab|screening|oncology|genetic|genomic|mrd|liquid biopsy)\b",
    re.I,
)
FINANCIAL_TERMS = re.compile(r"\b(revenue|net sales|sales|guidance|net profit|net income|adjusted ebitda|ebitda)\b", re.I)
MONEY_TERMS = re.compile(r"(?:US\$|A\$|\$|€|£)\s?\d|\b\d+(?:\.\d+)?\s?(?:billion|million|bn|m)\b", re.I)
WORKFORCE_TERMS = re.compile(r"\b(?:approximately|about|nearly|more than|over|~)?\s*([0-9][0-9,\.]+)\s+(?:global\s+)?employees\b", re.I)
VOLATILE_PATTERNS = [
    re.compile(r"\b(last updated|as at|as of)\s+\d{1,2}[:/]", re.I),
    re.compile(r"\b(?:open|high|low|volume|last close)\s+\$?\d", re.I),
    re.compile(r"\bpricing delayed by\b", re.I),
    re.compile(r"\bcookie\b|\bprivacy preference\b|\baccept all\b", re.I),
]


class VisibleTextParser(HTMLParser):
    BLOCK = {"p", "li", "h1", "h2", "h3", "h4", "td", "th", "div", "article", "section", "br"}

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self.skip_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        if tag in {"script", "style", "noscript", "svg"}:
            self.skip_depth += 1
        elif not self.skip_depth and tag in self.BLOCK:
            self.parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag in {"script", "style", "noscript", "svg"} and self.skip_depth:
            self.skip_depth -= 1
        elif not self.skip_depth and tag in self.BLOCK:
            self.parts.append("\n")

    def handle_data(self, data: str) -> None:
        if not self.skip_depth:
            self.parts.append(data)

    def text(self) -> str:
        value = html.unescape(" ".join(self.parts))
        value = re.sub(r"[\t\r ]+", " ", value)
        value = re.sub(r"\n\s*\n+", "\n", value)
        return value.strip()


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def fetch_bytes(url: str, *, accept: str = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8") -> bytes:
    last_error: Exception | None = None
    user_agents = [USER_AGENT, BROWSER_USER_AGENT, BROWSER_USER_AGENT]
    for attempt, user_agent in enumerate(user_agents):
        request = urllib.request.Request(
            url,
            headers={
                "User-Agent": user_agent,
                "Accept": accept,
                "Accept-Language": "en-US,en;q=0.8",
                "Cache-Control": "no-cache",
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT) as response:
                return response.read(MAX_SOURCE_TEXT)
        except Exception as exc:  # network variability and bot protection are expected in scheduled CI
            last_error = exc
            if attempt < len(user_agents) - 1:
                time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"Unable to fetch {url}: {last_error}")


def html_to_text(payload: bytes) -> str:
    raw = payload.decode("utf-8", errors="replace")
    parser = VisibleTextParser()
    parser.feed(raw)
    return parser.text()


def compact_sentence(value: str, limit: int = 320) -> str:
    value = re.sub(r"\s+", " ", value).strip(" -|•\t\n")
    if len(value) > limit:
        value = value[: limit - 1].rsplit(" ", 1)[0] + "…"
    return value


def meaningful_sentences(text: str) -> list[str]:
    chunks = re.split(r"(?<=[.!?])\s+|\n+", text)
    found: list[str] = []
    seen: set[str] = set()
    for chunk in chunks:
        sentence = compact_sentence(chunk)
        if len(sentence) < 28 or len(sentence) > 340:
            continue
        if not SIGNAL_TERMS.search(sentence):
            continue
        if any(pattern.search(sentence) for pattern in VOLATILE_PATTERNS):
            continue
        key = re.sub(r"\W+", " ", sentence.lower()).strip()
        if key in seen:
            continue
        seen.add(key)
        found.append(sentence)
        if len(found) >= 28:
            break
    return found


def google_news(query: str, title_terms: list[str] | None = None) -> list[dict[str, str]]:
    encoded = urllib.parse.quote_plus(f'"{query}" when:14d')
    url = f"https://news.google.com/rss/search?q={encoded}&hl=en-US&gl=US&ceid=US:en"
    xml = fetch_bytes(url, accept="application/rss+xml,application/xml,text/xml;q=0.9,*/*;q=0.8")
    root = ET.fromstring(xml)
    items: list[dict[str, str]] = []
    seen: set[str] = set()
    required = [term.strip().lower() for term in (title_terms or []) if term and term.strip()]
    for item in root.findall(".//item"):
        title = compact_sentence(item.findtext("title") or "", 220)
        link = (item.findtext("link") or "").strip()
        published = compact_sentence(item.findtext("pubDate") or "", 90)
        if not title or not link:
            continue
        clean_title = re.sub(r"\s+-\s+[^-]{2,80}$", "", title).strip()
        lowered = clean_title.lower()
        if required and not any(term in lowered for term in required):
            continue
        key = lowered
        if key in seen:
            continue
        seen.add(key)
        items.append({"title": clean_title, "url": link, "published": published, "source_type": "public_news"})
        if len(items) >= MAX_NEWS:
            break
    return items


def extract_financial(signals: list[str]) -> str | None:
    candidates = [s for s in signals if FINANCIAL_TERMS.search(s) and MONEY_TERMS.search(s)]
    if not candidates:
        return None
    candidates.sort(key=lambda s: (0 if re.search(r"\b(2026|q[1-4]|quarter|half year|h1|full year|fy)\b", s, re.I) else 1, len(s)))
    return compact_sentence(candidates[0], 280)


def extract_workforce(signals: list[str]) -> str | None:
    for sentence in signals:
        match = WORKFORCE_TERMS.search(sentence)
        if match:
            return compact_sentence(sentence, 220)
    return None


def source_snapshot(entry: dict[str, Any]) -> tuple[list[dict[str, Any]], list[str], list[str]]:
    source_results: list[dict[str, Any]] = []
    all_signals: list[str] = []
    errors: list[str] = []
    for source in entry.get("official_sources", []):
        url = source["url"]
        try:
            text = html_to_text(fetch_bytes(url))
            signals = meaningful_sentences(text)
            source_results.append(
                {
                    "label": source.get("label", url),
                    "url": url,
                    "kind": source.get("kind", "official_company"),
                    "status": "ok",
                    "signals": signals[:10],
                }
            )
            all_signals.extend(signals)
        except Exception as exc:
            message = compact_sentence(str(exc), 200)
            source_results.append(
                {
                    "label": source.get("label", url),
                    "url": url,
                    "kind": source.get("kind", "official_company"),
                    "status": "error",
                    "error": message,
                    "signals": [],
                }
            )
            errors.append(message)
    return source_results, all_signals, errors


def canonical_for_hash(profile: dict[str, Any]) -> dict[str, Any]:
    return {
        "verified_fields": profile.get("verified_fields", {}),
        "latest_developments": [
            {"title": item.get("title"), "url": item.get("url")}
            for item in profile.get("latest_developments", [])
        ],
        "official_signals": sorted(set(profile.get("official_signals", []))),
        "source_status": [
            {"label": s.get("label"), "status": s.get("status"), "signals": s.get("signals", [])}
            for s in profile.get("source_status", [])
        ],
    }


def content_hash(profile: dict[str, Any]) -> str:
    payload = json.dumps(canonical_for_hash(profile), sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def change_summary(previous: dict[str, Any] | None, current: dict[str, Any]) -> dict[str, list[str]]:
    if not previous:
        return {"added": ["Initial automated public-source baseline"], "removed": [], "modified": []}
    old_titles = {x.get("title", "") for x in previous.get("latest_developments", []) if x.get("title")}
    new_titles = {x.get("title", "") for x in current.get("latest_developments", []) if x.get("title")}
    old_fields = previous.get("verified_fields", {})
    new_fields = current.get("verified_fields", {})
    modified = [key for key in sorted(set(old_fields) | set(new_fields)) if old_fields.get(key) != new_fields.get(key)]
    return {
        "added": sorted(new_titles - old_titles)[:8],
        "removed": sorted(old_titles - new_titles)[:8],
        "modified": modified,
    }


def build_profile_patch(current: dict[str, Any], entry: dict[str, Any]) -> dict[str, Any]:
    fields = current.get("verified_fields", {})
    patch: dict[str, Any] = {}
    if fields.get("financial"):
        patch["financial"] = fields["financial"]
    if fields.get("employees"):
        patch["employees"] = fields["employees"]
    developments = current.get("latest_developments", [])
    if developments:
        patch["moves"] = [item["title"] for item in developments[:3]]
    sources = [[source.get("label", "Official source"), source.get("url", "")] for source in entry.get("official_sources", [])]
    for item in developments[:3]:
        sources.append(["Latest public development", item.get("url", "")])
    patch["sources"] = [source for source in sources if source[1]]
    return patch


def refresh_competitor(entry: dict[str, Any], previous: dict[str, Any] | None, checked_at: str) -> dict[str, Any]:
    source_results, signals, errors = source_snapshot(entry)
    try:
        title_terms = entry.get("news_title_terms") or [entry["name"].split()[0]]
        news = google_news(entry.get("news_query") or entry["name"], title_terms)
    except Exception as exc:
        errors.append(compact_sentence(str(exc), 200))
        news = previous.get("latest_developments", []) if previous else []

    verified_fields: dict[str, str] = {}
    financial = extract_financial(signals)
    workforce = extract_workforce(signals)
    if financial:
        verified_fields["financial"] = financial
    if workforce:
        verified_fields["employees"] = workforce

    current: dict[str, Any] = {
        "id": entry["id"],
        "name": entry["name"],
        "last_checked_at": checked_at,
        "refresh_status": "ok" if not errors else ("partial" if source_results or news else "error"),
        "verified_fields": verified_fields,
        "latest_developments": news,
        "official_signals": sorted(set(signals))[:20],
        "source_status": source_results,
        "errors": errors[:8],
    }

    successful_sources = any(source.get("status") == "ok" for source in source_results)
    if not successful_sources and not news and previous:
        for key in ("verified_fields", "latest_developments", "official_signals", "source_status"):
            current[key] = previous.get(key, current.get(key))

    digest = content_hash(current)
    previous_digest = previous.get("content_hash") if previous else None
    changed = digest != previous_digest
    current["content_hash"] = digest
    current["last_updated_at"] = checked_at if changed else previous.get("last_updated_at", checked_at)
    current["change_detected"] = changed
    current["changes"] = change_summary(previous, current) if changed else {"added": [], "removed": [], "modified": []}
    current["profile_patch"] = build_profile_patch(current, entry)
    return current


def load_json(path: Path, default: Any) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return default


def main() -> int:
    registry = load_json(REGISTRY_PATH, {})
    previous_payload = load_json(OUTPUT_PATH, {"competitors": []})
    previous_by_id = {item.get("id"): item for item in previous_payload.get("competitors", [])}
    checked_at = utc_now()

    competitors: list[dict[str, Any]] = []
    for entry in registry.get("competitors", []):
        print(f"Refreshing {entry['name']}...", flush=True)
        competitors.append(refresh_competitor(entry, previous_by_id.get(entry["id"]), checked_at))

    changed_competitors = [item["id"] for item in competitors if item.get("change_detected")]
    payload = {
        "schema_version": 1,
        "generated_at": checked_at,
        "refresh_cadence": "daily",
        "change_policy": "Per-competitor last_updated_at changes only when normalized monitored information changes.",
        "processing": "Deterministic public-web extraction; no paid LLM/API key required.",
        "changed_competitors": changed_competitors,
        "competitors": competitors,
    }
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    log = load_json(LOG_PATH, {"runs": []})
    runs = log.setdefault("runs", [])
    runs.append(
        {
            "checked_at": checked_at,
            "competitors_checked": len(competitors),
            "competitors_changed": changed_competitors,
            "partial_or_failed": [item["id"] for item in competitors if item.get("refresh_status") != "ok"],
        }
    )
    log["runs"] = runs[-45:]
    LOG_PATH.write_text(json.dumps(log, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(f"Checked {len(competitors)} competitors; changes detected for {len(changed_competitors)}: {', '.join(changed_competitors) or 'none'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
