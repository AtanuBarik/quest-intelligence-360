(() => {
  'use strict';
  const RELEASE='20260901stable1';
  const ALIASES=new Map([['surveys','survey'],['survey-analytics','survey'],['profile','competitors'],['profiles','competitors'],['competitor-profiles','competitors']]);
  const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
  const route=v=>{const r=clean(v).replace(/^#(?:view=)?/,'').toLowerCase();return ALIASES.get(r)||r};
  const navs=()=>[...document.querySelectorAll('.nav-item[data-view]')];
  const views=()=>[...document.querySelectorAll('.view[data-view]')];
  function normalize(){
    navs().forEach(n=>{const r=route(n.dataset.view);if(r)n.dataset.view=r;if(/^survey analytics$/i.test(clean(n.textContent)))n.dataset.view='survey'});
    views().forEach(v=>{const r=route(v.dataset.view);if(r)v.dataset.view=r});
    document.querySelectorAll('.filter-bar button:not([type]),.toolbar button:not([type]),.button-row button:not([type]),[data-filter-bar] button:not([type])').forEach(b=>b.type='button');
    document.querySelectorAll('input[type="search"]').forEach(i=>{if(!i.autocomplete)i.autocomplete='off'});
  }
  function findNav(r){r=route(r);return navs().find(n=>route(n.dataset.view)===r)||null}
  function findView(r){r=route(r);return views().find(v=>route(v.dataset.view)===r)||null}
  function activate(r,selectedNav=null,notify=true){
    r=route(r);if(!r||r==='landscape')return false;normalize();const v=findView(r);if(!v)return false;const n=selectedNav||findNav(r);
    navs().forEach(x=>{const on=x===n||(!n&&route(x.dataset.view)===r);x.classList.toggle('active',on);if(on)x.setAttribute('aria-current','page');else x.removeAttribute('aria-current')});
    views().forEach(x=>{const on=x===v;x.classList.toggle('active',on);if(on){x.hidden=false;x.removeAttribute('aria-hidden');x.style.removeProperty('display');x.style.removeProperty('visibility')}});
    document.documentElement.dataset.questActiveView=r;document.documentElement.dataset.platformStabilityRelease=RELEASE;
    if(notify)window.dispatchEvent(new CustomEvent('quest:stable-route',{detail:{route:r}}));
    return true;
  }
  function activeRoute(){const n=document.querySelector('.nav-item.active[data-view],[aria-current="page"][data-view]'),v=document.querySelector('.view.active[data-view]');return route(n?.dataset?.view||v?.dataset?.view||'')}
  function reconcile(){normalize();const r=activeRoute();if(r&&!findView(r)?.classList.contains('active'))activate(r,findNav(r),false)}
  function boot(){
    normalize();reconcile();
    document.addEventListener('click',e=>{const n=e.target.closest?.('.nav-item[data-view]');if(n){const r=route(n.dataset.view);requestAnimationFrame(()=>activate(r,n,true));return}const j=e.target.closest?.('[data-view-jump]');if(j){const r=route(j.dataset.viewJump),n=findNav(r);if(n)requestAnimationFrame(()=>activate(r,n,true))}},false);
    window.addEventListener('hashchange',()=>requestAnimationFrame(reconcile));
    window.addEventListener('quest:module-loaded',()=>requestAnimationFrame(()=>{normalize();reconcile()}));
  }
  window.QuestPlatformStability={activateRoute:activate,reconcile,stabilizeControls:normalize,release:RELEASE};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
