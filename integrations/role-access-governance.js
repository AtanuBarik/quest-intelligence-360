(() => {
  'use strict';

  const SESSION_KEY = 'quest360-session-v2';
  const APPROVAL_KEY = 'quest360-approval-state-v1';
  const ROLE_HASHES = new Map([
    ['c8afafd96e54fd8d67cc589b9c4047573b71309bef7dc74a8fbacd9f9c1aacd5', { role: 'Hub Owner', email: 'questhubowner@medtech.com' }],
    ['96f579594a5708ec80734da8ebac9ada57a509dbf6d2b9331a2b7ecad5b184d0', { role: 'Contributor', email: 'questcontributor@medtech.com' }],
    ['f6533982b7b2f974a927528b7fb1ff273d59d09268df5c1845d0ce43bc69e847', { role: 'Viewer', email: 'questviewer@medtech.com' }],
  ]);

  let session = readSession();
  let scheduled = false;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const parse = (value, fallback) => { try { return JSON.parse(value); } catch { return fallback; } };
  function readSession() { return parse(sessionStorage.getItem(SESSION_KEY), null); }
  function readApprovals() { return parse(localStorage.getItem(APPROVAL_KEY), {}); }
  function writeApprovals(value) { localStorage.setItem(APPROVAL_KEY, JSON.stringify(value)); }

  function toast(message) {
    const node = $('#toast');
    if (!node) return console.info(message);
    node.textContent = message;
    node.classList.add('show');
    clearTimeout(node._questTimer);
    node._questTimer = setTimeout(() => node.classList.remove('show'), 2600);
  }

  async function credentialHash(email, password) {
    const bytes = new TextEncoder().encode(`${String(email || '').trim().toLowerCase()}\n${String(password || '')}`);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('');
  }

  function injectStyles() {
    if ($('#questRoleGovernanceStyles')) return;
    const style = document.createElement('style');
    style.id = 'questRoleGovernanceStyles';
    style.textContent = `
      .q-role-governance-badge{display:inline-flex;align-items:center;gap:6px;padding:7px 10px;border-radius:8px;background:#edf5e8;color:#034c1f;font-size:10px;font-weight:800;white-space:nowrap;border:1px solid #d8e5d5}.q-role-governance-badge:before{content:'●';font-size:8px;color:#4c7637}
      .q-approval-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 12px;padding:10px 12px;border:1px solid #dce6d9;border-left:4px solid #c6d52f;border-radius:10px;background:#fbfdf7;font-size:10px;color:#59645c}.q-approval-toolbar strong{color:#034c1f}.q-owner-count{display:inline-flex;padding:4px 7px;border-radius:999px;background:#fff;border:1px solid #dce6d9;color:#034c1f;font-weight:800}
      .q-approval-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:7px;padding-top:7px;border-top:1px solid #edf0ee}.q-approval-tag{display:inline-flex;padding:4px 7px;border-radius:999px;font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.35px}.q-status-pending{background:#fff3d9;color:#845b00}.q-status-approved{background:#edf5e8;color:#245b1e}.q-status-on_hold{background:#e8f3f7;color:#00587c}.q-status-rejected{background:#fff0f4;color:#a52149}
      .q-approval-action{border:1px solid #cad8cb;background:#fff;color:#034c1f;border-radius:7px;padding:5px 8px;font-size:9px;font-weight:750}.q-approval-action:hover{background:#edf5e8}.q-approval-action.reject{color:#a52149}.q-approval-action.remind{color:#00587c}.q-governance-disabled{opacity:.5!important;cursor:not-allowed!important;filter:grayscale(.15)}
    `;
    document.head.appendChild(style);
  }

  function prepareLogin() {
    const username = $('#username');
    const password = $('#password');
    if (username && username.dataset.questPrepared !== '1') {
      username.value = '';
      username.placeholder = 'Enter your work email';
      username.dataset.questPrepared = '1';
    }
    if (password && password.dataset.questPrepared !== '1') {
      password.value = '';
      password.placeholder = 'Enter your password';
      password.dataset.questPrepared = '1';
    }
    const help = $('.login-help');
    if (help) help.innerHTML = '<span>🔐 Authorized prototype access</span><span>Role is assigned from your credentials</span>';
    const roleScreen = $('#roleScreen');
    if (roleScreen) roleScreen.classList.add('hidden');
  }

  function showScreen(target) {
    const login = $('#loginScreen');
    const role = $('#roleScreen');
    const app = $('#appScreen');
    if (login) login.classList.toggle('hidden', target !== 'login');
    if (role) role.classList.add('hidden');
    if (app) app.classList.toggle('hidden', target !== 'app');
  }

  function applyRoleLabels() {
    if (!session) return;
    const roleBadge = $('#roleBadge');
    if (roleBadge) {
      roleBadge.textContent = session.role;
      roleBadge.classList.add('q-role-governance-badge');
    }
    const sidebarRole = $('#sidebarRole');
    if (sidebarRole) sidebarRole.textContent = session.role;
  }

  function actionText(element) {
    return `${element.id || ''} ${element.dataset?.action || ''} ${element.getAttribute('aria-label') || ''} ${element.textContent || ''}`.toLowerCase().replace(/\s+/g, ' ');
  }

  function restrictionReason(element) {
    if (!session || session.role === 'Hub Owner') return '';
    const text = actionText(element);
    if (/filter|search|sort|reset|apply|view|open|expand|collapse|download|export|copy|refresh|next|previous|page|brief|summary/.test(text)) return '';
    if (/approve|reject|remind|hold|status|publish|unpublish|archive|restore|configure|edit|modify|rename|delete|remove/.test(text)) {
      return `${session.role} access does not allow modifying, deleting or changing approval status.`;
    }
    if (session.role === 'Viewer' && /add|create|upload|import|new |stage|submit|save|attach|ingest|watchlist|rule/.test(text)) {
      return 'Viewer access is read-only. Viewing, searching and filtering remain available.';
    }
    return '';
  }

  function applyControlRestrictions() {
    if (!session) return;
    $$('button,[role="button"],input[type="file"]').forEach(element => {
      if (element.closest('#loginScreen') || element.classList.contains('q-approval-action')) return;
      const reason = restrictionReason(element);
      if (reason) {
        element.disabled = true;
        element.classList.add('q-governance-disabled');
        element.dataset.questGovernanceDisabled = '1';
        element.title = reason;
      } else if (element.dataset.questGovernanceDisabled === '1') {
        element.disabled = false;
        element.classList.remove('q-governance-disabled');
        delete element.dataset.questGovernanceDisabled;
        element.removeAttribute('title');
      }
    });
  }

  function cardKey(card) {
    const link = card.querySelector('a[href]')?.href || '';
    const title = card.querySelector('h3,h4,strong')?.textContent?.trim() || card.textContent.trim().slice(0, 160);
    const raw = `${link}|${title}`;
    let hash = 2166136261;
    for (let i = 0; i < raw.length; i += 1) {
      hash ^= raw.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return `item-${(hash >>> 0).toString(16)}`;
  }

  function statusFor(key, approvals) { return approvals[key]?.status || 'pending'; }
  function statusLabel(status) { return ({ pending: 'Pending approval', approved: 'Approved', on_hold: 'On hold', rejected: 'Rejected' })[status] || status; }

  function setStatus(key, status) {
    const approvals = readApprovals();
    approvals[key] = { status, updatedAt: new Date().toISOString(), updatedBy: session?.email || 'unknown' };
    writeApprovals(approvals);
    scheduleApply();
  }

  function decorateCard(card, approvals) {
    const key = cardKey(card);
    const status = statusFor(key, approvals);
    card.dataset.questApprovalKey = key;
    card.dataset.questApprovalStatus = status;

    if ((session.role === 'Viewer' && status !== 'approved') || (session.role === 'Contributor' && status === 'rejected')) {
      card.style.display = 'none';
      return;
    }
    card.style.removeProperty('display');

    const signature = `${session.role}:${status}`;
    if (card.dataset.questApprovalRendered === signature && card.querySelector('.q-approval-row')) return;
    card.dataset.questApprovalRendered = signature;

    let row = card.querySelector('.q-approval-row');
    if (!row) {
      row = document.createElement('div');
      row.className = 'q-approval-row';
      card.appendChild(row);
    }
    row.replaceChildren();
    const tag = document.createElement('span');
    tag.className = `q-approval-tag q-status-${status}`;
    tag.textContent = statusLabel(status);
    row.appendChild(tag);

    if (session.role !== 'Hub Owner') return;
    [['approved','Approve',''],['rejected','Reject','reject'],['on_hold','Remind me later','remind']].forEach(([value,label,className]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `q-approval-action ${className}`.trim();
      button.textContent = label;
      button.disabled = status === value;
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        setStatus(key, value);
        toast(`${label}: ${card.querySelector('h3,h4')?.textContent?.trim() || 'intelligence item'}`);
      });
      row.appendChild(button);
    });
  }

  function applyApprovalGovernance() {
    if (!session) return;
    const approvals = readApprovals();
    const cards = $$('.live-news-card,.si-news-card');
    cards.forEach(card => decorateCard(card, approvals));

    let toolbar = $('.q-approval-toolbar');
    if (session.role !== 'Hub Owner' || !cards.length) {
      if (toolbar) toolbar.remove();
      return;
    }
    const pending = cards.filter(card => statusFor(cardKey(card), approvals) === 'pending').length;
    const hold = cards.filter(card => statusFor(cardKey(card), approvals) === 'on_hold').length;
    const signature = `${pending}:${hold}`;
    if (toolbar?.dataset.signature === signature) return;
    const anchor = $('.live-alerts-shell .page-heading,.si-news-shell .page-heading,.view.active .page-heading');
    if (!anchor) return;
    if (!toolbar) {
      toolbar = document.createElement('div');
      toolbar.className = 'q-approval-toolbar';
      anchor.insertAdjacentElement('afterend', toolbar);
    }
    toolbar.dataset.signature = signature;
    toolbar.innerHTML = `<span><strong>Hub Owner review queue</strong> · New intelligence stays hidden from Viewers until approved.</span><span class="q-owner-count">${pending} pending · ${hold} on hold</span>`;
  }

  function applyAll() {
    prepareLogin();
    if (!session) return;
    showScreen('app');
    applyRoleLabels();
    applyControlRestrictions();
    applyApprovalGovernance();
  }

  function scheduleApply() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      applyAll();
    }, 80);
  }

  async function handleLogin(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const username = $('#username');
    const password = $('#password');
    const error = $('#loginError');
    const email = username?.value?.trim().toLowerCase() || '';
    if (error) error.textContent = '';
    try {
      const hash = await credentialHash(email, password?.value || '');
      const match = ROLE_HASHES.get(hash);
      if (!match || match.email !== email) throw new Error('bad credentials');
      session = { role: match.role, email: match.email, authenticatedAt: new Date().toISOString() };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      sessionStorage.removeItem('quest360-auth');
      if (password) password.value = '';
      applyAll();
      toast(`Signed in as ${match.role}.`);
    } catch (_) {
      session = null;
      sessionStorage.removeItem(SESSION_KEY);
      if (error) error.textContent = 'Incorrect email or password.';
      showScreen('login');
      prepareLogin();
    }
  }

  function bind() {
    const form = $('#loginForm');
    if (form && form.dataset.questRoleBound !== '1') {
      form.addEventListener('submit', handleLogin, true);
      form.dataset.questRoleBound = '1';
    }
    const signOut = $('#signOut');
    if (signOut && signOut.dataset.questRoleBound !== '1') {
      signOut.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem('quest360-auth');
        session = null;
        showScreen('login');
        prepareLogin();
        toast('Signed out.');
      }, true);
      signOut.dataset.questRoleBound = '1';
    }
  }

  function boot() {
    injectStyles();
    prepareLogin();
    bind();
    sessionStorage.removeItem('quest360-auth');
    session = readSession();
    if (session && ['Hub Owner','Contributor','Viewer'].includes(session.role)) applyAll();
    else showScreen('login');

    const observer = new MutationObserver(() => {
      bind();
      scheduleApply();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('quest:module-loaded', scheduleApply);
    window.addEventListener('quest:layout-refresh', scheduleApply);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
