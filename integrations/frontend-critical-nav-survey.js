(() => {
  'use strict';
  const RELEASE='20260901stable1';
  const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
  function cleanup(){
    document.querySelectorAll('.nav-item').forEach(n=>{if(/^competitive landscape$/i.test(clean(n.textContent)))n.remove();if(/^survey analytics$/i.test(clean(n.textContent)))n.dataset.view='survey'});
    document.querySelectorAll('.view[data-view]').forEach(v=>{const h=clean(v.querySelector('h1,h2,h3,[class*="title"]')?.textContent);if(v.dataset.view==='landscape'||/competitive landscape/i.test(h))v.remove();else if(v.dataset.view==='surveys'||/^survey analytics$/i.test(h))v.dataset.view='survey'});
    const items=[...document.querySelectorAll('.nav-item')],tracker=items.find(n=>/^project tracker$/i.test(clean(n.textContent))),evidence=items.find(n=>/^evidence library$/i.test(clean(n.textContent)));if(tracker&&evidence&&tracker.parentElement===evidence.parentElement&&tracker.nextElementSibling!==evidence)tracker.insertAdjacentElement('afterend',evidence);
  }
  function load(path,key){const existing=[...document.scripts].find(s=>(s.src||'').includes(path));if(existing)return existing;const s=document.createElement('script');s.src=new URL(`${path}?v=${RELEASE}`,document.baseURI).href;s.async=false;if(key)s.dataset[key]='true';document.body.appendChild(s);return s}
  function ensureCore(){cleanup();load('integrations/platform-runtime-stability.js','qStableRuntime');load('integrations/competitive-intelligence-live-refresh/loader.js','qCiLiveRefresh');load('integrations/alerts-chatgpt-summaries.js','qAlertsStable');document.documentElement.dataset.criticalFrontendRelease=RELEASE}
  function boot(){ensureCore();document.addEventListener('click',e=>{const n=e.target.closest?.('.nav-item[data-view]');if(!n)return;cleanup();const r=n.dataset.view;if(r==='survey')load('integrations/survey-analytics-dashboard-final.js','qCriticalSurvey');if(['alerts','competitors','news','social'].includes(r))load('integrations/competitive-intelligence-live-refresh/loader.js','qCiLiveRefresh');if(r==='alerts')load('integrations/alerts-chatgpt-summaries.js','qAlertsStable')},false)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();