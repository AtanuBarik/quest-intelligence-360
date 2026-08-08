(() => {
  'use strict';
  const originalFetch = window.fetch.bind(window);
  const LAB_REMOTE = 'https://atanubarik.github.io/laboratory-news-monitor/';
  const LAB_MIRRORS = new Map([
    ['data/news.json', 'data/laboratory-news.json'],
    ['data/email_status.json', 'data/laboratory-email-status.json'],
    ['data/workflow_health.json', 'data/laboratory-workflow-health.json'],
    ['data/chatgpt_strategic_synthesis.json', 'data/laboratory-chatgpt-strategic-synthesis.json'],
    ['data/chatgpt_summaries.json', 'data/laboratory-chatgpt-summaries.json'],
  ]);

  async function localLaboratoryMirror(url, init) {
    if (!url.startsWith(LAB_REMOTE)) return null;
    const relative = url.slice(LAB_REMOTE.length).split('?')[0];
    const local = LAB_MIRRORS.get(relative);
    if (!local) return null;
    try {
      const response = await originalFetch(new URL(local, document.baseURI).href, init);
      if (response.ok) return response;
    } catch (_) {}
    return null;
  }

  window.fetch = async function questLocalDataFetch(input, init) {
    const url = typeof input === 'string' ? input : input?.url || '';

    const laboratoryMirror = await localLaboratoryMirror(url, init);
    if (laboratoryMirror) return laboratoryMirror;

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
