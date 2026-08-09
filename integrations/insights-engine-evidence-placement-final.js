(() => {
  'use strict';

  const RELEASE = '20260809r';
  let observer = null;
  let timer = 0;
  let applying = false;

  const $ = (selector, root = document) => root.querySelector(selector);

  function injectStyles() {
    let style = document.getElementById('qieEvidencePlacementFinalStyles');
    if (!style) {
      style = document.createElement('style');
      style.id = 'qieEvidencePlacementFinalStyles';
      document.head.appendChild(style);
    }
    style.textContent = `
      #qieWorkspaceV3{
        grid-template-columns:minmax(305px,340px) minmax(0,1fr)!important;
        grid-template-areas:"repos repos" "sidebar main"!important;
        align-items:start!important;
        gap:16px!important;
      }
      #qieRepositoriesSlotV3{grid-area:repos!important;min-width:0!important;width:100%!important}
      #qieSidebarV3{grid-area:sidebar!important;min-width:0!important;width:100%!important}
      #qieMainColumnFinal{
        grid-area:main!important;
        display:grid!important;
        grid-template-columns:minmax(0,1fr)!important;
        gap:16px!important;
        min-width:0!important;
        width:100%!important;
        align-content:start!important;
      }
      #qieEvidenceSlotV3{display:none!important}
      #qieMainColumnFinal > #qieEvidenceV3,
      #qieMainColumnFinal > #qieMainV3{
        grid-area:auto!important;
        width:100%!important;
        min-width:0!important;
        max-width:none!important;
        margin:0!important;
      }
      #qieMainColumnFinal > #qieEvidenceV3{order:1!important}
      #qieMainColumnFinal > #qieMainV3{order:2!important}

      #qieWorkspaceV3 .qie-desc,
      #qieWorkspaceV3 .qie-header-actions button,
      #qieWorkspaceV3 .qie-option-card :is(p,span,small,label,button,strong,a),
      #qieWorkspaceV3 .qie-option-card,
      #qieMainV3 :is(p,small,label,button,input,textarea,a),
      #qieMainV3 :is([class*="meta"],[class*="sub"],[class*="helper"],[class*="caption"],[class*="description"],[class*="status"],[class*="scope"],[class*="evidence"]){
        font-size:12px!important;
        line-height:1.4!important;
      }
      #qieMainV3 textarea,
      #qieMainV3 input{font-size:12px!important}
      #qieMainV3 button{font-size:12px!important;line-height:1.35!important}
      #qieMainV3 h1,#qieMainV3 h2,#qieMainV3 h3,#qieMainV3 h4{font-size:inherit}
      #qieWorkspaceV3 .qie-title{font-size:16px!important}
      #qieWorkspaceV3 .qie-icon{font-size:15px!important}

      @media(max-width:960px){
        #qieWorkspaceV3{
          grid-template-columns:1fr!important;
          grid-template-areas:"repos" "sidebar" "main"!important;
        }
      }
    `;
  }

  function layoutReady() {
    return document.getElementById('qieWorkspaceV3') &&
      document.getElementById('qieEvidenceV3') &&
      document.getElementById('qieMainV3') &&
      document.getElementById('qieRepositoriesSlotV3') &&
      document.getElementById('qieSidebarV3');
  }

  function needsRepair() {
    if (!layoutReady()) return true;
    const wrapper = document.getElementById('qieMainColumnFinal');
    if (!wrapper) return true;
    return document.getElementById('qieEvidenceV3')?.parentElement !== wrapper ||
      document.getElementById('qieMainV3')?.parentElement !== wrapper;
  }

  function apply() {
    if (applying || !layoutReady()) return;
    applying = true;
    observer?.disconnect();
    try {
      injectStyles();
      const shell = document.getElementById('qieWorkspaceV3');
      const evidence = document.getElementById('qieEvidenceV3');
      const main = document.getElementById('qieMainV3');
      let wrapper = document.getElementById('qieMainColumnFinal');
      if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.id = 'qieMainColumnFinal';
        wrapper.setAttribute('aria-label', 'Evidence selection and Quest Enterprise Insights Engine');
        shell.appendChild(wrapper);
      }
      if (evidence.parentElement !== wrapper) wrapper.appendChild(evidence);
      if (main.parentElement !== wrapper) wrapper.appendChild(main);
      document.documentElement.dataset.insightsEvidencePlacement = RELEASE;
      requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    } finally {
      applying = false;
      watch();
    }
  }

  function schedule(delay = 0) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (needsRepair()) apply();
      else injectStyles();
    }, delay);
  }

  function watch() {
    observer?.disconnect();
    const shell = document.getElementById('qieWorkspaceV3');
    if (!shell) return;
    observer = new MutationObserver(() => {
      if (needsRepair()) schedule(100);
    });
    observer.observe(shell, { childList:true, subtree:true });
  }

  function boot() {
    injectStyles();
    schedule(120);
    [450,1000,1800,3000].forEach(delay => setTimeout(() => schedule(0), delay));
    window.addEventListener('quest:layout-refresh', () => schedule(120));
    window.addEventListener('hashchange', () => schedule(180));
    document.addEventListener('click', event => {
      const nav = event.target.closest?.('.nav-item');
      if (nav && /Insights Engine|Insights Copilot/i.test(nav.textContent || '')) schedule(260);
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
