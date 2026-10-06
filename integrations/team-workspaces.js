(() => {
  'use strict';
  const RELEASE = '20261006teams1';
  const TEAMS = {
    executive: { name: 'Executive Leadership Team', short: 'Executive Leadership', icon: '◎', title: 'Complete intelligence. One view.', description: 'Enterprise priorities, every workstream and the complete intelligence portfolio.', focus: 'Enterprise value, investment priorities, risks and decisions across all workstreams.', routes: null, projects: null, questions: ['What priorities recur across the research portfolio?', 'What does the evidence say about enterprise value?'], metrics: ['quest_trust', 'value_clarity', 'service_reliability'] },
    strategy: { name: 'Strategy & Business Intelligence Team', short: 'Strategy & BI', icon: '↗', title: 'Connect signals to strategic decisions.', description: 'Competitive positioning, market signals, growth opportunities and strategic research.', focus: 'Competitive differentiation, growth opportunities, partnerships and strategic trade-offs.', routes: ['team-dashboard','copilot','alerts','competitors','news','pmr','library','projects','methodology'], projects: ['health-system-experience','data-ecosystem-needs','data-ecosystem-extended','consumer-testing','ci-always-on'], questions: ['Where can Quest differentiate its enterprise value proposition?', 'Which consumer testing opportunities are supported by this evidence?'], metrics: ['value_clarity','quest_trust','data_ai_readiness'] },
    maci: { name: 'Market and Customer Insights (MACI) team', short: 'Market & Customer Insights', icon: '◉', title: 'Bring the customer into every decision.', description: 'Customer needs, expert perspectives, survey findings and market perception.', focus: 'Customer segmentation, unmet needs, perception, qualitative and quantitative evidence, and research gaps.', routes: ['team-dashboard','copilot','competitors','social','pmr','experts','survey','library','projects','methodology'], projects: ['health-system-experience','digital-customer-journey','data-ecosystem-needs','data-ecosystem-extended','lab-stewardship','consumer-testing'], questions: ['Which customer needs recur across these projects?', 'What does the evidence say about persona-specific value propositions?'], metrics: ['quest_trust','digital_experience','recommend_score'] },
    operations: { name: 'Product & Operations Management team', short: 'Product & Operations', icon: '▦', title: 'Turn customer needs into delivery priorities.', description: 'Workflow, product requirements, service reliability and implementation progress.', focus: 'Product requirements, workflow integration, service delivery, adoption barriers and implementation priorities.', routes: ['team-dashboard','copilot','alerts','pmr','experts','survey','library','projects','methodology'], projects: ['digital-customer-journey','data-ecosystem-needs','data-ecosystem-extended','lab-stewardship'], questions: ['What workflow and interoperability gaps should the roadmap address?', 'What does the evidence say about service reliability and adoption?'], metrics: ['workflow_integration','service_reliability','digital_experience'] }
  };
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const session = () => { try { return JSON.parse(sessionStorage.getItem('quest360-session-v2')) || null; } catch { return null; } };
  const profile = () => TEAMS[session()?.team];
  const ready = () => session()?.stage === 'app' && !!profile();
  const canonical = route => ({surveys:'survey',tracker:'projects',insights:'copilot'})[route] || route;
  const allowed = route => !ready() || !profile().routes || profile().routes.includes(canonical(route));
  let data = null, pending = null, queued = false, signature = '';

  function styles() {
    if ($('#qTeamStyles')) return;
    const el = document.createElement('style'); el.id = 'qTeamStyles';
    el.textContent = `
      [data-team-hidden="true"]{display:none!important}body .q-team-screen{min-height:100vh;box-sizing:border-box;padding:36px 24px;display:grid;place-items:center;background:radial-gradient(circle at 12% 0%,#44764a 0,transparent 45%),linear-gradient(135deg,#062e1b,#034c1f 70%,#163d34)}
      .q-onboard{box-sizing:border-box;width:min(1120px,100%);padding:40px;border-radius:24px;background:#fff;box-shadow:0 24px 80px #00221055}.q-onboard .role-logos{margin-bottom:30px}.q-steps{display:flex;gap:18px;margin:0 0 28px;flex-wrap:wrap;color:#68786e;font-size:12px}.q-steps b{color:#034c1f}.q-onboard h2{color:#034c1f;font-size:34px;line-height:1.2;margin:12px 0}.q-onboard>p{font-size:15px;line-height:1.65;color:#627267}.q-team-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin:28px 0}.q-team-choice{min-height:190px;padding:24px;text-align:left;border:1px solid #d8e4d9;background:#fff;border-radius:16px;position:relative;cursor:pointer;color:#034c1f;transition:transform .15s,border-color .15s}.q-team-choice:hover{border-color:#35792a;transform:translateY(-2px)}.q-team-choice[aria-pressed="true"]{border:2px solid #35792a;background:#f4f9f0;box-shadow:0 8px 24px #034c1f0c}.q-team-choice strong{display:block;font-size:17px;line-height:1.4;margin:14px 0 8px}.q-team-choice small{font-size:12px;line-height:1.7;color:#607066;display:block}.q-team-choice .q-choice-icon{display:grid;place-items:center;width:42px;height:42px;border-radius:12px;background:#edf4e7;font-size:24px}.q-team-choice.executive{grid-column:1/-1;min-height:130px;display:grid;grid-template-columns:48px 1fr auto;gap:20px;align-items:center;background:linear-gradient(110deg,#f3f8ec,#fff)}.q-team-choice.executive strong{white-space:nowrap;margin:0 0 6px;font-size:20px}.q-choice-tag{border-radius:99px;background:#c6d52f;padding:8px 12px;font-size:11px;font-weight:800}.q-team-choice[aria-pressed="true"]:after{content:'✓';position:absolute;right:12px;top:10px;color:#35792a;font-weight:800}.q-onboard-footer{display:flex;align-items:center;justify-content:space-between;gap:16px}.q-onboard-footer button{min-height:46px}.q-access-options{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:26px 0}.q-access-options .role-option{display:block;min-height:190px;padding:24px!important;border-radius:16px}.q-access-options .role-option strong{margin-top:16px;font-size:18px}.q-access-options .role-option small{display:block;font-size:12px;line-height:1.6}.q-access-options .role-option:disabled{opacity:.5;cursor:not-allowed}.q-access-note{font-size:12px!important;color:#69776e}.q-workspace-context{display:flex;align-items:center;gap:10px;padding:12px 16px;margin:0 0 16px;background:#edf4e9;border:1px solid #d5e4d3;border-radius:12px;color:#034c1f;font-size:12px}.q-workspace-context strong{flex:1}.q-workspace-context button{font-size:11px}.q-team-hero{padding:30px;border-radius:20px;color:white;background:linear-gradient(115deg,#034c1f,#286530);display:flex;justify-content:space-between;gap:24px;align-items:center;margin-bottom:18px}.q-team-hero h1{font-size:30px;line-height:1.2;margin:10px 0!important;color:#fff!important}.q-team-hero p{font-size:14px;line-height:1.6;margin:0;color:#e3eddf;max-width:720px}.q-team-hero .q-team-kicker{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#d8e979}.q-team-hero button{background:#c6d52f;color:#034c1f;border:0;border-radius:10px;padding:13px 20px;font-weight:800;white-space:nowrap}.q-team-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:18px}.q-team-kpi{border:1px solid #dce6dc;border-radius:14px;background:white;padding:20px}.q-team-kpi span,.q-team-kpi small{display:block;color:#657368;font-size:12px}.q-team-kpi strong{display:block;font-size:30px;color:#034c1f;margin:8px 0}.q-team-grid{display:grid;grid-template-columns:1.2fr 1fr;gap:18px}.q-team-panel{padding:24px;border:1px solid #dce6dc;border-radius:16px;background:#fff;min-width:0}.q-team-panel h3{color:#034c1f;font-size:19px;margin:0 0 8px}.q-team-note{font-size:12px;line-height:1.55;color:#6c786f}.q-team-panel.full{grid-column:1/-1}.q-team-bar{margin:18px 0;font-size:12px;line-height:1.5}.q-team-bar>div:first-child{display:flex;justify-content:space-between;gap:10px}.q-team-bar-track{height:9px;background:#e9efe7;border-radius:99px;margin-top:7px;overflow:hidden}.q-team-bar-track i{height:100%;display:block;background:linear-gradient(90deg,#35792a,#a6bf36);border-radius:99px}.q-team-insight{padding:16px 0;border-bottom:1px solid #e7ede5}.q-team-insight strong{color:#034c1f;font-size:14px}.q-team-insight p{font-size:13px;line-height:1.7;color:#526457;margin:7px 0}.q-team-insight small{font-size:11px;color:#758076}.q-team-links{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}.q-team-links button{padding:9px 12px;border:1px solid #d2dfce;border-radius:8px;background:#f8fbf5;color:#034c1f;font-size:12px}.q-team-table{width:100%;border-collapse:collapse;font-size:12px}.q-team-table th,.q-team-table td{text-align:left;padding:13px 8px;border-bottom:1px solid #e6ede4;line-height:1.6}.q-team-table th{color:#034c1f;background:#f6f9f3}.q-team-table-wrap{overflow:auto}.q-team-table td:first-child{min-width:190px}.q-team-chat{margin-bottom:20px;border:1px solid #d1e1cb;border-radius:18px;background:#fff;overflow:hidden}.q-team-chat-head{padding:22px 24px;background:#f4f8ee;border-bottom:1px solid #dce6d7}.q-team-chat-head h2{margin:5px 0 9px;color:#034c1f;font-size:22px}.q-team-chat-head p{color:#5d715f;font-size:13px;line-height:1.5;margin:0}.q-team-chat-body{padding:24px}.q-team-chat form{display:flex;gap:12px;align-items:flex-end;margin-top:18px}.q-team-chat textarea{flex:1;min-height:75px;border:1px solid #cedecc;border-radius:10px;padding:14px;font:14px Arial;resize:vertical}.q-team-chat form button{padding:14px 18px}.q-team-chat select{padding:10px;border:1px solid #cedecc;border-radius:8px;font-size:12px;max-width:100%}.q-team-answer{margin-top:20px;padding:20px;background:#f8faf5;border-radius:12px;font-size:14px;line-height:1.7}.q-team-answer h3{color:#034c1f;margin-top:0}.q-team-answer li{margin:14px 0}.q-team-source{font-size:11px;color:#657561}.q-team-chat-source{margin-top:12px;font-size:11px;color:#6c786b}.q-team-prompts{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}.q-team-prompts button{border:1px solid #d4e2d0;border-radius:8px;background:white;padding:10px 14px;text-align:left;color:#034c1f;font-size:12px}.q-team-chat label{font-size:12px;color:#034c1f;font-weight:700;display:flex;align-items:center;gap:8px}.q-team-legacy-insights{display:none!important}:focus-visible{outline:3px solid #96b539;outline-offset:3px}@media(max-width:800px){.q-onboard{padding:24px}.q-team-options,.q-access-options{grid-template-columns:1fr}.q-team-choice{min-height:140px}.q-team-choice.executive{grid-template-columns:42px 1fr}.q-choice-tag{grid-column:2;width:max-content}.q-team-choice.executive strong{font-size:17px}.q-team-grid{grid-template-columns:1fr}.q-team-kpis{grid-template-columns:repeat(2,1fr)}.q-team-hero{display:block;padding:24px}.q-team-hero h1{font-size:25px}.q-team-hero button{margin-top:16px}.q-workspace-context{flex-wrap:wrap}.q-team-chat form{display:block}.q-team-chat textarea{width:100%;box-sizing:border-box}.q-team-chat form button{margin-top:10px}.q-onboard-footer{flex-wrap:wrap}}@media(max-width:400px){.q-team-choice.executive strong{font-size:14px}.q-team-screen{padding:16px!important}.q-onboard{padding:20px}.q-team-kpis{grid-template-columns:1fr}}
    `;
    document.head.appendChild(el);
  }

  async function loadData() {
    if (data) return data;
    if (pending) return pending;
    pending = Promise.all(['project-tracker','pmr-insight-library','survey-analytics-demo'].map(async n => {
      const r = await fetch(`data/${n}.json?v=${RELEASE}`); if (!r.ok) throw new Error(`${n}: ${r.status}`); return r.json();
    })).then(([tracker,insights,survey]) => (data={tracker,insights,survey})).catch(e=>{pending=null;throw e;});
    return pending;
  }
  const includesProject = (key, name = '') => {
    if (!ready() || !profile()?.projects) return true;
    const normalized = String(key).replace(/-pulse$/, '');
    const alias = normalized === 'data-ai-readiness' ? 'data-ecosystem-needs' : normalized;
    return profile().projects.includes(alias) || (!!name && inTeam(name));
  };
  const projectEntries = () => Object.entries(data?.insights.projects || {}).filter(([key]) => !profile()?.projects || profile().projects.includes(key));
  const records = () => projectEntries().flatMap(([key,p]) => (p.insights||[]).map(r=>({...r,key,source:'data/pmr-insight-library.json'})));
  const projectName = key => ({'health-system-experience':'Health System Experience','digital-customer-journey':'Digital Customer Journey','data-ecosystem-needs':'Data Ecosystem Needs','data-ecosystem-extended':'Data Ecosystem Extended','lab-stewardship':'Lab Stewardship & Analytics','consumer-testing':'Consumer Testing','ci-always-on':'Competitive Intelligence'})[key]||key;
  const inTeam = text => {
    const p = profile(); if (!p?.projects) return true;
    const value = String(text).toLowerCase();
    return p.projects.some(key => ({'health-system-experience':/health.system experience|enterprise decision/,'digital-customer-journey':/digital customer journey/,'data-ecosystem-needs':/data ecosystem/,'data-ecosystem-extended':/data ecosystem/,'lab-stewardship':/lab stewardship/,'consumer-testing':/consumer testing/,'ci-always-on':/competitive intelligence|always.on/}[key]).test(value));
  };
  const tracked = () => (data?.tracker.projects||[]).filter(p=>inTeam(p.project_name));
  const go = route => { if (!allowed(route)) return false; const nav=$$('.nav-item').find(n=>n.dataset.view===route); nav?.click(); return !!nav; };

  function addRoute() {
    if (!$('.view[data-view="team-dashboard"]')) {
      const view = document.createElement('section'); view.className='view'; view.dataset.view='team-dashboard';
      view.innerHTML='<div class="q-team-panel">Loading your team workspace…</div>'; $('#appScreen .content')?.prepend(view);
      const nav=document.createElement('button'); nav.type='button';nav.className='nav-item';nav.dataset.view='team-dashboard';nav.innerHTML='<span>⌂</span><b>Team Dashboard</b>';
      $('.nav-item[data-view="home"]')?.insertAdjacentElement('afterend',nav);
    }
  }
  function renderDashboard() {
    const view=$('.view[data-view="team-dashboard"]'), p=profile(); if (!view||!p||!data) return;
    const projects=tracked(), entries=projectEntries(), insights=records();
    const average=projects.length?Math.round(projects.reduce((s,p)=>s+Number(p.final_progress||0),0)/projects.length):null;
    const date=data.tracker.reporting_date||'Date not supplied';
    const questions=data.survey.questions||[], segments=(data.survey.segments||[]).filter(s=>includesProject(s.project_id));
    const bars=p.metrics.map(key=>{const rows=segments.filter(s=>Number.isFinite(Number(s.metrics?.[key])) && Number(s.n)>0);const n=rows.reduce((a,s)=>a+Number(s.n),0);const score=n?rows.reduce((a,s)=>a+Number(s.n)*Number(s.metrics[key]),0)/n:null;const max=key==='recommend_score'?10:5;return {label:questions.find(q=>q.key===key)?.label||key,score,max,n};});
    const links=(p.routes||[]).filter(r=>!['team-dashboard','methodology'].includes(r));
    const labels={copilot:'Ask the assistant',alerts:'Alerts & Signals',competitors:'Competitor Profiles',news:'News Intelligence',pmr:'PMR Projects & Reports',library:'Evidence Library',projects:'Project Tracker',experts:'Voice of Experts',survey:'Survey Analytics',social:'Social & Perception'};
    view.innerHTML=`<div class="q-team-hero"><div><span class="q-team-kicker">${esc(p.name)} · ${esc(session().role)}</span><h1>${esc(p.title)}</h1><p>${esc(p.focus)}</p></div><button type="button" data-team-go="copilot">Ask your team assistant ↗</button></div>
      <div class="q-team-kpis">${[[entries.length,'Relevant research workstreams','From the existing insight library'],[projects.length,'Delivery records',`Tracker reported ${date}`],[insights.length,'Curated insight objects','Illustrative PMR content'],[average===null?'—':average+'%','Average final-output progress',`Unweighted · ${projects.length} delivery records`]].map(([n,label,note])=>`<article class="q-team-kpi"><span>${esc(label)}</span><strong>${esc(n)}</strong><small>${esc(note)}</small></article>`).join('')}</div>
      <div class="q-team-grid"><article class="q-team-panel"><h3>${session().team==='strategy'?'Strategic themes to explore':session().team==='maci'?'Customer priorities to explore':'Roadmap priorities to explore'}</h3><p class="q-team-note">Existing PMR insight objects, selected for your team. Illustrative synthesis; validate before client use.</p>${entries.slice(0,4).map(([key,p])=>{const i=p.insights?.[0];return i?`<div class="q-team-insight"><strong>${esc(i.title)}</strong><p>${esc(i.body)}</p><p><b>Implication:</b> ${esc(i.implication)}</p><small>${esc(projectName(key))} · PMR insight library · Demo synthesis</small></div>`:'';}).join('')}<div class="q-team-links">${links.map(r=>`<button type="button" data-team-go="${r}">${esc(labels[r])} →</button>`).join('')}</div></article>
      <article class="q-team-panel"><h3>${session().team==='strategy'?'Value & digital readiness':session().team==='maci'?'Customer perception snapshot':'Workflow & service snapshot'}</h3><p class="q-team-note">Synthetic survey responses · sample-weighted means within relevant demo cohorts. Each cohort is a separate study; combined results are illustrative.</p>${bars.map(b=>`<div class="q-team-bar"><div><span>${esc(b.label)}</span><b>${b.score===null?'No data':b.score.toFixed(1)+' / '+b.max}</b></div><div class="q-team-bar-track" role="img" aria-label="${esc(b.label)}: ${b.score===null?'no data':b.score.toFixed(1)+' out of '+b.max}"><i style="width:${b.score===null?0:100*b.score/b.max}%"></i></div><small>Demo cohort base: ${b.n}</small></div>`).join('')}<h3 style="margin-top:30px">Delivery progress</h3><p class="q-team-note">Source: project tracker · reporting date ${esc(date)}</p>${projects.slice(0,5).map(p=>`<div class="q-team-bar"><div><span>${esc(p.project_name)}</span><b>${Number(p.final_progress||0)}%</b></div><div class="q-team-bar-track"><i style="width:${Math.max(0,Math.min(100,Number(p.final_progress||0)))}%"></i></div></div>`).join('')}</article>
      <article class="q-team-panel full"><h3>Workstreams & next actions</h3><p class="q-team-note">Recorded actions from the existing tracker. This reflects the source reporting date, not a real-time task feed.</p><div class="q-team-table-wrap"><table class="q-team-table"><thead><tr><th>Workstream</th><th>Research type</th><th>Next action</th><th>Owner / due</th></tr></thead><tbody>${projects.map(p=>`<tr><td>${esc(p.project_name)}</td><td>${esc(p.research_type)}</td><td>${esc(p.next_step||p.next_milestone||'No action recorded')}</td><td>${esc(p.next_step_owner||'Not recorded')}<br>${esc(p.milestone_due||'No date recorded')}</td></tr>`).join('')}</tbody></table></div></article></div>`;
  }

  function renderAssistant() {
    const view=$('.view[data-view="copilot"]'), p=profile();if (!view||!p) return;
    let node=$('#qTeamAssistant');
    if (!node) { node=document.createElement('section');node.id='qTeamAssistant';node.className='q-team-chat';view.prepend(node); }
    const key=session().team;
    const buildKey=key+':'+projectEntries().map(([id])=>id).join(',');
    if (node.dataset.team!==buildKey) {
      node.dataset.team=buildKey;
      node.innerHTML=`<div class="q-team-chat-head"><span class="q-team-kicker">ROLE-AWARE INSIGHTS</span><h2>${esc(p.short)} assistant</h2><p>${esc(p.focus)}</p></div><div class="q-team-chat-body"><label>Research scope <select id="qTeamChatProject"><option value="all">All relevant workstreams</option>${projectEntries().map(([key])=>`<option value="${key}">${esc(projectName(key))}</option>`).join('')}</select></label><div class="q-team-prompts">${p.questions.map(q=>`<button type="button" data-team-prompt="${esc(q)}">${esc(q)}</button>`).join('')}</div><form id="qTeamPromptForm"><textarea id="qTeamPromptInput" aria-label="Question for your team assistant" placeholder="Ask a question within your team's research scope…" required></textarea><button class="primary-button" type="submit">Find evidence ↗</button></form><p class="q-team-chat-source">Source-bounded prototype: keyword retrieval from the existing PMR demo insight library. No live generative model is connected. Responses preserve the illustrative status of this content.</p><div id="qTeamAnswer" class="q-team-answer" role="status" aria-live="polite" hidden></div></div>`;
    }
    // Keep the full original engine visible to Executive Leadership. Other teams
    // use the bounded assistant so generic legacy answers cannot broaden their scope.
    [...view.children].forEach(child=>child.classList.toggle('q-team-legacy-insights',key!=='executive'&&child!==node));
  }
  async function answer(question) {
    const teamAtStart=session()?.team;
    try { await loadData(); } catch(e) { const errorPanel=$('#qTeamAnswer');if(errorPanel){errorPanel.hidden=false;errorPanel.textContent='Unable to load the evidence library. Please retry.';}return; }
    if (session()?.team!==teamAtStart||!ready()) return;
    const panel=$('#qTeamAnswer'); if (!panel) return;
    const chosen=$('#qTeamChatProject')?.value||'all';
    const stop=new Set(['what','which','where','when','does','about','these','should','across','with','from','have','that','this','their','there','would','could','quest','evidence','supported','research','projects','priorities','recurring']);
    const tokens=question.toLowerCase().match(/[a-z]{3,}/g)?.filter(t=>!stop.has(t))||[];
    const pool=records().filter(r=>chosen==='all'||r.key===chosen);
    const ranked=pool.map(r=>({r,score:tokens.reduce((s,t)=>s+((r.title+' '+r.body+' '+r.implication+' '+(r.tags||[]).join(' ')+' '+projectName(r.key)).toLowerCase().includes(t)?1:0),0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,4);
    panel.hidden=false;
    panel.innerHTML=`<h3>${esc(profile().short)} evidence brief</h3><p><b>Question:</b> ${esc(question)}</p><p><b>Team focus:</b> ${esc(profile().focus)}</p>${ranked.length?`<p>Matching insight objects within ${chosen==='all'?'your relevant workstreams':esc(projectName(chosen))}:</p><ol>${ranked.map(({r})=>`<li><strong>${esc(r.title)}</strong><p>${esc(r.body)}</p><p><b>Decision implication:</b> ${esc(r.implication)}</p><span class="q-team-source">Source: <a href="data/pmr-insight-library.json" target="_blank" rel="noopener">PMR insight library</a> · ${esc(projectName(r.key))} · Illustrative synthesis</span></li>`).join('')}</ol>`:'<p>No matching evidence was found within your team’s selected workstreams. Refine the question or select another relevant workstream. No unsupported answer has been generated.</p>'}<p class="q-team-note">Demo PMR synthesis, not validated respondent findings. Insight-library date: ${esc(data.insights.generated_at?.slice(0,10)||'not recorded')}.</p>`;
  }

  function enforce() {
    const p=profile(); if (!ready()||!p) return;
    const executive=session().team==='executive';
    $$('.nav-item[data-view],.view[data-view],[data-view-jump]').forEach(node=>{
      const route=node.dataset.view||node.dataset.viewJump||node.dataset.searchView;
      const hide=route==='team-dashboard'?executive:!allowed(route);
      const next=String(hide); if(node.dataset.teamHidden!==next)node.dataset.teamHidden=next;
    });
    $$('.nav-label').forEach(label=>{let n=label.nextElementSibling;const items=[];while(n&&!n.classList.contains('nav-label')){if(n.classList.contains('nav-item'))items.push(n);n=n.nextElementSibling;} const hide=items.length>0&&items.every(n=>n.dataset.teamHidden==='true');if(label.dataset.teamHidden!==String(hide))label.dataset.teamHidden=String(hide);});
    // Global search can link to modules; suppress results outside this team's scope.
    $$('#searchResults button').forEach(node=>{const route=node.dataset.view||node.dataset.viewJump||node.dataset.searchView; if(route&&!allowed(route))node.dataset.teamHidden='true';});
    if($('.view.active')&&!allowed($('.view.active').dataset.view))go('team-dashboard');
    const label=$('#sidebarRole');if(label&&label.textContent!==p.short+' · '+session().role)label.textContent=p.short+' · '+session().role;
    const content=$('#appScreen .content'); if(content&&!$('#qWorkspaceContext')){
      const context=document.createElement('div');context.id='qWorkspaceContext';context.className='q-workspace-context';context.innerHTML='<span>◎</span><strong></strong><button type="button" class="secondary-button" id="qChangeWorkspace">Change team / access</button>';content.prepend(context);
    }
    const text=$('#qWorkspaceContext strong'),value=p.name+' · '+session().role+(executive?' · All workstreams':'');if(text&&text.textContent!==value)text.textContent=value;
    renderAssistant();
  }
  function schedule() { if(queued)return;queued=true;setTimeout(()=>{queued=false;enforce();},80); }
  async function applyWorkspace() {
    styles();addRoute();
    const key=session()?.team; if(!ready())return;
    enforce();
    try{await loadData();if(session()?.team!==key||!ready())return;const sig=key+':'+session().role;if(signature!==sig){signature=sig;renderDashboard();}renderAssistant();enforce();}catch(e){const view=$('.view[data-view="team-dashboard"]');if(view)view.innerHTML=`<div class="q-team-panel"><h3>Unable to load your workspace</h3><p>${esc(e.message)}</p><button type="button" data-team-retry>Retry</button></div>`;}
  }
  function boot() {
    styles();addRoute();
    document.addEventListener('click',event=>{
      const jump=event.target.closest('[data-team-go]');if(jump){event.preventDefault();go(jump.dataset.teamGo);}
      const prompt=event.target.closest('[data-team-prompt]');if(prompt){$('#qTeamPromptInput').value=prompt.dataset.teamPrompt;answer(prompt.dataset.teamPrompt);}
      if(event.target.closest('[data-team-retry]'))applyWorkspace();
      const nav=event.target.closest('.nav-item,[data-view-jump],[data-search-view]');if(nav&&!allowed(nav.dataset.view||nav.dataset.viewJump||nav.dataset.searchView)){event.preventDefault();event.stopImmediatePropagation();go('team-dashboard');}
    },true);
    document.addEventListener('submit',event=>{if(event.target.id==='qTeamPromptForm'){event.preventDefault();event.stopImmediatePropagation();answer($('#qTeamPromptInput').value.trim());}},true);
    window.addEventListener('quest:workspace-change',applyWorkspace);
    window.addEventListener('quest:module-loaded',schedule);
    window.addEventListener('quest:layout-refresh',schedule);
    new MutationObserver(ms=>{if(ms.some(m=>m.addedNodes.length))schedule();}).observe(document.body,{childList:true,subtree:true});
    applyWorkspace();
  }
  window.QuestWorkspaces={teams:TEAMS,profile,allowed,ready,apply:applyWorkspace,go,inTeam,includesProject};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
