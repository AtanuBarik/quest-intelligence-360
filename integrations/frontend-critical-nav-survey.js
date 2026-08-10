(() => {
  'use strict';
  const RELEASE = '20260810q';
  let queued = false;

  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();

  function fixNavigation() {
    Array.from(document.querySelectorAll('.nav-item')).forEach(node => {
      if (/^competitive landscape$/i.test(clean(node.textContent))) node.remove();
    });
    Array.from(document.querySelectorAll('.view[data-view]')).forEach(view => {
      const heading = Array.from(view.querySelectorAll('h1,h2,h3,[class*="title"]')).map(node => clean(node.textContent)).join(' | ');
      if (view.dataset.view === 'landscape' || /competitive landscape/i.test(heading)) view.remove();
    });
    const items = Array.from(document.querySelectorAll('.nav-item'));
    const tracker = items.find(node => /^project tracker$/i.test(clean(node.textContent)));
    const evidence = items.find(node => /^evidence library$/i.test(clean(node.textContent)));
    if (tracker && evidence && tracker.parentElement === evidence.parentElement && tracker.nextElementSibling !== evidence) {
      tracker.insertAdjacentElement('afterend', evidence);
    }
  }

  function ensureSurveyRenderer() {
    const survey = document.querySelector('.view[data-view="survey"]');
    if (!survey || survey.dataset.surveyFinal === 'true') return;
    const hasScript = Array.from(document.scripts).some(script => (script.src || '').includes('survey-analytics-dashboard-final.js'));
    if (!hasScript) {
      const script = document.createElement('script');
      script.src = new URL(`integrations/survey-analytics-dashboard-final.js?v=${RELEASE}`, document.baseURI).href;
      script.async = false;
      script.dataset.qCriticalSurvey = 'true';
      document.body.appendChild(script);
    }
    window.setTimeout(() => {
      const current = document.querySelector('.view[data-view="survey"]');
      if (current && current.dataset.surveyFinal !== 'true' && !current.querySelector('[data-q-survey-load-error]')) {
        current.innerHTML = '<div data-q-survey-load-error style="margin:24px;padding:18px;border:1px solid #d8e4d7;border-left:4px solid #c78800;border-radius:12px;background:#fff;color:#3f5046;font:600 14px/1.5 Arial,sans-serif">Survey Analytics is loading its current data module. If this message remains visible, refresh once to retrieve the latest release.</div>';
      }
    }, 2500);
  }

  function apply() {
    queued = false;
    fixNavigation();
    ensureSurveyRenderer();
    document.documentElement.dataset.criticalFrontendRelease = RELEASE;
  }

  function schedule() {
    if (queued) return;
    queued = true;
    (window.requestAnimationFrame || window.setTimeout)(apply);
  }

  function boot() {
    apply();
    const observer = new MutationObserver(mutations => {
      if (mutations.some(m => m.addedNodes && m.addedNodes.length)) schedule();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('click', event => {
      if (event.target.closest('.nav-item')) window.setTimeout(apply, 0);
    }, true);
    window.addEventListener('hashchange', () => window.setTimeout(apply, 0));
    [250, 800, 1800].forEach(delay => window.setTimeout(apply, delay));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
