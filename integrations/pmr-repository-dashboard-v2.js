(() => {
  'use strict';
  const FINAL_PATH = 'integrations/pmr-repository-dashboard-final.js';
  if (Array.from(document.scripts).some(script => (script.src || '').includes(FINAL_PATH))) return;
  const script = document.createElement('script');
  script.src = new URL(`${FINAL_PATH}?v=20260810n`, document.baseURI).href;
  script.async = true;
  script.dataset.qPmrCompatibility = 'v2-retired';
  document.body.appendChild(script);
})();
