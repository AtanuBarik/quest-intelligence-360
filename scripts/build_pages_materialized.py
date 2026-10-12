from __future__ import annotations
import base64
import gzip
import re
import shutil
from pathlib import Path

RELEASE = "20261012persona1"
ROOT = Path(".")
SITE = ROOT / "_site"


def replace_view(html: str, view: str, label: str, message: str, aliases: tuple[str, ...] = ()) -> str:
    names = (view, *aliases)
    name_pattern = "|".join(re.escape(name) for name in names)
    pattern = rf'\s*(?:<!--\s*{re.escape(label)}S?\s*-->\s*)?<section class="view" data-view="(?:{name_pattern})">.*?</section>\s*'
    replacement = (f'\n<!-- {label} -->\n<section class="view" data-view="{view}">'
                   '<div style="padding:28px;border:1px solid #dce6de;border-radius:14px;background:#fff;color:#034c1f;font:600 14px Arial,sans-serif">'
                   f'{message}</div></section>\n')
    html, count = re.subn(pattern, replacement, html, count=1, flags=re.I | re.S)
    if count != 1:
        raise RuntimeError(f"Expected one {view} section (aliases: {aliases}); replaced {count}.")
    return html


def route_values(html: str, attribute: str) -> list[str]:
    return [value.strip().lower() for value in re.findall(rf'{re.escape(attribute)}=["\']([^"\']+)["\']', html, flags=re.I)]


def validate_navigation_contract(html: str) -> None:
    nav_routes = route_values(html, "data-view")
    section_routes = [v.strip().lower() for v in re.findall(r'<section\b[^>]*\bclass=["\'][^"\']*\bview\b[^"\']*["\'][^>]*\bdata-view=["\']([^"\']+)["\']', html, flags=re.I)]
    button_routes = [v.strip().lower() for v in re.findall(r'<button\b[^>]*\bclass=["\'][^"\']*\bnav-item\b[^"\']*["\'][^>]*\bdata-view=["\']([^"\']+)["\']', html, flags=re.I)]
    unresolved = sorted(set(button_routes) - set(section_routes))
    duplicates = sorted(r for r in set(section_routes) if section_routes.count(r) > 1)
    if unresolved or duplicates:
        raise RuntimeError(f"Invalid navigation: unresolved={unresolved}; duplicate sections={duplicates}")
    if "survey" not in button_routes or "survey" not in section_routes or "surveys" in nav_routes:
        raise RuntimeError("Survey Analytics must use the canonical 'survey' route.")


