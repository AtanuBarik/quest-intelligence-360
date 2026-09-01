(() => {
  'use strict';
  const RELEASE = '20260901alerts1';
  const DATA_URL = `data/alerts-chatgpt-summaries.gz.b64?v=${RELEASE}`;
  let payload = null;
  let loading = null;
  let renderTimer = null;

  const esc = (v='') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clean = (v='') => String(v).replace(/\s+/g,' ').trim();
  const normDate = (v='') => { const d=new Date(`${v}T12:00:00`); return Number.isNaN(d.getTime()) ? null : d; };
  const prettyDate = (v='') => { const d=normDate(v); return d ? d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : v; };

  function injectStyles(){
    if(document.getElementById('q-alerts-chatgpt-style')) return;
    const s=document.createElement('style');
    s.id='q-alerts-chatgpt-style';
    s.textContent=`
      .qac-wrap{--qg:#034c1f;--qg2:#35792a;--ql:#eff6ef;--qb:#dce7dd;--qt:#303936;--qm:#69736f;font-family:Arial,Helvetica,sans-serif;color:var(--qt);padding:2px 0 24px}
      .qac-hero{background:linear-gradient(135deg,#034c1f 0%,#1b642d 62%,#35792a 100%);color:#fff;border-radius:18px;padding:24px 26px;box-shadow:0 12px 30px rgba(3,76,31,.15);margin-bottom:16px}
      .qac-eyebrow{font-size:11px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;opacity:.8}.qac-hero h1{font-size:27px;line-height:1.15;margin:7px 0 8px;color:#fff}.qac-hero p{max-width:980px;margin:0;font-size:13.5px;line-height:1.55;opacity:.93}
      .qac-meta{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.qac-chip{display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.11);padding:6px 9px;border-radius:999px;font-size:11.5px;font-weight:600}
      .qac-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:12px}.qac-kpi{background:#fff;border:1px solid var(--qb);border-radius:13px;padding:14px 15px}.qac-kpi b{display:block;color:var(--qg);font-size:22px;line-height:1}.qac-kpi span{display:block;color:var(--qm);font-size:11.5px;margin-top:6px}
      .qac-controls{display:grid;grid-template-columns:minmax(220px,1.6fr) repeat(3,minmax(145px,.7fr));gap:9px;background:#fff;border:1px solid var(--qb);border-radius:13px;padding:11px;margin-bottom:13px;position:sticky;top:0;z-index:5;box-shadow:0 4px 14px rgba(20,60,35,.05)}
      .qac-controls input,.qac-controls select{width:100%;box-sizing:border-box;border:1px solid #cfdad1;border-radius:9px;padding:9px 10px;background:#fff;color:#2f3935;font-size:12.5px;outline:none}.qac-controls input:focus,.qac-controls select:focus{border-color:#35792a;box-shadow:0 0 0 2px rgba(53,121,42,.10)}
      .qac-status{display:flex;justify-content:space-between;gap:12px;align-items:center;margin:0 2px 10px;color:var(--qm);font-size:11.5px}.qac-status strong{color:var(--qg)}
      .qac-list{display:grid;gap:10px}.qac-card{background:#fff;border:1px solid var(--qb);border-left:4px solid #35792a;border-radius:13px;padding:15px 16px;box-shadow:0 3px 10px rgba(30,65,45,.035)}.qac-card[data-priority="High"]{border-left-color:#034c1f}
      .qac-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:7px}.qac-tags{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.qac-tag{font-size:10.5px;font-weight:700;padding:4px 7px;border-radius:999px;background:var(--ql);color:var(--qg)}.qac-tag.summary{background:#f4f7ea;color:#5c681b}.qac-date{font-size:11px;color:var(--qm);white-space:nowrap}
      .qac-card h3{font-size:15px;line-height:1.35;margin:0 0 7px;color:#183d28}.qac-summary{font-size:12.7px;line-height:1.58;margin:0;color:#4f5a55}.qac-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:11px;padding-top:9px;border-top:1px solid #edf1ed}.qac-source{font-size:10.8px;color:#7a837f}.qac-link{display:inline-flex;align-items:center;gap:5px;text-decoration:none;color:var(--qg);font-size:11.5px;font-weight:700}.qac-link:hover{text-decoration:underline}
      .qac-empty{background:#fff;border:1px dashed #cbd9ce;border-radius:13px;padding:28px;text-align:center;color:#6b756f;font-size:13px}
      @media(max-width:900px){.qac-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.qac-controls{grid-template-columns:1fr 1fr;position:static}.qac-hero h1{font-size:23px}}
      @media(max-width:560px){.qac-kpis,.qac-controls{grid-template-columns:1fr}.qac-top,.qac-foot{align-items:flex-start;flex-direction:column}.qac-date{white-space:normal}}
    `;
    document.head.appendChild(s);
  }

  async function loadData(){
    if(payload) return payload;
    if(loading) return loading;
    loading=fetch(new URL(DATA_URL,document.baseURI),{cache:'no-store'})
      .then(async r=>{if(!r.ok) throw new Error(`Alerts summary data ${r.status}`);const encoded=(await r.text()).replace(/\s+/g,'');const binary=atob(encoded);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));return new Response(stream).json();})
      .then(j=>{payload=j;return j;})
      .catch(e=>{console.error('Quest alerts summary load failed:',e); return null;});
    return loading;
  }

  function findView(){
    return document.querySelector('.view[data-view="alerts"]') || [...document.querySelectorAll('.view[data-view]')].find(v=>/alerts\s*&\s*signals/i.test(clean(v.querySelector('h1,h2,h3')?.textContent||'')));
  }

  function withinDays(dateStr, days){
    if(days==='all') return true;
    const d=normDate(dateStr); if(!d) return true;
    const now=new Date();
    return (now-d) <= Number(days)*86400000 && (now-d) >= -86400000;
  }

  function buildShell(view,data){
    const articles=[...(data.articles||[])].sort((a,b)=>String(b.date).localeCompare(String(a.date)));
    const companies=[...new Set(articles.map(x=>x.company))].sort();
    const categories=[...new Set(articles.map(x=>x.category))].sort();
    const newest=articles[0]?.date||'';
    view.dataset.alertsChatgptRelease=RELEASE;
    view.innerHTML=`<div class="qac-wrap">
      <section class="qac-hero">
        <div class="qac-eyebrow">Competitive intelligence | refreshed Sep 1, 2026</div>
        <h1>Alerts &amp; Signals</h1>
        <p>Material laboratory and diagnostics developments with article-level summaries prepared by ChatGPT from public sources. Financial-market-only stories are intentionally excluded so the feed stays focused on clinical, product, regulatory, partnership, technology, coverage and operating signals.</p>
        <div class="qac-meta"><span class="qac-chip">✓ 0 summaries pending</span><span class="qac-chip">${data.meta.companyCount} companies monitored</span><span class="qac-chip">${data.meta.articleCount} summarized developments</span></div>
      </section>
      <section class="qac-kpis">
        <div class="qac-kpi"><b>${data.meta.articleCount}</b><span>Summarized developments</span></div>
        <div class="qac-kpi"><b>${data.meta.companyCount}</b><span>Companies in current feed</span></div>
        <div class="qac-kpi"><b>${articles.filter(x=>x.priority==='High').length}</b><span>High-priority signals</span></div>
        <div class="qac-kpi"><b>${esc(prettyDate(newest).replace(/, 2026/,''))}</b><span>Newest development</span></div>
      </section>
      <section class="qac-controls">
        <input id="qacSearch" type="search" placeholder="Search company, topic, article or summary..." aria-label="Search alerts">
        <select id="qacCompany" aria-label="Filter company"><option value="">All companies</option>${companies.map(c=>`<option>${esc(c)}</option>`).join('')}</select>
        <select id="qacCategory" aria-label="Filter category"><option value="">All themes</option>${categories.map(c=>`<option>${esc(c)}</option>`).join('')}</select>
        <select id="qacPeriod" aria-label="Filter period"><option value="all">All current feed</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="180">Last 180 days</option><option value="365">Last 12 months</option></select>
      </section>
      <div class="qac-status"><span id="qacCount"></span><span><strong>Summary policy:</strong> every displayed article includes a completed ChatGPT summary</span></div>
      <section id="qacList" class="qac-list"></section>
    </div>`;

    const search=view.querySelector('#qacSearch'), company=view.querySelector('#qacCompany'), category=view.querySelector('#qacCategory'), period=view.querySelector('#qacPeriod');
    const list=view.querySelector('#qacList'), count=view.querySelector('#qacCount');
    function draw(){
      const q=clean(search.value).toLowerCase();
      const rows=articles.filter(x=>(!company.value||x.company===company.value)&&(!category.value||x.category===category.value)&&withinDays(x.date,period.value)&&(!q||`${x.company} ${x.title} ${x.summary} ${x.category}`.toLowerCase().includes(q)));
      count.textContent=`Showing ${rows.length} of ${articles.length} summarized developments`;
      list.innerHTML=rows.length?rows.map(x=>`<article class="qac-card" data-priority="${esc(x.priority)}">
        <div class="qac-top"><div class="qac-tags"><span class="qac-tag">${esc(x.company)}</span><span class="qac-tag">${esc(x.category)}</span><span class="qac-tag summary">ChatGPT summary</span></div><span class="qac-date">${esc(prettyDate(x.date))}</span></div>
        <h3>${esc(x.title)}</h3><p class="qac-summary">${esc(x.summary)}</p>
        <div class="qac-foot"><span class="qac-source">Source: ${esc(x.sourceLabel||'Public source')}</span><a class="qac-link" href="${esc(x.source)}" target="_blank" rel="noopener noreferrer">Open source ↗</a></div>
      </article>`).join(''):`<div class="qac-empty">No summarized developments match the current filters.</div>`;
    }
    [search,company,category,period].forEach(el=>el.addEventListener(el===search?'input':'change',draw));
    draw();
  }

  async function render(force=false){
    const view=findView(); if(!view) return;
    if(!force && view.dataset.alertsChatgptRelease===RELEASE && view.querySelector('.qac-wrap')) return;
    const data=await loadData(); if(!data) return;
    injectStyles(); buildShell(view,data);
    document.documentElement.dataset.alertsSummaryRelease=RELEASE;
  }

  function schedule(force=false){
    clearTimeout(renderTimer);
    renderTimer=setTimeout(()=>render(force),120);
  }

  function boot(){
    [450,1100,2200,3800].forEach((ms,i)=>setTimeout(()=>render(i>1),ms));
    document.addEventListener('click',e=>{const n=e.target.closest?.('.nav-item,[data-view],a,button');if(n&&/alert|signal/i.test(`${n.dataset?.view||''} ${n.textContent||''}`)) [120,650,1500].forEach((ms,i)=>setTimeout(()=>render(i>0),ms));},true);
    window.addEventListener('hashchange',()=>[150,800].forEach((ms,i)=>setTimeout(()=>render(i>0),ms)));
    window.addEventListener('quest:layout-refresh',e=>{if(!e.detail?.group||e.detail.group==='alerts') [180,900].forEach((ms,i)=>setTimeout(()=>render(i>0),ms));});
    window.addEventListener('quest:module-loaded',()=>schedule(true));
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
