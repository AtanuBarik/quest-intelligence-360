(() => {
  'use strict';

  const DATA_URL = 'data/strategic-source-watch.json';
  let payload = null;
  let scheduled = false;

  const esc = (value = '') => String(value).replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));

  function formatDate(value) {
    if (!value) return 'awaiting first run';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  async function load() {
    try {
      const response = await fetch(`${DATA_URL}?v=${Date.now()}`, { cache: 'no-store' });
      payload = response.ok ? await response.json() : null;
    } catch (_) {
      payload = null;
    }
    enhance();
  }

  function statusRow(view) {
    return view.querySelector('.sa-status') || view.querySelector('.page-heading > div:first-child');
  }

  function enhance() {
    const view = document.querySelector('.view[data-strategic-analysis="true"], .view[data-view="news"].sa-shell');
    if (!view) return;
    const row = statusRow(view);
    if (!row) return;

    row.querySelectorAll('[data-strategic-watch-pill]').forEach(node => node.remove());
    const sources = Array.isArray(payload?.sources) ? payload.sources : [];
    const reached = sources.filter(source => Number(source?.status) >= 200 && Number(source?.status) < 400).length;
    const errors = sources.filter(source => source?.error).length;
    const changed = Number(payload?.changed_source_count || 0);

    const pills = payload
      ? [
          `Source watch: ${formatDate(payload.last_checked)} IST`,
          `${reached}/${sources.length} source pages reached`,
          `${changed} material page change${changed === 1 ? '' : 's'}`,
          errors ? `${errors} source warning${errors === 1 ? '' : 's'} retained` : 'Source checks healthy'
        ]
      : [
          'Source watch: scheduled weekly',
          'Initial source-watch state pending'
        ];

    pills.forEach(text => {
      const pill = document.createElement('span');
      pill.className = 'sa-pill';
      pill.dataset.strategicWatchPill = 'true';
      pill.innerHTML = esc(text);
      row.appendChild(pill);
    });
  }

  function scheduleEnhance() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      enhance();
    });
  }

  window.addEventListener('quest:layout-refresh', event => {
    if (event.detail?.group === 'strategic') scheduleEnhance();
  });
  window.addEventListener('quest:module-loaded', scheduleEnhance);
  document.addEventListener('click', event => {
    if (event.target.closest?.('[data-view],.nav-item')) setTimeout(scheduleEnhance, 80);
  }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load, { once: true });
  else load();
})();
