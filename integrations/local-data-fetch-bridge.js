(() => {
  'use strict';
  const originalFetch = window.fetch.bind(window);
  window.fetch = async function questLocalDataFetch(input, init) {
    const url = typeof input === 'string' ? input : input?.url || '';
    if (url.includes('data/project-tracker.json')) {
      try {
        const local = localStorage.getItem('quest-local-project-tracker');
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed?.projects) && parsed.projects.length) {
            return new Response(local, { status:200, headers:{ 'Content-Type':'application/json', 'X-Quest-Data-Source':'local-browser-import' } });
          }
        }
      } catch (_) {
        localStorage.removeItem('quest-local-project-tracker');
      }
    }
    return originalFetch(input, init);
  };
})();
