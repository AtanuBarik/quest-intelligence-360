(() => {
  'use strict';

  const RELEASE = '20260810a';
  const COLORS = ['#35792a','#c6d52f','#034c1f','#00587c','#80276c','#c78800','#9a9a9a','#3995bb'];
  let summaryPayload = null;
  let applyTimer = 0;
  let lastCardSignature = '';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
  const norm = value => clean(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const view = () => $('.view[data-view="alerts"]');
  const resilience = () => window.QuestAlertsResilience?.state || {};

  function injectStyles() {
    let style = $('#qAlertsStableStyles');
    if (!style) {
      style = document.createElement('style');
      style.id = 'qAlertsStableStyles';
      document.head.appendChild(style);
    }
    style.textContent = `
      .view[data-view="alerts"] .live-summary,.view[data-view="alerts"] .sa-alert-migration,.view[data-view="alerts"] .live-context{display:none!important}
      .view[data-view="alerts"] .q-chatgpt-chip,.view[data-view="alerts"] .q-verified-button,.view[data-view="alerts"] .q-visible-news-summary,.view[data-view="alerts"] .q-final-summary{display:none!important}
      .view[data-view="alerts"] .live-news-card:not([data-q-summary-ready="1"]){visibility:hidden}
      .view[data-view="alerts"] .q-inline-chatgpt-summary{margin:2px 0 4px;padding:12px 13px;border:1px solid #d9e6d8;border-left:4px solid #35792a;border-radius:10px;background:linear-gradient(135deg,#f8fcf6,#fff);color:#405047;font-size:12px;line-height:1.58}
      .view[data-view="alerts"] .q-inline-chatgpt-summary strong{display:flex;align-items:center;gap:7px;color:#034c1f;font-size:12px;margin-bottom:6px}
      .view[data-view="alerts"] .q-inline-chatgpt-summary strong:before{content:'✦';display:grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#eef5e9;color:#35792a;font-size:11px}
      .view[data-view="alerts"] .q-inline-chatgpt-summary p{margin:0}
      .view[data-view="alerts"] .q-inline-chatgpt-summary.pending{border-left-color:#c6d52f;background:#fbfcf7;color:#68736d}
      .view[data-view="alerts"] .q-final-treemap{position:relative;width:100%;height:100%;min-height:270px;border-radius:10px;overflow:hidden;background:#f1f5f1}
      .view[data-view="alerts"] .q-tree-tile{position:absolute;padding:10px;border:2px solid #fff;overflow:hidden;color:#fff;display:flex;flex-direction:column;justify-content:flex-end}
      .view[data-view="alerts"] .q-tree-tile b{font-size:13px;line-height:1.15}.view[data-view="alerts"] .q-tree-tile span{font-size:11px;margin-top:3px;opacity:.95}
      .view[data-view="alerts"] .q-theme-horizontal{display:grid;gap:11px;padding:8px 2px 2px}
      .view[data-view="alerts"] .q-theme-row{display:grid;grid-template-columns:150px 1fr 34px;gap:9px;align-items:center}
      .view[data-view="alerts"] .q-theme-label{font-size:12px;color:#334239;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .view[data-view="alerts"] .q-theme-track{height:24px;border-radius:6px;background:#edf1ed;display:flex;overflow:hidden}
      .view[data-view="alerts"] .q-theme-seg{height:100%;min-width:0}.view[data-view="alerts"] .q-theme-total{font-size:12px;font-weight:700;color:#034c1f;text-align:right}
      .view[data-view="alerts"] .q-theme-legend{display:flex;flex-wrap:wrap;gap:8px 13px;margin-top:13px;border-top:1px solid #e5ebe6;padding-top:10px}
      .view[data-view="alerts"] .q-theme-legend span{display:inline-flex;align-items:center;gap:5px;font-size:10px;color:#5d6b63}.view[data-view="alerts"] .q-theme-legend i{width:9px;height:9px;border-radius:2px;display:inline-block}
      .view[data-view="alerts"] #liveCompanyVolumeChart,.view[data-view="alerts"] #liveCategoryMixChart{display:none!important}
      @media(max-width:720px){.view[data-view="alerts"] .q-theme-row{grid-template-columns:110px 1fr 28px}.view[data-view="alerts"] .q-final-treemap{min-height:230px}}
    `;
  }

  async function loadSummaries() {
    try {
      const response = await fetch(`data/laboratory-openai-summaries.json?v=${Date.now()}`, { cache: 'no-store' });
      if (response.ok) summaryPayload = await response.json();
    } catch (_) { /* keep the current cache if the refresh fails */ }
  }

  function summaryIndex() {
    const map = new Map();
    const payloads = [summaryPayload, resilience().summaries].filter(Boolean);
    for (const payload of payloads) {
      for (const [id, record] of Object.entries(payload?.summaries || {})) {
        if (!record || !clean(record.summary)) continue;
        if (id) map.set(`id:${id}`, record);
        if (record.title) map.set(`title:${norm(record.title)}`, record);
        if (record.source_url) map.set(`url:${record.source_url}`, record);
      }
    }
    for (const item of resilience().news?.items || []) {
      if (!clean(item.chatgpt_summary)) continue;
      const record = { summary: item.chatgpt_summary, title: item.title, provider: item.summary_provider || 'ChatGPT' };
      if (item.id) map.set(`id:${item.id}`, record);
      if (item.title) map.set(`title:${norm(item.title)}`, record);
      if (item.url) map.set(`url:${item.url}`, record);
    }
    return map;
  }

  function findSummary(card, map) {
    const link = card.querySelector('h3 a[href],h4 a[href]');
    if (link && map.has(`url:${link.href}`)) return map.get(`url:${link.href}`);
    const title = norm(card.querySelector('h3,h4')?.textContent);
    if (map.has(`title:${title}`)) return map.get(`title:${title}`);
    for (const [key, value] of map.entries()) {
      if (!key.startsWith('title:') || !title) continue;
      const candidate = key.slice(6);
      if (candidate.length > 28 && (candidate.includes(title) || title.includes(candidate))) return value;
    }
    return null;
  }

  function renderInlineSummaries() {
    const root = view();
    if (!root) return;
    const map = summaryIndex();
    const cards = $$('.live-news-card', root);
    cards.forEach(card => {
      $$('.q-visible-news-summary,.q-final-summary,.q-verified-button,.q-chatgpt-chip', card).forEach(node => node.remove());
      const title = norm(card.querySelector('h3,h4')?.textContent);
      const record = findSummary(card, map);
      const summary = clean(record?.summary);
      let box = $('.q-inline-chatgpt-summary', card);
      const key = summary ? `${title}|${summary.length}|${summary.slice(0,40)}` : `${title}|pending`;
      if (!box) {
        box = document.createElement('div');
        box.className = 'q-inline-chatgpt-summary';
        const footer = $('.live-card-footer', card);
        if (footer) footer.insertAdjacentElement('beforebegin', box); else card.appendChild(box);
      }
      if (box.dataset.summaryKey !== key) {
        box.dataset.summaryKey = key;
        box.classList.toggle('pending', !summary);
        box.innerHTML = summary
          ? `<strong>ChatGPT summary</strong><p>${esc(summary)}</p>`
          : '<strong>ChatGPT summary pending</strong><p>This newly synchronized article is awaiting its content-aware summary. The raw feed description is not shown as a substitute.</p>';
      }
      card.dataset.qSummaryReady = '1';
    });

    const count = Object.keys(summaryPayload?.summaries || {}).length;
    $$('.live-status-pill', root).forEach(pill => {
      if (/^AI:/i.test(clean(pill.textContent))) pill.textContent = `AI: ${count || map.size} ChatGPT summaries cached`;
    });
  }

  function currentItems() {
    const items = resilience().news?.items || [];
    const search = clean($('#liveSearch')?.value).toLowerCase();
    const company = $('#liveCompany')?.value || '';
    const category = $('#liveCategory')?.value || '';
    const period = Number($('#livePeriod')?.value || 30);
    const sourceType = $('#liveSourceType')?.value || '';
    const cutoff = Date.now() - (Number.isFinite(period) ? period : 9999) * 86400000;
    return items.filter(item => {
      const hay = `${item.title || ''} ${item.description || ''} ${item.chatgpt_summary || ''} ${item.source || ''} ${item.company || ''} ${item.category || ''}`.toLowerCase();
      const when = Date.parse(item.published_at || '');
      return (!search || hay.includes(search)) && (!company || item.company === company) && (!category || item.category === category) && (!sourceType || (sourceType === 'official' ? item.official_source : !item.official_source)) && (!Number.isFinite(when) || when >= cutoff);
    });
  }

  function binaryTreemap(items, x, y, w, h, out) {
    if (!items.length) return;
    if (items.length === 1) { out.push({ ...items[0], x, y, w, h }); return; }
    const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
    let running = 0, split = 1, best = Infinity;
    for (let i = 1; i < items.length; i++) {
      running += items[i - 1].value;
      const diff = Math.abs(total / 2 - running);
      if (diff < best) { best = diff; split = i; }
    }
    const a = items.slice(0, split), b = items.slice(split);
    const sumA = a.reduce((s, item) => s + item.value, 0), ratio = sumA / total;
    if (w >= h) {
      const wa = w * ratio;
      binaryTreemap(a, x, y, wa, h, out); binaryTreemap(b, x + wa, y, w - wa, h, out);
    } else {
      const ha = h * ratio;
      binaryTreemap(a, x, y, w, ha, out); binaryTreemap(b, x, y + ha, w, h - ha, out);
    }
  }

  function renderTreemap() {
    const canvas = $('#liveCompanyVolumeChart');
    if (!canvas) return;
    const parent = canvas.parentElement;
    let box = $('#qSignalTreemapFinal', parent);
    if (!box) {
      box = document.createElement('div');
      box.id = 'qSignalTreemapFinal';
      box.className = 'q-final-treemap';
      parent.appendChild(box);
    }
    const counts = new Map();
    currentItems().forEach(item => { const key = item.company || 'Other'; counts.set(key, (counts.get(key) || 0) + 1); });
    const data = [...counts.entries()].map(([label, value]) => ({ label, value })).filter(x => x.value > 0).sort((a, b) => b.value - a.value);
    const signature = JSON.stringify(data);
    if (box.dataset.signature === signature) return;
    box.dataset.signature = signature;
    if (!data.length) { box.innerHTML = '<div style="padding:24px;font-size:12px;color:#68758a">No signal volume for the current filters.</div>'; return; }
    const rects = []; binaryTreemap(data, 0, 0, 100, 100, rects);
    const total = data.reduce((s, x) => s + x.value, 0);
    box.innerHTML = rects.map((r, i) => `<div class="q-tree-tile" style="left:${r.x}%;top:${r.y}%;width:${r.w}%;height:${r.h}%;background:${COLORS[i % COLORS.length]}" title="${esc(r.label)}: ${r.value}"><b>${esc(r.label)}</b><span>${r.value} signal${r.value === 1 ? '' : 's'} · ${Math.round(r.value / total * 100)}%</span></div>`).join('');
  }

  function renderThemeMix() {
    const canvas = $('#liveCategoryMixChart');
    if (!canvas) return;
    const parent = canvas.parentElement;
    let root = $('#qThemeHorizontalFinal', parent);
    if (!root) {
      root = document.createElement('div');
      root.id = 'qThemeHorizontalFinal';
      root.className = 'q-theme-horizontal';
      parent.appendChild(root);
    }
    const items = currentItems();
    const companies = [...new Set(items.map(x => x.company).filter(Boolean))].sort((a, b) => items.filter(x => x.company === b).length - items.filter(x => x.company === a).length);
    const categories = [...new Set(items.map(x => x.category || 'Other'))];
    const signature = JSON.stringify({ companies, categories, counts: companies.map(c => items.filter(x => x.company === c).length) });
    if (root.dataset.signature === signature) return;
    root.dataset.signature = signature;
    const maxTotal = Math.max(1, ...companies.map(company => items.filter(x => x.company === company).length));
    const rows = companies.map(company => {
      const total = items.filter(x => x.company === company).length;
      const segments = categories.map((category, i) => {
        const count = items.filter(x => x.company === company && (x.category || 'Other') === category).length;
        return count ? `<i class="q-theme-seg" style="width:${count / maxTotal * 100}%;background:${COLORS[i % COLORS.length]}" title="${esc(category)}: ${count}"></i>` : '';
      }).join('');
      return `<div class="q-theme-row"><div class="q-theme-label" title="${esc(company)}">${esc(company)}</div><div class="q-theme-track">${segments}</div><div class="q-theme-total">${total}</div></div>`;
    }).join('');
    const legend = categories.map((category, i) => `<span><i style="background:${COLORS[i % COLORS.length]}"></i>${esc(category)}</span>`).join('');
    root.innerHTML = `${rows || '<div style="font-size:12px;color:#68758a">No theme data for the current filters.</div>'}<div class="q-theme-legend">${legend}</div>`;
  }

  function hideRetiredSections() {
    const root = view();
    if (!root) return;
    $$('.sa-alert-migration,.q-lab-strategy,.q-sync-strip', root).forEach(node => node.remove());
    const patterns = [/migrated news\s*&\s*research intelligence/i,/signal-to-action matrix/i,/developments with competitive implications/i,/validated research themes/i];
    $$('section,article,div', root).forEach(node => {
      const text = clean(node.textContent);
      if (!text || text.length > 16000) return;
      if (patterns.some(pattern => pattern.test(text.slice(0, 260)))) node.style.setProperty('display', 'none', 'important');
    });
  }

  function apply() {
    if (!view()) return;
    injectStyles();
    hideRetiredSections();
    renderInlineSummaries();
    renderTreemap();
    renderThemeMix();
    document.documentElement.dataset.alertsFinalRelease = RELEASE;
  }

  function schedule(delay = 40) {
    clearTimeout(applyTimer);
    applyTimer = setTimeout(apply, delay);
  }

  function cardSignature() {
    return $$('.view[data-view="alerts"] .live-news-card h3,.view[data-view="alerts"] .live-news-card h4').map(node => norm(node.textContent)).join('|');
  }

  function bind() {
    ['input', 'change'].forEach(type => document.addEventListener(type, event => {
      if (event.target?.matches?.('#liveSearch,#liveCompany,#liveCategory,#livePeriod,#liveSourceType')) schedule(30);
    }));
    document.addEventListener('click', event => {
      if (event.target.closest?.('.nav-item[data-view="alerts"],#liveApplyFilters,#liveResetFilters,#liveRefreshBtn,#liveLoadMore,.live-load-more button')) schedule(70);
    });
    window.addEventListener('quest:alerts-data-ready', () => schedule(70));
    window.addEventListener('quest:layout-refresh', () => schedule(100));
    window.setInterval(() => {
      const signature = cardSignature();
      if (signature && signature !== lastCardSignature) {
        lastCardSignature = signature;
        schedule(20);
      }
    }, 700);
  }

  async function boot() {
    injectStyles();
    bind();
    await loadSummaries();
    schedule(30);
    window.setTimeout(() => schedule(0), 350);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
