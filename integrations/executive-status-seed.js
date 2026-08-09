(() => {
  'use strict';
  const RELEASE='20260809h';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const home=()=>$('.view[data-view="home"],.view[data-view="executive"],.view[data-view="hub"],.view[data-view="dashboard"],.view[data-view="my-hub"]');
  const get=async path=>{try{const r=await fetch(`${path}?v=${RELEASE}&t=${Date.now()}`,{cache:'no-store'});return r.ok?await r.json():null}catch(_){return null}};
  async function counts(){
    const [projects,news,social,benchmark]=await Promise.all([get('data/project-tracker.json'),get('data/laboratory-news.json'),get('data/social-intelligence.json'),get('data/public-demo-intelligence.json')]);
    return {projects:projects?.projects?.length||0,news:news?.items?.length||0,social:social?.companies?.length||0,benchmark:benchmark?.companies?.length||0};
  }
  async function mount(){
    const view=home();if(!view)return;
    const c=await counts();
    let panel=$('#floHomeStatus',view);
    if(!panel){
      panel=document.createElement('section');
      panel.className='flo-panel flo-shell';
      panel.id='floHomeStatus';
      const kpis=$('.kpi-grid',view);
      if(kpis?.parentElement)kpis.insertAdjacentElement('afterend',panel);else view.prepend(panel);
    }
    panel.innerHTML=`<div style="display:flex;justify-content:space-between;gap:12px;align-items:start"><div><span class="flo-kicker">LIVE OPERATIONS</span><h3>Connected intelligence services</h3></div><button class="flo-button secondary" id="floHomeRefresh">Refresh all</button></div><div class="flo-status-grid" style="margin-top:12px"><article class="flo-status-card"><div class="flo-status-line"><i class="flo-dot"></i>Project portfolio</div><strong>${c.projects} workstreams</strong><small>JSON-driven weekly tracker</small></article><article class="flo-status-card"><div class="flo-status-line"><i class="flo-dot"></i>News monitor</div><strong>${c.news.toLocaleString()} articles</strong><small>Action synchronization in 6hours</small></article><article class="flo-status-card"><div class="flo-status-line"><i class="flo-dot"></i>Social dashboard</div><strong>${c.social} companies</strong><small>Connected activity dataset</small></article><article class="flo-status-card"><div class="flo-status-line"><i class="flo-dot"></i>Local research</div><strong>Browser index</strong><small>Approved local files on demand</small></article><article class="flo-status-card"><div class="flo-status-line"><i class="flo-dot"></i>Executive benchmark</div><strong>${c.benchmark} companies</strong><small>Public-source + PMR alignment</small></article></div>`;
    $('#floHomeRefresh',panel)?.addEventListener('click',async()=>{const button=$('#floHomeRefresh',panel);if(button){button.disabled=true;button.textContent='Refreshing…'}await window.__QUEST_EXECUTIVE_FINAL__?.refresh?.();await mount();});
    window.dispatchEvent(new CustomEvent('quest:executive-status-ready'));
  }
  function boot(){mount();document.addEventListener('click',e=>{if(e.target.closest?.('.nav-item'))setTimeout(mount,250)},true)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();