(() => {
  'use strict';

  const RELEASE = '20260810b';
  const SUMMARY_PARTS = [
    'data/laboratory-article-summaries-01.b64',
    'data/laboratory-article-summaries-02.b64',
    'data/laboratory-article-summaries-03.b64'
  ];
  const BRAND_PATTERN = new RegExp('chat' + 'gpt', 'gi');
  const summaryIndex = new Map();
  let applying = false;
  let timer = 0;

  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
  const norm = value => clean(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[char]));

  function injectStyles() {
    let style = document.getElementById('qFrontendContentCleanupStyles');
    if (!style) {
      style = document.createElement('style');
      style.id = 'qFrontendContentCleanupStyles';
      document.head.appendChild(style);
    }
    style.textContent = `
      .view[data-view="alerts"] .q-visible-news-summary,
      .view[data-view="alerts"] .q-chatgpt-chip { display:none!important; }

      .view[data-view="alerts"] .q-final-summary,
      .view[data-view="alerts"] .q-article-summary {
        display:block!important;
        margin:8px 0 10px!important;
        padding:14px 15px!important;
        border:1px solid #dce7da!important;
        border-radius:10px!important;
        background:#f7fbf5!important;
        color:#34443b!important;
        font-size:15px!important;
        line-height:1.7!important;
        overflow-wrap:anywhere;
      }
      .view[data-view="alerts"] .q-final-summary strong,
      .view[data-view="alerts"] .q-article-summary strong {
        display:block!important;
        margin-bottom:7px!important;
        color:#034c1f!important;
        font-size:14px!important;
        line-height:1.35!important;
      }
      .view[data-view="alerts"] .q-final-summary > div,
      .view[data-view="alerts"] .q-article-summary .q-summary-copy {
        font-size:15px!important;
        line-height:1.7!important;
      }
      .view[data-view="alerts"] .q-article-summary .q-summary-note {
        margin-top:9px;
        padding-top:8px;
        border-top:1px solid #e4ebe3;
        color:#66736b;
        font-size:12px!important;
        line-height:1.5!important;
      }
      .view[data-view="alerts"] .q-final-summary.pending {
        display:block!important;
        background:#fbfcfa!important;
      }

      .view[data-view="alerts"] .page-heading p { font-size:13.5px!important; line-height:1.58!important; }
      .view[data-view="alerts"] .section-kicker { font-size:12px!important; }
      .view[data-view="alerts"] .live-status-pill { font-size:12.5px!important; line-height:1.4!important; }
      .view[data-view="alerts"] .live-filter-bar input,
      .view[data-view="alerts"] .live-filter-bar select,
      .view[data-view="alerts"] .live-filter-bar button { font-size:12.5px!important; }
      .view[data-view="alerts"] .live-kpi span,
      .view[data-view="alerts"] .live-kpi small { font-size:12px!important; line-height:1.45!important; }
      .view[data-view="alerts"] .live-news-head h2 { font-size:20px!important; }
      .view[data-view="alerts"] .live-news-head span { font-size:12.5px!important; }
      .view[data-view="alerts"] .live-news-card h3,
      .view[data-view="alerts"] .live-news-card h3 a { font-size:15.5px!important; line-height:1.48!important; }
      .view[data-view="alerts"] .live-chip { font-size:11.5px!important; }
      .view[data-view="alerts"] .live-meta,
      .view[data-view="alerts"] .live-card-footer a,
      .view[data-view="alerts"] .live-card-footer button,
      .view[data-view="alerts"] .live-disclaimer { font-size:12.5px!important; line-height:1.5!important; }
      .view[data-view="alerts"] .live-context { font-size:13px!important; line-height:1.6!important; }
      .view[data-view="alerts"] .q-theme-label,
      .view[data-view="alerts"] .q-theme-total { font-size:12.5px!important; }
      .view[data-view="alerts"] .q-theme-legend span,
      .view[data-view="alerts"] .q-tree-tile span { font-size:11.5px!important; }
      .view[data-view="alerts"] .q-tree-tile b { font-size:14px!important; }

      @media (max-width:720px) {
        .view[data-view="alerts"] .q-final-summary,
        .view[data-view="alerts"] .q-article-summary,
        .view[data-view="alerts"] .q-final-summary > div,
        .view[data-view="alerts"] .q-article-summary .q-summary-copy { font-size:14px!important; }
      }
    `;
  }

  function scrubBranding(root = document.body) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const parent = node.parentElement;
      if (!parent || /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA)$/i.test(parent.tagName)) continue;
      BRAND_PATTERN.lastIndex = 0;
      if (BRAND_PATTERN.test(node.nodeValue || '')) {
        BRAND_PATTERN.lastIndex = 0;
        node.nodeValue = String(node.nodeValue || '').replace(BRAND_PATTERN, 'AI');
      }
      BRAND_PATTERN.lastIndex = 0;
    }
    root.querySelectorAll?.('[title],[aria-label],[placeholder],[alt]').forEach(node => {
      ['title','aria-label','placeholder','alt'].forEach(attr => {
        const value = node.getAttribute(attr);
        if (!value) return;
        BRAND_PATTERN.lastIndex = 0;
        if (BRAND_PATTERN.test(value)) {
          BRAND_PATTERN.lastIndex = 0;
          node.setAttribute(attr, value.replace(BRAND_PATTERN, 'AI'));
        }
        BRAND_PATTERN.lastIndex = 0;
      });
    });
  }

  function removeLatestStrategicSynthesis() {
    const root = document.querySelector('.view[data-view="alerts"]');
    if (!root) return;
    const patterns = [
      /latest verified strategic synthesis/i,
      /what the newest signals mean competitively/i
    ];
    const candidates = Array.from(root.querySelectorAll('section,article,div'))
      .filter(node => {
        const value = clean(node.textContent);
        return value && value.length < 14000 && patterns.some(pattern => pattern.test(value));
      })
      .sort((a,b) => clean(a.textContent).length - clean(b.textContent).length);
    if (!candidates.length) return;
    let target = candidates[0];
    while (target.parentElement && target.parentElement !== root) {
      const parent = target.parentElement;
      const value = clean(parent.textContent);
      if (value.length > 14000 || !patterns.some(pattern => pattern.test(value))) break;
      target = parent;
    }
    if (target !== root) target.remove();
  }

  async function decodeSummaryPayload() {
    try {
      const parts = await Promise.all(SUMMARY_PARTS.map(async path => {
        const response = await fetch(`${path}?v=${RELEASE}`, {cache:'no-store'});
        if (!response.ok) throw new Error(`${path}: ${response.status}`);
        return (await response.text()).replace(/\s+/g, '');
      }));
      const binary = atob(parts.join(''));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
      const payload = JSON.parse(await new Response(stream).text());
      for (const record of Object.values(payload.summaries || {})) {
        if (!record?.title || !clean(record.summary)) continue;
        summaryIndex.set(norm(record.title), record);
      }
      document.documentElement.dataset.articleSummaryCount = String(summaryIndex.size);
    } catch (error) {
      console.error('Verified article summary data could not be loaded:', error);
    }
  }

  function recordForCard(card) {
    const title = norm(card.querySelector('h3,h4')?.textContent);
    if (!title) return null;
    if (summaryIndex.has(title)) return summaryIndex.get(title);
    let best = null;
    let bestLength = 0;
    for (const [key, record] of summaryIndex.entries()) {
      if (key.length < 28) continue;
      if ((title.includes(key) || key.includes(title)) && Math.min(title.length, key.length) > bestLength) {
        best = record;
        bestLength = Math.min(title.length, key.length);
      }
    }
    return best;
  }

  function newsCards(root) {
    const feed = root.querySelector('#liveNews') || root;
    const cards = new Set(feed.querySelectorAll('.live-news-card, article'));
    return Array.from(cards).filter(card => card.querySelector('h3,h4') && card.querySelector('a[href]'));
  }

  function renderArticleSummaries() {
    const root = document.querySelector('.view[data-view="alerts"]');
    if (!root) return;
    let rendered = 0;
    newsCards(root).forEach(card => {
      const record = recordForCard(card);
      const legacy = card.querySelector('.q-final-summary');
      card.querySelectorAll('.q-visible-news-summary').forEach(node => node.remove());
      if (!record) {
        if (legacy) {
          legacy.style.setProperty('display','block','important');
          const label = legacy.querySelector('strong');
          if (label) label.textContent = 'Article summary';
        }
        return;
      }
      let box = card.querySelector('.q-article-summary');
      if (!box && legacy) {
        box = legacy;
        box.classList.remove('q-final-summary','pending');
        box.classList.add('q-article-summary');
      }
      if (!box) {
        box = document.createElement('div');
        box.className = 'q-article-summary';
        const footer = card.querySelector('.live-card-footer');
        if (footer) footer.insertAdjacentElement('beforebegin', box);
        else card.appendChild(box);
      }
      const note = record.retrieval_status && record.retrieval_status !== 'publisher article accessed directly'
        ? `<div class="q-summary-note">Evidence basis: ${esc(record.retrieval_status)}</div>` : '';
      box.innerHTML = `<strong>Article summary</strong><div class="q-summary-copy">${esc(clean(record.summary))}</div>${note}`;
      box.dataset.summaryTitle = record.title;
      rendered += 1;
    });
    document.documentElement.dataset.visibleArticleSummaryCount = String(rendered);
  }

  function apply() {
    if (applying) return;
    applying = true;
    try {
      injectStyles();
      removeLatestStrategicSynthesis();
      renderArticleSummaries();
      scrubBranding(document.body);
      document.documentElement.dataset.frontendContentRelease = RELEASE;
    } finally {
      applying = false;
    }
  }

  function schedule(delay = 0) {
    clearTimeout(timer);
    timer = setTimeout(apply, delay);
  }

  async function boot() {
    injectStyles();
    scrubBranding(document.body);
    removeLatestStrategicSynthesis();
    await decodeSummaryPayload();
    apply();
    [200,500,1000,1800,3000].forEach(delay => setTimeout(() => schedule(0), delay));
    const observer = new MutationObserver(mutations => {
      if (applying) return;
      if (mutations.some(mutation => mutation.addedNodes?.length || mutation.type === 'characterData')) schedule(90);
    });
    observer.observe(document.body, {childList:true, subtree:true, characterData:true});
    window.addEventListener('quest:module-loaded', () => schedule(80));
    window.addEventListener('quest:layout-refresh', () => schedule(80));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
