#!/usr/bin/env python3
"""Maintain complete article-summary coverage for the Quest Alerts & Signals feed.

Every synchronized article receives an immediate feed-grounded brief so there is
never an unsummarized card. When an OpenAI API key is available, those immediate
briefs are progressively replaced with content-aware ChatGPT summaries grounded
in the exact publisher article and web verification.
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
SCHEDULED_PATH = Path("data/laboratory-chatgpt-summaries.json")
API_URL = "https://api.openai.com/v1/responses"
MODEL = os.getenv("OPENAI_SUMMARY_MODEL", "gpt-5-chat-latest")
MODE = os.getenv("OPENAI_SUMMARY_MODE", "both").strip().lower()
MAX_ARTICLE_CHARS = 28000
MAX_ITEMS = int(os.getenv("OPENAI_SUMMARY_MAX_ITEMS", "90"))
FALLBACK_VERIFICATION = "feed_metadata_fallback"


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


def is_fallback_record(record: dict | None) -> bool:
    if not isinstance(record, dict):
        return False
    return record.get("verification") == FALLBACK_VERIFICATION or record.get("summary_tier") == "instant_feed_brief"


def cached_record_for_item(summaries: dict, item: dict, allow_fallback: bool = True):
    item_id = str(item.get("id") or "").strip()
    direct = summaries.get(item_id) if item_id else None
    if isinstance(direct, dict) and str(direct.get("summary") or "").strip():
        if allow_fallback or not is_fallback_record(direct):
            return direct
    wanted = normalize_title(item.get("title"))
    if not wanted:
        return None
    for record in summaries.values():
        if not isinstance(record, dict) or not str(record.get("summary") or "").strip():
            continue
        if not allow_fallback and is_fallback_record(record):
            continue
        if normalize_title(record.get("title")) == wanted:
            return record
    return None


def clean_feed_description(item: dict) -> str:
    raw = html.unescape(re.sub(r"<[^>]+>", " ", str(item.get("description") or "")))
    value = re.sub(r"\s+", " ", raw).strip(" -–—|:;")
    title = normalize_title(item.get("title"))
    candidate = normalize_title(value)
    if not value or candidate == title:
        return ""
    source = normalize_title(item.get("source"))
    if source and candidate.endswith(source) and len(value.split()) < 22:
        return ""
    return value[:650]


def relevance_sentence(category: str, company: str) -> str:
    category_key = str(category or "Other").lower()
    actor = str(company or "the monitored company")
    if any(token in category_key for token in ("product", "innovation", "service")):
        return f"For Quest monitoring, this is a product or service signal from {actor} that may affect portfolio positioning, customer choice or competitive differentiation."
    if any(token in category_key for token in ("clinical", "research", "r&d")):
        return f"For Quest monitoring, this is a clinical or R&D signal from {actor} that may indicate changes in evidence, testing capability or specialty-diagnostics positioning."
    if any(token in category_key for token in ("partnership", "m&a", "investment", "channel")):
        return f"For Quest monitoring, this is an ecosystem or transaction signal from {actor} that may change access, scale, channel reach or capability ownership."
    if "financial" in category_key:
        return f"For Quest monitoring, this is a financial signal from {actor} that may inform operating momentum, investment capacity or management priorities."
    if any(token in category_key for token in ("organiz", "leadership", "workforce")):
        return f"For Quest monitoring, this is an organizational signal from {actor} that may indicate leadership, workforce or execution priorities."
    return f"For Quest monitoring, this is a market signal involving {actor}; the verified article detail should be used before drawing a broader strategic conclusion."


def fallback_summary(item: dict) -> str:
    title = re.sub(r"\s+", " ", str(item.get("title") or "Untitled article")).strip()
    company = str(item.get("company") or "Monitored company").strip()
    source = str(item.get("source") or item.get("source_domain") or "the synchronized public-news feed").strip()
    published = str(item.get("published_display") or item.get("published_at") or "the latest feed refresh").strip()
    category = str(item.get("category") or "Other").strip()
    description = clean_feed_description(item)
    sentences = [f"{title}. The item was captured for {company} from {source} and is dated {published}."]
    if description:
        sentences.append(description.rstrip(". ") + ".")
    sentences.append(relevance_sentence(category, company))
    return " ".join(sentences)


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


def merge_scheduled_cache(summaries: dict) -> dict:
    scheduled = load_json(SCHEDULED_PATH, {})
    scheduled_summaries = scheduled.get("summaries") if isinstance(scheduled.get("summaries"), dict) else {}
    merged = dict(summaries)
    for key, record in scheduled_summaries.items():
        if not isinstance(record, dict) or not str(record.get("summary") or "").strip():
            continue
        existing = merged.get(key)
        if not existing or is_fallback_record(existing):
            merged[key] = record
    return merged


def counts(items: list[dict], summaries: dict) -> tuple[int, int, int]:
    total = 0
    verified = 0
    fallback = 0
    for item in items:
        if not item.get("id"):
            continue
        record = cached_record_for_item(summaries, item, allow_fallback=True)
        if not record:
            continue
        total += 1
        if is_fallback_record(record):
            fallback += 1
        else:
            verified += 1
    return total, verified, fallback


def write_payload(news: dict, items: list[dict], summaries: dict, generated: int, unavailable: int, fallback_added: int) -> None:
    total, verified, fallback = counts(items, summaries)
    now = datetime.now(timezone.utc).isoformat()
    payload = {
        "provider": "Quest article-summary pipeline",
        "model": MODEL,
        "updated_at": now,
        "news_generated_at": news.get("generated_at"),
        "news_item_count": len(items),
        "summary_count": total,
        "verified_summary_count": verified,
        "instant_feed_brief_count": fallback,
        "remaining_unsummarized": max(0, len([i for i in items if i.get("id")]) - total),
        "generated_this_run": generated,
        "instant_briefs_added_this_run": fallback_added,
        "unavailable_this_run": unavailable,
        "summary_policy": "Every new article receives an immediate feed-grounded brief; content-aware ChatGPT enrichment replaces the brief when verified article content is available.",
        "summaries": summaries,
    }
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({k: payload[k] for k in ["news_item_count", "summary_count", "verified_summary_count", "instant_feed_brief_count", "remaining_unsummarized", "generated_this_run", "instant_briefs_added_this_run"]}, indent=2))


def main() -> int:
    news = load_json(NEWS_PATH, {})
    items = news.get("items") or []
    if not isinstance(items, list) or not items:
        print("No synchronized laboratory news items were found.", file=sys.stderr)
        return 2

    existing = load_json(OUT_PATH, {})
    summaries = existing.get("summaries") if isinstance(existing.get("summaries"), dict) else {}
    summaries = merge_scheduled_cache(dict(summaries))

    fallback_added = 0
    for item in items:
        item_id = str(item.get("id") or "").strip()
        if not item_id:
            continue
        cached = cached_record_for_item(summaries, item, allow_fallback=True)
        if cached:
            if item_id not in summaries:
                summaries[item_id] = dict(cached, title=item.get("title"), company=item.get("company"))
            continue
        summaries[item_id] = {
            "summary": fallback_summary(item),
            "provider": "Automated feed-grounded brief",
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "title": item.get("title"),
            "company": item.get("company"),
            "category": item.get("category"),
            "source_url": item.get("url"),
            "verification": FALLBACK_VERIFICATION,
            "summary_tier": "instant_feed_brief",
            "content_verified": False,
        }
        fallback_added += 1

    if MODE == "fallback":
        write_payload(news, items, summaries, generated=0, unavailable=0, fallback_added=fallback_added)
        return 0

    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        print("OPENAI_API_KEY is not configured; immediate briefs remain available for all items and will be enriched when API access is configured.")
        write_payload(news, items, summaries, generated=0, unavailable=0, fallback_added=fallback_added)
        return 0

    generated = 0
    unavailable = 0
    for item in items:
        item_id = str(item.get("id") or "").strip()
        if not item_id:
            continue
        verified = cached_record_for_item(summaries, item, allow_fallback=False)
        if verified:
            if item_id not in summaries or is_fallback_record(summaries.get(item_id)):
                summaries[item_id] = dict(verified, title=item.get("title"), company=item.get("company"))
            continue
        if generated >= MAX_ITEMS:
            break
        article_text, resolved_url = fetch_article_text(item)
        try:
            summary = call_openai(api_key, build_prompt(item, article_text, resolved_url))
        except Exception as exc:
            print(f"Summary enrichment failed for {item_id}: {exc}", file=sys.stderr)
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
            "verification": "content_verified",
            "summary_tier": "content_aware",
            "content_verified": True,
        }
        generated += 1
        print(f"Generated content-aware ChatGPT summary {generated}: {item.get('title')}")
        time.sleep(0.2)

    write_payload(news, items, summaries, generated=generated, unavailable=unavailable, fallback_added=fallback_added)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())