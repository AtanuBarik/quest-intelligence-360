(() => {
  'use strict';

  const RELEASE = '20260810h';
  const DATA_URL = `data/social-perception-public-snapshot.json?v=${RELEASE}`;
  const COLORS = {
    dark: '#034c1f', green: '#35792a', lime: '#c6d52f', blue: '#00587c',
    gold: '#c78800', pink: '#e0044e', muted: '#607168', line: '#dce6de', soft: '#f5f8f5'
  };

  let DATA = null;
  let selectedCompany = 'Quest Diagnostics';
  let mounting = false;

  const esc = (value = '') => String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
  const fmt = value => Number(value || 0).toLocaleString('en-US');
  const byId = id => document.getElementById(id);
  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();

  function injectStyles() {
    let style = byId('socialPerceptionV2Styles');
    if (!style) {
      style = document.createElement('style');
      style.id = 'socialPerceptionV2Styles';
      document.head.appendChild(style);
    }
    style.textContent = `
      #floSocialImport{display:none!important}
      .sp2-shell{--sp2-dark:${COLORS.dark};--sp2-green:${COLORS.green};--sp2-lime:${COLORS.lime};--sp2-blue:${COLORS.blue};--sp2-line:${COLORS.line};--sp2-muted:${COLORS.muted};color:#28362e}
      .sp2-shell *{box-sizing:border-box}.sp2-shell .page-heading p{font-size:13px;line-height:1.55;max-width:1060px}.sp2-status{display:flex;gap:8px;flex-wrap:wrap;margin-top:11px}.sp2-pill{border:1px solid var(--sp2-line);background:#fff;border-radius:999px;padding:7px 10px;font-size:11px;color:var(--sp2-muted)}.sp2-pill b{color:var(--sp2-dark)}
      .sp2-toolbar{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin:14px 0}.sp2-toolbar select{min-height:40px;border:1px solid var(--sp2-line);border-radius:9px;background:#fff;padding:8px 11px;font-size:12px;color:#26332c}.sp2-toolbar-note{margin-left:auto;font-size:11.5px;color:var(--sp2-muted);display:flex;align-items:center;gap:7px}.sp2-toolbar-note i{width:8px;height:8px;border-radius:50%;background:var(--sp2-green);display:inline-block}
      .sp2-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:12px}.sp2-kpi{background:#fff;border:1px solid var(--sp2-line);border-radius:13px;padding:13px 14px;display:grid;grid-template-columns:38px 1fr;gap:10px;align-items:center;min-height:82px;box-shadow:0 5px 18px rgba(3,76,31,.035)}.sp2-kpi-icon{width:38px;height:38px;border-radius:11px;background:#edf5e9;color:var(--sp2-dark);display:grid;place-items:center;font-size:17px;font-weight:900}.sp2-kpi b{display:block;font-size:16px;color:var(--sp2-dark);margin-bottom:3px}.sp2-kpi span{display:block;font-size:11.5px;line-height:1.4;color:var(--sp2-muted)}
      .sp2-panel{background:#fff;border:1px solid var(--sp2-line);border-radius:14px;padding:15px;min-width:0;box-shadow:0 5px 18px rgba(3,76,31,.035)}.sp2-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px}.sp2-head h3{margin:3px 0 4px;font-size:16px;color:var(--sp2-dark);line-height:1.3}.sp2-head p{margin:0;color:var(--sp2-muted);font-size:11.5px;line-height:1.5}.sp2-kicker{font:800 10px Arial;letter-spacing:1.15px;color:var(--sp2-green)}
      .sp2-platform-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;margin-bottom:12px}.sp2-platform{border:1px solid var(--sp2-line);border-radius:12px;background:#fff;padding:12px;min-height:145px;position:relative;overflow:hidden}.sp2-platform:before{content:'';position:absolute;left:0;right:0;top:0;height:3px;background:#aebbb2}.sp2-platform.snapshot:before{background:var(--sp2-lime)}.sp2-platform .sp2-platform-top{display:flex;align-items:center;gap:8px;margin-bottom:8px}.sp2-platform-icon{width:31px;height:31px;border-radius:9px;background:#eef5ea;color:var(--sp2-dark);display:grid;place-items:center;font-weight:900;font-size:11px;text-transform:uppercase}.sp2-platform strong{font-size:12px;color:var(--sp2-dark)}.sp2-platform p{font-size:11px;line-height:1.45;color:var(--sp2-muted);margin:8px 0 0}.sp2-status-chip{display:inline-flex;padding:5px 7px;border-radius:999px;background:#f0f3f1;color:#66726b;font-size:10px;font-weight:800}.sp2-status-chip.snapshot{background:#eef5e9;color:var(--sp2-green)}.sp2-connection{font-size:10px;color:#7a867f;margin-top:7px}.sp2-connection b{color:#8b5c00}
      .sp2-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:12px}.sp2-5{grid-column:span 5}.sp2-6{grid-column:span 6}.sp2-7{grid-column:span 7}.sp2-12{grid-column:span 12}
      .sp2-bars{display:grid;gap:10px}.sp2-bar-row{display:grid;grid-template-columns:190px 1fr 92px;gap:10px;align-items:center}.sp2-bar-label{display:flex;align-items:center;gap:8px;min-width:0}.sp2-company-mark{width:30px;height:30px;border-radius:9px;background:#e9f2e5;color:var(--sp2-dark);display:grid;place-items:center;font-size:10px;font-weight:900;flex:0 0 30px}.sp2-bar-label b{display:block;font-size:11.5px;color:#26332c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sp2-bar-label small{display:block;font-size:10px;color:var(--sp2-muted);margin-top:2px}.sp2-track{height:13px;border-radius:999px;background:#edf1ed;overflow:hidden}.sp2-track i{height:100%;display:block;border-radius:999px;background:linear-gradient(90deg,var(--sp2-green),var(--sp2-lime));min-width:3px}.sp2-bar-value{text-align:right;font-size:11.5px;font-weight:800;color:var(--sp2-dark)}
      .sp2-insights{display:grid;gap:8px}.sp2-insight{border:1px solid #e4eae4;border-radius:10px;padding:10px 11px;background:#fbfdfb;display:grid;grid-template-columns:29px 1fr;gap:9px}.sp2-insight-icon{width:29px;height:29px;border-radius:9px;background:#eef5ea;color:var(--sp2-dark);display:grid;place-items:center;font-size:13px;font-weight:900}.sp2-insight b{display:block;font-size:11.5px;color:var(--sp2-dark);margin-bottom:3px}.sp2-insight p{font-size:11px;line-height:1.48;color:var(--sp2-muted);margin:0}
      .sp2-profile{display:grid;grid-template-columns:74px 1fr;gap:13px}.sp2-profile-mark{width:66px;height:66px;border-radius:17px;background:linear-gradient(135deg,#eaf4e6,#dfead8);border:1px solid #d1dfcf;color:var(--sp2-dark);display:grid;place-items:center;font-size:17px;font-weight:900}.sp2-profile h4{font-size:15px;margin:0 0 4px;color:var(--sp2-dark)}.sp2-profile-meta{font-size:11px;color:var(--sp2-muted);margin-bottom:8px}.sp2-profile p{font-size:12px;line-height:1.52;margin:0;color:#435149}.sp2-chip-row{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.sp2-chip{padding:5px 7px;border-radius:999px;background:#eef5ea;color:var(--sp2-green);font-size:10.5px;font-weight:800}.sp2-profile-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:11px}.sp2-mini{border:1px solid #e4eae5;border-radius:10px;background:#fbfdfb;padding:9px 10px}.sp2-mini strong{display:block;color:var(--sp2-green);font-size:10px;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px}.sp2-mini span{font-size:11px;line-height:1.42;color:#46544b}.sp2-source-link{display:inline-flex;margin-top:10px;color:var(--sp2-blue);font-size:11px;font-weight:800;text-decoration:none}
      .sp2-benchmark-bars{display:grid;gap:12px}.sp2-benchmark-row{display:grid;grid-template-columns:90px 1fr 48px;gap:9px;align-items:center}.sp2-benchmark-row strong{font-size:11.5px;color:#25342b}.sp2-benchmark-row .sp2-track{height:10px}.sp2-benchmark-row .sp2-track i{background:linear-gradient(90deg,var(--sp2-blue),#55a2bf)}.sp2-benchmark-row span{font-size:11.5px;font-weight:800;color:var(--sp2-blue);text-align:right}.sp2-benchmark-note{margin-top:11px;padding:9px 10px;border-radius:9px;background:#f4f8fb;border-left:4px solid var(--sp2-blue);font-size:10.5px;line-height:1.45;color:var(--sp2-muted)}
      .sp2-matrix-wrap{overflow:auto;border:1px solid var(--sp2-line);border-radius:11px}.sp2-matrix{width:100%;min-width:1250px;border-collapse:collapse}.sp2-matrix th,.sp2-matrix td{padding:10px 11px;border-bottom:1px solid #e8ede8;text-align:left;vertical-align:top}.sp2-matrix thead th{background:var(--sp2-dark);color:#fff;font-size:11px;position:sticky;top:0;z-index:2}.sp2-matrix td{font-size:11px;line-height:1.48;color:#435149}.sp2-matrix td:first-child{font-weight:800;color:var(--sp2-dark);min-width:180px}.sp2-matrix tr:last-child td{border-bottom:0}.sp2-matrix .sp2-chip{display:inline-flex;margin:1px 3px 3px 0;font-size:9.5px}.sp2-fresh{display:inline-flex;padding:4px 6px;border-radius:999px;background:#f1f5ef;color:#59685e;font-size:9.5px;font-weight:800}
      .sp2-method-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.sp2-method{border:1px solid #e3eae4;border-radius:10px;padding:11px;background:#fbfdfb}.sp2-method b{display:block;color:var(--sp2-dark);font-size:11.5px;margin-bottom:4px}.sp2-method p{margin:0;font-size:10.5px;line-height:1.45;color:var(--sp2-muted)}.sp2-method a{display:inline-block;margin-top:7px;font-size:10.5px;font-weight:800;color:var(--sp2-blue);text-decoration:none}.sp2-caveat{margin-top:10px;font-size:10.5px;line-height:1.5;color:var(--sp2-muted);background:#f7faf6;border-left:4px solid var(--sp2-lime);padding:10px 11px}
      @media(max-width:1150px){.sp2-platform-grid{grid-template-columns:repeat(3,1fr)}.sp2-kpis{grid-template-columns:repeat(2,1fr)}.sp2-5,.sp2-6,.sp2-7{grid-column:span 12}.sp2-toolbar-note{width:100%;margin-left:0}.sp2-method-grid{grid-template-columns:1fr}.sp2-bar-row{grid-template-columns:165px 1fr 85px}}
      @media(max-width:720px){.sp2-platform-grid,.sp2-kpis{grid-template-columns:1fr}.sp2-bar-row{grid-template-columns:1fr}.sp2-bar-value{text-align:left}.sp2-profile{grid-template-columns:1fr}.sp2-profile-grid{grid-template-columns:1fr}.sp2-shell .page-heading p{font-size:12px}.sp2-panel{padding:13px}}
    `;
  }

  function renameNavigation(root = document) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      if (!node.nodeValue) return;
      node.nodeValue = node.nodeValue
        .replaceAll('Social & Perception', 'Social Perception')
        .replaceAll('Social & Perception Command Center', 'Social Perception');
    });
  }

  function publicSnapshotPlatforms() {
    return (DATA?.platform_status || []).filter(item => item.public_snapshot).length;
  }

  function automatedPlatforms() {
    return (DATA?.platform_status || []).filter(item => item.automated_daily).length;
  }

  function generatedLabel() {
    try {
      return new Intl.DateTimeFormat('en-GB', {
        day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', timeZone:'Asia/Kolkata'
      }).format(new Date(DATA.generated_at));
    } catch (_) { return DATA?.generated_at || ''; }
  }

  function platformCards() {
    return (DATA?.platform_status || []).map(item => {
      const snapshot = item.public_snapshot;
      return `<article class="sp2-platform ${snapshot ? 'snapshot' : ''}">
        <div class="sp2-platform-top"><span class="sp2-platform-icon">${esc(item.code)}</span><strong>${esc(item.platform)}</strong></div>
        <span class="sp2-status-chip ${snapshot ? 'snapshot' : ''}">${esc(item.status)}</span>
        <div class="sp2-connection">Automated daily connector: <b>${item.automated_daily ? 'Connected' : 'Not connected'}</b></div>
        <p>${esc(item.detail)}</p>
      </article>`;
    }).join('');
  }

  function audienceBars() {
    const companies = [...(DATA?.companies || [])].sort((a,b) => Number(b.linkedin_followers || 0) - Number(a.linkedin_followers || 0));
    const max = Math.max(...companies.map(item => Number(item.linkedin_followers || 0)), 1);
    return companies.map(item => {
      const width = Math.max(2, Math.round((Number(item.linkedin_followers || 0) / max) * 100));
      return `<div class="sp2-bar-row">
        <div class="sp2-bar-label"><span class="sp2-company-mark">${esc(item.mark)}</span><div><b>${esc(item.name)}</b><small>${esc(item.channel_scope)}</small></div></div>
        <div class="sp2-track"><i style="width:${width}%"></i></div>
        <div class="sp2-bar-value">${fmt(item.linkedin_followers)}</div>
      </div>`;
    }).join('');
  }

  function executiveInsights() {
    const icons = ['↗','◎','🧬','▶'];
    return (DATA?.executive_insights || []).map((item,index) => `<div class="sp2-insight"><span class="sp2-insight-icon">${icons[index] || '•'}</span><div><b>${esc(item.title)}</b><p>${esc(item.detail)}</p></div></div>`).join('');
  }

  function companyOptions() {
    return (DATA?.companies || []).map(item => `<option value="${esc(item.name)}" ${item.name === selectedCompany ? 'selected' : ''}>${esc(item.name)}</option>`).join('');
  }

  function renderSelectedProfile() {
    const target = byId('sp2SelectedProfile');
    if (!target || !DATA) return;
    const company = DATA.companies.find(item => item.name === selectedCompany) || DATA.companies[0];
    target.innerHTML = `<div class="sp2-profile">
      <div class="sp2-profile-mark">${esc(company.mark)}</div>
      <div><h4>${esc(company.name)}</h4><div class="sp2-profile-meta">LinkedIn public snapshot: ${fmt(company.linkedin_followers)} followers · ${esc(company.freshness)}</div><p>${esc(company.narrative)}</p>
        <div class="sp2-chip-row">${(company.themes || []).map(theme => `<span class="sp2-chip">${esc(theme)}</span>`).join('')}</div>
      </div>
    </div>
    <div class="sp2-profile-grid">
      <div class="sp2-mini"><strong>Audience emphasis</strong><span>${esc((company.audiences || []).join(' · '))}</span></div>
      <div class="sp2-mini"><strong>Observed content pattern</strong><span>${esc(company.format_signal)}</span></div>
    </div>
    <a class="sp2-source-link" href="${esc(company.source_url)}" target="_blank" rel="noopener">Open public company page ↗</a>`;
  }

  function benchmarkBars() {
    const items = DATA?.healthcare_benchmarks || [];
    const max = Math.max(...items.map(item => Number(item.engagement_rate || 0)), 1);
    return items.map(item => `<div class="sp2-benchmark-row"><strong>${esc(item.platform)}</strong><div class="sp2-track"><i style="width:${Math.round((Number(item.engagement_rate || 0)/max)*100)}%"></i></div><span>${Number(item.engagement_rate).toFixed(1)}%</span></div>`).join('');
  }

  function narrativeMatrix() {
    const rows = (DATA?.companies || []).map(company => `<tr>
      <td>${esc(company.name)}</td>
      <td>${esc(company.narrative)}</td>
      <td>${(company.themes || []).map(theme => `<span class="sp2-chip">${esc(theme)}</span>`).join('')}</td>
      <td>${esc((company.audiences || []).join(', '))}</td>
      <td>${esc(company.format_signal)}</td>
      <td><span class="sp2-fresh">${esc(company.freshness)}</span></td>
    </tr>`).join('');
    return `<div class="sp2-matrix-wrap"><table class="sp2-matrix"><thead><tr><th>Company</th><th>Observed narrative</th><th>Leading themes</th><th>Audience emphasis</th><th>Content pattern</th><th>Public freshness</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  function methodologyCards() {
    return (DATA?.methodology_sources || []).map(item => `<div class="sp2-method"><b>${esc(item.name)}</b><p>${esc(item.use)}</p><a href="${esc(item.url)}" target="_blank" rel="noopener">Open methodology source ↗</a></div>`).join('');
  }

  function template() {
    return `<section class="view sp2-shell" data-view="social" data-social-perception-v2="true">
      <div class="page-heading">
        <div><span class="section-kicker">COMPETITIVE SOCIAL INTELLIGENCE</span><h1>Social Perception</h1><p>Public-evidence view of how Quest and priority competitors show up across professional and public social channels. The page separates observable public snapshots from direct API connections so unavailable channels are never presented as live monitoring.</p>
          <div class="sp2-status"><span class="sp2-pill"><b>Snapshot:</b> ${esc(generatedLabel())} IST</span><span class="sp2-pill"><b>${automatedPlatforms()}/5</b> automated daily connectors</span><span class="sp2-pill"><b>${publicSnapshotPlatforms()}/5</b> public-web snapshots available</span><span class="sp2-pill"><b>${DATA.companies.length}</b> priority companies</span></div>
        </div>
        <div class="heading-actions"><button class="secondary-button" id="sp2Refresh">↻ Refresh snapshot</button></div>
      </div>

      <div class="sp2-toolbar"><select id="sp2CompanySelect" aria-label="Select company">${companyOptions()}</select><span class="sp2-toolbar-note"><i></i>Public company-page evidence + healthcare social benchmark context; no synthetic live-listening metrics.</span></div>

      <div class="sp2-kpis">
        <div class="sp2-kpi"><span class="sp2-kpi-icon">⌁</span><div><b>0 direct daily feeds</b><span>No social-platform API connector is currently configured in this repository.</span></div></div>
        <div class="sp2-kpi"><span class="sp2-kpi-icon">in</span><div><b>LinkedIn observable</b><span>Public company-page snapshots support professional narrative comparison.</span></div></div>
        <div class="sp2-kpi"><span class="sp2-kpi-icon">▶</span><div><b>YouTube observable</b><span>Selected company channels/video libraries are publicly verifiable; API metrics are not connected.</span></div></div>
        <div class="sp2-kpi"><span class="sp2-kpi-icon">◎</span><div><b>Benchmark-led analysis</b><span>Healthcare network benchmarks provide context without being misreported as company performance.</span></div></div>
      </div>

      <div class="sp2-platform-grid">${platformCards()}</div>

      <div class="sp2-grid">
        <article class="sp2-panel sp2-7"><div class="sp2-head"><div><span class="sp2-kicker">PROFESSIONAL AUDIENCE FOOTPRINT</span><h3>Public LinkedIn audience snapshot</h3><p>Directional company-page audience size. Cleveland Clinic Laboratories uses the parent Cleveland Clinic channel as a clearly labeled proxy.</p></div></div><div class="sp2-bars">${audienceBars()}</div></article>
        <article class="sp2-panel sp2-5"><div class="sp2-head"><div><span class="sp2-kicker">EXECUTIVE ATTENTION</span><h3>What the competitive social pattern suggests</h3><p>Interpretation of public company narratives and healthcare social-media practice.</p></div></div><div class="sp2-insights">${executiveInsights()}</div></article>

        <article class="sp2-panel sp2-6"><div class="sp2-head"><div><span class="sp2-kicker">SELECTED COMPANY</span><h3>Social narrative profile</h3><p>Qualitative profile of audience, content territory and observable channel behavior.</p></div></div><div id="sp2SelectedProfile"></div></article>
        <article class="sp2-panel sp2-6"><div class="sp2-head"><div><span class="sp2-kicker">HEALTHCARE CHANNEL CONTEXT</span><h3>2025 healthcare engagement benchmarks</h3><p>External sector benchmark context — these rates are not Quest or competitor performance figures.</p></div></div><div class="sp2-benchmark-bars">${benchmarkBars()}</div><div class="sp2-benchmark-note">Use these network-level benchmarks to judge whether future connected social metrics are strong or weak. They should not be substituted for direct company engagement data.</div></article>

        <article class="sp2-panel sp2-12"><div class="sp2-head"><div><span class="sp2-kicker">COMPETITIVE NARRATIVE MAP</span><h3>How the peer set is positioning itself socially</h3><p>Qualitative comparison of narrative territory, themes, audience orientation and content format across the eight approved companies.</p></div></div>${narrativeMatrix()}</article>

        <article class="sp2-panel sp2-12"><div class="sp2-head"><div><span class="sp2-kicker">METHODOLOGY & SOURCE TRAIL</span><h3>How to read this page</h3><p>Competitive social analysis combines observable company-owned channel evidence with healthcare-sector social-media benchmarks and explicit connector-status disclosure.</p></div></div><div class="sp2-method-grid">${methodologyCards()}</div><div class="sp2-caveat">The previous social dataset was an illustrative connector-ready baseline, not a production social-listening feed. This redesigned view does not use its synthetic mentions, share-of-voice, sentiment or post-volume values as live data. Public follower counts and narrative observations are point-in-time snapshots and can change after publication.</div></article>
      </div>
    </section>`;
  }

  function findSocialView() {
    return document.querySelector('.view[data-view="social"]');
  }

  function wire() {
    byId('sp2CompanySelect')?.addEventListener('change', event => {
      selectedCompany = event.target.value;
      renderSelectedProfile();
    });
    byId('sp2Refresh')?.addEventListener('click', () => boot(true));
  }

  function mount() {
    if (!DATA || mounting) return false;
    const old = findSocialView();
    if (!old) return false;
    if (old.dataset.socialPerceptionV2 === 'true') {
      renameNavigation(document);
      document.getElementById('floSocialImport')?.remove();
      return true;
    }
    mounting = true;
    try {
      const active = old.classList.contains('active');
      const wrapper = document.createElement('div');
      wrapper.innerHTML = template().trim();
      const fresh = wrapper.firstElementChild;
      if (active) fresh.classList.add('active');
      old.replaceWith(fresh);
      document.getElementById('floSocialImport')?.remove();
      renameNavigation(document);
      wire();
      renderSelectedProfile();
      document.documentElement.dataset.socialPerceptionRelease = RELEASE;
      return true;
    } finally {
      mounting = false;
    }
  }

  async function loadData(force = false) {
    const url = `${DATA_URL}${force ? `&t=${Date.now()}` : ''}`;
    const response = await fetch(url, { cache: force ? 'no-store' : 'default' });
    if (!response.ok) throw new Error(`Social Perception snapshot returned HTTP ${response.status}`);
    DATA = await response.json();
    if (!Array.isArray(DATA?.companies) || !DATA.companies.length) throw new Error('Social Perception snapshot has no companies.');
    if (!DATA.companies.some(item => item.name === selectedCompany)) selectedCompany = DATA.companies[0].name;
  }

  async function boot(force = false) {
    injectStyles();
    renameNavigation(document);
    document.getElementById('floSocialImport')?.remove();
    try {
      await loadData(force);
    } catch (error) {
      console.error('Social Perception data load failed:', error);
      return;
    }
    let attempts = 0;
    const tryMount = () => {
      attempts += 1;
      if (mount() || attempts >= 30) return;
      setTimeout(tryMount, 100);
    };
    tryMount();
  }

  window.addEventListener('quest:layout-refresh', event => {
    if (event.detail?.group !== 'strategic') return;
    setTimeout(() => {
      const view = findSocialView();
      if (DATA && view && view.dataset.socialPerceptionV2 !== 'true') mount();
      renameNavigation(document);
      document.getElementById('floSocialImport')?.remove();
    }, 80);
  });

  document.addEventListener('click', event => {
    const nav = event.target?.closest?.('.nav-item,a,button');
    if (!nav || !/Social\s*(?:&|and)?\s*Perception/i.test(nav.textContent || '')) return;
    setTimeout(() => {
      const view = findSocialView();
      if (DATA && view && view.dataset.socialPerceptionV2 !== 'true') mount();
      renameNavigation(document);
      document.getElementById('floSocialImport')?.remove();
    }, 90);
  }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => boot(), { once:true });
  else boot();
})();
