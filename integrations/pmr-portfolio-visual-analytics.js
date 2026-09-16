(() => {
  'use strict';

  const RELEASE = '20260916ux6';
  const DATA_URL = `data/pmr-repository-dashboard.json?v=${RELEASE}`;
  let DATA = null;
  let timer = 0;
  let observer = null;

  const clean = v => String(v || '').replace(/\s+/g, ' ').trim();
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = n => Number(n || 0).toLocaleString('en-US');
  const palette = ['#0b612c','#35792a','#68a34d','#00587c','#3987b8','#8ba8b7','#a9b66d','#7c8c82'];

  function locateView() {
    return document.querySelector('.view[data-view="pmr"]') ||
      [...document.querySelectorAll('.view[data-view]')].find(v => /PMR Projects\s*&\s*Reports/i.test(clean(v.textContent)));
  }

  function controlValue(view, name) {
    return view.querySelector(`[data-filter="${name}"]`)?.value || 'All';
  }

  function filterState(view) {
    return {
      search: controlValue(view, 'search'),
      project: controlValue(view, 'project'),
      objective: controlValue(view, 'objective'),
      theme: controlValue(view, 'theme'),
      research: controlValue(view, 'research'),
      status: controlValue(view, 'status'),
      artifact: controlValue(view, 'artifact')
    };
  }

  function filteredProjects(view) {
    const state = filterState(view);
    const q = clean(state.search).toLowerCase();
    return (DATA?.projects || []).filter(p => {
      const arts = p.artifacts || [];
      if (state.artifact !== 'All' && !arts.some(a => a.type === state.artifact)) return false;
      if (state.project !== 'All' && p.name !== state.project) return false;
      if (state.objective !== 'All' && p.objective_group !== state.objective) return false;
      if (state.theme !== 'All' && !(p.themes || []).includes(state.theme)) return false;
      if (state.research !== 'All' && !(p.research_types || []).includes(state.research)) return false;
      if (state.status !== 'All' && p.status !== state.status) return false;
      if (!q) return true;
      const haystack = clean([p.name,p.short_name,p.objective,p.objective_group,(p.themes||[]).join(' '),(p.research_types||[]).join(' '),p.status,(p.key_findings||[]).join(' '),p.executive_implication,(p.artifacts||[]).map(a=>`${a.type} ${a.label}`).join(' ')].join(' ')).toLowerCase();
      return haystack.includes(q);
    });
  }

  function countBy(items, extractor) {
    const map = new Map();
    items.forEach(item => {
      const values = extractor(item);
      (Array.isArray(values) ? values : [values]).filter(Boolean).forEach(value => map.set(value, (map.get(value) || 0) + 1));
    });
    return [...map.entries()].sort((a,b) => b[1]-a[1] || String(a[0]).localeCompare(String(b[0])));
  }

  function artifactCounts(projects) {
    const map = new Map();
    projects.forEach(p => (p.artifacts || []).forEach(a => map.set(a.type || 'Other', (map.get(a.type || 'Other') || 0) + Number(a.count || 0))));
    return [...map.entries()].sort((a,b) => b[1]-a[1]);
  }

  function sumArtifact(projects, type) {
    return projects.reduce((sum,p) => sum + (p.artifacts || []).filter(a => a.type === type).reduce((s,a)=>s+Number(a.count||0),0), 0);
  }

  function setFilter(name, value) {
    const view = locateView();
    const control = view?.querySelector(`[data-filter="${name}"]`);
    if (!control) return;
    if (control.tagName === 'SELECT' && ![...control.options].some(o => o.value === value)) return;
    control.value = value;
    control.dispatchEvent(new Event(control.tagName === 'INPUT' ? 'input' : 'change', { bubbles: true }));
  }

  function donutGradient(entries) {
    const total = entries.reduce((s,e)=>s+e[1],0) || 1;
    let cursor = 0;
    const stops = entries.map((entry,i) => {
      const start = cursor;
      cursor += entry[1] / total * 100;
      return `${palette[i % palette.length]} ${start.toFixed(2)}% ${cursor.toFixed(2)}%`;
    });
    return stops.length ? `conic-gradient(${stops.join(',')})` : '#edf1ed';
  }

  function donut(title, entries, center, centerLabel, filterName) {
    const total = entries.reduce((s,e)=>s+e[1],0) || 1;
    return `<article class="pmrv-card pmrv-donut-card">
      <h4>${esc(title)}</h4>
      <div class="pmrv-donut-body">
        <div class="pmrv-donut" style="background:${donutGradient(entries)}"><div><strong>${esc(center)}</strong><span>${esc(centerLabel)}</span></div></div>
        <div class="pmrv-legend">${entries.slice(0,6).map((e,i)=>`<button type="button" data-pmrv-filter="${esc(filterName||'')}" data-pmrv-value="${esc(e[0])}"><i style="background:${palette[i%palette.length]}"></i><span>${esc(e[0])}</span><b>${Math.round(e[1]/total*100)}%</b></button>`).join('') || '<span class="pmrv-empty">No data for current filters</span>'}</div>
      </div>
    </article>`;
  }

  function verticalBars(title, entries, filterName) {
    const max = Math.max(1,...entries.map(e=>e[1]));
    return `<article class="pmrv-card"><h4>${esc(title)}</h4><div class="pmrv-vbars">${entries.slice(0,5).map(e=>`<button type="button" data-pmrv-filter="${esc(filterName)}" data-pmrv-value="${esc(e[0])}" title="Filter by ${esc(e[0])}"><b>${e[1]}</b><i style="height:${Math.max(9,e[1]/max*100)}%"></i><span>${esc(e[0])}</span></button>`).join('') || '<span class="pmrv-empty">No data for current filters</span>'}</div></article>`;
  }

  function horizontalBars(title, entries, filterName) {
    const max = Math.max(1,...entries.map(e=>e[1]));
    return `<article class="pmrv-card pmrv-wide"><h4>${esc(title)}</h4><div class="pmrv-hbars">${entries.slice(0,8).map(e=>`<button type="button" data-pmrv-filter="${esc(filterName)}" data-pmrv-value="${esc(e[0])}"><span>${esc(e[0])}</span><i><em style="width:${e[1]/max*100}%"></em></i><b>${e[1]}</b></button>`).join('') || '<span class="pmrv-empty">No themes for current filters</span>'}</div></article>`;
  }

  function heatmap(projects, themes) {
    const cols = projects.slice(0,6);
    const rows = themes.slice(0,6).map(e=>e[0]);
    return `<article class="pmrv-card pmrv-heatmap-card"><h4>Theme heatmap <small>Projects × themes</small></h4>
      <div class="pmrv-heatmap" style="--pmrv-cols:${Math.max(1,cols.length)}">
        <div class="pmrv-heat-corner"></div>${cols.map(p=>`<div class="pmrv-col" title="${esc(p.name)}">${esc(p.short_name || p.name)}</div>`).join('')}
        ${rows.map(theme=>`<button type="button" class="pmrv-row" data-pmrv-filter="theme" data-pmrv-value="${esc(theme)}">${esc(theme)}</button>${cols.map(p=>{const hit=(p.themes||[]).includes(theme);return `<button type="button" class="pmrv-cell ${hit?'hit':''}" data-pmrv-filter="theme" data-pmrv-value="${esc(theme)}" title="${esc(theme)} — ${esc(p.short_name||p.name)}"></button>`}).join('')}`).join('')}
      </div>
      ${projects.length>6?`<div class="pmrv-note">Showing the first 6 projects in the current filtered view.</div>`:''}
    </article>`;
  }

  function ensureStyles() {
    let style = document.getElementById('pmrvStyles');
    if (!style) { style = document.createElement('style'); style.id='pmrvStyles'; document.head.appendChild(style); }
    style.textContent = `
      .pmrv{--q:#034c1f;--g:#35792a;--lime:#c6d52f;--line:#dfe6df;--muted:#68766e;margin:0 0 14px;font-family:Inter,Arial,sans-serif;color:#2a382f}
      .pmrv *{box-sizing:border-box}.pmrv-head{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin:2px 0 9px}.pmrv-head h3{margin:0!important;color:var(--q)!important;font-size:16px!important}.pmrv-head p{margin:3px 0 0!important;color:var(--muted)!important;font-size:10.5px!important}.pmrv-active{font-size:9px;color:var(--g);font-weight:800;background:#eff6ed;border:1px solid #d8e6d5;border-radius:999px;padding:6px 9px;white-space:nowrap}
      .pmrv-kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin-bottom:9px}.pmrv-kpi{border:1px solid var(--line);border-radius:10px;background:#fff;padding:9px 10px;display:grid;grid-template-columns:28px 1fr;gap:8px;align-items:center;min-width:0;box-shadow:0 3px 12px rgba(3,76,31,.03)}.pmrv-kpi i{width:28px;height:28px;border-radius:8px;background:#edf5e9;color:var(--q);display:grid;place-items:center;font-style:normal;font-size:13px}.pmrv-kpi strong{display:block;color:var(--q);font-size:15px;line-height:1}.pmrv-kpi span{display:block;margin-top:3px;color:#708077;font-size:8px;line-height:1.2}
      .pmrv-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:9px}.pmrv-card{grid-column:span 3;min-width:0;border:1px solid var(--line);border-radius:11px;background:#fff;padding:11px;box-shadow:0 3px 12px rgba(3,76,31,.03)}.pmrv-card.pmrv-wide{grid-column:span 3}.pmrv-heatmap-card{grid-column:span 6}.pmrv-card h4{margin:0 0 9px!important;color:#164727!important;font-size:10.5px!important;line-height:1.3!important}.pmrv-card h4 small{font-weight:600;color:#87938c;margin-left:5px}
      .pmrv-donut-body{display:grid;grid-template-columns:112px 1fr;gap:9px;align-items:center}.pmrv-donut{width:106px;height:106px;border-radius:50%;position:relative}.pmrv-donut:after{content:'';position:absolute;inset:27px;border-radius:50%;background:#fff}.pmrv-donut>div{position:absolute;inset:0;z-index:1;display:grid;place-content:center;text-align:center}.pmrv-donut strong{font-size:15px;color:var(--q)}.pmrv-donut span{font-size:7.5px;color:#7d8982;margin-top:2px}.pmrv-legend{display:grid;gap:4px}.pmrv-legend button{display:grid;grid-template-columns:7px minmax(0,1fr) auto;gap:5px;align-items:center;border:0;background:transparent;padding:2px;text-align:left;color:#536158;font-size:7.7px;cursor:pointer}.pmrv-legend button:hover span{color:var(--q);text-decoration:underline}.pmrv-legend i{width:7px;height:7px;border-radius:2px}.pmrv-legend b{color:#31523a}
      .pmrv-vbars{height:126px;display:flex;align-items:flex-end;gap:8px;padding:8px 3px 0;border-bottom:1px solid #d9e2db}.pmrv-vbars button{height:100%;flex:1;display:grid;grid-template-rows:14px 1fr 31px;align-items:end;border:0;background:transparent;padding:0;min-width:0;color:#597067;cursor:pointer}.pmrv-vbars button b{font-size:8px;color:#204c2c;text-align:center}.pmrv-vbars button i{display:block;width:58%;min-height:8px;margin:0 auto;background:linear-gradient(180deg,#0c652e,#35792a);border-radius:3px 3px 0 0}.pmrv-vbars button span{font-size:7.3px;line-height:1.15;text-align:center;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}.pmrv-vbars button:hover i{filter:brightness(1.12)}
      .pmrv-hbars{display:grid;gap:6px}.pmrv-hbars button{display:grid;grid-template-columns:minmax(80px,1.1fr) 1fr 18px;gap:6px;align-items:center;border:0;background:transparent;padding:0;text-align:left;cursor:pointer}.pmrv-hbars button>span{font-size:7.7px;color:#536158;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pmrv-hbars button>i{height:8px;border-radius:2px;background:#edf2ee;overflow:hidden}.pmrv-hbars button>i em{display:block;height:100%;background:linear-gradient(90deg,#0b612c,#62a14b)}.pmrv-hbars button>b{font-size:7.5px;color:#31523a}.pmrv-hbars button:hover>span{color:var(--q);text-decoration:underline}
      .pmrv-heatmap{display:grid;grid-template-columns:105px repeat(var(--pmrv-cols),minmax(55px,1fr));gap:2px;align-items:stretch;overflow:auto}.pmrv-col{writing-mode:vertical-rl;transform:rotate(180deg);height:68px;padding:4px;font-size:6.8px;color:#52645a;overflow:hidden;text-overflow:ellipsis}.pmrv-row{border:0;background:transparent;text-align:left;padding:5px;font-size:7.5px;color:#44584a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer}.pmrv-cell{min-width:38px;height:24px;border:1px solid #e8eee9;background:#f4f7f4;border-radius:2px;cursor:pointer}.pmrv-cell.hit{background:linear-gradient(135deg,#3e8638,#11612d);border-color:#4c9148}.pmrv-cell:hover{outline:2px solid #c6d52f;outline-offset:-2px}.pmrv-note{font-size:7.5px;color:#87938c;margin-top:6px}.pmrv-empty{font-size:8px;color:#89958e}.pmrv-reset-note{margin-top:8px;font-size:8px;color:#87938c}.pmrv button:focus-visible{outline:2px solid #c6d52f;outline-offset:1px}
      @media(max-width:1250px){.pmrv-kpis{grid-template-columns:repeat(3,minmax(0,1fr))}.pmrv-card{grid-column:span 6}.pmrv-heatmap-card{grid-column:span 12}}
      @media(max-width:760px){.pmrv-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.pmrv-card,.pmrv-card.pmrv-wide,.pmrv-heatmap-card{grid-column:span 12}.pmrv-donut-body{grid-template-columns:120px 1fr}}
    `;
  }

  function render(view) {
    if (!DATA || !view) return;
    const projects = filteredProjects(view);
    const research = countBy(projects,p=>p.research_types||[]);
    const statuses = countBy(projects,p=>p.status);
    const themes = countBy(projects,p=>p.themes||[]);
    const artifacts = artifactCounts(projects);
    const totalRespondents = projects.reduce((s,p)=>s+Number(p.respondents||0),0);
    const evidenceFiles = projects.reduce((s,p)=>s+Number(p.evidence_files||0),0);
    const reportCount = sumArtifact(projects,'Report');
    const transcriptCount = sumArtifact(projects,'Transcript');
    const surveyCount = sumArtifact(projects,'Survey data');
    const state = filterState(view);
    const active = Object.entries(state).filter(([k,v])=>k!=='search'?v!=='All':Boolean(clean(v))).length;

    const wrapper = document.createElement('section');
    wrapper.className = 'pmrv';
    wrapper.id = 'pmrPortfolioVisualAnalytics';
    wrapper.dataset.release = RELEASE;
    wrapper.innerHTML = `
      <div class="pmrv-head"><div><h3>Portfolio visual analytics</h3><p>Interactive views derived from the currently filtered PMR project and evidence inventory.</p></div><span class="pmrv-active">${active ? `${active} active filter${active===1?'':'s'}` : 'All PMR evidence'}</span></div>
      <div class="pmrv-kpis">
        <div class="pmrv-kpi"><i>▤</i><div><strong>${fmt(projects.length)}</strong><span>Projects in view</span></div></div>
        <div class="pmrv-kpi"><i>♟</i><div><strong>${fmt(totalRespondents)}</strong><span>Respondents represented</span></div></div>
        <div class="pmrv-kpi"><i>◉</i><div><strong>${fmt(evidenceFiles)}</strong><span>Evidence files mapped</span></div></div>
        <div class="pmrv-kpi"><i>▧</i><div><strong>${fmt(reportCount)}</strong><span>Report files</span></div></div>
        <div class="pmrv-kpi"><i>◫</i><div><strong>${fmt(transcriptCount)}</strong><span>Transcript files</span></div></div>
        <div class="pmrv-kpi"><i>▦</i><div><strong>${fmt(surveyCount)}</strong><span>Survey datasets</span></div></div>
      </div>
      <div class="pmrv-grid">
        ${donut('Research mix by methodology',research,projects.length,'projects','research')}
        ${verticalBars('Projects by research type',research,'research')}
        ${donut('Projects by status',statuses,projects.length,'projects','status')}
        ${donut('Evidence by source',artifacts,evidenceFiles,'mapped files','artifact')}
        ${horizontalBars('Top themes across portfolio',themes,'theme')}
        ${heatmap(projects,themes)}
      </div>
      <div class="pmrv-reset-note">Charts update automatically when Project, Objective, Theme, Research Type, Status, Evidence Type, or Search filters change. Click a chart element to apply the corresponding filter.</div>`;

    const old = view.querySelector('#pmrPortfolioVisualAnalytics');
    old?.remove();
    const anchor = view.querySelector('.pmrf-context') || view.querySelector('.pmrf-filterbar');
    if (anchor) anchor.insertAdjacentElement('afterend',wrapper);
    else view.prepend(wrapper);

    wrapper.querySelectorAll('[data-pmrv-filter][data-pmrv-value]').forEach(button => {
      button.addEventListener('click', () => setFilter(button.dataset.pmrvFilter, button.dataset.pmrvValue));
    });
    document.documentElement.dataset.pmrVisualAnalytics = RELEASE;
  }

  function schedule(delay=70) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const view = locateView();
      if (view && DATA) render(view);
    }, delay);
  }

  async function boot() {
    ensureStyles();
    try {
      const res = await fetch(new URL(DATA_URL, document.baseURI), { cache:'no-store' });
      if (!res.ok) throw new Error(`PMR data ${res.status}`);
      DATA = await res.json();
    } catch (error) {
      console.error('PMR portfolio visual analytics data failed:', error);
      return;
    }
    schedule(20);
    observer = new MutationObserver(mutations => {
      if (mutations.some(m => [...m.addedNodes].some(n => n.nodeType === 1 && (n.matches?.('.view[data-view="pmr"],.pmrf') || n.querySelector?.('.pmrf'))))) schedule(80);
    });
    observer.observe(document.body,{childList:true,subtree:true});
    document.addEventListener('change',event=>{if(event.target.closest?.('.view[data-view="pmr"]') && event.target.matches?.('[data-filter]')) schedule(120)},true);
    document.addEventListener('input',event=>{if(event.target.closest?.('.view[data-view="pmr"]') && event.target.matches?.('[data-filter="search"]')) schedule(180)},true);
    document.addEventListener('click',event=>{const nav=event.target.closest?.('.nav-item[data-view="pmr"]');if(nav) [100,350,800].forEach(schedule)},true);
    window.addEventListener('quest:layout-refresh',()=>schedule(120));
    window.addEventListener('quest:stable-route',event=>{if(event.detail?.route==='pmr') schedule(100)});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
