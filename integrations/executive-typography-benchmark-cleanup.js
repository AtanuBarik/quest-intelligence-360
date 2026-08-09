(() => {
  'use strict';

  const RELEASE = '20260809k';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  let observer = null;
  let timer = 0;

  function homeView() {
    return $('.view[data-view="home"],.view[data-view="executive"],.view[data-view="hub"],.view[data-view="dashboard"],.view[data-view="my-hub"]');
  }

  function injectStyles() {
    let style = $('#qExecutiveTypographyCleanupStyles');
    if (!style) {
      style = document.createElement('style');
      style.id = 'qExecutiveTypographyCleanupStyles';
      document.head.appendChild(style);
    }

    style.textContent = `
      .view[data-view="home"] .qef-kicker,
      .view[data-view="home"] .qef-sub,
      .view[data-view="home"] .qef-chip,
      .view[data-view="home"] .qef-signal p,
      .view[data-view="home"] .qef-meta,
      .view[data-view="home"] .qef-link,
      .view[data-view="home"] .qef-mini span,
      .view[data-view="home"] .qef-combined,
      .view[data-view="home"] .qef-action,
      .view[data-view="home"] .qef-project-meta,
      .view[data-view="home"] .qef-status,
      .view[data-view="home"] .qef-footer,
      .view[data-view="home"] .qef-button,
      .view[data-view="home"] .qef-social-item,
      .view[data-view="home"] .qef-social-item div,
      .view[data-view="home"] .qef-voice-insights,
      .view[data-view="home"] .qef-voice-insights li,
      .view[data-view="home"] .qeis-donut-key,
      .view[data-view="home"] .qeis-donut-key span,
      .view[data-view="home"] .qeis-donut-key strong,
      .view[data-view="home"] .qeis-donut-center span,
      .view[data-view="home"] .flo-status-line,
      .view[data-view="home"] .flo-status-card small,
      .view[data-view="home"] .kpi-card span,
      .view[data-view="home"] .kpi-card small,
      .view[data-view="home"] #qExecutiveInsightPairFinal .qef-sub,
      .view[data-view="home"] #qExecutiveInsightPairFinal .qef-social-item,
      .view[data-view="home"] #qExecutiveInsightPairFinal .qef-social-item div,
      .view[data-view="home"] #qExecutiveInsightPairFinal .qef-voice-insights li,
      .view[data-view="home"] #qExecutiveInsightPairFinal .qeis-donut-key,
      .view[data-view="home"] #qExecutiveInsightPairFinal .qeis-donut-key span,
      .view[data-view="home"] #qExecutiveInsightPairFinal .qeis-donut-key strong,
      .view[data-view="home"] #qExecutiveInsightPairFinal .qeis-donut-center span {
        font-size:12px!important;
        line-height:1.5!important;
      }

      .view[data-view="home"] .qef-signal strong,
      .view[data-view="home"] .qef-project strong,
      .view[data-view="home"] .qef-voice-insights h4,
      .view[data-view="home"] .qeis-social>.qef-social-list::before,
      .view[data-view="home"] .flo-status-card strong,
      .view[data-view="home"] .qef-alert-item strong {
        font-size:14px!important;
        line-height:1.4!important;
      }

      .view[data-view="home"] .qef-head h3 {
        font-size:18px!important;
      }

      .view[data-view="home"] .qef-bubble-svg g>line,
      .view[data-view="home"] .qef-bubble-svg .qef-label,
      .view[data-view="home"] .qef-bubble-svg .qef-bubble-sub {
        display:none!important;
      }

      .view[data-view="home"] .qef-bubble-svg .qef-axis {
        font-size:13px!important;
      }
      .view[data-view="home"] .qef-bubble-svg .qef-axis-title {
        font-size:14px!important;
      }
      .view[data-view="home"] .qef-bubble-svg .qef-value {
        font-size:14px!important;
      }

      /* Keep legends and footnotes at their existing compact size. */
      .view[data-view="home"] .qef-legend,
      .view[data-view="home"] .qef-legend *,
      .view[data-view="home"] .qef-note,
      .view[data-view="home"] .qef-company-card span,
      .view[data-view="home"] .qef-company-card strong {
        font-size:10px!important;
      }
    `;
  }

  function cleanBenchmark(view) {
    const panel = $('#qExecutiveDecisionMap', view);
    if (!panel) return;
    $$('.qef-bubble-svg g>line,.qef-bubble-svg .qef-label,.qef-bubble-svg .qef-bubble-sub', panel).forEach(node => {
      node.setAttribute('aria-hidden', 'true');
      node.style.display = 'none';
    });
  }

  function apply() {
    const view = homeView();
    if (!view) return;
    injectStyles();
    cleanBenchmark(view);
    document.documentElement.dataset.executiveTypography = RELEASE;
  }

  function schedule(delay = 0) {
    clearTimeout(timer);
    timer = setTimeout(apply, delay);
  }

  function watch() {
    const view = homeView();
    if (!view) return;
    observer?.disconnect();
    observer = new MutationObserver(() => schedule(100));
    observer.observe(view, { childList:true, subtree:true });
  }

  function boot() {
    injectStyles();
    schedule(50);
    schedule(600);
    watch();
    window.addEventListener('quest:layout-refresh', () => schedule(120));
    window.addEventListener('quest:executive-status-ready', () => schedule(120));
    window.addEventListener('hashchange', () => { schedule(120); setTimeout(watch, 180); });
    document.addEventListener('click', event => {
      if (event.target.closest?.('.nav-item,#floHomeRefresh,[data-qef-refresh]')) schedule(700);
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
