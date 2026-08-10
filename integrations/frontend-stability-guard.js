(() => {
  'use strict';

  const RELEASE = '20260810d';
  const SUMMARY_PARTS = [
    'data/laboratory-article-summaries-01.b64',
    'data/laboratory-article-summaries-02.b64',
    'data/laboratory-article-summaries-03.b64'
  ];
  const BRAND_PATTERN = new RegExp('chat' + 'gpt', 'gi');
  const summaries = new Map();
  let ready = false;
  let applying = false;
  let timer = 0;
  let observer = null;

  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
  const norm = value => clean(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[char]));

  function observe() {
    if (!observer || !document.body) return;
    observer.observe(document.body, {childList:true, subtree:true, characterData:true});
  }

  function injectStyles() {
    let style = document.getElementById('qPermanentFrontendStabilityStyles');
    if (!style) {
      style = document.createElement('style');
      style.id = 'qPermanentFrontendStabilityStyles';
      document.head.appendChild(style);
    }
    if (style.dataset.release === RELEASE) return;
    style.dataset.release = RELEASE;
    style.textContent = `
      .view[data-view="alerts"] .q-final-summary,
      .view[data-view="alerts"] .q-visible-news-summary,
      .view[data-view="alerts"] .q-article-summary{display:none!important}

      .view[data-view="alerts"] .q-stable-article-summary{
        display:block!important;visibility:visible!important;opacity:1!important;
        height:auto!important;max-height:none!important;overflow:visible!important;
        margin:8px 0 10px!important;padding:15px 16px!important;
        border:1px solid #d8e4d7!important;border-radius:10px!important;
        background:#f7fbf5!important;color:#324239!important;
        font-size:15px!important;line-height:1.7!important;font-weight:400!important;
      }
      .view[data-view="alerts"] .q-stable-article-summary strong{
        display:block!important;margin:0 0 7px!important;color:#034c1f!important;
        font-size:14px!important;line-height:1.35!important;font-weight:750!important;
      }
      .view[data-view="alerts"] .q-stable-summary-copy{
        display:block!important;color:#324239!important;font-size:15px!important;line-height:1.7!important;
      }
      .view[data-view="alerts"] .q-stable-summary-note{
        margin-top:9px!important;padding-top:8px!important;border-top:1px solid #e3ebe2!important;
        color:#68756d!important;font-size:12.5px!important;line-height:1.5!important;
      }
      .view[data-view="alerts"] .q-stable-article-summary.unavailable{
        background:#fbfcfa!important;border-style:dashed!important;color:#657168!important;
      }

      .view[data-view="alerts"] .live-news-card h3,
      .view[data-view="alerts"] .live-news-card h3 a{font-size:16px!important;line-height:1.5!important}
      .view[data-view="alerts"] .live-meta{font-size:13px!important;line-height:1.5!important}
      .view[data-view="alerts"] .live-chip{font-size:12px!important;line-height:1.35!important;padding:4px 7px!important}
      .view[data-view="alerts"] .live-card-footer a,
      .view[data-view="alerts"] .live-card-footer button{font-size:12.5px!important;line-height:1.45!important}
      .view[data-view="alerts"] .live-status-pill{font-size:12.5px!important;line-height:1.4!important}
      .view[data-view="alerts"] .live-filter-bar input,
      .view[data-view="alerts"] .live-filter-bar select,
      .view[data-view="alerts"] .live-filter-bar button{font-size:13px!important}
      .view[data-view="alerts"] .live-kpi span,
      .view[data-view="alerts"] .live-kpi small{font-size:12.5px!important;line-height:1.45!important}
      .view[data-view="alerts"] .live-news-head h2{font-size:20px!important}
      .view[data-view="alerts"] .live-news-head span{font-size:12.5px!important}
      .view[data-view="alerts"] .section-kicker{font-size:12px!important}
      .view[data-view="alerts"] .page-heading p{font-size:13.5px!important;line-height:1.58!important}

      @media(max-width:720px){
        .view[data-view="alerts"] .q-stable-article-summary,
        .view[data-view="alerts"] .q-stable-summary-copy{font-size:14px!important}
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
      const value = String(node.nodeValue || '');
      BRAND_PATTERN.lastIndex = 0;
      if (BRAND_PATTERN.test(value)) {
        BRAND_PATTERN.lastIndex = 0;
        node.nodeValue = value.replace(BRAND_PATTERN, 'AI');
      }
      BRAND_PATTERN.lastIndex = 0;
    }
    root.querySelectorAll?.('[title],[aria-label],[placeholder],[alt]').forEach(node => {
      for (const attr of ['title','aria-label','placeholder','alt']) {
        const value = node.getAttribute(attr);
        if (!value) continue;
        BRAND_PATTERN.lastIndex = 0;
        if (BRAND_PATTERN.test(value)) {
          BRAND_PATTERN.lastIndex = 0;
          node.setAttribute(attr, value.replace(BRAND_PATTERN, 'AI'));
        }
        BRAND_PATTERN.lastIndex = 0;
      }
    });
  }

  function removeStrategicSynthesis() {
    const root = document.querySelector('.view[data-view="alerts"]');
    if (!root) return;
    const patterns = [/latest verified strategic synthesis/i,/what the newest signals mean competitively/i];
    const candidates = Array.from(root.querySelectorAll('section,article,div'))
      .filter(node => {
        const text = clean(node.textContent);
        return text && text.length < 14000 && patterns.some(pattern => pattern.test(text));
      })
      .sort((a,b) => clean(a.textContent).length - clean(b.textContent).length);
    if (!candidates.length) return;
    let target = candidates[0];
    while (target.parentElement && target.parentElement !== root) {
      const parent = target.parentElement;
      const text = clean(parent.textContent);
      if (text.length > 14000 || !patterns.some(pattern => pattern.test(text))) break;
      target = parent;
    }
    if (target !== root) target.remove();
  }

  async function loadReviewedSummaries() {
    try {
      const parts = await Promise.all(SUMMARY_PARTS.map(async path => {
        const response = await fetch(`${path}?v=${RELEASE}`, {cache:'no-store'});
        if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
        return (await response.text()).replace(/\s+/g, '');
      }));
      const binary = atob(parts.join(''));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
      const payload = JSON.parse(await new Response(stream).text());
      const records = Object.values(payload?.summaries || {});
      if (Number(payload?.item_count) !== 82 || records.length !== 82) {
        throw new Error(`Expected 82 reviewed summaries, received ${records.length}.`);
      }
      summaries.clear();
      records.forEach(record => {
        if (record?.title && clean(record.summary)) summaries.set(norm(record.title), record);
      });
      ready = summaries.size === 82;
      document.documentElement.dataset.reviewedArticleSummaryCount = String(summaries.size);
    } catch (error) {
      ready = false;
      console.error('Reviewed article summaries failed to load:', error);
    }
  }

  function findRecord(titleText) {
    const title = norm(titleText);
    if (!title) return null;
    if (summaries.has(title)) return summaries.get(title);

    const titleTokens = new Set(title.split(' ').filter(Boolean));
    let best = null;
    let bestScore = 0;
    for (const [candidate, record] of summaries.entries()) {
      if (candidate.includes(title) || title.includes(candidate)) {
        const score = Math.min(candidate.length,title.length) / Math.max(candidate.length,title.length);
        if (score > bestScore) { bestScore = score; best = record; }
        continue;
      }
      const candidateTokens = new Set(candidate.split(' ').filter(Boolean));
      let overlap = 0;
      titleTokens.forEach(token => { if (candidateTokens.has(token)) overlap += 1; });
      const union = new Set([...titleTokens,...candidateTokens]).size || 1;
      const score = overlap / union;
      if (score > bestScore) { bestScore = score; best = record; }
    }
    return bestScore >= 0.72 ? best : null;
  }

  function newsCards(root) {
    const feed = root.querySelector('#liveNews') || root;
    return Array.from(new Set(feed.querySelectorAll('.live-news-card,article')))
      .filter(card => card.querySelector('h3,h4') && card.querySelector('a[href]'));
  }

  function summaryMarkup(record) {
    if (!record) {
      return {
        key: 'unavailable',
        className: 'q-stable-article-summary unavailable',
        html: '<strong>Reviewed summary not yet available</strong><div class="q-stable-summary-copy">This item was added after the latest reviewed summary set and will be included in the next article-content review.</div>'
      };
    }
    const retrieval = clean(record.retrieval_status || '');
    const note = retrieval && !/publisher article accessed directly/i.test(retrieval)
      ? `<div class="q-stable-summary-note">Evidence basis: ${esc(retrieval)}</div>` : '';
    return {
      key: `reviewed:${norm(record.title)}:${clean(record.summary).length}`,
      className: 'q-stable-article-summary',
      html: `<strong>Article summary</strong><div class="q-stable-summary-copy">${esc(clean(record.summary))}</div>${note}`
    };
  }

  function renderSummaries() {
    const root = document.querySelector('.view[data-view="alerts"]');
    if (!root || !ready) return;
    const cards = newsCards(root);
    let matched = 0;

    cards.forEach(card => {
      const title = card.querySelector('h3,h4')?.textContent || '';
      const record = findRecord(title);
      if (record) matched += 1;
      const desired = summaryMarkup(record);
      const existing = card.querySelector('.q-stable-article-summary');
      const duplicates = card.querySelectorAll('.q-stable-article-summary');
      if (duplicates.length > 1) Array.from(duplicates).slice(1).forEach(node => node.remove());

      if (existing && existing.dataset.summaryKey === desired.key) return;

      const box = existing || document.createElement('div');
      box.className = desired.className;
      box.dataset.summaryKey = desired.key;
      box.innerHTML = desired.html;
      if (record) box.dataset.summaryTitle = record.title || '';
      else delete box.dataset.summaryTitle;

      if (!existing) {
        const footer = card.querySelector('.live-card-footer');
        if (footer) footer.insertAdjacentElement('beforebegin', box);
        else card.appendChild(box);
      }
    });

    document.documentElement.dataset.visibleReviewedSummaryMatches = String(matched);
    document.documentElement.dataset.visibleReviewedSummaryCards = String(cards.length);
  }

  function apply() {
    if (applying) return;
    applying = true;
    if (observer) observer.disconnect();
    try {
      injectStyles();
      removeStrategicSynthesis();
      renderSummaries();
      scrubBranding(document.body);
      document.documentElement.dataset.frontendStabilityRelease = RELEASE;
    } finally {
      applying = false;
      observe();
    }
  }

  function schedule(delay = 0) {
    clearTimeout(timer);
    timer = setTimeout(apply, delay);
  }

  function shouldSchedule(mutation) {
    if (mutation.type === 'characterData') {
      return !mutation.target.parentElement?.closest?.('.q-stable-article-summary');
    }
    if (mutation.type !== 'childList') return false;
    const changed = [...mutation.addedNodes, ...mutation.removedNodes];
    if (!changed.length) return false;
    const ownedOnly = changed.every(node => {
      if (node.nodeType !== Node.ELEMENT_NODE) return node.parentElement?.closest?.('.q-stable-article-summary');
      return node.matches?.('.q-stable-article-summary') || node.closest?.('.q-stable-article-summary');
    });
    return !ownedOnly;
  }

  async function boot() {
    injectStyles();
    scrubBranding(document.body);
    removeStrategicSynthesis();
    await loadReviewedSummaries();
    apply();

    observer = new MutationObserver(mutations => {
      if (applying) return;
      if (mutations.some(shouldSchedule)) schedule(70);
    });
    observe();

    [250,700,1500,3000].forEach(delay => setTimeout(() => schedule(0), delay));
    window.addEventListener('quest:module-loaded', () => schedule(50));
    window.addEventListener('quest:layout-refresh', () => schedule(50));
    window.addEventListener('hashchange', () => schedule(50));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
