from __future__ import annotations

import base64
import gzip
import re
import shutil
from pathlib import Path

RELEASE = "20260810s"
ROOT = Path(".")
SITE = ROOT / "_site"


def replace_view(html: str, view: str, label: str, message: str) -> str:
    pattern = rf"\s*(?:<!--\s*{re.escape(label)}\s*-->\s*)?<section class=\"view\" data-view=\"{re.escape(view)}\">.*?</section>\s*"
    replacement = (
        f"\n<!-- {label} -->\n"
        f"<section class=\"view\" data-view=\"{view}\">"
        f"<div style=\"padding:28px;border:1px solid #dce6de;border-radius:14px;background:#fff;color:#034c1f;font:600 14px Arial,sans-serif\">"
        f"{message}</div></section>\n"
    )
    html, count = re.subn(pattern, replacement, html, count=1, flags=re.I | re.S)
    if count != 1:
        raise RuntimeError(f"Expected one {view} section; replaced {count}.")
    return html


def build() -> None:
    chunks = [ROOT / f"chunks/chunk-{i:02d}.txt" for i in range(7)]
    missing = [str(p) for p in chunks if not p.exists()]
    if missing:
        raise RuntimeError(f"Missing frontend chunks: {missing}")

    encoded = "".join(p.read_text(encoding="utf-8").strip() for p in chunks)
    html = gzip.decompress(base64.b64decode(encoded)).decode("utf-8")

    html = html.replace('id="username" type="email" value="quest@medtech.com"', 'id="username" type="email" value=""')
    html = html.replace('id="password" type="password" value="evalueserve"', 'id="password" type="password" value=""')

    html = re.sub(r'\s*<button class="nav-item" data-view="landscape">.*?</button>\s*', '\n', html, count=1, flags=re.I | re.S)
    html = re.sub(r'\s*<!--\s*LANDSCAPE\s*-->\s*<section class="view" data-view="landscape">.*?</section>\s*', '\n', html, count=1, flags=re.I | re.S)
    html = re.sub(r",\s*landscape\s*:\s*['\"]Competitive Landscape['\"]", "", html, count=1, flags=re.I)
    html = re.sub(r"\s*chart\('positioningBubble'.*?\);\s*", "\n", html, count=1, flags=re.S)
    html = re.sub(r"\s*chart\('capabilityRadar'.*?\);\s*", "\n", html, count=1, flags=re.S)

    if re.search(r'>\s*Competitive Landscape\s*<|data-view=["\']landscape["\']', html, flags=re.I):
        raise RuntimeError("Visible Competitive Landscape markup survived materialization.")

    buttons = re.findall(r'<button\s+class="nav-item"[^>]*>.*?</button>', html, flags=re.I | re.S)
    tracker = next((b for b in buttons if re.search(r'>\s*Project Tracker\s*<', b, flags=re.I)), None)
    evidence = next((b for b in buttons if re.search(r'>\s*Evidence Library\s*<', b, flags=re.I)), None)
    if not tracker or not evidence:
        raise RuntimeError("Project Tracker or Evidence Library navigation item is missing.")
    html = html.replace(evidence, "", 1)
    html = html.replace(tracker, tracker + "\n" + evidence, 1)
    if html.find(tracker) < 0 or html.find(evidence) < html.find(tracker):
        raise RuntimeError("Evidence Library is not positioned after Project Tracker.")

    html = replace_view(html, "pmr", "PMR", "Loading PMR repository and analysis dashboard...")
    html = replace_view(html, "experts", "EXPERTS", "Loading Voice of Experts persona analysis...")
    html = replace_view(html, "survey", "SURVEY", "Loading multi-project Survey Analytics...")

    html = re.sub(
        r'<script\b[^>]*\bsrc=["\']https://cdn\.jsdelivr\.net/npm/chart\.js[^"\']*["\'][^>]*>\s*</script>',
        f'<script src="integrations/chart-lite.js?v={RELEASE}"></script>',
        html,
        flags=re.I,
    )
    html = re.sub(
        r'<script\b[^>]*\bsrc=["\'](?:\.\/)?integrations/[^"\']+["\'][^>]*>\s*</script>',
        lambda m: m.group(0) if "chart-lite.js" in m.group(0) else "",
        html,
        flags=re.I,
    )

    scripts = "".join(
        [
            f'<script src="integrations/frontend-critical-nav-survey.js?v={RELEASE}"></script>',
            f'<script src="integrations/survey-analytics-dashboard-final.js?v={RELEASE}"></script>',
            f'<script src="integrations/survey-analytics-failsafe.js?v={RELEASE}"></script>',
            f'<script src="integrations/optimized-loader.js?v={RELEASE}"></script>',
        ]
    )
    if "</body>" not in html:
        raise RuntimeError("Materialized shell has no closing body tag.")
    html = html.replace("</body>", scripts + "</body>", 1)

    required = [
        'data-view="survey"',
        "Loading multi-project Survey Analytics",
        "frontend-critical-nav-survey.js",
        "survey-analytics-dashboard-final.js",
        "survey-analytics-failsafe.js",
        "optimized-loader.js",
    ]
    missing_tokens = [token for token in required if token not in html]
    if missing_tokens:
        raise RuntimeError(f"Materialized shell missing required tokens: {missing_tokens}")

    if SITE.exists():
        shutil.rmtree(SITE)
    SITE.mkdir(parents=True)
    (SITE / "index.html").write_text(html, encoding="utf-8")

    for name in ("integrations", "data"):
        shutil.copytree(ROOT / name, SITE / name)
    if (ROOT / "assets").is_dir():
        shutil.copytree(ROOT / "assets", SITE / "assets")
    (SITE / ".nojekyll").touch()

    print(f"Materialized Quest Pages release {RELEASE}: {len(html):,} HTML characters")


if __name__ == "__main__":
    build()