def build() -> None:
    chunks = [ROOT / f"chunks/chunk-{i:02d}.txt" for i in range(7)]
    missing = [str(p) for p in chunks if not p.exists()]
    if missing:
        raise RuntimeError(f"Missing frontend chunks: {missing}")
    html = gzip.decompress(base64.b64decode("".join(p.read_text(encoding="utf-8").strip() for p in chunks))).decode("utf-8")
    html = html.replace('id="username" type="email" value="quest@medtech.com"', 'id="username" type="email" value=""')
    html = html.replace('id="password" type="password" value="evalueserve"', 'id="password" type="password" value=""')
    html = re.sub(r'\s*<button class="nav-item" data-view="landscape">.*?</button>\s*', '\n', html, count=1, flags=re.I | re.S)
    html = re.sub(r'\s*<!--\s*LANDSCAPE\s*-->\s*<section class="view" data-view="landscape">.*?</section>\s*', '\n', html, count=1, flags=re.I | re.S)
    html = re.sub(r'\s*<(?P<tag>button|a)\b[^>]*\bdata-view-jump=["\']landscape["\'][^>]*>.*?</(?P=tag)>\s*', '\n', html, flags=re.I | re.S)
    html = re.sub(r'\sdata-view-jump=["\']landscape["\']', '', html, flags=re.I)
    html = re.sub(r",\s*landscape\s*:\s*['\"]Competitive Landscape['\"]", "", html, count=1, flags=re.I)
    html = re.sub(r"\s*chart\('positioningBubble'.*?\);\s*", "\n", html, count=1, flags=re.S)
    html = re.sub(r"\s*chart\('capabilityRadar'.*?\);\s*", "\n", html, count=1, flags=re.S)
    if re.search(r'>\s*Competitive Landscape\s*<|data-view=["\']landscape["\']|data-view-jump=["\']landscape["\']', html, flags=re.I):
        raise RuntimeError("Retired Competitive Landscape markup survived materialization.")
    buttons = re.findall(r'<button\s+class="nav-item"[^>]*>.*?</button>', html, flags=re.I | re.S)
    def find_button(label: str) -> str | None:
        return next((b for b in buttons if re.search(r'>\s*'+label+r'\s*<', b, flags=re.I)), None)
    tracker, evidence, survey = find_button('Project Tracker'), find_button('Evidence Library'), find_button('Survey Analytics')
    if not tracker or not evidence or not survey:
        raise RuntimeError("Required tracker, evidence or survey navigation item missing.")
    html = html.replace(evidence, "", 1).replace(tracker, tracker + "\n" + evidence, 1)
    html = html.replace(survey, re.sub(r'data-view="surveys?"', 'data-view="survey"', survey, count=1, flags=re.I), 1)
    html = replace_view(html, "pmr", "PMR", "Loading PMR repository and analysis dashboard...")
    html = replace_view(html, "experts", "EXPERTS", "Loading Voice of Experts persona analysis...")
    html = replace_view(html, "survey", "SURVEY", "Loading multi-project Survey Analytics...", aliases=("surveys",))
    html = re.sub(r'<script\b[^>]*\bsrc=["\']https://cdn\.jsdelivr\.net/npm/chart\.js[^"\']*["\'][^>]*>\s*</script>', f'<script src="integrations/chart-lite.js?v={RELEASE}"></script>', html, flags=re.I)
    html = re.sub(r'<script\b[^>]*\bsrc=["\'](?:\./)?integrations/[^"\']+["\'][^>]*>\s*</script>', lambda m: m.group(0) if 'chart-lite.js' in m.group(0) else '', html, flags=re.I)
    assets = ['workspace-experience.js','maci-evidence-model.js','team-workspaces.js','role-access-governance.js','maci-research-center.js','persona-intelligence.js','frontend-critical-nav-survey.js','survey-analytics-dashboard-final.js','survey-analytics-failsafe.js','chart-alignment-system.js','frontend-quality-guard.js','platform-runtime-stability.js','optimized-loader.js','quest-enterprise-insights-override.js','insights-modern-redesign.js','competitive-intelligence-live-refresh/loader.js','alerts-chatgpt-summaries.js']
    styles = ''.join(f'<link rel="stylesheet" href="integrations/{name}?v={RELEASE}">' for name in ['maci-research-center.css','persona-intelligence.css'])
    scripts = ''.join(f'<script src="integrations/{name}?v={RELEASE}"></script>' for name in assets)
    if '</body>' not in html:
        raise RuntimeError('Materialized shell has no closing body tag.')
    html = html.replace('</body>', styles + scripts + '</body>', 1)
    html = html.replace('<html', f'<html data-quest-persona-release="{RELEASE}"', 1)
    for name in assets + ['persona-intelligence.css']:
        if not (ROOT / 'integrations' / name).is_file():
            raise RuntimeError(f'Missing integration: {name}')
    validate_navigation_contract(html)
    if SITE.exists():
        shutil.rmtree(SITE)
    SITE.mkdir(parents=True)
    (SITE / 'index.html').write_text(html, encoding='utf-8')
    for name in ('integrations','data','assets','downloads'):
        if (ROOT / name).is_dir():
            shutil.copytree(ROOT / name, SITE / name)
    (SITE / '.nojekyll').touch()
    print(f'Materialized Quest Pages release {RELEASE}: {len(html):,} HTML characters')


if __name__ == '__main__':
    build()
