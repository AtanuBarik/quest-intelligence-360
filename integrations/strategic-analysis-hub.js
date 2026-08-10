(() => {
  'use strict';

  const RELEASE = '20260810g';
  const SCRIPTS = [
    ['integrations/strategic-analysis-final-fixes.js', 'strategicAnalysisFinalFixLoader'],
    ['integrations/strategic-analysis-v2.js', 'strategicAnalysisV2Loader']
  ];

  function loadScript(path, datasetKey) {
    return new Promise((resolve, reject) => {
      const existing = Array.from(document.scripts).find(script => (script.src || '').includes(path));
      if (existing) return resolve(existing);
      const script = document.createElement('script');
      script.src = new URL(`${path}?v=${RELEASE}`, document.baseURI).href;
      script.async = false;
      script.dataset[datasetKey] = 'true';
      script.onload = () => resolve(script);
      script.onerror = () => reject(new Error(`Unable to load ${path}`));
      document.body.appendChild(script);
    });
  }

  async function loadV2() {
    if (document.documentElement.dataset.strategicAnalysisBridgeRelease === RELEASE) return;
    try {
      for (const [path, datasetKey] of SCRIPTS) await loadScript(path, datasetKey);
      document.documentElement.dataset.strategicAnalysisBridgeRelease = RELEASE;
      window.dispatchEvent(new CustomEvent('quest:module-loaded', {
        detail: { path: 'integrations/strategic-analysis-v2.js' }
      }));
    } catch (error) {
      console.error('Unable to load Strategic Analysis v2:', error);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadV2, { once: true });
  else loadV2();
})();
