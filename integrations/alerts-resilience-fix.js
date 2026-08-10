(() => {
  'use strict';

  const RELEASE = '20260810a';
  const REMOTE_BASE = 'https://atanubarik.github.io/laboratory-news-monitor';
  const SOURCES = {
    news: [`${REMOTE_BASE}/data/news.json`, 'data/laboratory-news.json'],
    summaries: ['data/laboratory-openai-summaries.json', `${REMOTE_BASE}/data/chatgpt_summaries.json`, 'data/laboratory-chatgpt-summaries.json'],
    workflow: [`${REMOTE_BASE}/data/workflow_health.json`, 'data/laboratory-workflow-health.json']
  };
  const state = { news: null, summaries: null, workflow: null, loading: false, loadedAt: 0 };

  async function fetchFirst(candidates) {
    for (const url of candidates) {
      try {
        const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) throw new Error(String(response.status));
        return await response.json();
      } catch (_) { /* try the next resilient source */ }
    }
    return null;
  }

  async function load() {
    if (state.loading) return state;
    state.loading = true;
    try {
      const [news, summaries, workflow] = await Promise.all([
        fetchFirst(SOURCES.news),
        fetchFirst(SOURCES.summaries),
        fetchFirst(SOURCES.workflow)
      ]);
      if (news) state.news = news;
      if (summaries) state.summaries = summaries;
      if (workflow) state.workflow = workflow;
      state.loadedAt = Date.now();
      window.dispatchEvent(new CustomEvent('quest:alerts-data-ready', {
        detail: {
          itemCount: state.news?.item_count ?? state.news?.items?.length ?? 0,
          summaryCount: state.summaries?.summary_count ?? Object.keys(state.summaries?.summaries || {}).length
        }
      }));
    } finally {
      state.loading = false;
    }
    return state;
  }

  function boot() {
    load();
    window.setInterval(load, 6 * 60 * 60 * 1000);
    document.documentElement.dataset.alertsResilienceRelease = RELEASE;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();

  window.QuestAlertsResilience = { release: RELEASE, reload: load, state };
})();
