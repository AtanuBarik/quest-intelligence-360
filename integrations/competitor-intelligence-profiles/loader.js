(() => {
  'use strict';

  const jsParts = ['chunk-00.b64','chunk-01.b64','chunk-02.b64','chunk-03.b64','chunk-04.b64','chunk-05.b64'];
  const dataParts = ['data-00.b64','data-01.b64','data-02.b64','data-03.b64'];

  async function inflateBase64(paths, base) {
    const responses = await Promise.all(paths.map(name => fetch(new URL(name, base), { cache: 'no-store' })));
    const failed = responses.find(response => !response.ok);
    if (failed) throw new Error(`Unable to load competitor intelligence bundle (${failed.status})`);
    const encoded = (await Promise.all(responses.map(response => response.text()))).join('').replace(/\s+/g, '');
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Response(stream).text();
  }

  function showLoadError(error) {
    console.error('Competitor Intelligence Profiles integration failed:', error);
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      const view = document.querySelector('.view[data-view="profiles"]');
      if (view && !view.querySelector('[data-cp-load-error]')) {
        const warning = document.createElement('div');
        warning.dataset.cpLoadError = 'true';
        warning.style.cssText = 'margin:12px 0;padding:12px 14px;border:1px solid #efc5d2;border-radius:10px;background:#fff4f7;color:#8e2647;font:600 12px/1.4 Arial,sans-serif';
        warning.textContent = `Expanded competitor profiles could not load: ${error.message}. Please refresh the page.`;
        view.prepend(warning);
        clearInterval(timer);
      }
      if (attempts > 120) clearInterval(timer);
    }, 100);
  }

  async function boot() {
    let dataUrl;
    try {
      const base = new URL('.', document.currentScript.src);
      const [source, dataText] = await Promise.all([
        inflateBase64(jsParts, base),
        inflateBase64(dataParts, base),
      ]);
      JSON.parse(dataText);
      dataUrl = URL.createObjectURL(new Blob([dataText], { type: 'application/json' }));

      // The base Quest application names this route "profiles". The original
      // expansion bundle used "competitors", so patch every route selector and
      // generated view identifier before execution.
      const patchedSource = source
        .replaceAll('data-view="competitors"', 'data-view="profiles"')
        .replaceAll("data-view='competitors'", "data-view='profiles'")
        .replace(
          "const DATA_URL = 'data/competitor-profiles-expanded.json';",
          `const DATA_URL = '${dataUrl}';`
        );

      const script = document.createElement('script');
      script.dataset.integration = 'competitor-intelligence-profiles';
      script.textContent = `${patchedSource}\nwindow.__QUEST_COMPETITOR_PROFILES_VERSION__='2026-08-05d';\n//# sourceURL=competitor-intelligence-profiles.js`;
      document.body.appendChild(script);
      window.setTimeout(() => URL.revokeObjectURL(dataUrl), 300000);
    } catch (error) {
      if (dataUrl) URL.revokeObjectURL(dataUrl);
      showLoadError(error);
    }
  }

  boot();
})();
