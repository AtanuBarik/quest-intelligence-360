(() => {
  'use strict';

  const RELEASE = '20260901layout1';
  const DATA_URL = 'data/alerts-chatgpt-summaries.gz.b64';
  const nativeFetch = window.fetch.bind(window);
  let payloadPromise = null;

  const clean = value => String(value || '').replace(/\s+/g,' ').trim();
  const isoDate = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) ? `${value}T12:00:00Z` : value;
  const displayDate = value => {
    const d = new Date(isoDate(value));
    return Number.isNaN(d.getTime()) ? String(value || '') : d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
  };
  const domain = value => { try { return new URL(value).hostname.replace(/^www\./,''); } catch (_) { return ''; } };

  async function loadPayload() {
    if (payloadPromise) return payloadPromise;
    payloadPromise = (async () => {
      const response = await nativeFetch(new URL(`${DATA_URL}?v=${RELEASE}`,document.baseURI),{cache:'no-store'});
      if (!response.ok) throw new Error(`Curated alerts data ${response.status}`);
      const encoded = (await response.text()).replace(/\s+/g,'');
      const binary = atob(encoded);
      const bytes = new Uint8Array(binary.length);
      for (let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i);
      if (!('DecompressionStream' in window)) throw new Error('Gzip decompression is not supported by this browser.');
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
      return new Response(stream).json();
    })().catch(error => { console.error('Quest curated Alerts feed failed:',error); throw error; });
    return payloadPromise;
  }

  function toNewsPayload(source) {
    const articles = [...(source?.articles || [])].sort((a,b)=>String(b.date).localeCompare(String(a.date)));
    const items = articles.map((article,index) => {
      const url = article.source || article.url || '#';
      const published = isoDate(article.date);
      const sourceLabel = article.sourceLabel || article.company || 'Public source';
      return {
        id: article.id || `curated-${index}-${String(article.date || '').replace(/\D/g,'')}`,
        company: article.company,
        title: article.title,
        url,
        description: article.summary,
        source: sourceLabel,
        source_url: url,
        source_domain: domain(url),
        published_at: published,
        published_display: displayDate(article.date),
        category: article.category || 'Other',
        official_source: /newsroom|press release|official|company/i.test(clean(sourceLabel)),
        sources: [{name:sourceLabel,url,domain:domain(url),published_at:published}],
        coverage_count: 1,
        event_signature: article.id || article.title,
        priority: article.priority || 'Medium',
        chatgpt_summary: article.summary,
        summary_provider: 'ChatGPT (OpenAI)',
        summary_status: 'complete'
      };
    });
    return {
      generated_at: source?.generatedAt || source?.generated_at || new Date().toISOString(),
      generated_at_display: '01 Sep 2026',
      item_count: items.length,
      raw_relevant_item_count: items.length,
      duplicates_merged: 0,
      failures: [],
      curated: true,
      content_policy: source?.contentPolicy || source?.content_policy || '',
      items
    };
  }

  function toSummaryPayload(source) {
    const summaries = {};
    (source?.articles || []).forEach((article,index) => {
      const id = article.id || `curated-${index}-${String(article.date || '').replace(/\D/g,'')}`;
      summaries[id] = {
        title: article.title,
        company: article.company,
        source: article.sourceLabel || 'Public source',
        source_url: article.source || article.url || '',
        summary: article.summary,
        provider: 'ChatGPT (OpenAI)',
        model: 'GPT-5.6 Sol',
        updated_at: source?.generatedAt || new Date().toISOString(),
        verification: 'curated_public_source'
      };
    });
    return {
      provider: 'ChatGPT (OpenAI)',
      model: 'GPT-5.6 Sol',
      updated_at: source?.generatedAt || new Date().toISOString(),
      news_item_count: Object.keys(summaries).length,
      summary_count: Object.keys(summaries).length,
      remaining_unsummarized: 0,
      generation_mode: 'curated_current_feed',
      summaries
    };
  }

  function requestKind(input) {
    const raw = typeof input === 'string' ? input : input?.url || '';
    let url;
    try { url = new URL(raw,document.baseURI); } catch (_) { return ''; }
    const path = url.pathname;
    if (url.hostname === 'atanubarik.github.io' && /\/laboratory-news-monitor\/data\/news\.json$/i.test(path)) return 'news';
    if (/\/data\/laboratory-openai-summaries\.json$/i.test(path)) return 'summaries';
    if (url.hostname === 'atanubarik.github.io' && /\/laboratory-news-monitor\/data\/chatgpt_summaries\.json$/i.test(path)) return 'summaries';
    return '';
  }

  window.fetch = async function questCuratedFetch(input, init) {
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
    document.documentElement.dataset.alertsDataLayerRelease = RELEASE;
    document.documentElement.dataset.alertsDataLayerMode = 'legacy-design-current-data';
    window.dispatchEvent(new CustomEvent('quest:curated-alerts-ready',{detail:{count:source?.articles?.length || 0,release:RELEASE}}));
  }).catch(()=>{});
})();
