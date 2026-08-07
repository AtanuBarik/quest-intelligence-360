(() => {
  'use strict';

  const DATA_URL = 'data/competitor-daily-refresh.json';
  let payload = window.__QUEST_COMPETITOR_REFRESH__ || null;
  let byId = new Map();
  let byName = new Map();
  let scheduled = false;

  const esc = (value = '') => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const norm = (value = '') => String(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

  function formatDate(value) {
    if (!value) return 'Not yet refreshed';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString(undefined, { year:'numeric', month:'short', day:'2-digit', hour:'2-digit', minute:'2-digit' });
  }

  function injectStyles() {
    if (document.getElementById('competitorDailyRefreshStyles')) return;
    const style = document.createElement('style');
    style.id = 'competitorDailyRefreshStyles';
    style.textContent = `
      .cp-refresh-status{display:flex;flex-wrap:wrap;align-items:center;gap:7px;margin-top:10px}
      .cp-refresh-pill{display:inline-flex;align-items:center;gap:6px;padding:6px 9px;border:1px solid rgba(255,255,255,.28);border-radius:999px;background:rgba(255,255,255,.13);color:#fff;font:700 9px/1.2 Arial,sans-serif}
      .cp-refresh-pill::before{content:'';width:6px;height:6px;border-radius:50%;background:#c6d52f;box-shadow:0 0 0 3px rgba(198,213,47,.16)}
      .cp-refresh-pill.partial::before{background:#c78800}.cp-refresh-pill.error::before{background:#e0044e}
      .cp-refresh-checked{font:500 8px/1.3 Arial,sans-serif;color:rgba(255,255,255,.78)}
      .cp-daily-panel{margin:0 0 14px;border:1px solid #dbe5dc;border-top:4px solid #35792a;border-radius:14px;background:#fff;padding:15px;box-shadow:0 7px 22px rgba(3,76,31,.05)}
      .cp-daily-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:11px}.cp-daily-head h3{margin:2px 0 3px;color:#034c1f;font:800 13px/1.25 Arial,sans-serif}.cp-daily-head p{margin:0;color:#646464;font:500 9px/1.45 Arial,sans-serif}.cp-daily-badge{white-space:nowrap;padding:5px 8px;border-radius:999px;background:#edf4e9;color:#034c1f;font:800 8px/1 Arial,sans-serif}
      .cp-daily-grid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(220px,.75fr);gap:12px}.cp-daily-box{border:1px solid #e3e9e3;border-radius:11px;padding:11px;background:#fbfdfb}.cp-daily-box h4{margin:0 0 8px;color:#35792a;font:800 10px/1.2 Arial,sans-serif}.cp-daily-item{padding:7px 0;border-bottom:1px solid #edf0ed}.cp-daily-item:last-child{border-bottom:0}.cp-daily-item a{color:#26352d;text-decoration:none;font:700 9px/1.35 Arial,sans-serif}.cp-daily-item a:hover{color:#034c1f;text-decoration:underline}.cp-daily-item span{display:block;margin-top:3px;color:#7a817d;font:500 8px/1.3 Arial,sans-serif}.cp-daily-field{display:grid;grid-template-columns:78px 1fr;gap:7px;padding:6px 0;border-bottom:1px solid #edf0ed;font:500 8px/1.4 Arial,sans-serif}.cp-daily-field:last-child{border-bottom:0}.cp-daily-field b{color:#034c1f}.cp-daily-changes{margin-top:9px;padding:8px 10px;border-radius:9px;background:#f3f7ef;color:#4c574f;font:500 8px/1.45 Arial,sans-serif}.cp-daily-changes strong{color:#034c1f}.cp-page-refresh{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:8px}.cp-page-refresh .cp-page-pill{padding:6px 9px;border:1px solid #d9e3d9;border-radius:999px;background:#fff;color:#034c1f;font:700 8px/1 Arial,sans-serif}.cp-card-refresh{margin-top:8px;color:#35792a;font:700 8px/1.25 Arial,sans-serif}
      @media(max-width:760px){.cp-daily-grid{grid-template-columns:1fr}.cp-daily-head{display:block}.cp-daily-badge{display:inline-block;margin-top:7px}}
    `;
    document.head.appendChild(style);
  }

  function rebuildMaps() {
    const competitors = payload?.competitors || [];
    byId = new Map(competitors.map(item => [norm(item.id), item]));
    byName = new Map(competitors.map(item => [norm(item.name), item]));
  }

  async function load() {
    try {
      if (!payload?.competitors?.length) {
        const response = await fetch(`${DATA_URL}?v=${Date.now()}`, { cache:'no-store' });
        if (response.ok) payload = await response.json();
      }
      rebuildMaps();
      injectStyles();
      enhance();
    } catch (error) {
      console.warn('Competitor daily refresh metadata unavailable:', error);
    }
  }

  function findEntry(name, id = '') {
    const idKey = norm(id);
    if (idKey && byId.has(idKey)) return byId.get(idKey);
    const nameKey = norm(name);
    if (byName.has(nameKey)) return byName.get(nameKey);
    for (const [key, item] of byName.entries()) {
      if (nameKey.includes(key) || key.includes(nameKey)) return item;
    }
    return null;
  }

  function enhancePageStatus() {
    const view = document.querySelector('.view[data-view="competitors"], .view[data-view="profiles"]');
    if (!view || !payload?.generated_at) return;
    const heading = view.querySelector('.page-heading > div:first-child, .page-heading');
    if (!heading || heading.querySelector('.cp-page-refresh')) return;
    const row = document.createElement('div');
    row.className = 'cp-page-refresh';
    row.innerHTML = `<span class="cp-page-pill">↻ Automatic public-web refresh: daily</span><span class="cp-page-pill">Last check: ${esc(formatDate(payload.generated_at))}</span><span class="cp-page-pill">${esc((payload.competitors || []).length)} monitored profiles</span>`;
    heading.appendChild(row);
  }

  function enhanceCards() {
    const cards = document.querySelectorAll('.cp-card[data-profile], [data-competitor-profile-id], .competitor-card');
    cards.forEach(card => {
      if (card.querySelector('.cp-card-refresh')) return;
      const id = card.dataset.profile || card.dataset.competitorProfileId || card.dataset.id || '';
      const name = card.querySelector('h3,h4,strong')?.textContent?.trim() || card.textContent?.trim().split('\n')[0] || '';
      const entry = findEntry(name, id);
      if (!entry) return;
      const note = document.createElement('div');
      note.className = 'cp-card-refresh';
      note.textContent = `Last updated ${formatDate(entry.last_updated_at)}`;
      const actions = card.querySelector('.cp-actions, .card-actions, button')?.parentElement || card;
      actions.appendChild(note);
    });
  }

  function titleAndContainer() {
    const candidates = [
      document.querySelector('#cpProfile'),
      document.querySelector('.cp-profile'),
      document.querySelector('.ci-profile'),
      document.querySelector('[data-competitor-profile]'),
      document.querySelector('#profileDrawer')
    ].filter(Boolean);
    for (const container of candidates) {
      const title = container.querySelector('h1,h2,.profile-title');
      if (title?.textContent?.trim()) return { title, container };
    }
    return null;
  }

  function injectRefreshTag(entry, container) {
    const hero = container.querySelector('.cp-hero,.ci-profile-hero,.profile-drawer-header,.profile-header') || container.firstElementChild || container;
    if (hero.querySelector('.cp-refresh-status')) return;
    const status = document.createElement('div');
    status.className = 'cp-refresh-status';
    status.innerHTML = `<span class="cp-refresh-pill ${esc(entry.refresh_status || 'ok')}">Last updated: ${esc(formatDate(entry.last_updated_at))}</span><span class="cp-refresh-checked">Last web check: ${esc(formatDate(entry.last_checked_at))} · ${esc(entry.refresh_status || 'ok')}</span>`;
    hero.appendChild(status);
  }

  function changeText(entry) {
    const changes = entry.changes || {};
    const parts = [];
    if (changes.added?.length) parts.push(`${changes.added.length} added`);
    if (changes.removed?.length) parts.push(`${changes.removed.length} removed`);
    if (changes.modified?.length) parts.push(`${changes.modified.length} fields modified`);
    return parts.length ? parts.join(' · ') : 'No monitored information changed in the latest check.';
  }

  function refreshPanel(entry) {
    const latest = (entry.latest_developments || []).slice(0, 5);
    const fields = Object.entries(entry.verified_fields || {});
    const sourcesOk = (entry.source_status || []).filter(source => source.status === 'ok').length;
    const sourcesTotal = (entry.source_status || []).length;
    const panel = document.createElement('section');
    panel.className = 'cp-daily-panel';
    panel.dataset.competitorDailyRefresh = entry.id;
    panel.innerHTML = `<div class="cp-daily-head"><div><span class="section-kicker">AUTOMATED PUBLIC-WEB REFRESH</span><h3>What changed in the monitored public evidence?</h3><p>Official company, investor-relations and public-news sources are checked daily. Time-sensitive facts below are automatically merged when confidence is sufficient.</p></div><span class="cp-daily-badge">${sourcesOk}/${sourcesTotal} official sources reached</span></div><div class="cp-daily-grid"><div class="cp-daily-box"><h4>Latest developments</h4>${latest.length ? latest.map(item => `<div class="cp-daily-item"><a href="${esc(item.url)}" target="_blank" rel="noopener">${esc(item.title)}</a><span>${esc(item.published || 'Recent public source')}</span></div>`).join('') : '<div class="cp-daily-item"><span>No new public developments were captured in this refresh window.</span></div>'}</div><div class="cp-daily-box"><h4>Auto-verified current facts</h4>${fields.length ? fields.map(([key,value]) => `<div class="cp-daily-field"><b>${esc(key === 'financial' ? 'Financial' : key === 'employees' ? 'Workforce' : key)}</b><span>${esc(value)}</span></div>`).join('') : '<div class="cp-daily-field"><b>Status</b><span>No high-confidence core-field change detected.</span></div>'}<div class="cp-daily-changes"><strong>Latest comparison:</strong> ${esc(changeText(entry))}</div></div></div>`;
    return panel;
  }

  function enhanceOpenProfile() {
    const found = titleAndContainer();
    if (!found) return;
    const { title, container } = found;
    const entry = findEntry(title.textContent.trim(), container.dataset.profile || container.dataset.id || '');
    if (!entry) return;
    injectRefreshTag(entry, container);
    if (container.querySelector(`[data-competitor-daily-refresh="${CSS.escape(entry.id)}"]`)) return;
    const body = container.querySelector('.cp-profile-body,.ci-profile-body,.profile-body,.drawer-body') || container;
    const tabs = body.querySelector('.cp-tabs,.profile-tabs,.ci-tabs');
    const firstSection = body.querySelector('.cp-section.active,.ci-section.active,.profile-section.active,.cp-section,.ci-section,.profile-section');
    const panel = refreshPanel(entry);
    if (firstSection) firstSection.insertAdjacentElement('afterbegin', panel);
    else if (tabs) tabs.insertAdjacentElement('afterend', panel);
    else body.appendChild(panel);
  }

  function enhance() {
    enhancePageStatus();
    enhanceCards();
    enhanceOpenProfile();
  }

  function scheduleEnhance() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      enhance();
    });
  }

  document.addEventListener('click', event => {
    if (event.target.closest?.('.cp-card,[data-profile],[data-competitor-profile-id],.competitor-card,.cp-tab,.profile-tab')) {
      setTimeout(scheduleEnhance, 40);
      setTimeout(scheduleEnhance, 220);
    }
  }, true);
  window.addEventListener('quest:competitor-refresh-loaded', event => {
    if (event.detail?.competitors) payload = event.detail;
    rebuildMaps();
    scheduleEnhance();
  });
  window.addEventListener('quest:layout-refresh', event => {
    if (event.detail?.group === 'competitor') scheduleEnhance();
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load, { once:true });
  else load();
})();
