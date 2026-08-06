(() => {
  'use strict';

  const RELEASE = '20260806r';
  const DATA_URL = `data/public-demo-intelligence.json?v=${RELEASE}`;
  const esc = (value = '') => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  function injectStyles() {
    if (document.getElementById('publicDemoEvidenceStyles')) return;
    const style = document.createElement('style');
    style.id = 'publicDemoEvidenceStyles';
    style.textContent = `
      .q-public-benchmark{margin:14px 0;border:1px solid #dce5dc;border-top:4px solid #35792a;border-radius:14px;background:#fff;padding:16px;box-shadow:0 7px 22px rgba(3,76,31,.05)}
      .q-public-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:13px}.q-public-head h3{margin:3px 0 4px;color:#034c1f;font-size:16px}.q-public-head p{margin:0;color:#646464;font-size:10px;line-height:1.5}.q-public-badge{white-space:nowrap;border-radius:999px;background:#edf4e9;color:#034c1f;padding:6px 9px;font-size:9px;font-weight:700}
      .q-public-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.q-public-card{border:1px solid #e1e7e1;border-radius:12px;padding:12px;background:#fbfdfb;min-width:0}.q-public-card h4{margin:0;color:#15241b;font-size:12px}.q-public-scale{margin:6px 0 9px;color:#35792a;font-size:15px;font-weight:800}.q-public-facts{margin:0 0 10px;padding-left:16px;color:#646464;font-size:9px;line-height:1.45}.q-public-facts li+li{margin-top:3px}.q-public-bars{display:grid;gap:5px}.q-public-row{display:grid;grid-template-columns:75px 1fr 24px;gap:6px;align-items:center;font-size:8px;color:#646464}.q-public-track{height:6px;background:#e8ede8;border-radius:999px;overflow:hidden}.q-public-track i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#034c1f,#35792a,#c6d52f)}.q-public-card a{display:inline-block;margin-top:9px;color:#034c1f;font-size:8px;font-weight:700;text-decoration:none}.q-public-card a:hover{text-decoration:underline}
      .q-demo-note{display:flex;align-items:flex-start;gap:9px;margin:10px 0 14px;padding:10px 12px;border:1px solid #dce5dc;border-left:4px solid #c6d52f;border-radius:10px;background:#fbfdf7;color:#555;font-size:9px;line-height:1.45}.q-demo-note strong{color:#034c1f}.q-demo-note span:first-child{font-size:15px;line-height:1}
      @media(max-width:1200px){.q-public-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:760px){.q-public-grid{grid-template-columns:1fr}.q-public-head{display:block}.q-public-badge{display:inline-block;margin-top:8px}}
    `;
    document.head.appendChild(style);
  }

  function renderLandscape(payload) {
    const view = document.querySelector('.view[data-view="landscape"]');
    if (!view || document.getElementById('publicBenchmarkPanel')) return;
    const benchmarkLabels = {
      enterprise_scale: 'Enterprise scale',
      clinical_reach: 'Clinical reach',
      specialty_depth: 'Specialty depth',
      digital_access: 'Digital access',
      global_reach: 'Global reach'
    };
    const cards = (payload.companies || []).map(company => {
      const bars = Object.entries(company.benchmark || {}).map(([key,value]) => `<div class="q-public-row"><span>${esc(benchmarkLabels[key] || key)}</span><span class="q-public-track"><i style="width:${Math.max(0,Math.min(100,Number(value)||0))}%"></i></span><b>${esc(value)}</b></div>`).join('');
      const facts = (company.facts || []).slice(0,3).map(fact => `<li>${esc(fact)}</li>`).join('');
      return `<article class="q-public-card"><h4>${esc(company.name)}</h4><div class="q-public-scale">${esc(company.scale_headline)}</div><ul class="q-public-facts">${facts}</ul><div class="q-public-bars">${bars}</div><a href="${esc(company.source)}" target="_blank" rel="noopener">Open official source ↗</a></article>`;
    }).join('');
    const panel = document.createElement('section');
    panel.className = 'q-public-benchmark';
    panel.id = 'publicBenchmarkPanel';
    panel.innerHTML = `<div class="q-public-head"><div><span class="section-kicker">PUBLIC-SOURCE SCALE BENCHMARK</span><h3>Verified operating scale and directional capability comparison</h3><p>Official company and regulatory sources populate the scale facts. Relative capability indices are clearly marked as illustrative demo benchmarks.</p></div><span class="q-public-badge">Verified facts · Demo indices</span></div><div class="q-public-grid">${cards}</div>`;
    const anchor = view.querySelector('.kpi-grid');
    if (anchor) anchor.insertAdjacentElement('afterend', panel); else view.prepend(panel);
  }

  function addNote(viewName, id, html) {
    const view = document.querySelector(`.view[data-view="${viewName}"]`);
    if (!view || document.getElementById(id)) return;
    const note = document.createElement('div');
    note.className = 'q-demo-note';
    note.id = id;
    note.innerHTML = `<span>ⓘ</span><div>${html}</div>`;
    const heading = view.querySelector('.page-heading');
    if (heading) heading.insertAdjacentElement('afterend', note); else view.prepend(note);
  }

  function refreshCharts() {
    requestAnimationFrame(() => {
      const instances = window.Chart?.instances ? Object.values(window.Chart.instances) : [];
      instances.forEach(chart => {
        try { chart.resize?.(); chart.update?.('none'); } catch (_) {}
      });
    });
  }

  async function boot() {
    injectStyles();
    try {
      const response = await fetch(DATA_URL, {cache:'force-cache'});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      renderLandscape(payload);
    } catch (error) {
      console.warn('Public demo evidence could not be loaded:', error);
    }
    addNote('projects','projectDemoNote','<strong>Portfolio demo view:</strong> milestone, completion and risk visuals use the Quest–Evalueserve project tracker supplied for the 03 Aug 2026 weekly status. Values are not external market estimates.');
    addNote('social','socialDemoNote','<strong>Illustrative social-listening baseline:</strong> charts are populated for the demo using a connector-ready dataset. Production use requires an approved social-listening source or export; the interface does not represent unauthenticated live access to LinkedIn, Facebook or X.');
    refreshCharts();
  }

  document.addEventListener('click', event => {
    if (event.target.closest?.('.nav-item,[data-view],a,button')) setTimeout(refreshCharts, 60);
  }, {passive:true});
  window.addEventListener('hashchange', () => setTimeout(refreshCharts, 60));
  window.addEventListener('quest:module-loaded', () => setTimeout(refreshCharts, 80));
  window.addEventListener('quest:chart-engine-ready', () => setTimeout(refreshCharts, 30));

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
