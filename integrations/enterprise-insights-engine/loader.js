(() => {
  'use strict';
  const parts = ['chunk-00.b64', 'chunk-01.b64', 'chunk-02.b64', 'chunk-03.b64', 'chunk-04.b64', 'chunk-05.b64'];
  async function boot() {
    try {
      const base = new URL('.', document.currentScript.src);
      const responses = await Promise.all(parts.map(name => fetch(new URL(name, base), { cache: 'no-store' })));
      const failed = responses.find(response => !response.ok);
      if (failed) throw new Error(`Unable to load enterprise insights bundle (${failed.status})`);
      const encoded = (await Promise.all(responses.map(response => response.text()))).join('').replace(/\s+/g, '');
      const binary = atob(encoded);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
      const source = await new Response(stream).text();
      const script = document.createElement('script');
      script.dataset.integration = 'enterprise-insights-engine';
      script.textContent = `${source}\n//# sourceURL=enterprise-insights-engine.js`;
      document.body.appendChild(script);
    } catch (error) {
      console.error('Enterprise Insights Engine integration failed:', error);
    }
  }
  boot();
})();
