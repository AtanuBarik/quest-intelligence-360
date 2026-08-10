(() => {
  'use strict';

  const RELEASE = '20260810f';
  const PATH = `integrations/strategic-analysis-v2.js?v=${RELEASE}`;

  function loadV2() {
    if (document.querySelector('script[data-strategic-analysis-v2-loader]')) return;
    const script = document.createElement('script');
    script.src = new URL(PATH, document.baseURI).href;
    script.async = false;
    script.dataset.strategicAnalysisV2Loader = 'true';
    script.onload = () => {
      document.documentElement.dataset.strategicAnalysisBridgeRelease = RELEASE;
      window.dispatchEvent(new CustomEvent('quest:module-loaded', {
        detail: { path: 'integrations/strategic-analysis-v2.js' }
      }));
    };
    script.onerror = () => console.error('Unable to load Strategic Analysis v2.');
    document.body.appendChild(script);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadV2, { once: true });
  else loadV2();
})();
