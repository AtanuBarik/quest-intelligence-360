(() => {
  'use strict';

  const RELEASE = '20260916ux7';
  const LIVE_NEWS_URL = 'data/laboratory-news.json';
  const SUMMARY_URL = 'data/laboratory-openai-summaries.json';
  const SCHEDULED_SUMMARY_URL = 'data/laboratory-chatgpt-summaries.json';
  const nativeFetch = window.fetch.bind(window);
  let payloadPromise = null;

  const clean = value => String(value || '').replace(/\s+/g,' ').trim();
  const normTitle = value => clean(value).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

  async function loadJson(path, fallback = {}) {
    try {
      const response = await nativeFetch(new URL(`${path}?v=${RELEASE}&t=${Date.now()}`, document.baseURI), { cache:'no-store' });
      if (!response.ok) throw new Error(`${path} ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn(`Quest Alerts data source unavailable (${path}):`, error);
      return fallback;
    }
  }

  async function loadPayload() {
    if (payloadPromise) return payloadPromise;
    payloadPromise = (async () => {
      const [news, openai, scheduled] = await Promise.all([
        loadJson(LIVE_NEWS_URL, {items:[]}),
        loadJson(SUMMARY_URL, {summaries:{}}),
        loadJson(SCHEDULED_SUMMARY_URL, {summaries:{}})
      ]);
      const summaries = {...(scheduled?.summaries || {}), ...(openai?.summaries || {})};
      const byTitle = new Map();
      Object.values(summaries).forEach(record => {
        const key = normTitle(record?.title);
        if (key && record?.summary) byTitle.set(key, record);
      });
      return { news, openai, scheduled, summaries, byTitle };
    })().catch(error => { payloadPromise = null; throw error; });
    return payloadPromise;
  }

  function recordFor(item, source) {
    const direct = source.summaries?.[item?.id];
    if (direct?.summary) return direct;
    return source.byTitle.get(normTitle(item?.title)) || null;
  }

  function toNewsPayload(source) {
    const base = source.news || {};
    const items = (base.items || []).map(item => {
      const record = recordFor(item, source);
      if (!record) return item;
      return {
        ...item,
        chatgpt_summary: record.summary,
        summary_provider: record.provider || source.openai?.provider || source.scheduled?.provider || 'Quest article-summary pipeline',
        summary_updated_at: record.updated_at || source.openai?.updated_at || source.scheduled?.updated_at || base.generated_at,
        summary_status: record.summary_tier === 'instant_feed_brief' ? 'instant' : 'complete',
        summary_verification: record.verification || (record.content_verified ? 'content_verified' : 'available'),
        summary_evidence: record.sources_used || record.sources || []
      };
    });
    return {
      ...base,
      item_count: items.length,
      items,
      summary_count: items.filter(item => clean(item.chatgpt_summary)).length,
      remaining_unsummarized: items.filter(item => !clean(item.chatgpt_summary)).length,
      summary_data_layer: RELEASE
    };
  }

  function toSummaryPayload(source) {
    const items = source.news?.items || [];
    const matched = {};
    items.forEach(item => {
      const record = recordFor(item, source);
      if (record?.summary && item.id) matched[item.id] = record;
    });
    return {
      provider: source.openai?.provider || source.scheduled?.provider || 'Quest article-summary pipeline',
      model: source.openai?.model || source.scheduled?.model || 'mixed',
      updated_at: source.openai?.updated_at || source.scheduled?.updated_at || source.news?.generated_at || new Date().toISOString(),
      news_item_count: items.length,
      summary_count: Object.keys(matched).length,
      verified_summary_count: source.openai?.verified_summary_count,
      instant_feed_brief_count: source.openai?.instant_feed_brief_count,
      remaining_unsummarized: Math.max(0, items.length - Object.keys(matched).length),
      generation_mode: 'live_feed_complete_coverage',
      summaries: matched
    };
  }

  function requestKind(input) {
    const raw = typeof input === 'string' ? input : input?.url || '';
    let url;
    try { url = new URL(raw, document.baseURI); } catch (_) { return ''; }
    const path = url.pathname;
    if (url.hostname === 'atanubarik.github.io' && /\/laboratory-news-monitor\/data\/news\.json$/i.test(path)) return 'news';
    if (url.hostname === 'atanubarik.github.io' && /\/laboratory-news-monitor\/data\/chatgpt_summaries\.json$/i.test(path)) return 'summaries';
    return '';
  }

  window.fetch = async function questLiveAlertsFetch(input, init) {
    const kind = requestKind(input);
    if (!kind) return nativeFetch(input, init);
    try {
      const source = await loadPayload();
      const body = kind === 'news' ? toNewsPayload(source) : toSummaryPayload(source);
      return new Response(JSON.stringify(body), {status:200,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Quest-Data-Layer':RELEASE}});
    } catch (_) {
      return nativeFetch(input, init);
    }
  };

  loadPayload().then(source => {
    const news = toNewsPayload(source);
    document.documentElement.dataset.alertsDataLayerRelease = RELEASE;
    document.documentElement.dataset.alertsDataLayerMode = 'live-news-complete-summary-coverage';
    window.dispatchEvent(new CustomEvent('quest:curated-alerts-ready',{detail:{count:news.item_count || 0,summaries:news.summary_count || 0,remaining:news.remaining_unsummarized || 0,release:RELEASE}}));
  }).catch(()=>{});
})();