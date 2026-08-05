(() => {
  'use strict';

  const RELEASE = '2026-08-05-lab-sync-v1';
  const REMOTE_BASE = 'https://atanubarik.github.io/laboratory-news-monitor';
  const REMOTE_NEWS = `${REMOTE_BASE}/data/news.json`;
  const REMOTE_EMAIL = `${REMOTE_BASE}/data/email_status.json`;
  const LOCAL_NEWS = 'data/laboratory-news.json';
  const LOCAL_EMAIL = 'data/laboratory-email-status.json';
  const WORKER = 'https://laboratory-news-ai.atanu-barik.workers.dev';
  const ICON_BASE = `${REMOTE_BASE}/assets/email-icons/rendered`;
  const CATEGORY_ICONS = {
    'Product & Services': `${ICON_BASE}/product-services.png?v=3`,
    'Product / Innovation': `${ICON_BASE}/product-services.png?v=3`,
    'Clinical, R&D': `${ICON_BASE}/clinical-rd.png?v=3`,
    'Research / Clinical': `${ICON_BASE}/clinical-rd.png?v=3`,
    'Partnership, M&A': `${ICON_BASE}/partnership-ma.png?v=3`,
    'Partnership': `${ICON_BASE}/partnership-ma.png?v=3`,
    'M&A / Investment': `${ICON_BASE}/partnership-ma.png?v=3`,
    'Financials': `${ICON_BASE}/financials.png?v=3`,
    'Financial': `${ICON_BASE}/financials.png?v=3`,
    'Organizational Updates': `${ICON_BASE}/organizational.png?v=3`,
    'Leadership / Organization': `${ICON_BASE}/organizational.png?v=3`,
    'Leadership Changes': `${ICON_BASE}/leadership.png?v=3`,
    'Other': `${ICON_BASE}/other.png?v=3`
  };
  const state = { news:null, email:null, health:null, itemByUrl:new Map(), itemByTitle:new Map() };

  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const text = node => (node?.textContent || '').trim();

  async function fetchJson(url, fallback) {
    try {
      const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`, {cache:'no-store'});
      if (!response.ok) throw new Error(`${response.status}`);
      return await response.json();
    } catch (remoteError) {
      if (!fallback) throw remoteError;
      const response = await fetch(`${fallback}?v=${Date.now()}`, {cache:'no-store'});
      if (!response.ok) throw remoteError;
      return response.json();
    }
  }

  function indexItems() {
    state.itemByUrl.clear();
    state.itemByTitle.clear();
    for (const item of state.news?.items || []) {
      [item.url,item.source_url,...(item.sources || []).map(source => source?.url)].filter(Boolean).forEach(url => state.itemByUrl.set(url,item));
      const title = String(item.title || '').trim().toLowerCase();
      if (title) state.itemByTitle.set(title,item);
    }
  }

  function findCategory(card) {
    const full = text(card);
    const categories = Object.keys(CATEGORY_ICONS).sort((a,b)=>b.length-a.length);
    return categories.find(category => full.toLowerCase().includes(category.toLowerCase())) || 'Other';
  }

  function findItem(card) {
    const link = card.querySelector('a[href]');
    if (link && state.itemByUrl.has(link.href)) return state.itemByUrl.get(link.href);
    const heading = card.querySelector('h3,h4,strong');
    const title = text(heading).toLowerCase();
    if (state.itemByTitle.has(title)) return state.itemByTitle.get(title);
    return [...state.itemByTitle.entries()].find(([candidate]) => title && (candidate.includes(title) || title.includes(candidate)))?.[1] || null;
  }

  function iconFor(category) { return CATEGORY_ICONS[category] || CATEGORY_ICONS.Other; }

  function applyIcons() {
    document.querySelectorAll('.live-news-card,.si-news-card').forEach(card => {
      if (card.dataset.questIconApplied === '1') return;
      const category = findCategory(card);
      const icon = document.createElement('img');
      icon.className = 'q-category-icon';
      icon.alt = `${category} icon`;
      icon.src = iconFor(category);
      icon.loading = 'lazy';
      icon.addEventListener('error', () => { icon.src = CATEGORY_ICONS.Other; }, {once:true});
      const heading = card.querySelector('h3,h4');
      if (heading) {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:flex-start;gap:10px';
        heading.parentNode.insertBefore(row, heading);
        row.appendChild(icon);
        row.appendChild(heading);
      } else card.prepend(icon);
      card.dataset.questIconApplied = '1';
    });
  }

  function closeModal() { document.querySelector('.q-verified-modal')?.remove(); }

  function showModal(title, body, meta = '') {
    closeModal();
    const modal = document.createElement('div');
    modal.className = 'q-verified-modal';
    modal.innerHTML = `<article class="q-verified-dialog"><header class="q-verified-header"><div><span class="section-kicker">VERIFIED ARTICLE CONTENT</span><h3>${esc(title)}</h3></div><button class="q-close" type="button" aria-label="Close">×</button></header><div class="q-verified-body">${body}<div class="q-verified-meta">${esc(meta)}</div></div></article>`;
    modal.addEventListener('click', event => { if (event.target === modal || event.target.closest('.q-close')) closeModal(); });
    document.body.appendChild(modal);
  }

  async function requestVerifiedSummary(item, button) {
    if (!item?.id) return;
    const previous = button.textContent;
    button.disabled = true;
    button.textContent = 'Verifying article…';
    showModal(item.title || 'Article summary', '<p>Reading the underlying public article and verifying material details…</p>', 'Uses the latest laboratory-news-monitor email_article_summary capability.');
    try {
      const response = await fetch(WORKER, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({mode:'email_article_summary',article_ids:[item.id]})
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      if (!data.content_verified || !data.answer || data.answer === 'CONTENT_UNAVAILABLE') {
        showModal(item.title || 'Article summary', '<p>The underlying public article could not be verified with enough substantive detail. It remains available in the feed and can be retried later.</p>', data.error || 'Content unavailable; no generic interpretation was inserted.');
      } else {
        const paragraphs = esc(data.answer).split(/\n{2,}/).map(paragraph => `<p>${paragraph.replace(/\n/g,'<br>')}</p>`).join('');
        showModal(item.title || 'Article summary', paragraphs, `Verified with ${data.model || 'Gemini'} · ${data.tool_profile || 'web tools'} · Repository ${data.repository_updated || 'current'}`);
      }
    } catch (error) {
      showModal(item.title || 'Article summary', `<p>Verified article summary is temporarily unavailable.</p>`, error.message);
    } finally {
      button.disabled = false;
      button.textContent = previous;
    }
  }

  function addVerifiedButtons() {
    document.querySelectorAll('.live-news-card').forEach(card => {
      if (card.querySelector('.q-verified-button')) return;
      const item = findItem(card);
      if (!item) return;
      const footer = card.querySelector('.live-card-footer') || card;
      const button = document.createElement('button');
      button.className = 'q-verified-button';
      button.type = 'button';
      button.textContent = 'Verified brief';
      button.addEventListener('click', event => { event.preventDefault(); requestVerifiedSummary(item,button); });
      footer.appendChild(button);
    });
  }

  function statusText() {
    const generated = state.news?.generated_at_display || 'not available';
    const itemCount = state.news?.item_count ?? state.news?.items?.length ?? 0;
    const emailStatus = state.email?.status || 'not available';
    const capabilities = (state.health?.capabilities || []).join(', ') || 'worker capabilities unavailable';
    return { generated,itemCount,emailStatus,capabilities };
  }

  function addSyncStrip(view) {
    if (!view || view.querySelector('.q-sync-strip')) return;
    const heading = view.querySelector('.page-heading');
    const info = statusText();
    const strip = document.createElement('div');
    strip.className = 'q-sync-strip';
    strip.innerHTML = `<span class="q-sync-dot"></span><strong>Laboratory-news-monitor synced</strong><span>${esc(info.itemCount)} de-duplicated items · Generated ${esc(info.generated)}</span><span>Email workflow: ${esc(info.emailStatus)}</span><span>Latest AI: verified article summaries with model/tool fallbacks</span>`;
    if (heading) heading.insertAdjacentElement('afterend', strip); else view.prepend(strip);
  }

  function refreshStatusStrips() {
    document.querySelectorAll('.q-sync-strip').forEach(strip => strip.remove());
    addSyncStrip(document.querySelector('.view[data-view="alerts"]'));
    addSyncStrip(document.querySelector('.view[data-view="news"]'));
  }

  function enhance() {
    applyIcons();
    addVerifiedButtons();
    refreshStatusStrips();
    document.documentElement.dataset.labNewsSyncRelease = RELEASE;
  }

  async function load() {
    const results = await Promise.allSettled([
      fetchJson(REMOTE_NEWS, LOCAL_NEWS),
      fetchJson(REMOTE_EMAIL, LOCAL_EMAIL),
      fetchJson(WORKER)
    ]);
    if (results[0].status === 'fulfilled') state.news = results[0].value;
    if (results[1].status === 'fulfilled') state.email = results[1].value;
    if (results[2].status === 'fulfilled') state.health = results[2].value;
    indexItems();
    enhance();
  }

  const observer = new MutationObserver(() => {
    clearTimeout(window.__questLabSyncTimer);
    window.__questLabSyncTimer = setTimeout(enhance,160);
  });

  function boot() {
    observer.observe(document.documentElement,{childList:true,subtree:true});
    load();
    setInterval(load,6*60*60*1000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
  window.QuestLabNewsSync = {release:RELEASE,reload:load,state};
})();
