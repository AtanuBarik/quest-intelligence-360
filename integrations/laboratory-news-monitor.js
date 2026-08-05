(() => {
  'use strict';

  const DATA_URL = 'https://atanubarik.github.io/laboratory-news-monitor/data/news.json';
  const EMAIL_STATUS_URL = 'https://atanubarik.github.io/laboratory-news-monitor/data/email_status.json';
  const MONITOR_URL = 'https://atanubarik.github.io/laboratory-news-monitor/';
  const WORKER_URL = 'https://laboratory-news-ai.atanu-barik.workers.dev';
  const REFRESH_MS = 6 * 60 * 60 * 1000;
  const CATEGORY_COLORS = ['#4c7637', '#00587c', '#daa000', '#7b4d83', '#e0044e', '#4f7f77', '#78905f', '#a8b5ad'];

  const state = {
    allItems: [],
    filteredItems: [],
    chatHistory: [],
    summarySignature: '',
    visibleLimit: 30,
    loading: false,
    companyChart: null,
    categoryChart: null,
    lastPayload: null,
    emailStatus: null,
  };

  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));

  const byId = id => document.getElementById(id);
  const unique = values => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));

  function markdown(text = '') {
    let safe = escapeHtml(text);
    safe = safe
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, match => `<ul>${match}</ul>`)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n{2,}/g, '</p><p>')
      .replace(/\n/g, '<br>');
    return `<p>${safe}</p>`;
  }

  function injectStyles() {
    if (document.getElementById('laboratoryNewsMonitorStyles')) return;
    const style = document.createElement('style');
    style.id = 'laboratoryNewsMonitorStyles';
    style.textContent = `
      .live-alerts-shell{--live-green:#4c7637;--live-dark:#034c1f;--live-blue:#00587c;--live-gold:#daa000;--live-red:#e0044e;--live-purple:#7b4d83;--live-line:#dfe5e1;--live-muted:#68758a;position:relative}
      .live-alerts-shell .live-status-row{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 0}
      .live-alerts-shell .live-status-pill{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--live-line);background:#fff;border-radius:999px;padding:6px 9px;font-size:9px;color:var(--live-muted)}
      .live-alerts-shell .live-status-pill strong{color:var(--live-dark)}
      .live-alerts-shell .live-dot{width:7px;height:7px;border-radius:50%;background:var(--live-green);box-shadow:0 0 0 4px rgba(76,118,55,.1)}
      .live-alerts-shell .live-dot.warn{background:var(--live-gold)}
      .live-alerts-shell .live-dot.error{background:var(--live-red)}
      .live-alerts-shell .live-filter-bar{display:grid;grid-template-columns:minmax(220px,2fr) repeat(4,minmax(130px,1fr)) auto auto;gap:8px;align-items:center;background:#fff;border:1px solid var(--live-line);border-radius:13px;padding:11px;margin:12px 0}
      .live-alerts-shell .live-filter-bar input,.live-alerts-shell .live-filter-bar select{width:100%;min-height:38px;border:1px solid var(--live-line);border-radius:8px;background:#fff;padding:8px 10px;font-size:10px;color:#27342e}
      .live-alerts-shell .live-filter-bar input:focus,.live-alerts-shell .live-filter-bar select:focus{outline:3px solid rgba(76,118,55,.11);border-color:var(--live-green)}
      .live-alerts-shell .live-kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px}
      .live-alerts-shell .live-kpi{background:#fff;border:1px solid var(--live-line);border-radius:13px;padding:14px}
      .live-alerts-shell .live-kpi span,.live-alerts-shell .live-kpi small{display:block;color:var(--live-muted);font-size:9px}
      .live-alerts-shell .live-kpi strong{display:block;color:var(--live-dark);font-size:24px;margin:5px 0}
      .live-alerts-shell .live-analytics{display:grid;grid-template-columns:1fr 1.25fr;gap:12px;margin-bottom:12px}
      .live-alerts-shell .live-chart{height:310px;position:relative}
      .live-alerts-shell .live-summary{margin-bottom:12px}
      .live-alerts-shell .live-summary-content{min-height:120px;font-size:11px;line-height:1.65;color:#46544d}
      .live-alerts-shell .live-summary-content h2,.live-alerts-shell .live-summary-content h3{font-size:12px;color:var(--live-dark);margin:12px 0 6px}
      .live-alerts-shell .live-summary-content ul{padding-left:18px}
      .live-alerts-shell .live-summary-meta{font-size:9px;color:var(--live-muted);margin-top:9px}
      .live-alerts-shell .live-news-head{display:flex;justify-content:space-between;align-items:end;gap:12px;margin:16px 0 9px}
      .live-alerts-shell .live-news-head h2{margin:0;font-size:15px;color:var(--live-dark)}
      .live-alerts-shell .live-news-head span{font-size:9px;color:var(--live-muted)}
      .live-alerts-shell .live-news-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      .live-alerts-shell .live-news-card{background:#fff;border:1px solid var(--live-line);border-radius:13px;padding:14px;display:flex;flex-direction:column;gap:8px;box-shadow:0 6px 20px rgba(3,76,31,.04)}
      .live-alerts-shell .live-news-card.priority-high{border-left:3px solid var(--live-red)}
      .live-alerts-shell .live-news-card.priority-medium{border-left:3px solid var(--live-gold)}
      .live-alerts-shell .live-news-card h3{font-size:12px;line-height:1.42;margin:0}
      .live-alerts-shell .live-news-card h3 a{color:#202834;text-decoration:none}
      .live-alerts-shell .live-news-card h3 a:hover{color:var(--live-green);text-decoration:underline}
      .live-alerts-shell .live-chips{display:flex;gap:5px;flex-wrap:wrap}
      .live-alerts-shell .live-chip{padding:4px 7px;border-radius:999px;background:#edf5e8;color:var(--live-dark);font-size:8px;font-weight:700}
      .live-alerts-shell .live-chip.blue{background:#e8f3f7;color:var(--live-blue)}
      .live-alerts-shell .live-chip.gold{background:#fff3d9;color:#8c5c00}
      .live-alerts-shell .live-chip.red{background:#fff0f4;color:#b22852}
      .live-alerts-shell .live-meta{font-size:9px;color:var(--live-muted)}
      .live-alerts-shell .live-context{margin:0;padding-left:17px;color:#536159;font-size:10px;line-height:1.5}
      .live-alerts-shell .live-context li+li{margin-top:3px}
      .live-alerts-shell .live-card-footer{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:auto;padding-top:6px;border-top:1px solid #edf0ee}
      .live-alerts-shell .live-card-footer a{font-size:9px;font-weight:700;color:var(--live-green)}
      .live-alerts-shell .live-card-footer button{border:0;background:transparent;color:var(--live-muted);font-size:9px}
      .live-alerts-shell .live-empty{grid-column:1/-1;background:#fff;border:1px dashed var(--live-line);border-radius:13px;text-align:center;padding:30px;color:var(--live-muted);font-size:11px}
      .live-alerts-shell .live-load-more{display:flex;justify-content:center;margin:14px 0 4px}
      .live-alerts-shell .live-disclaimer{font-size:9px;color:var(--live-muted);text-align:center;margin:14px 0}
      .live-ai-launcher{position:fixed;right:22px;bottom:22px;z-index:1000;min-height:48px;padding:0 17px;border:0;border-radius:999px;background:#034c1f;color:#fff;font-weight:750;box-shadow:0 12px 35px rgba(3,76,31,.3);cursor:pointer}
      .live-ai-panel{position:fixed;right:20px;bottom:80px;z-index:999;width:min(470px,calc(100vw - 32px));height:min(690px,calc(100vh - 105px));display:none;flex-direction:column;border:1px solid var(--live-line);border-radius:17px;background:#fff;box-shadow:0 24px 75px rgba(20,70,54,.25);overflow:hidden}
      .live-ai-panel.open{display:flex}
      .live-ai-header{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:#034c1f;color:#fff}
      .live-ai-header strong,.live-ai-header span{display:block}.live-ai-header span{font-size:9px;opacity:.8;margin-top:2px}
      .live-ai-close{width:34px;height:34px;border:0;border-radius:8px;background:rgba(255,255,255,.15);color:#fff;font-size:18px}
      .live-ai-messages{flex:1;overflow:auto;padding:13px;background:#f7f9f7}
      .live-ai-message{max-width:92%;margin:0 0 10px;padding:10px 12px;border-radius:13px;font-size:10px;line-height:1.55;overflow-wrap:anywhere}
      .live-ai-message.user{margin-left:auto;background:#034c1f;color:#fff}.live-ai-message.assistant{background:#fff;border:1px solid var(--live-line)}.live-ai-message.error{background:#fff0f4;border:1px solid #efc2cf;color:#9f2448}
      .live-ai-form{display:grid;grid-template-columns:1fr auto;gap:8px;padding:10px;border-top:1px solid var(--live-line)}
      .live-ai-form textarea{min-height:52px;max-height:120px;border:1px solid var(--live-line);border-radius:9px;padding:9px;resize:vertical;font-size:10px}
      .live-modal-backdrop{position:fixed;inset:0;background:rgba(3,40,21,.45);z-index:1100;display:none;place-items:center;padding:20px}.live-modal-backdrop.open{display:grid}
      .live-modal{width:min(520px,100%);background:#fff;border-radius:17px;padding:20px;box-shadow:0 25px 70px rgba(0,0,0,.25)}
      .live-modal h3{margin:0 0 6px;color:#034c1f}.live-modal p{font-size:10px;color:var(--live-muted);line-height:1.55}.live-modal label{display:block;font-size:10px;font-weight:700;margin:10px 0 5px}.live-modal input,.live-modal select{width:100%;min-height:40px;border:1px solid var(--live-line);border-radius:8px;padding:8px}.live-modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}
      @media(max-width:1200px){.live-alerts-shell .live-filter-bar{grid-template-columns:repeat(3,1fr)}.live-alerts-shell .live-filter-bar input{grid-column:span 2}.live-alerts-shell .live-analytics{grid-template-columns:1fr}}
      @media(max-width:800px){.live-alerts-shell .live-kpi-grid{grid-template-columns:repeat(2,1fr)}.live-alerts-shell .live-news-grid{grid-template-columns:1fr}}
      @media(max-width:620px){.live-alerts-shell .live-filter-bar,.live-alerts-shell .live-kpi-grid{grid-template-columns:1fr}.live-alerts-shell .live-filter-bar input{grid-column:auto}.live-ai-panel{right:8px;bottom:72px;width:calc(100vw - 16px);height:calc(100vh - 88px)}.live-ai-launcher{right:14px;bottom:14px}}
    `;
    document.head.appendChild(style);
  }

  function template() {
    return `
      <section class="view live-alerts-shell" data-view="alerts">
        <div class="page-heading">
          <div>
            <span class="section-kicker">LIVE COMPETITIVE SIGNAL CENTER</span>
            <h1>Alerts & Strategic Signals</h1>
            <p>Live public-news intelligence integrated from the laboratory-news-monitor repository, with filter-aware analytics and evidence-grounded AI.</p>
            <div class="live-status-row">
              <span class="live-status-pill"><i class="live-dot" id="liveFeedDot"></i><strong id="liveUpdated">Last updated: loading…</strong></span>
              <span class="live-status-pill">↻ Automated refresh every 6 hours</span>
              <span class="live-status-pill" id="liveEmailStatus">Email workflow: checking…</span>
              <span class="live-status-pill">AI: Gemini deep-read synthesis</span>
            </div>
          </div>
          <div class="heading-actions">
            <button class="secondary-button" id="liveRefreshBtn">↻ Refresh live feed</button>
            <button class="secondary-button" id="liveAlertRules">⚙ Alert rules</button>
            <button class="primary-button" id="liveCreateWatchlist">＋ Create watchlist</button>
          </div>
        </div>

        <div class="live-filter-bar" aria-label="Live news filters">
          <input id="liveSearch" type="search" placeholder="Search headlines, context or sources…">
          <select id="liveCompany"><option value="">All companies</option></select>
          <select id="liveCategory"><option value="">All themes</option></select>
          <select id="livePeriod"><option value="7">Past 7 days</option><option value="30" selected>Past 30 days</option><option value="90">Past 90 days</option><option value="9999">All available</option></select>
          <select id="liveSourceType"><option value="">All sources</option><option value="official">Official sources only</option><option value="independent">Independent sources</option></select>
          <button class="secondary-button" id="liveResetFilters">Reset</button>
          <button class="primary-button" id="liveApplyFilters">Apply filters</button>
        </div>

        <div class="live-kpi-grid">
          <article class="live-kpi"><span>Filtered articles</span><strong id="liveVisibleCount">0</strong><small id="liveResultContext">Current selection</small></article>
          <article class="live-kpi"><span>Companies represented</span><strong id="liveCompanyCount">0</strong><small>Across monitored laboratory players</small></article>
          <article class="live-kpi"><span>Distinct sources</span><strong id="liveSourceCount">0</strong><small>Publisher diversity</small></article>
          <article class="live-kpi"><span>Official-source items</span><strong id="liveOfficialCount">0</strong><small>Company-originated evidence</small></article>
        </div>

        <div class="live-analytics">
          <article class="panel">
            <div class="panel-head"><div><span class="section-kicker">SIGNAL VOLUME</span><h3>News volume by company</h3><p>Current filtered view</p></div></div>
            <div class="chart-wrap live-chart"><canvas id="liveCompanyVolumeChart"></canvas></div>
          </article>
          <article class="panel">
            <div class="panel-head"><div><span class="section-kicker">THEME MIX</span><h3>News categories by company</h3><p>Stacked themes across the selected period</p></div></div>
            <div class="chart-wrap live-chart"><canvas id="liveCategoryMixChart"></canvas></div>
          </article>
        </div>

        <article class="panel live-summary">
          <div class="panel-head">
            <div><span class="section-kicker">AI STRATEGIC SYNTHESIS</span><h3>Strategic synthesis of filtered news</h3><p>Deep-reads a balanced selection of updates and identifies competitive implications.</p></div>
            <button class="primary-button" id="liveGenerateSummary">Generate synthesis</button>
          </div>
          <div class="panel-body">
            <div class="live-summary-content" id="liveSummaryContent"><span class="muted">Apply filters and generate a concise strategic synthesis.</span></div>
            <div class="live-summary-meta" id="liveSummaryMeta"></div>
          </div>
        </article>

        <div class="live-news-head"><div><span class="section-kicker">LIVE NEWS FEED</span><h2>Filtered news</h2></div><span id="liveResultLabel">0 results</span></div>
        <section class="live-news-grid" id="liveNews" aria-live="polite"><div class="live-empty">Loading live news…</div></section>
        <div class="live-load-more"><button class="secondary-button" id="liveLoadMore" hidden>Load more updates</button></div>
        <div class="live-disclaimer">Context bullets are derived from available feed information. Open the original article for full verification. The automated collector, email digest, knowledge files and AI worker continue to run from the laboratory-news-monitor repository.</div>

        <button class="live-ai-launcher" id="liveAiLauncher" type="button">Ask News AI</button>
        <aside class="live-ai-panel" id="liveAiPanel">
          <div class="live-ai-header"><div><strong>Laboratory News AI</strong><span>Strategic answers grounded in the selected live updates</span></div><button class="live-ai-close" id="liveAiClose" type="button">×</button></div>
          <div class="live-ai-messages" id="liveAiMessages"><div class="live-ai-message assistant"><strong>Ask about the selected evidence.</strong><br>Questions are grounded in the currently filtered news set and can deep-read public articles when available.</div></div>
          <form class="live-ai-form" id="liveAiForm"><textarea id="liveAiQuestion" maxlength="1500" placeholder="Ask what the developments mean, why they matter, or what to watch…" required></textarea><button class="primary-button" id="liveAiSend" type="submit">Send</button></form>
        </aside>

        <div class="live-modal-backdrop" id="liveWatchlistModal">
          <div class="live-modal"><h3>Create a local watchlist</h3><p>Watchlists are stored in this browser. The shared six-hour collector continues to monitor all configured laboratory companies.</p><label>Watchlist name<input id="liveWatchlistName" placeholder="e.g., Partnerships & M&A"></label><label>Company<select id="liveWatchlistCompany"><option value="">All companies</option></select></label><label>Theme<select id="liveWatchlistCategory"><option value="">All themes</option></select></label><div class="live-modal-actions"><button class="secondary-button" data-live-close-modal>Cancel</button><button class="primary-button" id="liveSaveWatchlist">Save watchlist</button></div></div>
        </div>

        <div class="live-modal-backdrop" id="liveRulesModal">
          <div class="live-modal"><h3>Alert rules</h3><p>Configure browser-level preferences for the live feed. Repository email delivery remains controlled through GitHub Actions secrets and variables.</p><label>Default period<select id="liveRulePeriod"><option value="7">Past 7 days</option><option value="30">Past 30 days</option><option value="90">Past 90 days</option></select></label><label>Default source type<select id="liveRuleSource"><option value="">All sources</option><option value="official">Official sources only</option><option value="independent">Independent sources</option></select></label><div class="live-modal-actions"><button class="secondary-button" data-live-close-modal>Cancel</button><button class="primary-button" id="liveSaveRules">Save rules</button></div></div>
        </div>
      </section>`;
  }

  function currentFilters() {
    return {
      search: (byId('liveSearch')?.value || '').trim(),
      company: byId('liveCompany')?.value || '',
      category: byId('liveCategory')?.value || '',
      period: byId('livePeriod')?.value || '30',
      source_type: byId('liveSourceType')?.value || '',
    };
  }

  function filterSignature() {
    return JSON.stringify({ ...currentFilters(), ids: state.filteredItems.map(item => item.id) });
  }

  function priorityFor(item) {
    if (['M&A / Investment', 'Regulatory / Policy', 'Financial'].includes(item.category)) return 'high';
    if (['Partnership', 'Product / Innovation', 'Leadership / Organization'].includes(item.category)) return 'medium';
    return 'standard';
  }

  function cleanTitle(title, source) {
    let value = String(title || '').trim();
    if (source) {
      const escaped = String(source).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      value = value.replace(new RegExp(`\\s*[-–—|:]\\s*${escaped}\\s*$`, 'i'), '');
    }
    return value || 'Untitled article';
  }

  function contextBullets(item) {
    const title = cleanTitle(item.title, item.source);
    const description = String(item.description || '').replace(/\s+/g, ' ').trim();
    let core = description;
    if (!core || core.toLowerCase() === String(item.title || '').toLowerCase() || core.length < 45) core = title;
    const sentences = core.split(/(?<=[.!?])\s+/).filter(Boolean);
    const bullets = [];
    if (sentences[0]) bullets.push(sentences[0]);
    if (sentences[1] && sentences[1] !== sentences[0]) bullets.push(sentences[1]);
    if (bullets.length < 2) {
      const categoryMap = {
        'Financial': 'Signals a financial-performance or investor-positioning development.',
        'M&A / Investment': 'Points to portfolio expansion, ownership change, or capital deployment.',
        'Partnership': 'Indicates an ecosystem, distribution, data, or care-delivery collaboration.',
        'Product / Innovation': 'Highlights a new diagnostic capability, test, platform, or technology move.',
        'Research / Clinical': 'Adds clinical evidence, research visibility, or disease-area capability.',
        'Regulatory / Policy': 'May affect market access, compliance, reimbursement, or adoption.',
        'Leadership / Organization': 'Reflects a leadership or operating-model change.',
        'Other': 'Provides a broader market or organizational signal.',
      };
      bullets.push(categoryMap[item.category] || categoryMap.Other);
    }
    if (bullets.length < 3 && item.official_source) bullets.push('Reported through an official company source.');
    return bullets.slice(0, 3);
  }

  function applyFilters(resetLimit = true) {
    const filters = currentFilters();
    const query = filters.search.toLowerCase();
    const cutoff = Date.now() - Number(filters.period) * 86400000;
    state.filteredItems = state.allItems.filter(item => {
      const searchable = `${item.title || ''} ${item.description || ''} ${item.source || ''} ${item.company || ''} ${item.category || ''}`.toLowerCase();
      const date = Date.parse(item.published_at || '');
      const sourceMatch = !filters.source_type || (filters.source_type === 'official' ? item.official_source : !item.official_source);
      return (!query || searchable.includes(query)) &&
        (!filters.company || item.company === filters.company) &&
        (!filters.category || item.category === filters.category) &&
        sourceMatch &&
        (!Number.isFinite(date) || date >= cutoff);
    });
    if (resetLimit) state.visibleLimit = 30;
    renderAll();
    if (state.summarySignature && state.summarySignature !== filterSignature()) {
      byId('liveSummaryContent').innerHTML = '<span class="muted">Filters changed. Generate a new synthesis for the current selection.</span>';
      byId('liveSummaryMeta').textContent = '';
      state.summarySignature = '';
    }
  }

  function renderMetrics() {
    byId('liveVisibleCount').textContent = state.filteredItems.length.toLocaleString();
    byId('liveCompanyCount').textContent = new Set(state.filteredItems.map(item => item.company)).size;
    byId('liveSourceCount').textContent = new Set(state.filteredItems.map(item => item.source)).size;
    byId('liveOfficialCount').textContent = state.filteredItems.filter(item => item.official_source).length;
    const filters = currentFilters();
    byId('liveResultContext').textContent = `${filters.period === '9999' ? 'All available' : `Past ${filters.period} days`} · ${filters.company || 'All companies'}`;
    byId('liveResultLabel').textContent = `${state.filteredItems.length.toLocaleString()} result${state.filteredItems.length === 1 ? '' : 's'}`;
  }

  function countsBy(field) {
    return state.filteredItems.reduce((result, item) => {
      const key = item[field] || 'Unknown';
      result[key] = (result[key] || 0) + 1;
      return result;
    }, {});
  }

  function chartBase() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { boxWidth: 9, usePointStyle: true, font: { size: 9 }, color: '#66736b' } },
        tooltip: { backgroundColor: '#183544', titleFont: { size: 10 }, bodyFont: { size: 9 }, padding: 9 }
      },
      scales: {
        x: { grid: { color: '#edf0ee' }, ticks: { font: { size: 8 }, color: '#6e7a72' } },
        y: { grid: { color: '#edf0ee' }, ticks: { font: { size: 8 }, color: '#6e7a72' } }
      }
    };
  }

  function renderCharts() {
    if (!window.Chart || !document.querySelector('.view[data-view="alerts"].active')) return;
    const companyCanvas = byId('liveCompanyVolumeChart');
    const categoryCanvas = byId('liveCategoryMixChart');
    if (!companyCanvas || !categoryCanvas) return;

    const companyData = Object.entries(countsBy('company')).sort((a, b) => b[1] - a[1]);
    if (state.companyChart) state.companyChart.destroy();
    state.companyChart = new Chart(companyCanvas, {
      type: 'bar',
      data: {
        labels: companyData.map(entry => entry[0]),
        datasets: [{ label: 'News items', data: companyData.map(entry => entry[1]), backgroundColor: companyData.map((_, i) => CATEGORY_COLORS[i % CATEGORY_COLORS.length]), borderRadius: 7 }]
      },
      options: { ...chartBase(), indexAxis: 'y', plugins: { ...chartBase().plugins, legend: { display: false } }, scales: { x: { beginAtZero: true, grid: { color: '#edf0ee' }, ticks: { precision: 0, font: { size: 8 } } }, y: { grid: { display: false }, ticks: { font: { size: 8 } } } } }
    });

    const companies = unique(state.filteredItems.map(item => item.company));
    const categories = unique(state.filteredItems.map(item => item.category));
    const datasets = categories.map((category, index) => ({
      label: category,
      data: companies.map(company => state.filteredItems.filter(item => item.company === company && item.category === category).length),
      backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      borderRadius: 3,
    }));
    if (state.categoryChart) state.categoryChart.destroy();
    state.categoryChart = new Chart(categoryCanvas, {
      type: 'bar',
      data: { labels: companies, datasets },
      options: { ...chartBase(), scales: { x: { stacked: true, grid: { display: false }, ticks: { font: { size: 8 } } }, y: { stacked: true, beginAtZero: true, grid: { color: '#edf0ee' }, ticks: { precision: 0, font: { size: 8 } } } } }
    });
  }

  function renderNews() {
    const root = byId('liveNews');
    if (!root) return;
    if (!state.filteredItems.length) {
      root.innerHTML = '<div class="live-empty">No articles match the selected filters.</div>';
      byId('liveLoadMore').hidden = true;
      return;
    }
    const visibleItems = state.filteredItems.slice(0, state.visibleLimit);
    root.innerHTML = visibleItems.map(item => {
      const priority = priorityFor(item);
      const bullets = contextBullets(item).map(bullet => `<li>${escapeHtml(bullet)}</li>`).join('');
      return `<article class="live-news-card priority-${priority}">
        <div class="live-chips"><span class="live-chip">${escapeHtml(item.company)}</span><span class="live-chip blue">${escapeHtml(item.category)}</span>${item.official_source ? '<span class="live-chip gold">Official source</span>' : ''}${priority === 'high' ? '<span class="live-chip red">Priority signal</span>' : ''}</div>
        <h3><a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(cleanTitle(item.title, item.source))}</a></h3>
        <div class="live-meta">${escapeHtml(item.source || 'Unknown source')} · ${escapeHtml(item.published_display || 'Date unavailable')}</div>
        <ul class="live-context">${bullets}</ul>
        <div class="live-card-footer"><a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">Open original evidence →</a><button type="button" data-live-copy="${escapeHtml(item.url)}">Copy link</button></div>
      </article>`;
    }).join('');
    const loadMore = byId('liveLoadMore');
    loadMore.hidden = state.visibleLimit >= state.filteredItems.length;
    loadMore.textContent = `Load ${Math.min(30, state.filteredItems.length - state.visibleLimit)} more updates`;
  }

  function renderAll() {
    renderMetrics();
    renderNews();
    setTimeout(renderCharts, 60);
  }

  async function generateSummary() {
    const button = byId('liveGenerateSummary');
    if (!state.filteredItems.length) {
      byId('liveSummaryContent').innerHTML = '<span class="muted">No articles are selected.</span>';
      return;
    }
    button.disabled = true;
    button.textContent = 'Deep-reading…';
    byId('liveSummaryContent').innerHTML = '<span class="muted">Reading representative updates and synthesizing strategic implications…</span>';
    byId('liveSummaryMeta').textContent = '';
    try {
      const response = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'filtered_summary', article_ids: state.filteredItems.map(item => item.id), filters: currentFilters() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      byId('liveSummaryContent').innerHTML = markdown(data.answer || 'No synthesis was returned.');
      byId('liveSummaryMeta').textContent = data.grounding_used ? `Deep-read ${data.deep_read_items || 0} representative updates · ${data.model || 'AI model'}` : `Repository synthesis only · ${data.model || 'AI model'}`;
      state.summarySignature = filterSignature();
    } catch (error) {
      byId('liveSummaryContent').innerHTML = `<div class="live-ai-message error">${escapeHtml(error.message)}</div>`;
    } finally {
      button.disabled = false;
      button.textContent = 'Generate synthesis';
    }
  }

  function addAiMessage(role, text, meta = '') {
    const message = document.createElement('div');
    message.className = `live-ai-message ${role}`;
    message.innerHTML = role === 'assistant' ? markdown(text) : escapeHtml(text);
    if (meta) message.innerHTML += `<div class="live-summary-meta">${escapeHtml(meta)}</div>`;
    byId('liveAiMessages').appendChild(message);
    byId('liveAiMessages').scrollTop = byId('liveAiMessages').scrollHeight;
  }

  async function askAi(question) {
    addAiMessage('user', question);
    const send = byId('liveAiSend');
    send.disabled = true;
    try {
      const response = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'chat', question, history: state.chatHistory, article_ids: state.filteredItems.map(item => item.id), filters: currentFilters() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      addAiMessage('assistant', data.answer || 'No answer was returned.', data.grounding_used ? 'Deep-read web evidence used' : 'Repository evidence used');
      state.chatHistory.push({ role: 'user', content: question }, { role: 'assistant', content: data.answer });
      state.chatHistory = state.chatHistory.slice(-8);
    } catch (error) {
      addAiMessage('error', error.message);
    } finally {
      send.disabled = false;
    }
  }

  function fillSelect(id, values) {
    const select = byId(id);
    if (!select) return;
    const first = select.options[0]?.outerHTML || '<option value="">All</option>';
    select.innerHTML = first + unique(values).map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('');
  }

  function updateStatus() {
    const payload = state.lastPayload || {};
    byId('liveUpdated').textContent = `Last updated: ${payload.generated_at_display || 'Unavailable'}`;
    const dot = byId('liveFeedDot');
    dot.className = `live-dot${state.loading ? ' warn' : (!state.allItems.length ? ' error' : '')}`;
    const status = state.emailStatus || {};
    const emailText = status.status === 'sent' || status.status === 'test_email_sent'
      ? `Email workflow: ${status.email_item_count || 0} item${status.email_item_count === 1 ? '' : 's'} sent`
      : `Email workflow: ${status.status || 'configured in source repo'}`;
    byId('liveEmailStatus').textContent = emailText;
  }

  async function loadData(force = false) {
    if (state.loading) return;
    state.loading = true;
    updateStatus();
    const refreshButton = byId('liveRefreshBtn');
    if (refreshButton) { refreshButton.disabled = true; refreshButton.textContent = 'Refreshing…'; }
    try {
      const cache = force ? Date.now() : Math.floor(Date.now() / 300000);
      const [newsResponse, emailResponse] = await Promise.all([
        fetch(`${DATA_URL}?cache=${cache}`, { cache: 'no-store' }),
        fetch(`${EMAIL_STATUS_URL}?cache=${cache}`, { cache: 'no-store' }).catch(() => null),
      ]);
      if (!newsResponse.ok) throw new Error(`Live news feed returned HTTP ${newsResponse.status}`);
      const payload = await newsResponse.json();
      state.lastPayload = payload;
      state.allItems = Array.isArray(payload.items) ? payload.items : [];
      if (emailResponse?.ok) state.emailStatus = await emailResponse.json();
      fillSelect('liveCompany', state.allItems.map(item => item.company));
      fillSelect('liveCategory', state.allItems.map(item => item.category));
      fillSelect('liveWatchlistCompany', state.allItems.map(item => item.company));
      fillSelect('liveWatchlistCategory', state.allItems.map(item => item.category));
      applyFilters();
    } catch (error) {
      byId('liveNews').innerHTML = `<div class="live-empty">Live news data could not be loaded.<br>${escapeHtml(error.message)}</div>`;
      byId('liveUpdated').textContent = 'Last updated: unavailable';
      byId('liveFeedDot').className = 'live-dot error';
    } finally {
      state.loading = false;
      updateStatus();
      if (refreshButton) { refreshButton.disabled = false; refreshButton.textContent = '↻ Refresh live feed'; }
    }
  }

  function openModal(id) { byId(id)?.classList.add('open'); }
  function closeModals() { document.querySelectorAll('.live-modal-backdrop.open').forEach(modal => modal.classList.remove('open')); }

  function saveWatchlist() {
    const name = byId('liveWatchlistName').value.trim();
    if (!name) { byId('liveWatchlistName').focus(); return; }
    const watchlists = JSON.parse(localStorage.getItem('quest-live-watchlists') || '[]');
    watchlists.push({ name, company: byId('liveWatchlistCompany').value, category: byId('liveWatchlistCategory').value, created_at: new Date().toISOString() });
    localStorage.setItem('quest-live-watchlists', JSON.stringify(watchlists));
    closeModals();
    byId('liveWatchlistName').value = '';
    if (typeof window.toast === 'function') window.toast(`Watchlist “${name}” saved.`);
  }

  function saveRules() {
    const rules = { period: byId('liveRulePeriod').value, source: byId('liveRuleSource').value };
    localStorage.setItem('quest-live-alert-rules', JSON.stringify(rules));
    byId('livePeriod').value = rules.period;
    byId('liveSourceType').value = rules.source;
    closeModals();
    applyFilters();
  }

  function restoreRules() {
    try {
      const rules = JSON.parse(localStorage.getItem('quest-live-alert-rules') || '{}');
      if (rules.period) { byId('livePeriod').value = rules.period; byId('liveRulePeriod').value = rules.period; }
      if (rules.source !== undefined) { byId('liveSourceType').value = rules.source; byId('liveRuleSource').value = rules.source; }
    } catch (_) { /* ignore invalid browser storage */ }
  }

  function wireEvents() {
    ['liveSearch', 'liveCompany', 'liveCategory', 'livePeriod', 'liveSourceType'].forEach(id => {
      const element = byId(id);
      if (!element) return;
      element.addEventListener(id === 'liveSearch' ? 'input' : 'change', () => applyFilters());
    });
    byId('liveApplyFilters').addEventListener('click', () => applyFilters());
    byId('liveResetFilters').addEventListener('click', () => {
      byId('liveSearch').value = '';
      byId('liveCompany').value = '';
      byId('liveCategory').value = '';
      byId('livePeriod').value = '30';
      byId('liveSourceType').value = '';
      applyFilters();
    });
    byId('liveRefreshBtn').addEventListener('click', () => loadData(true));
    byId('liveGenerateSummary').addEventListener('click', generateSummary);
    byId('liveLoadMore').addEventListener('click', () => { state.visibleLimit += 30; renderNews(); });
    byId('liveAiLauncher').addEventListener('click', () => byId('liveAiPanel').classList.toggle('open'));
    byId('liveAiClose').addEventListener('click', () => byId('liveAiPanel').classList.remove('open'));
    byId('liveAiForm').addEventListener('submit', event => {
      event.preventDefault();
      const question = byId('liveAiQuestion').value.trim();
      if (!question) return;
      byId('liveAiQuestion').value = '';
      askAi(question);
    });
    byId('liveCreateWatchlist').addEventListener('click', () => openModal('liveWatchlistModal'));
    byId('liveAlertRules').addEventListener('click', () => openModal('liveRulesModal'));
    byId('liveSaveWatchlist').addEventListener('click', saveWatchlist);
    byId('liveSaveRules').addEventListener('click', saveRules);
    document.querySelectorAll('[data-live-close-modal]').forEach(button => button.addEventListener('click', closeModals));
    document.querySelectorAll('.live-modal-backdrop').forEach(modal => modal.addEventListener('click', event => { if (event.target === modal) closeModals(); }));
    byId('liveNews').addEventListener('click', async event => {
      const button = event.target.closest('[data-live-copy]');
      if (!button) return;
      try { await navigator.clipboard.writeText(button.dataset.liveCopy); button.textContent = 'Copied'; setTimeout(() => button.textContent = 'Copy link', 1200); } catch (_) { /* clipboard may be blocked */ }
    });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeModals(); byId('liveAiPanel')?.classList.remove('open'); } });
    document.addEventListener('click', event => {
      const alertsNav = event.target.closest('.nav-item[data-view="alerts"]');
      if (alertsNav) setTimeout(renderCharts, 120);
    });
  }

  function mount() {
    const original = document.querySelector('.view[data-view="alerts"]');
    if (!original || original.dataset.liveIntegrated === 'true') return false;
    injectStyles();
    const wrapper = document.createElement('div');
    wrapper.innerHTML = template().trim();
    const replacement = wrapper.firstElementChild;
    replacement.dataset.liveIntegrated = 'true';
    if (original.classList.contains('active')) replacement.classList.add('active');
    original.replaceWith(replacement);
    wireEvents();
    restoreRules();
    loadData(true);
    setInterval(() => loadData(true), REFRESH_MS);
    return true;
  }

  function boot() {
    if (mount()) return;
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (mount() || attempts > 100) clearInterval(timer);
    }, 100);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
