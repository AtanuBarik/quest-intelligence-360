#!/usr/bin/env python3
"""Generate cached article summaries with the OpenAI Responses API.

The script reads the synchronized laboratory news feed, retrieves the underlying
article text directly when possible, and asks the ChatGPT API model to summarize
the exact event. Web search is available to the model as a verification/fallback
when the publisher page cannot be read directly.
"""

from __future__ import annotations

import html
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

NEWS_PATH = Path("data/laboratory-news.json")
OUT_PATH = Path("data/laboratory-openai-summaries.json")
API_URL = "https://api.openai.com/v1/responses"
MODEL = os.getenv("OPENAI_SUMMARY_MODEL", "gpt-5-chat-latest")
MAX_ARTICLE_CHARS = 28000
MAX_ITEMS = int(os.getenv("OPENAI_SUMMARY_MAX_ITEMS", "120"))


class TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []
        self.skip = 0

    def handle_starttag(self, tag, attrs):
        if tag.lower() in {"script", "style", "noscript", "svg", "canvas", "nav", "footer", "head"}:
            self.skip += 1

    def handle_endtag(self, tag):
        if tag.lower() in {"script", "style", "noscript", "svg", "canvas", "nav", "footer", "head"} and self.skip:
            self.skip -= 1
        if not self.skip and tag.lower() in {"p", "div", "article", "section", "li", "h1", "h2", "h3"}:
            self.parts.append("\n")

    def handle_data(self, data):
        if not self.skip:
            text = re.sub(r"\s+", " ", data).strip()
            if text:
                self.parts.append(text)

    def text(self) -> str:
        value = " ".join(self.parts)
        value = html.unescape(value)
        value = re.sub(r"[ \t]+", " ", value)
        value = re.sub(r"\n\s*\n+", "\n", value)
        return value.strip()


def load_json(path: Path, default):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default


def normalize_title(value: str | None) -> str:
    return re.sub(r"[^a-z0-9]+", " ", str(value or "").lower()).strip()


def cached_record_for_item(summaries: dict, item: dict):
    item_id = str(item.get("id") or "").strip()
    direct = summaries.get(item_id) if item_id else None
    if isinstance(direct, dict) and str(direct.get("summary") or "").strip():
        return direct
    wanted = normalize_title(item.get("title"))
    if not wanted:
        return None
    for record in summaries.values():
        if not isinstance(record, dict) or not str(record.get("summary") or "").strip():
            continue
        if normalize_title(record.get("title")) == wanted:
            return record
    return None


def article_urls(item: dict) -> list[str]:
    values = [item.get("url")]
    for source in item.get("sources") or []:
        if isinstance(source, dict):
            values.append(source.get("url"))
    output = []
    for value in values:
        if not value or value in output:
            continue
        try:
            parsed = urllib.parse.urlparse(value)
            if parsed.scheme in {"http", "https"}:
                output.append(value)
        except Exception:
            pass
    return output[:6]


def fetch_article_text(item: dict) -> tuple[str, str | None]:
    for url in article_urls(item):
        try:
            req = urllib.request.Request(
                url,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.4",
                },
            )
            with urllib.request.urlopen(req, timeout=18) as response:
                content_type = response.headers.get("Content-Type", "")
                raw = response.read(900_000)
                charset = response.headers.get_content_charset() or "utf-8"
                page = raw.decode(charset, errors="replace")
                if "html" in content_type.lower() or "<html" in page[:1000].lower():
                    parser = TextExtractor()
                    parser.feed(page)
                    text = parser.text()
                else:
                    text = re.sub(r"\s+", " ", page).strip()
                if len(text) >= 700:
                    return text[:MAX_ARTICLE_CHARS], response.geturl()
        except Exception:
            continue
    return "", None


def extract_output_text(payload: dict) -> str:
    if isinstance(payload.get("output_text"), str):
        return payload["output_text"].strip()
    parts = []
    for item in payload.get("output") or []:
        if not isinstance(item, dict) or item.get("type") != "message":
            continue
        for content in item.get("content") or []:
            if isinstance(content, dict) and content.get("type") == "output_text":
                text = content.get("text")
                if text:
                    parts.append(str(text))
    return "\n".join(parts).strip()


