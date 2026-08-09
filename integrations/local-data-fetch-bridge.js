(() => {
  'use strict';
  const originalFetch = window.fetch.bind(window);
  const LAB_PAGES = 'https://atanubarik.github.io/laboratory-news-monitor/';
  const LAB_RAW = 'https://raw.githubusercontent.com/AtanuBarik/laboratory-news-monitor/main/';
  const LAB_MIRRORS = new Map([
    ['data/news.json', 'data/laboratory-news.json'],
    ['data/email_status.json', 'data/laboratory-email-status.json'],
    ['data/workflow_health.json', 'data/laboratory-workflow-health.json'],
    ['data/chatgpt_strategic_synthesis.json', 'data/laboratory-chatgpt-strategic-synthesis.json'],
    ['data/chatgpt_summaries.json', 'data/laboratory-chatgpt-summaries.json'],
  ]);
  const LOCAL_TO_SOURCE = new Map([...LAB_MIRRORS.entries()].map(([source, local]) => [local, source]));

  function laboratorySourcePath(url) {
    const value = String(url || '');
    if (value.startsWith(LAB_PAGES)) return value.slice(LAB_PAGES.length).split('?')[0];
    try {
      const absolute = new URL(value, document.baseURI);
      for (const [local, source] of LOCAL_TO_SOURCE.entries()) {
        const localPath = new URL(local, document.baseURI).pathname;
        if (absolute.origin === location.origin && absolute.pathname === localPath) return source;
      }
    } catch (_) {}
    return '';
  }

  async function publicLaboratorySource(url, init) {
    const sourcePath = laboratorySourcePath(url);
    if (!sourcePath || !LAB_MIRRORS.has(sourcePath)) return null;
    try {
      const response = await originalFetch(`${LAB_RAW}${sourcePath}?v=${Date.now()}`, {
        ...(init || {}),
        cache: 'no-store',
      });
      if (response.ok) return response;
    } catch (_) {}
    return null;
  }

  async function localLaboratoryMirror(url, init) {
    const sourcePath = laboratorySourcePath(url);
    const local = LAB_MIRRORS.get(sourcePath);
    if (!local) return null;
    try {
      const response = await originalFetch(new URL(local, document.baseURI).href, init);
      if (response.ok) return response;
    } catch (_) {}
    return null;
  }

  window.fetch = async function questLocalDataFetch(input, init) {
    const url = typeof input === 'string' ? input : input?.url || '';

    const laboratoryPublic = await publicLaboratorySource(url, init);
    if (laboratoryPublic) return laboratoryPublic;

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
