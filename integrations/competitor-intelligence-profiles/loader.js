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
      const patchedSource = source.replace(
        "const DATA_URL = 'data/competitor-profiles-expanded.json';",
        `const DATA_URL = '${dataUrl}';`
      );
      const script = document.createElement('script');
      script.dataset.integration = 'competitor-intelligence-profiles';
      script.textContent = `${patchedSource}\n//# sourceURL=competitor-intelligence-profiles.js`;
      document.body.appendChild(script);
      window.setTimeout(() => URL.revokeObjectURL(dataUrl), 120000);
    } catch (error) {
      if (dataUrl) URL.revokeObjectURL(dataUrl);
      console.error('Competitor Intelligence Profiles integration failed:', error);
    }
  }
  boot();
})();
