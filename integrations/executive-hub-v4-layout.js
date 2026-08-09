(() => {
  'use strict';

  const RELEASE = '20260809g';
  const URLS = {
    projects: `data/project-tracker.json?v=${RELEASE}`,
    news: `data/laboratory-news.json?v=${RELEASE}`,
    social: `data/social-intelligence.json?v=${RELEASE}`,
    benchmark: `data/public-demo-intelligence.json?v=${RELEASE}`,
  };
  const state = { projects:null, news:null, social:null, benchmark:null };
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const esc = (v='') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clamp = v => Math.max(0, Math.min(100, Number(v) || 0));
  let applying = false;
  let observer = null;

  function injectStyles(){
    if ($('#qExecutiveV4Styles')) return;
    const style = document.createElement('style');
    style.id = 'qExecutiveV4Styles';
    style.textContent = `
      #qExecutiveInsightPair{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:16px!important;align-items:stretch!important;width:100%!important;max-width:none!important;grid-column:1/-1!important;clear:both!important}
      #qExecutiveInsightPair>.panel,#qExecutiveInsightPair>.flo-panel,#qExecutiveInsightPair>.q-ui-card{width:100%!important;max-width:none!important;min-width:0!important;grid-column:auto!important;margin:0!important;overflow:visible!important}
      #qExecutiveInsightPair canvas{max-width:100%!important}
      #qExecutiveInsightPair .qv2-sub,#qExecutiveInsightPair .qv2-note,#qExecutiveInsightPair .qv2-meta,#qExecutiveInsightPair .qv2-project-meta,#qExecutiveInsightPair small{font-size:10px!important;line-height:1.45!important}
      #qExecutiveInsightPair .qv2-bar-row,#qExecutiveInsightPair .qv2-social-item,#qExecutiveInsightPair .qv2-voice-insights ul{font-size:10px!important;line-height:1.5!important}
      #qExecutiveInsightPair .qv2-head h3{font-size:17px!important;line-height:1.25!important}
      #qExecutiveInsightPair .qv2-social-list{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:10px!important}
      #qExecutiveInsightPair .qv2-social-item{padding:11px!important;min-height:78px!important}
      #qExecutiveInsightPair .qv2-voice-insights ul{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:10px!important}
      #qExecutiveInsightPair .qv2-voice-insights li{min-height:92px!important;padding:11px!important}
      .qv4-bubble-wrap{overflow:hidden;border:1px solid #d7e0d8;border-radius:10px;background:#fff}
      .qv4-bubble-svg{display:block;width:100%;height:auto;min-height:500px}
      .qv4-grid{stroke:#dfe5e0;stroke-width:1}.qv4-axis{fill:#4f5952;font-size:13px}.qv4-axis-title{fill:#034c1f;font-size:14px;font-weight:700}.qv4-label{fill:#16261d;font-size:13px;font-weight:700}.qv4-sub{fill:#5f6b63;font-size:11px}.qv4-value{fill:#fff;font-size:12px;font-weight:800;text-anchor:middle}
      .qv4-legend{display:flex;gap:18px;flex-wrap:wrap;align-items:center;padding:12px 15px;border-top:1px solid #e2e7e3;font-size:10px;color:#58635c}.qv4-legend i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:5px}
      .qv4-cards{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;margin-top:10px}.qv4-card{padding:10px;border:1px solid #dfe5e0;border-radius:8px;background:#fff}.qv4-card strong{display:block;color:#034c1f;font-size:11px}.qv4-card span{display:block;margin-top:4px;color:#626c65;font-size:10px;line-height:1.45}.qv4-note{margin-top:9px;color:#667069;font-size:10px;line-height:1.5}
      @media(max-width:1100px){#qExecutiveInsightPair{grid-template-columns:1fr!important}#qExecutiveInsightPair .qv2-social-list,#qExecutiveInsightPair .qv2-voice-insights ul{grid-template-columns:1fr!important}.qv4-cards{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:680px){.qv4-cards{grid-template-columns:1fr}.qv4-bubble-svg{min-height:420px}}
    `;
    document.head.appendChild(style);
  }

  async function loadData(){
    const entries = await Promise.all(Object.entries(URLS).map(async ([key,url]) => {
      try { const r = await fetch(`${url}&refresh=${Date.now()}`, {cache:'no-store'}); return [key, r.ok ? await r.json() : null]; }
      catch (_) { return [key, null]; }
    }));
    entries.forEach(([key,value]) => { if (value) state[key] = value; });
  }

  const homeView = () => $('.view[data-view="home"],.view[data-view="executive"],.view[data-view="hub"],.view[data-view="dashboard"],.view[data-view="my-hub"]');
  const findPanel = (view,re) => $$('.panel,.flo-panel,.q-ui-card',view).find(node => re.test((node.textContent || '').replace(/\s+/g,' ')));

  function topChildUnder(ancestor,node){
    let current = node;
    while (current && current.parentElement && current.parentElement !== ancestor) current = current.parentElement;
    return current;
  }

  function fixInsightsLayout(view){
    const voice = findPanel(view,/VOICE OF EXPERTS|Top unmet needs/i);
    const social = findPanel(view,/PUBLIC & SOCIAL ACTIVITY|Company activity pulse/i);
    if (!voice || !social) return;

    let pair = $('#qExecutiveInsightPair',view);
    if (!pair) {
      pair = document.createElement('section');
      pair.id = 'qExecutiveInsightPair';
      pair.setAttribute('aria-label','Voice of Experts and Public & Social Activity');
      const voiceTop = topChildUnder(view,voice);
      const socialTop = topChildUnder(view,social);
      const anchor = voiceTop && socialTop && (voiceTop.compareDocumentPosition(socialTop) & Node.DOCUMENT_POSITION_PRECEDING) ? socialTop : voiceTop;
      if (anchor && anchor.parentElement === view) view.insertBefore(pair,anchor);
      else view.appendChild(pair);
      pair.appendChild(voice);
      pair.appendChild(social);
      for (const oldTop of [voiceTop,socialTop]) {
        if (oldTop && oldTop !== voice && oldTop !== social && oldTop !== pair && oldTop.isConnected && !oldTop.querySelector('.panel,.flo-panel,.q-ui-card')) oldTop.style.display = 'none';
      }
    } else {
      if (voice.parentElement !== pair) pair.appendChild(voice);
      if (social.parentElement !== pair) pair.appendChild(social);
    }

    voice.style.removeProperty('width'); voice.style.removeProperty('max-width'); voice.style.removeProperty('min-width');
    social.style.removeProperty('width'); social.style.removeProperty('max-width'); social.style.removeProperty('min-width');
    window.requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
  }

  function canonical(value=''){
    const t = String(value).toLowerCase();
    if (t.includes('quest')) return 'Quest Diagnostics';
    if (t.includes('labcorp')) return 'Labcorp';
    if (t.includes('arup')) return 'ARUP Laboratories';
    if (t.includes('mayo')) return 'Mayo Clinic Laboratories';
    if (t.includes('sonic')) return 'Sonic Healthcare';
    return String(value || 'Market');
  }

  function activityCounts(){
    const names = (state.benchmark?.companies || []).map(x => canonical(x.name));
    const counts = Object.fromEntries(names.map(n => [n,0]));
    (state.news?.items || []).forEach(item => { const name = canonical(item.company); if (name in counts) counts[name] += 1; });
    return counts;
  }

  function socialScore(name){
    const all = state.social?.companies || [];
    const current = all.find(x => canonical(x.name) === name);
    if (!current || !all.length) return 0;
    const maxPosts = Math.max(1,...all.map(x => Number(x.posts || 0)));
    const maxEng = Math.max(1,...all.map(x => Number(x.engagement_rate || 0)));
    const maxMom = Math.max(1,...all.map(x => Number(x.momentum || 0)));
    return clamp(Number(current.posts || 0)/maxPosts*45 + Number(current.engagement_rate || 0)/maxEng*35 + Number(current.momentum || 0)/maxMom*20);
  }

  const THEMES = ['health system','digital','workflow','interoperability','analytics','ai','partnership','consumer','specialty','testing','stewardship','oncology','patient','data','access','innovation','genomic','genetic','automation'];
  function pmrAlignment(name,company){
    const projectText = (state.projects?.projects || []).map(x => `${x.project_name} ${x.sow_focus} ${x.next_step}`).join(' ').toLowerCase();
    const social = (state.social?.companies || []).find(x => canonical(x.name) === name);
    const companyNews = (state.news?.items || []).filter(x => canonical(x.company) === name).slice(0,20);
    const companyText = [company?.facts?.join(' '),social?.top_theme,social?.posts_summary?.map(x => `${x.theme} ${x.summary}`).join(' '),companyNews.map(x => `${x.title} ${x.description}`).join(' ')].join(' ').toLowerCase();
    const active = THEMES.filter(t => projectText.includes(t));
    return clamp(35 + active.filter(t => companyText.includes(t)).length * 7);
  }

  function rows(){
    const counts = activityCounts();
    const maxActivity = Math.max(1,...Object.values(counts));
    return (state.benchmark?.companies || []).map(company => {
      const name = canonical(company.name), b = company.benchmark || {};
      const strength = Math.round(([b.enterprise_scale,b.clinical_reach,b.specialty_depth,b.digital_access,b.global_reach].reduce((s,v) => s + Number(v || 0),0))/5);
      return {name,company,strength,pmr:Math.round(pmrAlignment(name,company)),activity:Math.round((counts[name] || 0)/maxActivity*100),social:Math.round(socialScore(name))};
    });
  }

  function bubbleSvg(data){
    const W=1180,H=510,L=86,R=62,T=48,B=72,PW=W-L-R,PH=H-T-B;
    const xmin=50,xmax=100;
    const x=v => L + (Math.max(xmin,Math.min(xmax,Number(v)||xmin))-xmin)/(xmax-xmin)*PW;
    const y=v => T + (100-clamp(v))/100*PH;
    const xticks=[50,60,70,80,90,100], yticks=[0,20,40,60,80,100];
    const gridX=xticks.map(t=>`<line class="qv4-grid" x1="${x(t)}" y1="${T}" x2="${x(t)}" y2="${T+PH}"/><text class="qv4-axis" x="${x(t)}" y="${T+PH+25}" text-anchor="middle">${t}</text>`).join('');
    const gridY=yticks.map(t=>`<line class="qv4-grid" x1="${L}" y1="${y(t)}" x2="${L+PW}" y2="${y(t)}"/><text class="qv4-axis" x="${L-17}" y="${y(t)+4}" text-anchor="end">${t}</text>`).join('');
    const colors={'Quest Diagnostics':'#034c1f','Labcorp':'#35792a','ARUP Laboratories':'#c6d52f','Mayo Clinic Laboratories':'#00587c','Sonic Healthcare':'#c78800'};
    const offsets={'Quest Diagnostics':[-74,-48],'Labcorp':[42,60],'ARUP Laboratories':[-65,-48],'Mayo Clinic Laboratories':[76,-28],'Sonic Healthcare':[-58,62]};
    const bubbles=data.map(r=>{
      const cx=x(r.strength),cy=y(r.pmr),radius=Math.min(43,22+Math.sqrt(Math.max(1,r.activity))*1.9);
      const [dx,dy]=offsets[r.name] || [0,-48];
      const lx=Math.max(110,Math.min(W-110,cx+dx)),ly=Math.max(28,Math.min(H-38,cy+dy));
      const short=r.name.replace(' Laboratories','').replace(' Healthcare','');
      return `<g><line x1="${cx}" y1="${cy}" x2="${lx}" y2="${ly}" stroke="#9cab9f" stroke-width="1.2"/><circle cx="${cx}" cy="${cy}" r="${radius}" fill="${colors[r.name]||'#35792a'}" fill-opacity=".9" stroke="#034c1f" stroke-width="1.7"><title>${esc(r.name)} — strength ${r.strength}, PMR relevance ${r.pmr}, public activity ${r.activity}, social activity ${r.social}</title></circle><text class="qv4-value" x="${cx}" y="${cy+4}">${r.strength}</text><text class="qv4-label" x="${lx}" y="${ly}" text-anchor="middle">${esc(short)}</text><text class="qv4-sub" x="${lx}" y="${ly+16}" text-anchor="middle">PMR ${r.pmr} · activity ${r.activity}</text></g>`;
    }).join('');
    return `<svg class="qv4-bubble-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Executive competitive benchmark bubble chart with X axis from 50 to 100"><rect x="${L}" y="${T}" width="${PW}" height="${PH}" fill="#fff" stroke="#cfd8d1"/>${gridX}${gridY}${bubbles}<text class="qv4-axis-title" x="${L+PW/2}" y="${H-16}" text-anchor="middle">Composite public-source competitive strength (50–100)</text><text class="qv4-axis-title" transform="translate(23 ${T+PH/2}) rotate(-90)" text-anchor="middle">PMR thematic relevance (0–100)</text></svg>`;
  }

  function renderBenchmark(view){
    const panel = $('#qExecutiveDecisionMap',view) || findPanel(view,/EXECUTIVE COMPETITIVE BENCHMARK|Company benchmark across public-source strength and PMR relevance/i);
    const data = rows();
    if (!panel || !data.length) return;
    if (panel.querySelector('.qv4-bubble-svg')) return;
    panel.innerHTML = `<div class="qv2-head"><div><span class="qv2-kicker">EXECUTIVE COMPETITIVE BENCHMARK</span><h3>Company benchmark across public-source strength and PMR relevance</h3></div><button class="secondary-button" type="button" data-qv4-refresh>↻ Refresh data</button></div><div class="qv2-benchmark-head"><span class="qv2-chip">${data.length} companies</span><span class="qv2-chip">X-axis focused to 50–100</span><span class="qv2-chip">Bubble size = recent public activity</span></div><div class="qv4-bubble-wrap">${bubbleSvg(data)}<div class="qv4-legend"><span><i style="background:#034c1f"></i>Quest</span><span><i style="background:#35792a"></i>Labcorp</span><span><i style="background:#c6d52f"></i>ARUP</span><span><i style="background:#00587c"></i>Mayo</span><span><i style="background:#c78800"></i>Sonic</span></div></div><div class="qv4-cards">${data.map(r=>`<div class="qv4-card"><strong>${esc(r.name)}</strong><span>Strength ${r.strength} · PMR relevance ${r.pmr}</span><span>Public activity ${r.activity} · Social activity ${r.social}</span></div>`).join('')}</div><div class="qv4-note">The focused 50–100 X-axis removes unused space and makes peer differences easier to read. Composite strength remains the average of enterprise scale, clinical reach, specialty depth, digital access and global reach; PMR relevance reflects overlap with current Quest workstream themes.</div>`;
    $('[data-qv4-refresh]',panel)?.addEventListener('click',async()=>{await loadData();panel.querySelector('.qv4-bubble-svg')?.remove();renderBenchmark(view);});
  }

  function apply(){
    if (applying) return;
    applying=true;
    try {
      const view=homeView();
      if (!view) return;
      fixInsightsLayout(view);
      renderBenchmark(view);
    } finally { applying=false; }
  }

  function observe(){
    if (observer) return;
    observer = new MutationObserver(() => {
      const view=homeView();
      if (!view) return;
      const benchmark=findPanel(view,/EXECUTIVE COMPETITIVE BENCHMARK|Company benchmark across public-source strength and PMR relevance/i);
      const pair=$('#qExecutiveInsightPair',view);
      if (!benchmark?.querySelector('.qv4-bubble-svg') || !pair) window.setTimeout(apply,80);
    });
    observer.observe(document.body,{childList:true,subtree:true});
  }

  async function boot(){
    injectStyles();
    await loadData();
    apply();
    observe();
    window.addEventListener('quest:layout-refresh',()=>setTimeout(apply,180));
    window.addEventListener('quest:module-loaded',()=>setTimeout(apply,180));
    document.addEventListener('click',e=>{if(e.target.closest?.('.nav-item,#floHomeRefresh'))setTimeout(apply,900)},true);
    window.setInterval(async()=>{await loadData();const view=homeView();if(view){const panel=$('#qExecutiveDecisionMap',view)||findPanel(view,/EXECUTIVE COMPETITIVE BENCHMARK/i);if(panel)panel.innerHTML='';apply();}},5*60*1000);
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
