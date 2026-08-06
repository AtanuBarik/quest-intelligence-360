(() => {
  'use strict';

  const RELEASE = '2026-08-06f';
  const LOCAL_BASE = 'http://127.0.0.1:8765';
  const SHARED_URL = `data/approved-insights.json?v=${RELEASE}`;
  const STORAGE_KEY = 'questApprovedInsightsExport';
  const state = { payload:null, source:'', mounted:new WeakSet() };
  const $ = (selector, root = document) => root.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const asArray = value => Array.isArray(value) ? value : value == null || value === '' ? [] : String(value).split(/\s*[;|]\s*/).filter(Boolean);

  function injectStyles() {
    if ($('#aipStyles')) return;
    const style = document.createElement('style');
    style.id = 'aipStyles';
    style.textContent = `
      .aip-panel{margin:14px 0;background:#fff;border:1px solid #dfe5e0;border-radius:10px;padding:17px;box-shadow:0 7px 22px rgba(3,76,31,.05);font-family:Arial,sans-serif}.aip-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.aip-kicker{display:block;color:#35792a;font-size:11px;font-weight:700;letter-spacing:1px}.aip-head h2{margin:4px 0 5px;color:#35792a;font-size:22px;font-weight:500}.aip-head p{margin:0;color:#646464;font-size:12px;line-height:1.45}.aip-actions{display:flex;gap:7px;flex-wrap:wrap}.aip-btn{min-height:38px;border:1px solid #034c1f;border-radius:7px;padding:0 12px;background:#034c1f;color:#fff;font:700 12px Arial,sans-serif;cursor:pointer}.aip-btn.secondary{background:#fff;color:#034c1f}.aip-meta{display:flex;gap:7px;flex-wrap:wrap;margin:11px 0}.aip-chip{display:inline-flex;align-items:center;padding:5px 8px;border-radius:5px;background:#edf4e9;color:#034c1f;font-size:10px;font-weight:700}.aip-chip.blue{background:#e7f2f7;color:#024c6a}.aip-chip.gold{background:#fff1d4;color:#8a5c00}.aip-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.aip-card{border:1px solid #e1e8e2;border-left:5px solid #35792a;border-radius:9px;padding:12px;background:#fbfdfb}.aip-card:nth-child(2n){border-left-color:#c6d52f}.aip-card:nth-child(3n){border-left-color:#024c6a}.aip-card h3{margin:0;color:#034c1f;font-size:14px;line-height:1.35}.aip-card p{margin:7px 0;color:#646464;font-size:11px;line-height:1.5}.aip-card small{display:block;color:#646464;font-size:10px;line-height:1.4}.aip-sources{margin-top:8px;padding-top:8px;border-top:1px solid #e5ebe6;font-size:10px;color:#646464}.aip-empty{padding:19px;border:2px dashed #cfd9d1;border-radius:9px;background:#f8faf8;text-align:center;color:#646464;font-size:12px;line-height:1.5}.aip-note{margin-top:10px;padding:9px 10px;border-left:4px solid #c6d52f;background:#f4f7f2;color:#646464;font-size:10px;line-height:1.45}@media(max-width:1050px){.aip-grid{grid-template-columns:1fr 1fr}}@media(max-width:680px){.aip-head{display:block}.aip-actions{margin-top:10px}.aip-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function normalizePayload(payload, source) {
    const items = asArray(payload?.items || payload?.value || payload?.insights).map((item, index) => ({
      id: item.id || item.insight_id || item.InsightID || `insight-${index + 1}`,
      title: item.title || item.Title || 'Approved insight',
      summary: item.executive_summary || item.summary || item.ExecutiveSummary || item.Description || '',
      project: item.project || item.Project || item.project_name || 'Cross-project',
      evidenceTypes: asArray(item.evidence_types || item.EvidenceTypes || item.document_types),
      citations: asArray(item.source_citations || item.citations || item.SourceCitations || item.sources),
      confidence: item.confidence ?? item.Confidence ?? null,
      approvedBy: item.approved_by || item.ApprovedBy || '',
      approvedDate: item.approved_date || item.ApprovedDate || '',
      businessUnit: item.business_unit || item.BusinessUnit || '',
      dashboardSection: item.dashboard_section || item.DashboardSection || '',
    }));
    return {
      schema_version: payload?.schema_version || 1,
      generated_at: payload?.generated_at || payload?.generatedAt || null,
      source: payload?.source || source,
      status: payload?.status || (items.length ? 'ready' : 'awaiting_approved_export'),
      items,
    };
  }

  async function fetchJson(url, options = {}) {
    const response = await fetch(url, { cache:'no-store', ...options });
    if (!response.ok) throw new Error(`${url} returned ${response.status}`);
    return response.json();
  }

  async function loadFromLocalCompanion() {
    await fetchJson(`${LOCAL_BASE}/api/health?ts=${Date.now()}`);
    const listing = await fetchJson(`${LOCAL_BASE}/api/files?ts=${Date.now()}`);
    const file = (listing.files || []).find(item => String(item.name || '').toLowerCase() === 'approved-insights.json');
    if (!file) throw new Error('No approved-insights.json in local repository');
    const response = await fetch(`${LOCAL_BASE}/api/files/${encodeURIComponent(file.id)}/download?ts=${Date.now()}`, { cache:'no-store' });
    if (!response.ok) throw new Error(`Local approved insights returned ${response.status}`);
    return normalizePayload(await response.json(), 'Local SharePoint export');
  }

  function loadFromStorage() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try { return normalizePayload(JSON.parse(raw), 'Imported approved export'); } catch (_) { return null; }
  }

  async function load(force = false) {
    if (!force) {
      const local = loadFromStorage();
      if (local?.items?.length) {
        state.payload = local;
        state.source = 'Browser import';
        renderAll();
        loadFromLocalCompanion().then(payload => {
          state.payload = payload; state.source = 'Local companion'; renderAll();
        }).catch(() => {});
        return;
      }
    }
    try {
      state.payload = await loadFromLocalCompanion();
      state.source = 'Local companion';
    } catch (_) {
      try {
        state.payload = normalizePayload(await fetchJson(`${SHARED_URL}&refresh=${Date.now()}`), 'Shared approved export');
        state.source = 'Shared dataset';
      } catch (error) {
        state.payload = normalizePayload({}, 'Unavailable');
        state.source = error.message;
      }
    }
    renderAll();
  }

  function formatDate(value) {
    if (!value) return 'Not generated yet';
    const date = new Date(value);
    return Number.isNaN(date.valueOf()) ? String(value) : date.toLocaleString([], { dateStyle:'medium', timeStyle:'short' });
  }

  function cardTemplate(item) {
    const confidence = item.confidence == null || item.confidence === '' ? 'Not rated' : typeof item.confidence === 'number' && item.confidence <= 1 ? `${Math.round(item.confidence * 100)}%` : `${item.confidence}${String(item.confidence).includes('%') ? '' : '%'}`;
    return `<article class="aip-card"><h3>${esc(item.title)}</h3><p>${esc(item.summary || 'No executive summary supplied.')}</p><small><strong>Project:</strong> ${esc(item.project)}${item.businessUnit ? ` · ${esc(item.businessUnit)}` : ''}</small><small><strong>Confidence:</strong> ${esc(confidence)}${item.approvedBy ? ` · Approved by ${esc(item.approvedBy)}` : ''}${item.approvedDate ? ` · ${esc(item.approvedDate)}` : ''}</small>${item.evidenceTypes.length ? `<div class="aip-meta">${item.evidenceTypes.map(value => `<span class="aip-chip blue">${esc(value)}</span>`).join('')}</div>` : ''}${item.citations.length ? `<div class="aip-sources"><strong>Sources:</strong> ${item.citations.map(esc).join(' · ')}</div>` : ''}</article>`;
  }

  function panelTemplate(context = 'executive') {
    const payload = state.payload || normalizePayload({}, 'Loading');
    const items = payload.items || [];
    return `<section class="aip-panel" data-approved-insights-panel="${context}"><div class="aip-head"><div><span class="aip-kicker">APPROVED MICROSOFT RESEARCH OUTPUTS</span><h2>SharePoint insight publication</h2><p>Approved Copilot, ChatGPT or analyst outputs can be exported from SharePoint and displayed here without exposing source documents or Microsoft credentials.</p></div><div class="aip-actions"><button class="aip-btn secondary" data-aip-refresh>Refresh</button><button class="aip-btn" data-aip-import>Import approved JSON</button><input type="file" accept="application/json,.json" data-aip-file hidden></div></div><div class="aip-meta"><span class="aip-chip">${esc(items.length)} approved insight${items.length === 1 ? '' : 's'}</span><span class="aip-chip blue">${esc(state.source || payload.source || 'Loading')}</span><span class="aip-chip gold">Generated ${esc(formatDate(payload.generated_at))}</span></div>${items.length ? `<div class="aip-grid">${items.slice(0, 12).map(cardTemplate).join('')}</div>` : '<div class="aip-empty"><strong>No approved SharePoint export is loaded.</strong><br>Run the Power Automate export, upload <code>approved-insights.json</code> here, or store that file in the local companion repository.</div>'}<div class="aip-note">Only approved and appropriately classified summaries should be exported. Confidential source reports, transcripts and respondent-level data remain in SharePoint.</div></section>`;
  }

  function executiveView() {
    return $('.view[data-view="home"],.view[data-view="executive"],.view[data-view="hub"],.view[data-view="dashboard"],.view[data-view="my-hub"]');
  }

  function mountExecutive() {
    const view = executiveView();
    if (!view || view.querySelector('[data-approved-insights-panel="executive"]')) return;
    const heading = view.querySelector('.page-heading,.welcome-banner,.hero,.dashboard-header');
    if (heading) heading.insertAdjacentHTML('afterend', panelTemplate('executive'));
    else view.insertAdjacentHTML('afterbegin', panelTemplate('executive'));
    bindPanel(view.querySelector('[data-approved-insights-panel="executive"]'));
  }

  function mountMicrosoftPanel() {
    const body = $('#mlbBody');
    if (!body || body.querySelector('[data-approved-insights-panel="microsoft"]')) return;
    body.insertAdjacentHTML('beforeend', panelTemplate('microsoft'));
    bindPanel(body.querySelector('[data-approved-insights-panel="microsoft"]'));
  }

  function bindPanel(panel) {
    if (!panel || panel.dataset.bound === 'true') return;
    panel.dataset.bound = 'true';
    const file = $('[data-aip-file]', panel);
    $('[data-aip-import]', panel).onclick = () => file.click();
    $('[data-aip-refresh]', panel).onclick = () => load(true);
    file.onchange = async event => {
      const selected = event.target.files?.[0];
      if (!selected) return;
      try {
        const parsed = JSON.parse(await selected.text());
        const normalized = normalizePayload(parsed, selected.name);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        state.payload = normalized; state.source = `Imported ${selected.name}`; renderAll();
      } catch (error) {
        alert(`Unable to import approved insights: ${error.message}`);
      }
      event.target.value = '';
    };
  }

  function renderAll() {
    document.querySelectorAll('[data-approved-insights-panel]').forEach(panel => {
      const context = panel.dataset.approvedInsightsPanel;
      const replacement = document.createElement('div');
      replacement.innerHTML = panelTemplate(context);
      const next = replacement.firstElementChild;
      panel.replaceWith(next);
      bindPanel(next);
    });
    mountExecutive(); mountMicrosoftPanel();
  }

  function boot() {
    injectStyles();
    load();
    const observer = new MutationObserver(() => { mountExecutive(); mountMicrosoftPanel(); });
    observer.observe(document.documentElement, { childList:true, subtree:true });
    setInterval(() => load(true), 5 * 60 * 1000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true }); else boot();
})();