def build_prompt(item: dict, article_text: str, resolved_url: str | None) -> str:
    sources = [str(item.get("source") or "").strip()]
    sources += [str(s.get("name") or "").strip() for s in item.get("sources") or [] if isinstance(s, dict)]
    sources = [x for x in sources if x]
    urls = article_urls(item)
    direct = article_text if article_text else "DIRECT ARTICLE TEXT UNAVAILABLE. Use web search to locate and read the exact headline/event before summarizing."
    return f"""You are summarizing one news item for Quest Diagnostics competitive intelligence.

EXACT EVENT
Company: {item.get('company') or 'Unknown'}
Category: {item.get('category') or 'Other'}
Headline: {item.get('title') or 'Untitled'}
Published: {item.get('published_display') or item.get('published_at') or 'Unknown'}
Publisher hints: {' | '.join(sources) or 'Unknown'}
Captured URLs: {' | '.join(urls) or 'None'}
Resolved publisher URL: {resolved_url or 'Unavailable'}
Feed description: {re.sub(r'<[^>]+>', ' ', str(item.get('description') or ''))[:1800]}

ARTICLE CONTENT
{direct}

INSTRUCTIONS
- Read and understand the exact article/event before writing the summary. Use the supplied article content first; use web search to verify or recover the exact story when needed.
- Write 120-190 words in two concise paragraphs for an executive reader.
- State the material facts, figures, timing, parties, products, study findings, transaction terms or guidance that the underlying article actually reports.
- End with one short sentence explaining the competitive relevance to Quest Diagnostics, grounded only in the reported facts.
- Do not discuss retrieval, source counts, search, citations or your process.
- Do not invent missing facts and do not merge unrelated stories.
- If you cannot verify the exact event, return exactly CONTENT_UNAVAILABLE.
- Return only the summary text.
"""


def call_openai(api_key: str, prompt: str) -> str:
    body = {
        "model": MODEL,
        "store": False,
        "tools": [{"type": "web_search"}],
        "input": prompt,
        "max_output_tokens": 900,
    }
    request = urllib.request.Request(
        API_URL,
        data=json.dumps(body).encode("utf-8"),
        method="POST",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
    )
    last_error = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=90) as response:
                payload = json.loads(response.read().decode("utf-8"))
            text = extract_output_text(payload)
            if not text or text.strip() == "CONTENT_UNAVAILABLE":
                return ""
            return text.strip()
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")[:800]
            last_error = RuntimeError(f"OpenAI HTTP {exc.code}: {detail}")
            if exc.code not in {429, 500, 502, 503, 504}:
                break
        except Exception as exc:
            last_error = exc
        time.sleep(2.0 * (attempt + 1))
    if last_error:
        raise last_error
    return ""


def current_summary_count(items: list[dict], summaries: dict) -> int:
    return sum(1 for item in items if item.get("id") and cached_record_for_item(summaries, item))


def main() -> int:
    news = load_json(NEWS_PATH, {})
    items = news.get("items") or []
    if not isinstance(items, list) or not items:
        print("No synchronized laboratory news items were found.", file=sys.stderr)
        return 2

    existing = load_json(OUT_PATH, {})
    summaries = existing.get("summaries") if isinstance(existing.get("summaries"), dict) else {}
    summaries = dict(summaries)
    api_key = os.getenv("OPENAI_API_KEY", "").strip()

    if not api_key:
        matched = current_summary_count(items, summaries)
        print(f"OPENAI_API_KEY is not configured; retaining {matched} cached current-feed summaries without generating new ones.")
        if not OUT_PATH.exists():
            OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
            OUT_PATH.write_text(json.dumps({
                "provider": "ChatGPT via OpenAI Responses API",
                "model": MODEL,
                "updated_at": None,
                "news_item_count": len(items),
                "summary_count": matched,
                "remaining_unsummarized": max(0, len(items) - matched),
                "summaries": summaries,
                "status": "openai_api_key_not_configured",
            }, indent=2) + "\n", encoding="utf-8")
        return 0

    generated = 0
    unavailable = 0
    for item in items:
        item_id = str(item.get("id") or "").strip()
        if not item_id:
            continue
        cached = cached_record_for_item(summaries, item)
        if cached:
            # Alias a title-keyed curated record to the current item ID so future runs
            # remain efficient even when the upstream collector regenerates/merges IDs.
            if item_id not in summaries:
                summaries[item_id] = dict(cached, title=item.get("title"), company=item.get("company"))
            continue
        if generated >= MAX_ITEMS:
            break
        article_text, resolved_url = fetch_article_text(item)
        try:
            summary = call_openai(api_key, build_prompt(item, article_text, resolved_url))
        except Exception as exc:
            print(f"Summary failed for {item_id}: {exc}", file=sys.stderr)
            unavailable += 1
            continue
        if not summary:
            unavailable += 1
            continue
        now = datetime.now(timezone.utc).isoformat()
        summaries[item_id] = {
            "summary": summary,
            "provider": "ChatGPT via OpenAI Responses API",
            "model": MODEL,
            "updated_at": now,
            "title": item.get("title"),
            "company": item.get("company"),
            "category": item.get("category"),
            "source_url": resolved_url or item.get("url"),
            "content_verified": True,
        }
        generated += 1
        print(f"Generated ChatGPT summary {generated}: {item.get('title')}")
        time.sleep(0.2)

    matched = current_summary_count(items, summaries)
    payload = {
        "provider": "ChatGPT via OpenAI Responses API",
        "model": MODEL,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "news_generated_at": news.get("generated_at"),
        "news_item_count": len(items),
        "summary_count": matched,
        "remaining_unsummarized": max(0, len([i for i in items if i.get("id")]) - matched),
        "generated_this_run": generated,
        "unavailable_this_run": unavailable,
        "summaries": summaries,
    }
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({k: payload[k] for k in ["news_item_count", "summary_count", "remaining_unsummarized", "generated_this_run", "unavailable_this_run"]}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
