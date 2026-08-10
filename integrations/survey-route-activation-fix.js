(() => {
  'use strict';
  const RELEASE='20260810s';
  let queued=false;
  const text=v=>String(v||'').replace(/\s+/g,' ').trim();

  function cleanNav(){
    document.querySelectorAll('.nav-item').forEach(n=>{if(/^competitive landscape$/i.test(text(n.textContent)))n.remove()});
    document.querySelectorAll('.view[data-view]').forEach(v=>{if(v.dataset.view==='landscape'||/competitive landscape/i.test(text(v.querySelector('h1,h2,h3')?.textContent)))v.remove()});
    const items=[...document.querySelectorAll('.nav-item')];
    const tracker=items.find(n=>/^project tracker$/i.test(text(n.textContent)));
    const evidence=items.find(n=>/^evidence library$/i.test(text(n.textContent)));
    if(tracker&&evidence&&tracker.parentElement===evidence.parentElement&&tracker.nextElementSibling!==evidence)tracker.insertAdjacentElement('afterend',evidence);
  }

  function surveySelected(){
    const active=[...document.querySelectorAll('.nav-item.active,[aria-current="page"]')].find(n=>n.dataset?.view==='survey'||/^survey analytics$/i.test(text(n.textContent)));
    return Boolean(active);
  }

  function activateSurvey(){
    const view=document.querySelector('.view[data-view="survey"]');
    if(!view)return;
    document.querySelectorAll('.view[data-view]').forEach(v=>v.classList.toggle('active',v===view));
    view.style.removeProperty('display');
    view.style.removeProperty('visibility');
    view.removeAttribute('hidden');
    document.documentElement.dataset.surveyRouteFix=RELEASE;
  }

  function apply(){
    queued=false;
    cleanNav();
    if(surveySelected())activateSurvey();
  }

  function schedule(delay=0){
    if(delay){setTimeout(apply,delay);return}
    if(queued)return;queued=true;(window.requestAnimationFrame||setTimeout)(apply);
  }

  function boot(){
    apply();
    document.addEventListener('click',e=>{
      const n=e.target.closest('.nav-item');
      if(!n)return;
      cleanNav();
      if(n.dataset.view==='survey'||/^survey analytics$/i.test(text(n.textContent))){[0,50,250,800,1600].forEach(schedule);}
    },true);
    window.addEventListener('hashchange',()=>[0,100,500].forEach(schedule));
    window.addEventListener('quest:layout-refresh',()=>[0,100,500].forEach(schedule));
    const observer=new MutationObserver(m=>{if(m.some(x=>x.addedNodes&&x.addedNodes.length))schedule()});
    observer.observe(document.body,{childList:true,subtree:true});
    [300,900,1800,3500].forEach(schedule);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
