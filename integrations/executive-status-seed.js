(() => {
  'use strict';
  const RELEASE='20260809h';
  const $=(s,r=document)=>r.querySelector(s);
  const home=()=>$('.view[data-view="home"],.view[data-view="executive"],.view[data-view="hub"],.view[data-view="dashboard"],.view[data-view="my-hub"]');
  const get=async path=>{try{const r=await fetch(`${path}?v=${RELEASE}&t=${Date.now()}`,{cache:'no-store'});return r.ok?await r.json():null}catch(_){return null}};
  function style(){
    if($('#qExecutiveStatusStyles'))return;
    const n=document.createElement('style');n.id='qExecutiveStatusStyles';n.textContent=`
      #floHomeStatus{background:#fff;border:1px solid #dfe5e0;border-radius:10px;padding:18px;box-shadow:0 7px 22px rgba(3,76,31,.05);margin:14px 0;color:#646464}
      #floHomeStatus h3{color:#034c1f;margin:0 0 7px;font-size:18px}.flo-kicker{display:block;color:#35792a;font-size:11px;font-weight:700;letter-spacing:1.1px;margin-bottom:5px}.flo-status-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.flo-status-card{border:1px solid #dfe5e0;border-radius:9px;padding:12px;background:#fff}.flo-status-card strong{display:block;color:#034c1f;font-size:13px;margin:5px 0}.flo-status-card small{font-size:10px;line-height:1.4;color:#646464}.flo-status-line{display:flex;align-items:center;gap:7px;font-size:11px}.flo-dot{width:8px;height:8px;border-radius:50%;background:#35792a;box-shadow:0 0 0 4px rgba(53,121,42,.12)}.flo-button{min-height:40px;border:1px solid #034c1f;border-radius:7px;padding:0 14px;background:#034c1f;color:#fff;font:700 13px Arial,sans-serif;cursor:pointer}.flo-button.secondary{background:#fff;color:#034c1f}
      @media(max-width:1100px){.flo-status-grid{grid-template-columns:repeat(3,1fr)}}@media(max-width:720px){.flo-status-grid{grid-template-columns:1fr 1fr}#floHomeStatus{padding:14px}}
    `;document.head.appendChild(n);
  }
  async function counts(){
    const [projects,news,social,benchmark]=await Promise.all([get('data/project-tracker.json'),get('data/laboratory-news.json'),get('data/social-intelligence.json'),get('data/public-demo-intelligence.json')]);
    return {projects:projects?.projects?.length||0,news:news?.items?.length||0,social:social?.companies?.length||0,benchmark:benchmark?.companies?.length||0};
  }
  async function mount(){
    const view=home();if(!view)return;
    style();const c=await counts();
    let panel=$('#floHomeStatus',view);
    if(!panel){
      panel=document.createElement('section');panel.id='floHomeStatus';
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