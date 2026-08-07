(() => {
  'use strict';

  const RELEASE = '20260807d';
  const REMOTE_BASE = 'https://atanubarik.github.io/laboratory-news-monitor';
  const SOURCES = {
    news: ['data/laboratory-news.json', `${REMOTE_BASE}/data/news.json`],
    summaries: ['data/laboratory-chatgpt-summaries.json', `${REMOTE_BASE}/data/chatgpt_summaries.json`],
    strategic: ['data/laboratory-chatgpt-strategic-synthesis.json', `${REMOTE_BASE}/data/chatgpt_strategic_synthesis.json`],
    workflow: ['data/laboratory-workflow-health.json', `${REMOTE_BASE}/data/workflow_health.json`],
  };
  const COLORS = ['#35792a','#034c1f','#c6d52f','#024c6a','#3995bb','#80276c','#c78800','#9a9a9a'];
  const state = {news:null,summaries:null,strategic:null,workflow:null,companyChart:null,categoryChart:null};

  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const byId = id => document.getElementById(id);
  const text = node => (node?.textContent || '').trim();
  const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

  function injectStyles(){
    if(document.getElementById('alertsResilienceStyles')) return;
    const style=document.createElement('style');
    style.id='alertsResilienceStyles';
    style.textContent=`
      .q-visible-news-summary{margin:2px 0 3px;padding:10px 11px;border-radius:9px;background:#f6faf4;border:1px solid #e0e9df;color:#4f5a53;font-size:10px;line-height:1.55}.q-visible-news-summary strong{display:block;margin-bottom:4px;color:#034c1f;font-size:9px;text-transform:uppercase;letter-spacing:.03em}.q-visible-news-summary p{margin:0}.q-summary-evidence{margin-top:5px;color:#6a746e;font-size:8.5px}.q-alerts-recovered{margin:8px 0 12px;padding:9px 11px;border:1px solid #dbe6da;border-left:4px solid #35792a;border-radius:9px;background:#fbfdf9;color:#59645d;font-size:9px}.q-alerts-recovered strong{color:#034c1f}.q-summary-categories{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}.q-summary-categories article{padding:9px;border:1px solid #e2e9e3;border-radius:8px;background:#fff}.q-summary-categories strong{display:block;color:#034c1f;font-size:9px;margin-bottom:3px}.q-summary-categories span{font-size:9px;line-height:1.45;color:#646464}@media(max-width:760px){.q-summary-categories{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  async function fetchFirst(candidates){
    for(const url of candidates){
      try{
        const response=await fetch(`${url}${url.includes('?')?'&':'?'}v=${Date.now()}`,{cache:'no-store'});
        if(!response.ok) throw new Error(String(response.status));
        return await response.json();
      }catch(_){ }
    }
    return null;
  }

  function summaryIndex(){
    const map=new Map();
    const external=state.summaries?.summaries || {};
    for(const item of state.news?.items || []){
      const record=external[item.id] || {};
      const summary=item.chatgpt_summary || record.summary;
      if(!summary) continue;
      const data={summary,provider:item.summary_provider || record.provider || state.summaries?.provider || 'ChatGPT',sources:item.summary_evidence || record.sources_used || []};
      if(item.id) map.set(`id:${item.id}`,data);
      if(item.url) map.set(`url:${item.url}`,data);
      if(item.title) map.set(`title:${normalize(item.title)}`,data);
    }
    return map;
  }

  function findSummary(card,map){
    for(const link of card.querySelectorAll('a[href]')){
      if(map.has(`url:${link.href}`)) return map.get(`url:${link.href}`);
    }
    const title=normalize(text(card.querySelector('h3,h4')));
    if(map.has(`title:${title}`)) return map.get(`title:${title}`);
    for(const [key,value] of map.entries()) if(key.startsWith('title:') && title && (key.slice(6).includes(title)||title.includes(key.slice(6)))) return value;
    return null;
  }

  function addVisibleSummaries(){
    const map=summaryIndex();
    document.querySelectorAll('.view[data-view="alerts"] .live-news-card').forEach(card=>{
      if(card.querySelector('.q-visible-news-summary')) return;
      const record=findSummary(card,map);
      if(!record) return;
      const sentences=String(record.summary).replace(/\s+/g,' ').split(/(?<=[.!?])\s+/).filter(Boolean).slice(0,3).join(' ');
      const box=document.createElement('div');
      box.className='q-visible-news-summary';
      box.innerHTML=`<strong>Verified summary</strong><p>${esc(sentences || record.summary)}</p><div class="q-summary-evidence">${esc(record.provider)}${record.sources?.length ? ` · ${record.sources.length} supporting source${record.sources.length===1?'':'s'}` : ''}</div>`;
      const footer=card.querySelector('.live-card-footer');
      if(footer) footer.insertAdjacentElement('beforebegin',box); else card.appendChild(box);
    });
  }

  function currentItems(){
    const items=state.news?.items || [];
    const search=String(byId('liveSearch')?.value || '').trim().toLowerCase();
    const company=byId('liveCompany')?.value || '';
    const category=byId('liveCategory')?.value || '';
    const period=Number(byId('livePeriod')?.value || 30);
    const sourceType=byId('liveSourceType')?.value || '';
    const cutoff=Date.now()-(Number.isFinite(period)?period:9999)*86400000;
    return items.filter(item=>{
      const hay=`${item.title||''} ${item.description||''} ${item.chatgpt_summary||''} ${item.source||''} ${item.company||''} ${item.category||''}`.toLowerCase();
      const when=Date.parse(item.published_at||'');
      return (!search||hay.includes(search)) && (!company||item.company===company) && (!category||item.category===category) && (!sourceType||(sourceType==='official'?item.official_source:!item.official_source)) && (!Number.isFinite(when)||when>=cutoff);
    });
  }

  function destroyChart(chart){ try{ chart?.destroy?.(); }catch(_){ } }

  function renderCharts(){
    if(!window.Chart || !state.news) return;
    const companyCanvas=byId('liveCompanyVolumeChart');
    const categoryCanvas=byId('liveCategoryMixChart');
    if(!companyCanvas || !categoryCanvas) return;
    const items=currentItems();
    const companies=[...new Set(items.map(item=>item.company).filter(Boolean))];
    const categories=[...new Set(items.map(item=>item.category).filter(Boolean))];
    const companyCounts=companies.map(company=>items.filter(item=>item.company===company).length);
    destroyChart(state.companyChart);
    destroyChart(state.categoryChart);
    state.companyChart=new Chart(companyCanvas,{type:'bar',data:{labels:companies,datasets:[{label:'News items',data:companyCounts,backgroundColor:companies.map((_,i)=>COLORS[i%COLORS.length])}]},options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{beginAtZero:true},y:{}}}});
    state.categoryChart=new Chart(categoryCanvas,{type:'bar',data:{labels:companies,datasets:categories.map((category,i)=>({label:category,data:companies.map(company=>items.filter(item=>item.company===company&&item.category===category).length),backgroundColor:COLORS[i%COLORS.length]}))},options:{responsive:true,maintainAspectRatio:false,scales:{x:{stacked:true},y:{stacked:true,beginAtZero:true}}}});
    setTimeout(()=>{try{state.companyChart?.resize?.();state.categoryChart?.resize?.();}catch(_){}},120);
  }

  function renderStrategicSummary(){
    const target=byId('liveSummaryContent');
    if(!target || !state.strategic?.synthesis) return;
    const existing=text(target);
    if(existing && !/apply filters|temporarily unavailable|no synthesis|loading/i.test(existing) && target.dataset.qPreloaded==='1') return;
    const paragraphs=String(state.strategic.synthesis).split(/\n{2,}/).filter(Boolean).map(p=>`<p>${esc(p)}</p>`).join('');
    const categories=Object.entries(state.strategic.categories||{}).slice(0,4).map(([name,value])=>`<article><strong>${esc(name)}</strong><span>${esc(value)}</span></article>`).join('');
    target.innerHTML=`${paragraphs}${categories?`<div class="q-summary-categories">${categories}</div>`:''}`;
    target.dataset.qPreloaded='1';
    const meta=byId('liveSummaryMeta');
    if(meta) meta.textContent=`Precomputed ${state.strategic.provider||'ChatGPT'} strategic synthesis · Updated ${state.strategic.updated_at_display||'latest monitor refresh'}`;
  }

  function fallbackRenderFeed(){
    const root=byId('liveNews');
    if(!root || root.querySelector('.live-news-card') || !state.news) return;
    const items=currentItems().slice(0,30);
    if(!items.length) return;
    root.dataset.qFallback='1';
    root.innerHTML=items.map(item=>{
      const summary=item.chatgpt_summary || item.description || '';
      const excerpt=String(summary).replace(/\s+/g,' ').split(/(?<=[.!?])\s+/).filter(Boolean).slice(0,3).join(' ');
      return `<article class="live-news-card"><div class="live-chips"><span class="live-chip">${esc(item.company)}</span><span class="live-chip blue">${esc(item.category)}</span>${item.chatgpt_summary?'<span class="live-chip q-chatgpt-chip">ChatGPT verified</span>':''}</div><h3><a href="${esc(item.url)}" target="_blank" rel="noopener">${esc(item.title)}</a></h3><div class="live-meta">${esc(item.source||'Source unavailable')} · ${esc(item.published_display||'')}</div>${excerpt?`<div class="q-visible-news-summary"><strong>${item.chatgpt_summary?'Verified summary':'Available context'}</strong><p>${esc(excerpt)}</p></div>`:''}<div class="live-card-footer"><a href="${esc(item.url)}" target="_blank" rel="noopener">Open original evidence →</a></div></article>`;
    }).join('');
    const visible=byId('liveVisibleCount'); if(visible) visible.textContent=currentItems().length.toLocaleString();
    const label=byId('liveResultLabel'); if(label) label.textContent=`${currentItems().length.toLocaleString()} results`;
  }

  function addRecoveryStatus(){
    const view=document.querySelector('.view[data-view="alerts"]');
    if(!view || view.querySelector('.q-alerts-recovered')) return;
    const heading=view.querySelector('.page-heading');
    const workflow=state.workflow||{};
    const note=document.createElement('div');
    note.className='q-alerts-recovered';
    note.innerHTML=`<strong>Alerts data layer:</strong> ${esc(state.news?.item_count ?? state.news?.items?.length ?? 0)} current events · summaries and charts use local synchronized data first with the laboratory monitor as fallback${workflow.last_run_display?` · source run ${esc(workflow.last_run_display)}`:''}.`;
    if(heading) heading.insertAdjacentElement('afterend',note); else view.prepend(note);
  }

  function enhance(){
    injectStyles();
    fallbackRenderFeed();
    addVisibleSummaries();
    renderStrategicSummary();
    renderCharts();
    addRecoveryStatus();
  }

  async function load(){
    const [news,summaries,strategic,workflow]=await Promise.all([
      fetchFirst(SOURCES.news),fetchFirst(SOURCES.summaries),fetchFirst(SOURCES.strategic),fetchFirst(SOURCES.workflow)
    ]);
    if(news) state.news=news;
    if(summaries) state.summaries=summaries;
    if(strategic) state.strategic=strategic;
    if(workflow) state.workflow=workflow;
    enhance();
    setTimeout(enhance,250);
    setTimeout(enhance,900);
  }

  function bind(){
    document.addEventListener('click',event=>{
      if(event.target.closest?.('.nav-item[data-view="alerts"],#liveApplyFilters,#liveResetFilters,#liveRefreshBtn')) setTimeout(enhance,180);
    },true);
    ['input','change'].forEach(type=>document.addEventListener(type,event=>{
      if(event.target?.matches?.('#liveSearch,#liveCompany,#liveCategory,#livePeriod,#liveSourceType')) setTimeout(()=>{renderCharts();addVisibleSummaries();},90);
    },true));
    window.addEventListener('quest:layout-refresh',()=>setTimeout(enhance,100));
    window.addEventListener('quest:module-loaded',()=>setTimeout(enhance,100));
  }

  function boot(){bind();load();document.documentElement.dataset.alertsResilienceRelease=RELEASE;}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
  window.QuestAlertsResilience={release:RELEASE,reload:load,state};
})();
