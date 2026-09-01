(() => {
  'use strict';
  const RELEASE='20260901alerts1';
  let queued=false;
  const clean=v=>String(v||'').replace(/\s+/g,' ').trim();

  function fixNavigation(){
    document.querySelectorAll('.nav-item').forEach(n=>{if(/^competitive landscape$/i.test(clean(n.textContent)))n.remove()});
    document.querySelectorAll('.view[data-view]').forEach(v=>{
      const h=clean(v.querySelector('h1,h2,h3,[class*="title"]')?.textContent);
      if(v.dataset.view==='landscape'||/competitive landscape/i.test(h)){v.remove();return;}
      if(v.dataset.view==='surveys'||/^survey analytics$/i.test(h))v.dataset.view='survey';
    });
    const items=[...document.querySelectorAll('.nav-item')];
    const survey=items.find(n=>/^survey analytics$/i.test(clean(n.textContent)));
    if(survey)survey.dataset.view='survey';
    const tracker=items.find(n=>/^project tracker$/i.test(clean(n.textContent)));
    const evidence=items.find(n=>/^evidence library$/i.test(clean(n.textContent)));
    if(tracker&&evidence&&tracker.parentElement===evidence.parentElement&&tracker.nextElementSibling!==evidence)tracker.insertAdjacentElement('afterend',evidence);
  }

  function surveyIsSelected(){
    return [...document.querySelectorAll('.nav-item.active,[aria-current="page"]')].some(n=>n.dataset?.view==='survey'||n.dataset?.view==='surveys'||/^survey analytics$/i.test(clean(n.textContent)));
  }

  function surveyView(){
    const v=document.querySelector('.view[data-view="survey"],.view[data-view="surveys"]');
    if(v&&v.dataset.view!=='survey')v.dataset.view='survey';
    return v;
  }

  function activateSurvey(){
    const v=surveyView();
    if(!v)return;
    document.querySelectorAll('.view[data-view]').forEach(x=>x.classList.toggle('active',x===v));
    v.style.removeProperty('display');
    v.style.removeProperty('visibility');
    v.removeAttribute('hidden');
    document.documentElement.dataset.surveyActivationRelease=RELEASE;
  }

  function loadScript(path,attr){
    const existing=[...document.scripts].find(s=>(s.src||'').includes(path));
    if(existing){
      if((path.includes('competitive-intelligence-live-refresh')||path.includes('alerts-chatgpt-summaries'))&&!existing.src.includes(RELEASE))existing.remove();
      else return existing;
    }
    const s=document.createElement('script');s.src=new URL(`${path}?v=${RELEASE}`,document.baseURI).href;s.async=false;if(attr)s.dataset[attr]='true';document.body.appendChild(s);return s;
  }

  function ensureCompetitiveRefresh(){
    loadScript('integrations/competitive-intelligence-live-refresh/loader.js','qCiLiveRefresh');
    document.documentElement.dataset.permanentCompetitiveIntelligence=RELEASE;
  }

  function ensureAlertsSummaries(){
    loadScript('integrations/alerts-chatgpt-summaries.js','qAlertsChatgptSummaries');
    document.documentElement.dataset.permanentAlertsSummaries=RELEASE;
  }

  function ensureSurvey(){
    const v=surveyView();
    if(!v)return;
    if(v.dataset.surveyFinal!=='true')loadScript('integrations/survey-analytics-dashboard-final.js','qCriticalSurvey');
    [700,1500,2800].forEach(t=>setTimeout(()=>{
      const current=surveyView();
      if(surveyIsSelected())activateSurvey();
      if(current&&current.dataset.surveyFinal!=='true'&&current.dataset.surveyFailsafe!=='true')loadScript('integrations/survey-analytics-failsafe.js','qSurveyFailsafe');
    },t));
  }

  function apply(){queued=false;fixNavigation();ensureSurvey();ensureCompetitiveRefresh();ensureAlertsSummaries();if(surveyIsSelected())activateSurvey();document.documentElement.dataset.criticalFrontendRelease=RELEASE;}
  function schedule(delay=0){if(delay){setTimeout(apply,delay);return}if(queued)return;queued=true;(window.requestAnimationFrame||setTimeout)(apply)}
  function boot(){
    apply();
    document.addEventListener('click',e=>{const n=e.target.closest('.nav-item');if(!n)return;fixNavigation();if(/alert|strategic signal|competitor profile|strategic analysis|social|perception/i.test(clean(n.textContent)))ensureCompetitiveRefresh();if(/alert|strategic signal/i.test(clean(n.textContent)))ensureAlertsSummaries();if(n.dataset.view==='survey'||n.dataset.view==='surveys'||/^survey analytics$/i.test(clean(n.textContent)))[0,40,150,500,1200].forEach(schedule);else schedule()},true);
    window.addEventListener('hashchange',()=>[0,100,400].forEach(schedule));
    window.addEventListener('quest:layout-refresh',()=>[0,100,400].forEach(schedule));
    const o=new MutationObserver(m=>{if(m.some(x=>x.addedNodes&&x.addedNodes.length))schedule()});o.observe(document.body,{childList:true,subtree:true});
    [250,800,1800,3500].forEach(schedule);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
