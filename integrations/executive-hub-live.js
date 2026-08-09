(() => {
  'use strict';

  const RELEASE = '20260809d';
  const PROJECT_URL = `data/project-tracker.json?v=${RELEASE}`;
  const NEWS_URL = `data/laboratory-news.json?v=${RELEASE}`;
  const state = { projects: null, news: null, refreshedAt: 0 };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const esc = (value = '') => String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));
  let applyTimer = 0;
  let refreshTimer = 0;

  function injectStyles() {
    if ($('#qExecutiveHubStyles')) return;
    const style = document.createElement('style');
    style.id = 'qExecutiveHubStyles';
    style.textContent = `
      .view[data-view="home"] [data-approved-insights-panel="executive"]{display:none!important}
      .q-demo-platform-badge{background:#edf4e9!important;color:#034c1f!important;border:1px solid #c6d52f!important}
      .q-exec-actions{display:grid;gap:8px;margin-top:10px}.q-exec-action{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;padding:10px 11px;border:1px solid #dfe5e0;border-left:4px solid #35792a;border-radius:8px;background:#fff}.q-exec-action.attention{border-left-color:#c78800}.q-exec-action strong{display:block;color:#034c1f;font-size:12px}.q-exec-action p{margin:4px 0 0;color:#646464;font-size:10px;line-height:1.45}.q-exec-action small{display:block;margin-top:4px;color:#7b827d;font-size:9px}.q-exec-action-score{align-self:start;white-space:nowrap;padding:4px 7px;border-radius:5px;background:#edf4e9;color:#034c1f;font-size:9px;font-weight:700}.q-exec-action.attention .q-exec-action-score{background:#fff1d4;color:#805600}.q-exec-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:10px;padding-top:9px;border-top:1px solid #e5ebe6;font-size:9px;color:#646464}.q-exec-link{border:0;background:transparent;color:#034c1f;font-size:10px;font-weight:700;padding:4px;cursor:pointer}
      .q-decision-map{position:relative;overflow:hidden}.q-decision-meta{display:flex;gap:8px;flex-wrap:wrap;margin:7px 0 10px}.q-decision-chip{padding:4px 7px;border-radius:5px;background:#edf4e9;color:#034c1f;font-size:9px;font-weight:700}.q-decision-chip.warn{background:#fff1d4;color:#805600}.q-decision-svg{display:block;width:100%;height:auto;min-height:300px;background:#fff}.q-decision-legend{display:flex;justify-content:center;gap:18px;flex-wrap:wrap;margin-top:6px;color:#646464;font-size:9px}.q-decision-legend i{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:5px}.q-decision-note{margin-top:7px;color:#646464;font-size:9px;line-height:1.45}
      .q-alert-drawer{position:fixed;right:18px;top:72px;z-index:2400;width:min(470px,calc(100vw - 30px));max-height:calc(100vh - 90px);overflow:auto;background:#fff;border:1px solid #d7e0d8;border-radius:10px;box-shadow:0 22px 70px rgba(3,76,31,.26);display:none}.q-alert-drawer.open{display:block}.q-alert-head{position:sticky;top:0;z-index:1;display:flex;justify-content:space-between;gap:12px;align-items:flex-start;padding:14px 15px;border-bottom:1px solid #e1e7e2;background:#fff}.q-alert-head h3{margin:2px 0 3px!important;color:#034c1f!important;font-size:15px!important}.q-alert-head small{font-size:9px;color:#646464}.q-alert-close{width:32px!important;height:32px!important;min-height:32px!important;padding:0!important;border:1px solid #d7e0d8!important;background:#fff!important;color:#034c1f!important}.q-alert-list{padding:5px 14px}.q-alert-item{padding:11px 0;border-bottom:1px solid #edf1ed}.q-alert-item:last-child{border-bottom:0}.q-alert-meta{display:flex;gap:6px;align-items:center;flex-wrap:wrap;color:#737b76;font-size:9px}.q-alert-tag{padding:3px 5px;border-radius:4px;background:#edf4e9;color:#034c1f;font-weight:700}.q-alert-item strong{display:block;margin:5px 0;color:#202834;font-size:11px;line-height:1.4}.q-alert-item a{color:#034c1f;font-size:9px;font-weight:700;text-decoration:none}.q-alert-item a:hover{text-decoration:underline}.q-alert-footer{position:sticky;bottom:0;display:flex;justify-content:space-between;gap:8px;align-items:center;padding:10px 14px;border-top:1px solid #e1e7e2;background:#f8faf8}.q-alert-footer span{font-size:9px;color:#646464}.q-alert-footer button{min-height:34px!important;padding:6px 10px!important;font-size:10px!important}
      @media(max-width:680px){.q-alert-drawer{right:8px;top:66px;width:calc(100vw - 16px)}.q-exec-action{grid-template-columns:1fr}.q-exec-action-score{justify-self:start}}
    `;
    document.head.appendChild(style);
  }

  async function fetchJson(url) {
    const response = await fetch(`${url}&refresh=${Date.now()}`, { cache:'no-store' });
    if (!response.ok) throw new Error(`${url} returned ${response.status}`);
    return response.json();
  }

  async function refreshData() {
    const [projects, news] = await Promise.all([
      fetchJson(PROJECT_URL).catch(() => null),
      fetchJson(NEWS_URL).catch(() => null),
    ]);
    if (projects?.projects) state.projects = projects;
    if (Array.isArray(news?.items)) state.news = news;
    state.refreshedAt = Date.now();
    applyAll();
  }

  function homeView() {
    return $('.view[data-view="home"],.view[data-view="executive"],.view[data-view="hub"],.view[data-view="dashboard"],.view[data-view="my-hub"]');
  }

  function outstandingProject(project) {
    const next = String(project?.next_step || '').trim().toLowerCase();
    return Boolean(next) && !/no outstanding|completed final report|completed final|not applicable/.test(next);
  }

  function attentionScore(project) {
    let score = Math.max(0, 100 - clamp(project?.final_progress));
    const due = project?.milestone_due ? new Date(`${project.milestone_due}T23:59:59Z`) : null;
    if (outstandingProject(project) && due && !Number.isNaN(due.valueOf()) && due.valueOf() < Date.now()) score += 45;
    const risk = String(project?.risk || '').trim().toLowerCase();
    if (risk && !['na','n/a','not applicable','none'].includes(risk)) score += 25;
    const response = String(project?.response_needed_from || '').trim().toLowerCase();
    if (response && !['evalueserve','not applicable','na','n/a'].includes(response)) score += 20;
    if (!['On Track','Completed'].includes(String(project?.status || ''))) score += 15;
    return clamp(score);
  }

  function shortProjectName(project) {
    const name = String(project?.project_name || 'Workstream');
    if (/Digital Customer Journey/i.test(name)) return project?.research_type?.includes('Survey') ? 'Digital Journey Survey' : 'Digital Journey IDIs';
    if (/Extended Study/i.test(name)) return 'Data Ecosystem Extended';
    if (/Data Ecosystem Needs/i.test(name)) return 'Data Ecosystem Needs';
    if (/Lab Stewardship/i.test(name)) return 'Lab Stewardship';
    if (/Consumer Testing/i.test(name)) return 'Consumer Testing';
    if (/Health System Experience/i.test(name)) return 'Health System Experience';
    return name.length > 28 ? `${name.slice(0, 27)}…` : name;
  }

  function workstreamMetrics() {
    const projects = state.projects?.projects || [];
    const openFollowups = projects.filter(outstandingProject).length;
    const finalPending = projects.filter(project => clamp(project.final_progress) < 100).length;
    const attention = projects.filter(project => attentionScore(project) >= 40).length;
    const onTrack = projects.filter(project => project.status === 'On Track').length;
    return { projects, openFollowups, finalPending, attention, onTrack };
  }

  function removeExecutiveSharePoint(view) {
    $$('[data-approved-insights-panel="executive"]', view).forEach(node => { node.style.display = 'none'; });
  }

  function updateKpis(view) {
    const metrics = workstreamMetrics();
    const cards = $$('.kpi-card', view);
    const card = cards.find(node => /curated response sla/i.test(node.textContent || '')) || $('#qExecutiveFollowupKpi', view);
    if (!card) return;
    card.id = 'qExecutiveFollowupKpi';
    card.innerHTML = `<span>Open workstream follow-ups</span><strong>${metrics.openFollowups}</strong><small>${metrics.finalPending} final output${metrics.finalPending === 1 ? '' : 's'} still in progress</small>`;
  }

  function updateLiveOperations(view) {
    const panel = $('#floHomeStatus', view);
    if (!panel) return;
    $$('p', panel).forEach(node => {
      if (/Operational view of the free, data-driven services currently powering the prototype\.?/i.test(node.textContent || '')) node.remove();
    });
    const newsCard = $$('.flo-status-card', panel).find(node => /News monitor/i.test(node.textContent || ''));
    const detail = newsCard?.querySelector('small');
    if (detail) detail.textContent = 'Action synchronization in 6hours';
  }

  function actionPanelHtml() {
    const metrics = workstreamMetrics();
    const ranked = [...metrics.projects]
      .filter(outstandingProject)
      .sort((a, b) => attentionScore(b) - attentionScore(a) || clamp(a.final_progress) - clamp(b.final_progress))
      .slice(0, 5);
    const rows = ranked.map(project => {
      const score = attentionScore(project);
      const due = project.milestone_due ? `Due ${esc(project.milestone_due)}` : 'No dated milestone';
      return `<article class="q-exec-action ${score >= 40 ? 'attention' : ''}"><div><strong>${esc(shortProjectName(project))}</strong><p>${esc(project.next_step || project.next_milestone || 'Review latest workstream update.')}</p><small>${due} · Owner: ${esc(project.next_step_owner || project.evs_lead || 'Evalueserve')} · Final output ${clamp(project.final_progress)}%</small></div><span class="q-exec-action-score">${score >= 40 ? 'Attention' : 'On track'}</span></article>`;
    }).join('');
    return `<div class="panel-head"><div><span class="section-kicker">EXECUTIVE ATTENTION</span><h3>Priority workstream actions</h3></div><span>${metrics.attention} attention item${metrics.attention === 1 ? '' : 's'}</span></div><div class="q-exec-actions">${rows || '<p>No open workstream follow-ups are currently recorded.</p>'}</div><div class="q-exec-foot"><span>Based on the latest Quest weekly research tracker${state.projects?.reporting_date ? ` · ${esc(state.projects.reporting_date)}` : ''}</span><button class="q-exec-link" type="button" data-q-open-tracker>Open Project Tracker →</button></div>`;
  }

  function replaceCompetitiveMomentum(view) {
    let target = $('#qExecutiveActions', view);
    if (!target) {
      const panel = $$('.panel', view).find(node => /COMPETITIVE MOMENTUM|90-day signal intensity/i.test(node.textContent || ''));
      if (!panel) return;
      panel.querySelectorAll('canvas').forEach(canvas => { try { window.Chart?.getChart?.(canvas)?.destroy?.(); } catch (_) {} });
      target = document.createElement(panel.tagName || 'section');
      target.className = panel.className;
      target.id = 'qExecutiveActions';
      panel.replaceWith(target);
    }
    target.innerHTML = actionPanelHtml();
    $('[data-q-open-tracker]', target)?.addEventListener('click', () => navigate(/Project Tracker/i));
  }

  function decisionMapSvg(projects) {
    const width = 1000;
    const height = 355;
    const left = 72;
    const right = 28;
    const top = 24;
    const bottom = 55;
    const plotW = width - left - right;
    const plotH = height - top - bottom;
    const x = value => left + clamp(value) / 100 * plotW;
    const y = value => top + (100 - clamp(value)) / 100 * plotH;
    const ticks = [0, 25, 50, 75, 100];
    const grid = ticks.map(tick => `<line x1="${x(tick)}" y1="${top}" x2="${x(tick)}" y2="${top + plotH}" stroke="#e2e7e2" stroke-width="1"/><text x="${x(tick)}" y="${top + plotH + 20}" text-anchor="middle" font-size="10" fill="#646464">${tick}</text><line x1="${left}" y1="${y(tick)}" x2="${left + plotW}" y2="${y(tick)}" stroke="#e2e7e2" stroke-width="1"/><text x="${left - 12}" y="${y(tick) + 3}" text-anchor="end" font-size="10" fill="#646464">${tick}</text>`).join('');
    const points = projects.map((project, index) => {
      const finalProgress = clamp(project.final_progress);
      const attention = attentionScore(project);
      const target = Number(project.total_target || 0);
      const radius = Math.max(9, Math.min(22, 9 + Math.sqrt(Math.max(0, target)) * 1.15));
      const color = attention >= 60 ? '#c78800' : attention >= 40 ? '#c6d52f' : '#35792a';
      const cx = x(finalProgress);
      const cy = y(attention);
      const label = esc(shortProjectName(project));
      const labelY = cy - radius - 5 - (index % 2) * 8;
      return `<g><title>${label}: final output ${finalProgress}%, executive attention ${attention}/100</title><circle cx="${cx}" cy="${cy}" r="${radius}" fill="${color}" fill-opacity=".92" stroke="#034c1f" stroke-width="1.2"/><text x="${cx}" y="${labelY}" text-anchor="middle" font-size="9" fill="#3f4742">${label}</text></g>`;
    }).join('');
    return `<svg class="q-decision-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Live workstream decision map plotting final-output readiness against executive attention"><rect x="${left}" y="${top}" width="${plotW}" height="${plotH}" fill="#fff" stroke="#d7e0d8"/>${grid}${points}<text x="${left + plotW / 2}" y="${height - 8}" text-anchor="middle" font-size="11" font-weight="700" fill="#034c1f">Final-output readiness (%)</text><text transform="translate(17 ${top + plotH / 2}) rotate(-90)" text-anchor="middle" font-size="11" font-weight="700" fill="#034c1f">Executive attention score</text></svg>`;
  }

  function decisionPanelHtml() {
    const metrics = workstreamMetrics();
    return `<div class="panel-head"><div><span class="section-kicker">EXECUTIVE DECISION MAP</span><h3>Live workstream readiness and attention</h3></div><button class="secondary-button" type="button" data-q-refresh-executive>↻ Refresh live data</button></div><div class="q-decision-meta"><span class="q-decision-chip">${metrics.projects.length} workstreams</span><span class="q-decision-chip">${metrics.onTrack} on track</span><span class="q-decision-chip warn">${metrics.finalPending} final outputs pending</span>${state.projects?.reporting_date ? `<span class="q-decision-chip">Tracker ${esc(state.projects.reporting_date)}</span>` : ''}</div><div class="q-decision-map">${decisionMapSvg(metrics.projects)}</div><div class="q-decision-legend"><span><i style="background:#35792a"></i>Low attention</span><span><i style="background:#c6d52f"></i>Follow-up</span><span><i style="background:#c78800"></i>Higher attention</span><span>Bubble size = respondent target</span></div><div class="q-decision-note">Attention is calculated from outstanding actions, overdue milestones, final-output completion, recorded risks and external response dependencies in the shared tracker.</div>`;
  }

  function replaceDecisionMap(view) {
    let target = $('#qExecutiveDecisionMap', view);
    if (!target) {
      const panel = $$('.panel', view).find(node => /EXECUTIVE DECISION MAP|Quest opportunity spaces by attractiveness and right-to-win/i.test(node.textContent || ''));
      if (!panel) return;
      panel.querySelectorAll('canvas').forEach(canvas => { try { window.Chart?.getChart?.(canvas)?.destroy?.(); } catch (_) {} });
      target = document.createElement(panel.tagName || 'section');
      target.className = panel.className;
      target.id = 'qExecutiveDecisionMap';
      panel.replaceWith(target);
    }
    target.innerHTML = decisionPanelHtml();
    $('[data-q-refresh-executive]', target)?.addEventListener('click', refreshData);
  }

  function updateDemoBadge() {
    const badge = $('.prototype-badge') || $$('.top-actions > *').find(node => /illustrative data/i.test(node.textContent || ''));
    if (!badge) return;
    badge.textContent = 'Demo Platform';
    badge.classList.add('q-demo-platform-badge');
    badge.title = 'Quest Intelligence 360 demonstration platform';
  }

  function latestNews() {
    const items = Array.isArray(state.news?.items) ? state.news.items : [];
    return [...items].sort((a, b) => Date.parse(b.published_at || '') - Date.parse(a.published_at || ''));
  }

  function latestAlertCount(items) {
    if (!items.length) return 0;
    const threshold = Date.now() - 72 * 60 * 60 * 1000;
    const recent = items.filter(item => {
      const time = Date.parse(item.published_at || '');
      return Number.isFinite(time) && time >= threshold;
    }).length;
    return Math.min(99, recent || Math.min(items.length, 9));
  }

  function ensureAlertDrawer() {
    let drawer = $('#qAlertDrawer');
    if (drawer) return drawer;
    drawer = document.createElement('aside');
    drawer.id = 'qAlertDrawer';
    drawer.className = 'q-alert-drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'false');
    drawer.setAttribute('aria-label', 'Latest Quest Intelligence 360 updates and alerts');
    document.body.appendChild(drawer);
    return drawer;
  }

  function renderAlerts() {
    const drawer = ensureAlertDrawer();
    const items = latestNews().slice(0, 8);
    const generated = state.news?.generated_at_display || (state.refreshedAt ? new Date(state.refreshedAt).toLocaleString() : 'Checking…');
    drawer.innerHTML = `<div class="q-alert-head"><div><span class="section-kicker">LIVE INTELLIGENCE</span><h3>Latest updates & alerts</h3><small>Feed refreshed ${esc(generated)}</small></div><button class="q-alert-close" type="button" data-q-alert-close aria-label="Close alerts">×</button></div><div class="q-alert-list">${items.length ? items.map(item => `<article class="q-alert-item"><div class="q-alert-meta"><span class="q-alert-tag">${esc(item.company || 'Market')}</span><span>${esc(item.category || 'Update')}</span><span>${esc(item.published_display || '')}</span></div><strong>${esc(item.title || 'Untitled update')}</strong>${item.url ? `<a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">Open alert source ↗</a>` : ''}</article>`).join('') : '<article class="q-alert-item"><strong>No current alerts are available.</strong></article>'}</div><div class="q-alert-footer"><span>${items.length} latest update${items.length === 1 ? '' : 's'} shown</span><button class="primary-button" type="button" data-q-open-alerts>Open Alerts & Signals</button></div>`;
    $('[data-q-alert-close]', drawer)?.addEventListener('click', closeAlerts);
    $('[data-q-open-alerts]', drawer)?.addEventListener('click', () => { closeAlerts(); navigate(/Alerts|Strategic Signals/i); });
  }

  function notificationButton() {
    return $('.notification-button') || $('.top-actions [aria-label*="notif" i],.top-actions [title*="notif" i]');
  }

  function updateBell() {
    const button = notificationButton();
    if (!button) return;
    const count = latestAlertCount(latestNews());
    button.innerHTML = `🔔${count ? `<span>${count}</span>` : ''}`;
    button.setAttribute('aria-label', `Latest updates and alerts${count ? `, ${count} recent` : ''}`);
    button.setAttribute('aria-controls', 'qAlertDrawer');
    button.setAttribute('aria-expanded', $('#qAlertDrawer')?.classList.contains('open') ? 'true' : 'false');
    button.title = 'Latest updates and alerts';
    renderAlerts();
  }

  function openAlerts() {
    renderAlerts();
    const drawer = ensureAlertDrawer();
    drawer.classList.add('open');
    notificationButton()?.setAttribute('aria-expanded', 'true');
  }

  function closeAlerts() {
    $('#qAlertDrawer')?.classList.remove('open');
    notificationButton()?.setAttribute('aria-expanded', 'false');
  }

  function toggleAlerts() {
    const drawer = ensureAlertDrawer();
    if (drawer.classList.contains('open')) closeAlerts(); else openAlerts();
  }

  function navigate(pattern) {
    const target = $$('.nav-item').find(node => pattern.test(node.textContent || ''));
    target?.click();
  }

  function applyHome() {
    const view = homeView();
    if (!view) return;
    removeExecutiveSharePoint(view);
    updateKpis(view);
    updateLiveOperations(view);
    if (state.projects?.projects?.length) {
      replaceCompetitiveMomentum(view);
      replaceDecisionMap(view);
    }
  }

  function applyAll() {
    updateDemoBadge();
    updateBell();
    applyHome();
  }

  function scheduleApply(delay = 90) {
    clearTimeout(applyTimer);
    applyTimer = setTimeout(applyAll, delay);
  }

  function bind() {
    document.addEventListener('click', event => {
      const bell = event.target.closest?.('.notification-button');
      if (bell) {
        event.preventDefault();
        event.stopImmediatePropagation();
        toggleAlerts();
        return;
      }
      if (!event.target.closest?.('#qAlertDrawer') && $('#qAlertDrawer')?.classList.contains('open')) closeAlerts();
      if (event.target.closest?.('.nav-item,[data-view],#floHomeRefresh')) scheduleApply(180);
    }, true);
    document.addEventListener('keydown', event => { if (event.key === 'Escape') closeAlerts(); });
    window.addEventListener('quest:module-loaded', () => scheduleApply(110));
    window.addEventListener('quest:layout-refresh', () => scheduleApply(110));
    window.addEventListener('hashchange', () => scheduleApply(110));
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && Date.now() - state.refreshedAt > 5 * 60 * 1000) refreshData();
    });
  }

  function boot() {
    injectStyles();
    bind();
    scheduleApply(20);
    refreshData();
    refreshTimer = window.setInterval(refreshData, 10 * 60 * 1000);
    window.addEventListener('beforeunload', () => clearInterval(refreshTimer), { once:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();