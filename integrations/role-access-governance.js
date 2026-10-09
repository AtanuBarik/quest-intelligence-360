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
  let stage = session?.team && session?.stage === 'app' ? 'app' : session ? 'team' : 'login';
  let selectedTeam = session?.team || '';
  let selectedRole = session?.role || '';
  const TYPES = ['Hub Owner','Contributor','Viewer'];
  const WORKSPACES = window.QuestWorkspaces;
  function persist() { if (session) { session.stage = stage; sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)); } }
  function notify() { window.dispatchEvent(new CustomEvent('quest:workspace-change')); }
  let scheduled = false, visibleScreen = '';
  const displayName = () => String(session?.displayName||'Quest team').trim().slice(0,80)||'Quest team';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  function parse(value, fallback) { try { return JSON.parse(value); } catch { return fallback; } }
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
    if (help && !help.dataset.teamPrepared) {
      help.innerHTML = '<span>🔐 Prototype access</span><span>Choose your team after sign in</span>';
      help.dataset.teamPrepared = '1';
    }
  }

  function logos() { return '<div class="role-logos"><div class="ev-wordmark dark">EVALUESERVE</div><div class="quest-wordmark dark"><span class="quest-q">Q</span><span>Quest Diagnostics</span></div></div>'; }
  function buildOnboarding() {
    if (!$('#teamScreen')) {
      const node = document.createElement('main'); node.id='teamScreen'; node.className='q-team-screen hidden';
      node.innerHTML=`<section class="q-onboard">${logos()}<div class="q-steps"><span>✓ Sign in</span><b>02 Choose team</b><span>03 Choose access</span><span>04 Your dashboard</span></div><p class="q-personal-greeting" id="qTeamGreeting">Welcome, Quest team</p><h2>Which team do you belong to?</h2><p>Choose your role and team. Your dashboard, workstreams and insights assistant will adapt to the decisions you make.</p><label class="q-name-field" for="qDisplayName">Your name <span>(optional)</span><input id="qDisplayName" type="text" maxlength="80" autocomplete="given-name" placeholder="Quest team" aria-describedby="qNameNote"><small id="qNameNote">Used to greet you in this browser session.</small></label><div class="q-team-options">${Object.entries(WORKSPACES.teams).map(([key,t])=>`<button type="button" class="q-team-choice ${key==='executive'?'executive':''}" data-team="${key}" aria-pressed="false"><span class="q-choice-icon" aria-hidden="true">${t.icon}</span><span><strong>${t.name}</strong><small>${t.description}</small></span>${key==='executive'?'<span class="q-choice-tag">All workstreams</span>':''}</button>`).join('')}</div><div class="q-onboard-footer"><button type="button" class="text-button" id="qTeamBack">← Back to sign in</button><button type="button" class="primary-button" id="qTeamContinue" disabled>Continue to access level →</button></div></section>`;
      $('#roleScreen').insertAdjacentElement('beforebegin',node);
    }
    const role=$('#roleScreen');
    if(role&&!role.dataset.teamPrepared){
      role.className='q-team-screen hidden';role.dataset.teamPrepared='1';
      role.innerHTML=`<section class="q-onboard">${logos()}<div class="q-steps"><span>✓ Sign in</span><span>✓ Choose team</span><b>03 Choose access</b><span>04 Your dashboard</span></div><h2>How will you use the hub?</h2><p id="qAccessTeam"></p><div class="q-access-options" id="roleOptions">${[['Hub Owner','✎','Curate intelligence, manage sources and review or publish content.'],['Contributor','▤','Add evidence, prepare analysis and contribute draft insights.'],['Viewer','◉','Explore intelligence, ask questions and download available outputs.']].map(([type,icon,desc])=>`<button type="button" class="role-option" data-role="${type}" aria-pressed="false"><span class="role-icon green">${icon}</span><strong>${type}</strong><small>${desc}</small></button>`).join('')}</div><p class="q-access-note">Available access levels follow your prototype account. Team selection changes relevance; your access level controls editing actions.</p><div class="q-onboard-footer"><button type="button" class="text-button" id="qAccessBack">← Back to team selection</button><button type="button" class="primary-button" id="enterHub" disabled>Open my dashboard →</button></div></section>`;
    }
  }
  function updateChoices() {
    $$('.q-team-choice').forEach(n=>n.setAttribute('aria-pressed',String(n.dataset.team===selectedTeam)));
    const next=$('#qTeamContinue');if(next)next.disabled=!selectedTeam;
    const name=WORKSPACES.teams[selectedTeam]?.name||'Choose a team';
    if($('#qAccessTeam'))$('#qAccessTeam').textContent='Welcome, '+displayName()+'. '+name+' — your content and assistant will be curated for this team.';
    if($('#qTeamGreeting'))$('#qTeamGreeting').textContent='Welcome, '+displayName();
    const nameInput=$('#qDisplayName');if(nameInput&&document.activeElement!==nameInput)nameInput.value=session?.displayName||'';
    const cap=TYPES.indexOf(session?.maxRole||session?.role||'Viewer');
    $$('#roleScreen .role-option').forEach(n=>{
      const blocked=TYPES.indexOf(n.dataset.role)<cap;n.disabled=blocked;
      n.title=blocked?'This access level is unavailable for your account.':'';
      n.classList.toggle('selected',n.dataset.role===selectedRole);
      n.setAttribute('aria-pressed',String(n.dataset.role===selectedRole));
    });
    const enter=$('#enterHub');if(enter){enter.disabled=!selectedRole||TYPES.indexOf(selectedRole)<cap;enter.textContent=selectedTeam==='executive'?'Open Executive Hub →':selectedTeam==='maci'?'Open MY HUB →':'Open My Dashboard →';}
  }
  function showScreen(target) {
    ['login','team','role','app'].forEach(name=>$('#'+name+'Screen')?.classList.toggle('hidden',name!==target));
    if(visibleScreen!==target){visibleScreen=target;window.dispatchEvent(new CustomEvent('quest:screen-opened',{detail:{screen:target}}));}
  }

  function applyRoleLabels() {
    if (!session) return;
    const roleBadge = $('#roleBadge');
    if (roleBadge) {
      roleBadge.textContent = session.role;
      roleBadge.classList.add('q-role-governance-badge');
    }
    const sidebarRole = $('#sidebarRole');
    const label = (WORKSPACES.teams[session.team]?.short || '') + ' · ' + session.role;
    if (sidebarRole && sidebarRole.textContent !== label) sidebarRole.textContent = label;
  }

  function actionText(element) {
    return `${element.id || ''} ${element.dataset?.action || ''} ${element.getAttribute('aria-label') || ''} ${element.textContent || ''}`.toLowerCase().replace(/\s+/g, ' ');
  }

  function restrictionReason(element) {
    if (!session || session.role === 'Hub Owner') return '';
    if(session.role==='Viewer' && element.matches('input[type="file"]')) return 'Viewer access is read-only.';
    if(element.id==='qkrClear') return 'Only Hub Owners can clear locally indexed files.';
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
      if (!element.closest('#appScreen') || element.classList.contains('q-approval-action') || element.closest('#qTeamAssistant,.qm-center') || element.id === 'qChangeWorkspace') return;
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

    if ((session.team !== 'executive' && session.role === 'Viewer' && status !== 'approved') || (session.role === 'Contributor' && status === 'rejected')) {
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
    if (!session) { showScreen('login'); return; }
    showScreen(stage);
    if(stage !== 'app') return;
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
    const submit=$('#loginForm button[type="submit"]'),label=submit?.textContent;
    if(submit){submit.disabled=true;submit.setAttribute('aria-busy','true');submit.textContent='Signing in…';}
    try {
      const hash = await credentialHash(email, password?.value || '');
      const match = ROLE_HASHES.get(hash);
      const account = email === 'quest@medtech.com' && password?.value === 'evalueserve' ? {role:'Hub Owner',email} : match;
      if (!account || account.email !== email) throw new Error('bad credentials');
      session = { role: account.role, maxRole: account.role, email: account.email, authenticatedAt: new Date().toISOString() };
      stage = 'team'; selectedTeam = ''; selectedRole = account.role; persist(); updateChoices();
      sessionStorage.removeItem('quest360-auth');
      if (password) password.value = '';
      applyAll();
      notify();
      toast('Signed in. Choose your team to continue.');
    } catch (_) {
      session = null; stage = 'login';
      sessionStorage.removeItem(SESSION_KEY);
      if (error) error.textContent = 'Incorrect email or password.';
      showScreen('login');
      prepareLogin();
    } finally { if(submit){submit.disabled=false;submit.removeAttribute('aria-busy');submit.textContent=label;} }
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
        session = null; stage = 'login'; selectedTeam = ''; selectedRole = '';
        showScreen('login');
        notify();
        prepareLogin();
        toast('Signed out.');
      }, true);
      signOut.dataset.questRoleBound = '1';
    }
  }

  function boot() {
    injectStyles();
    buildOnboarding();
    prepareLogin();
    bind();
    document.addEventListener('click', event => {
      const team = event.target.closest('[data-team]');
      if(team && team.closest('#teamScreen')) { selectedTeam=team.dataset.team; updateChoices(); }
      const role = event.target.closest('#roleScreen [data-role]');
      if(role && !role.disabled) { selectedRole=role.dataset.role; updateChoices(); }
      if(event.target.closest('#qTeamContinue') && session && selectedTeam) { stage='role'; session.team=selectedTeam; session.displayName=String($('#qDisplayName')?.value||'').trim().slice(0,80)||'Quest team'; persist(); updateChoices(); showScreen(stage); }
      if(event.target.closest('#qAccessBack')) { stage='team'; persist(); showScreen(stage); }
      if(event.target.closest('#qTeamBack')) { session=null; stage='login'; sessionStorage.removeItem(SESSION_KEY); showScreen(stage); }
      if(event.target.closest('#enterHub') && session && selectedTeam && selectedRole) {
        event.preventDefault(); event.stopImmediatePropagation();
        if(TYPES.indexOf(selectedRole)<TYPES.indexOf(session.maxRole||session.role))return;
        session.team=selectedTeam;session.role=selectedRole;stage='app';persist();applyAll();notify();
        WORKSPACES.go(selectedTeam==='executive'?'home':'team-dashboard');
        window.dispatchEvent(new Event('resize'));
      }
      if(event.target.closest('#qChangeWorkspace')) { stage='team';persist();updateChoices();showScreen(stage); }
    }, true);
    document.addEventListener('input',event=>{if(event.target.id==='qDisplayName'&&session){session.displayName=event.target.value.trim().slice(0,80)||'Quest team';persist();const greeting=$('#qTeamGreeting');if(greeting)greeting.textContent='Welcome, '+displayName();}});
    sessionStorage.removeItem('quest360-auth');
    session = readSession();
    if (session && TYPES.includes(session.role)) {
      session.maxRole ||= session.role;
      if(!WORKSPACES.teams[session.team]) { stage='team'; selectedTeam=''; }
      persist();updateChoices();applyAll();notify();if(stage==='app')WORKSPACES.go(session.team==='executive'?'home':'team-dashboard');
    } else { session=null;stage='login';showScreen(stage); }

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
