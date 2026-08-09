#!/usr/bin/env python3
"""Post-process competitor refresh output to remove stale/irrelevant public-news fallbacks.

The primary refresh already filters newly fetched Google News headlines by competitor name.
This cleanup also removes older fallback items that were preserved before that filter existed,
while leaving official-source fields and current source-error diagnostics intact.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
REGISTRY_PATH = ROOT / "data" / "competitor-source-registry.json"
OUTPUT_PATH = ROOT / "data" / "competitor-daily-refresh.json"


def load(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def canonical(profile: dict[str, Any]) -> dict[str, Any]:
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
    payload = json.dumps(canonical(profile), sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def main() -> int:
    registry = load(REGISTRY_PATH)
    payload = load(OUTPUT_PATH)
    entries = {item["id"]: item for item in registry.get("competitors", [])}
    cleaned_ids: list[str] = []

    for profile in payload.get("competitors", []):
        entry = entries.get(profile.get("id"), {})
        terms = entry.get("news_title_terms") or [str(entry.get("name") or profile.get("name") or "").split()[0]]
        required = [str(term).strip().lower() for term in terms if str(term).strip()]
        before = list(profile.get("latest_developments") or [])
        after = [
            item for item in before
            if not required or any(term in str(item.get("title") or "").lower() for term in required)
        ]
        if len(after) == len(before):
            continue

        removed = [str(item.get("title") or "") for item in before if item not in after and item.get("title")]
        profile["latest_developments"] = after
        profile["content_hash"] = content_hash(profile)
        profile["change_detected"] = True
        profile["last_updated_at"] = payload.get("generated_at") or profile.get("last_checked_at") or profile.get("last_updated_at")
        changes = profile.setdefault("changes", {"added": [], "removed": [], "modified": []})
        changes["removed"] = sorted(set((changes.get("removed") or []) + removed))[:8]

        patch = profile.setdefault("profile_patch", {})
        patch["moves"] = [item.get("title") for item in after[:3] if item.get("title")]
        official_urls = {
            str(source.get("url") or "")
            for source in entry.get("official_sources", [])
            if source.get("url")
        }
        sources = [source for source in (patch.get("sources") or []) if len(source) >= 2 and source[1] in official_urls]
        for item in after[:3]:
            if item.get("url"):
                sources.append(["Latest public development", item["url"]])
        patch["sources"] = sources
        cleaned_ids.append(profile.get("id"))

    if cleaned_ids:
        existing = payload.get("changed_competitors") or []
        payload["changed_competitors"] = list(dict.fromkeys(existing + cleaned_ids))
        OUTPUT_PATH.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(f"Competitor cleanup removed stale fallback headlines for: {', '.join(cleaned_ids) if cleaned_ids else 'none'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
