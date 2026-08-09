(() => {
  'use strict';

  const RELEASE = '20260809e';
  const URLS = {
    projects: `data/project-tracker.json?v=${RELEASE}`,
    news: `data/laboratory-news.json?v=${RELEASE}`,
    social: `data/social-intelligence.json?v=${RELEASE}`,
    benchmark: `data/public-demo-intelligence.json?v=${RELEASE}`,
    executive: `data/executive-public-intelligence.json?v=${RELEASE}`,
  };
  const state = { projects:null, news:null, social:null, benchmark:null, executive:null, refreshedAt:0 };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const esc = (value = '') => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const clamp = value => Math.max(0, Math.min(100, Number(value) || 0));
  let scheduled = false;

  function injectStyles() {
    if ($('#qExecutiveV2Styles')) return;
    const style = document.createElement('style');
    style.id = 'qExecutiveV2Styles';
    style.textContent = `
      .qv2-kicker{display:block;color:#35792a;font-size:11px;font-weight:700;letter-spacing:1.1px}.qv2-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding-bottom:10px;margin-bottom:12px;border-bottom:1px solid #d7e0d8}.qv2-head h3{margin:3px 0 0!important;color:#034c1f!important}.qv2-sub{font-size:9px;color:#646464}.qv2-grid{display:grid;gap:9px}.qv2-signal{display:grid;grid-template-columns:34px minmax(0,1fr) auto;gap:10px;align-items:start;padding:11px;border:1px solid #dce4dd;border-radius:8px;background:#fff}.qv2-signal-icon{width:32px;height:32px;border-radius:8px;display:grid;place-items:center;background:#edf4e9;color:#034c1f;font-weight:800}.qv2-signal strong{display:block;color:#202834;font-size:11px;line-height:1.35}.qv2-signal p{margin:4px 0;color:#646464;font-size:9px;line-height:1.45}.qv2-meta{display:flex;gap:6px;flex-wrap:wrap;color:#7b827d;font-size:8px}.qv2-tag{padding:3px 5px;border-radius:4px;background:#f2f6ef;color:#034c1f;font-weight:700}.qv2-link{white-space:nowrap;color:#034c1f;text-decoration:none;font-size:9px;font-weight:700}.qv2-link:hover{text-decoration:underline}
      .qv2-pmr-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-bottom:10px}.qv2-mini{border:1px solid #dce4dd;border-radius:7px;padding:8px;background:#fbfdfb}.qv2-mini span{display:block;font-size:8px;color:#646464}.qv2-mini strong{display:block;margin-top:3px;color:#034c1f;font-size:17px}.qv2-project{padding:9px 0;border-bottom:1px solid #e6ebe7}.qv2-project:last-child{border-bottom:0}.qv2-project-top{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:start}.qv2-project strong{font-size:10px;color:#034c1f}.qv2-action{margin-top:4px;font-size:9px;color:#555;line-height:1.4}.qv2-project-meta{margin-top:4px;font-size:8px;color:#778078}.qv2-progress{height:6px;margin-top:6px;background:#e7ece8;border-radius:99px;overflow:hidden}.qv2-progress i{display:block;height:100%;background:linear-gradient(90deg,#034c1f,#35792a,#c6d52f)}.qv2-attention{padding:3px 6px;border-radius:4px;background:#fff1d4;color:#805600;font-size:8px;font-weight:700}.qv2-ontrack{background:#edf4e9;color:#034c1f}.qv2-footer{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-top:9px;padding-top:8px;border-top:1px solid #e3e8e4;color:#707871;font-size:8px}.qv2-button{border:0;background:transparent;color:#034c1f;font-weight:700;font-size:9px;cursor:pointer}
      .qv2-voice-insights{margin-top:12px;padding-top:11px;border-top:1px solid #dfe5e0}.qv2-voice-insights h4{margin:0 0 7px!important;color:#034c1f!important;font-size:11px!important}.qv2-voice-insights ul{margin:0;padding-left:17px;display:grid;gap:6px;color:#525b55;font-size:9px;line-height:1.45}.qv2-voice-insights strong{color:#034c1f}
      .qv2-activity-chart{display:grid;gap:7px}.qv2-bar-row{display:grid;grid-template-columns:115px minmax(80px,1fr) 28px;gap:7px;align-items:center;font-size:8px}.qv2-bar-row span:first-child{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#303a33}.qv2-track{height:10px;background:#e8ede9;border-radius:3px;overflow:hidden}.qv2-track i{display:block;height:100%;background:linear-gradient(90deg,#034c1f,#35792a)}.qv2-social-list{display:grid;gap:6px;margin-top:11px;padding-top:10px;border-top:1px solid #dfe5e0}.qv2-social-item{padding:7px 8px;border-left:3px solid #c6d52f;background:#f8faf7;border-radius:0 6px 6px 0;font-size:8px;line-height:1.4;color:#555}.qv2-social-item strong{color:#034c1f}.qv2-note{margin-top:8px;color:#788079;font-size:8px;line-height:1.4}
      .qv2-benchmark-head{display:flex;gap:7px;flex-wrap:wrap;margin:5px 0 11px}.qv2-chip{padding:4px 7px;border-radius:5px;background:#edf4e9;color:#034c1f;font-size:8px;font-weight:700}.qv2-matrix-wrap{overflow:auto;border:1px solid #dce4dd;border-radius:8px}.qv2-matrix{width:100%;border-collapse:collapse;min-width:1050px;font-size:8px}.qv2-matrix th{background:#034c1f!important;color:#fff!important;padding:8px!important;text-align:center}.qv2-matrix th:first-child{text-align:left}.qv2-matrix td{padding:7px!important;text-align:center;border-bottom:1px solid #e8ece9!important}.qv2-matrix td:first-child{text-align:left;min-width:180px}.qv2-company strong{display:block;color:#034c1f;font-size:9px}.qv2-company small{display:block;color:#777;font-size:7px;margin-top:2px;line-height:1.3}.qv2-score{display:inline-grid;place-items:center;min-width:34px;height:25px;border-radius:5px;font-weight:800}.qv2-score.high{background:#dcebd4;color:#175d20}.qv2-score.mid{background:#f4f5d5;color:#676c00}.qv2-score.low{background:#fff1d4;color:#805600}.qv2-benchmark-highlights{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px;margin-top:9px}.qv2-benchmark-highlight{border:1px solid #dfe5e0;border-radius:7px;padding:8px;background:#fff;min-width:0}.qv2-benchmark-highlight strong{display:block;color:#034c1f;font-size:8px}.qv2-benchmark-highlight p{font-size:7px;color:#646464;line-height:1.4;margin:4px 0}.qv2-benchmark-highlight a{font-size:7px;color:#034c1f;font-weight:700;text-decoration:none}.qv2-benchmark-highlight a:hover{text-decoration:underline}
      @media(max-width:1050px){.qv2-benchmark-highlights{grid-template-columns:repeat(2,1fr)}.qv2-pmr-summary{grid-template-columns:repeat(2,1fr)}}@media(max-width:680px){.qv2-signal{grid-template-columns:30px 1fr}.qv2-signal .qv2-link{grid-column:2}.qv2-benchmark-highlights{grid-template-columns:1fr}.qv2-bar-row{grid-template-columns:90px 1fr 24px}}
    `;
    document.head.appendChild(style);
  }

  async function fetchJson(url) {
    const response = await fetch(`${url}&refresh=${Date.now()}`, { cache:'no-store' });
    if (!response.ok) throw new Error(`${url} returned ${response.status}`);
    return response.json();
  }

  async function loadData() {
    const results = await Promise.all(Object.entries(URLS).map(async ([key,url]) => {
      try { return [key, await fetchJson(url)]; } catch (_) { return [key, null]; }
    }));
    results.forEach(([key,value]) => { if (value) state[key] = value; });
    state.refreshedAt = Date.now();
  }

  function homeView() {
    return $('.view[data-view="home"],.view[data-view="executive"],.view[data-view="hub"],.view[data-view="dashboard"],.view[data-view="my-hub"]');
  }

  function findPanel(view, regex) {
    return $$('.panel,.flo-panel,.q-ui-card', view).find(node => regex.test((node.textContent || '').replace(/\s+/g,' ')));
  }

  function outstanding(project) {
    const action = String(project?.next_step || '').trim().toLowerCase();
    return Boolean(action) && !/no outstanding|completed final report|not applicable/.test(action);
  }

  function isOverdue(project) {
    if (!outstanding(project) || !project?.milestone_due) return false;
    const due = new Date(`${project.milestone_due}T23:59:59Z`);
    return !Number.isNaN(due.valueOf()) && due.valueOf() < Date.now();
  }

  function projectMetrics() {
    const projects = state.projects?.projects || [];
    return {
      projects,
      openActions: projects.filter(outstanding).length,
      pendingOutputs: projects.filter(item => clamp(item.final_progress) < 100).length,
      attention: projects.filter(item => isOverdue(item) || (item.risk && !/^(na|n\/a|not applicable|none)$/i.test(String(item.risk).trim()))).length,
      onTrack: projects.filter(item => item.status === 'On Track').length,
    };
  }

  function replaceSummaryMetric(view, captionRegex, value, caption) {
    const target = $$('span,small,p,label', view).find(node => captionRegex.test((node.textContent || '').trim()));
    if (!target) return;
    const parent = target.parentElement;
    const valueNode = parent?.querySelector('strong,b') || target.previousElementSibling;
    if (valueNode) valueNode.textContent = String(value);
    target.textContent = caption;
  }

  function updateExecutiveMetrics(view) {
    const metrics = projectMetrics();
    replaceSummaryMetric(view, /Potential search effort reduction/i, metrics.attention, 'Executive attention items');
    replaceSummaryMetric(view, /Target KBQ turnaround/i, metrics.pendingOutputs, 'Final outputs pending');
    const aiCard = $$('.flo-status-card', view).find(node => /AI services/i.test(node.textContent || ''));
    if (aiCard) aiCard.innerHTML = `<div class="flo-status-line"><i class="flo-dot"></i>Executive benchmark</div><strong>${state.benchmark?.companies?.length || 0} companies</strong><small>Public-source + PMR alignment</small>`;
  }

  function canonicalCompany(value = '') {
    const text = String(value).toLowerCase();
    if (text.includes('quest')) return 'Quest Diagnostics';
    if (text.includes('labcorp')) return 'Labcorp';
    if (text.includes('arup')) return 'ARUP Laboratories';
    if (text.includes('mayo')) return 'Mayo Clinic Laboratories';
    if (text.includes('sonic')) return 'Sonic Healthcare';
    return String(value || 'Market');
  }

  function latestSignals() {
    const official = (state.executive?.updates || []).map(item => ({...item, source:'Official public source'}));
    const news = (state.news?.items || []).slice(0,30).map(item => ({
      company: canonicalCompany(item.company),
      date: item.published_at || item.published_display || '',
      category: item.category || 'Market update',
      title: item.title,
      summary: item.description || '',
      executive_implication: implicationFor(item),
      url: item.url,
      source: item.source || 'Internet monitor',
    }));
    const combined = [...official, ...news].filter(item => item.title && item.url);
    const seen = new Set();
    return combined.filter(item => {
      const key = String(item.title).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
      if (seen.has(key)) return false;
      seen.add(key); return true;
    }).sort((a,b) => String(b.date).localeCompare(String(a.date)));
  }

  function implicationFor(item) {
    const text = `${item.company || ''} ${item.title || ''} ${item.category || ''}`.toLowerCase();
    if (/oncolog|genomic|genetic|mrd|cancer/.test(text)) return 'Review implications for advanced-diagnostics differentiation, specialty access and clinician workflow integration.';
    if (/partnership|collaboration|health system|hospital|epic|ehr/.test(text)) return 'Assess implications for health-system partnerships, interoperability and enterprise account strategy.';
    if (/consumer|at-home|ondemand|patient access/.test(text)) return 'Track consumer-access implications and opportunities to simplify the diagnostic journey.';
    if (/research|publication|stewardship|clinical evidence/.test(text)) return 'Consider how evidence, stewardship and expert-led differentiation can strengthen value propositions.';
    return 'Review for commercial, portfolio or operating-model implications relevant to current Quest workstreams.';
  }

  function signalIcon(category = '') {
    const text = category.toLowerCase();
    if (/growth|capital|financial/.test(text)) return '↗';
    if (/specialty|genetic|oncolog/.test(text)) return '✦';
    if (/research|evidence/.test(text)) return '✓';
    return '!';
  }

  function renderSignalMonitor(view) {
    const panel = findPanel(view, /SIGNAL MONITOR|What changed since the last approved refresh/i);
    if (!panel) return;
    const signals = latestSignals().slice(0,5);
    panel.innerHTML = `<div class="qv2-head"><div><span class="qv2-kicker">SIGNAL MONITOR</span><h3>What changed in the latest public-source refresh?</h3><div class="qv2-sub">Verified company sources + current internet news monitor</div></div><span class="qv2-sub">${esc(state.executive?.generated_at?.slice(0,10) || '')}</span></div><div class="qv2-grid">${signals.map(item => `<article class="qv2-signal"><div class="qv2-signal-icon">${signalIcon(item.category)}</div><div><strong>${esc(item.title)}</strong><p>${esc(item.executive_implication || item.summary)}</p><div class="qv2-meta"><span class="qv2-tag">${esc(item.company)}</span><span>${esc(item.category || 'Update')}</span><span>${esc(String(item.date || '').slice(0,10))}</span><span>${esc(item.source || '')}</span></div></div><a class="qv2-link" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">Open source ↗</a></article>`).join('')}</div>`;
  }

  function shortProject(project) {
    const name = String(project?.project_name || 'Workstream');
    if (/Digital Customer Journey/i.test(name)) return project?.research_type?.includes('Survey') ? 'Digital Journey Survey' : 'Digital Journey IDIs';
    if (/Extended Study/i.test(name)) return 'Data Ecosystem Extended';
    if (/Data Ecosystem Needs/i.test(name)) return 'Data Ecosystem Needs';
    if (/Lab Stewardship/i.test(name)) return 'Lab Stewardship & Analytics';
    if (/Consumer Testing/i.test(name)) return 'Consumer Testing Profiles';
    if (/Health System Experience/i.test(name)) return 'Health System Experience';
    return name;
  }

  function renderCombinedPmr(view) {
    const executivePanel = $('#qExecutiveActions', view) || findPanel(view, /EXECUTIVE ATTENTION|Priority workstream actions/i);
    const pmrPanel = findPanel(view, /PMR PORTFOLIO|Active project health/i);
    if (!executivePanel) return;
    if (pmrPanel && pmrPanel !== executivePanel) pmrPanel.style.display = 'none';
    const metrics = projectMetrics();
    const projects = [...metrics.projects].sort((a,b) => Number(isOverdue(b)) - Number(isOverdue(a)) || clamp(a.final_progress) - clamp(b.final_progress));
    executivePanel.innerHTML = `<div class="qv2-head"><div><span class="qv2-kicker">PMR DELIVERY & EXECUTIVE ACTIONS</span><h3>Project progress and next actions</h3></div><span class="qv2-sub">Tracker ${esc(state.projects?.reporting_date || '')}</span></div><div class="qv2-pmr-summary"><div class="qv2-mini"><span>Workstreams</span><strong>${metrics.projects.length}</strong></div><div class="qv2-mini"><span>Open actions</span><strong>${metrics.openActions}</strong></div><div class="qv2-mini"><span>Final outputs pending</span><strong>${metrics.pendingOutputs}</strong></div><div class="qv2-mini"><span>On track</span><strong>${metrics.onTrack}</strong></div></div><div>${projects.map(project => { const attention = isOverdue(project) || (project.risk && !/^(na|n\/a|not applicable|none)$/i.test(String(project.risk).trim())); return `<article class="qv2-project"><div class="qv2-project-top"><strong>${esc(shortProject(project))}</strong><span class="qv2-attention ${attention ? '' : 'qv2-ontrack'}">${attention ? 'Action' : esc(project.status || 'On track')}</span></div><div class="qv2-action">${esc(project.next_step || project.next_milestone || 'No outstanding action recorded.')}</div><div class="qv2-project-meta">${clamp(project.final_progress)}% final output · ${project.milestone_due ? `Due ${esc(project.milestone_due)} · ` : ''}Owner: ${esc(project.next_step_owner || project.evs_lead || 'Evalueserve')}</div><div class="qv2-progress"><i style="width:${clamp(project.final_progress)}%"></i></div></article>`; }).join('')}</div><div class="qv2-footer"><span>Progress and actions are generated from the shared PMR project tracker.</span><button class="qv2-button" type="button" data-qv2-tracker>Open Project Tracker →</button></div>`;
    $('[data-qv2-tracker]', executivePanel)?.addEventListener('click', () => navigate(/Project Tracker/i));
  }

  function renderVoiceInsights(view) {
    const panel = findPanel(view, /VOICE OF EXPERTS|Top unmet needs/i);
    if (!panel) return;
    panel.querySelector('.qv2-voice-insights')?.remove();
    const block = document.createElement('div');
    block.className = 'qv2-voice-insights';
    block.innerHTML = `<h4>Executive attention</h4><ul><li><strong>Workflow integration:</strong> Current Digital Journey and Data Ecosystem workstreams repeatedly center on interoperability, onboarding friction and integrating diagnostics into clinical workflows.</li><li><strong>Stewardship and decision support:</strong> The Lab Stewardship workstream points to continued demand for evidence-backed guidance that turns laboratory data into actionable utilization decisions.</li><li><strong>Experience consistency:</strong> Health-system and consumer-oriented projects indicate that data consistency, simpler access and flexible service models remain cross-workstream priorities.</li></ul>`;
    panel.appendChild(block);
  }

  function newsActivity() {
    const companies = (state.benchmark?.companies || []).map(item => item.name);
    const counts = Object.fromEntries(companies.map(name => [name,0]));
    (state.news?.items || []).forEach(item => {
      const name = canonicalCompany(item.company);
      if (Object.prototype.hasOwnProperty.call(counts,name)) counts[name] += 1;
    });
    (state.executive?.updates || []).forEach(item => {
      const name = canonicalCompany(item.company);
      if (Object.prototype.hasOwnProperty.call(counts,name)) counts[name] += 1;
    });
    return counts;
  }

  function renderMarketActivity(view) {
    const panel = findPanel(view, /NEWS\s*&\s*SOCIAL|Market pulse/i);
    if (!panel) return;
    const counts = newsActivity();
    const rows = Object.entries(counts).sort((a,b) => b[1]-a[1]);
    const max = Math.max(1,...rows.map(([,count]) => count));
    const social = [...(state.social?.companies || [])].sort((a,b) => Number(b.momentum || 0)-Number(a.momentum || 0)).slice(0,3);
    panel.innerHTML = `<div class="qv2-head"><div><span class="qv2-kicker">PUBLIC & SOCIAL ACTIVITY</span><h3>Company activity pulse</h3></div><span class="qv2-sub">Current internet feed</span></div><div class="qv2-activity-chart">${rows.map(([name,count]) => `<div class="qv2-bar-row"><span>${esc(name)}</span><span class="qv2-track"><i style="width:${Math.max(4, Math.round(count/max*100))}%"></i></span><b>${count}</b></div>`).join('')}</div><div class="qv2-social-list">${social.map(company => { const post = company.posts_summary?.[0]; return `<div class="qv2-social-item"><strong>${esc(company.name)} · ${esc(company.top_theme || 'Social theme')}</strong><br>${esc(post?.summary || 'No recent social summary available.')}</div>`; }).join('')}</div><div class="qv2-note">Activity bars count current public-news records plus the latest verified public-source highlight. Social highlights come from the connected social-intelligence dataset; its current status is ${esc(state.social?.status || 'unknown')}.</div>`;
  }

  const THEMES = ['health system','digital','workflow','interoperability','analytics','ai','partnership','consumer','specialty','testing','stewardship','oncology','patient','data','access','innovation','genomic','genetic','automation'];

  function companyNews(name) {
    return (state.news?.items || []).filter(item => canonicalCompany(item.company) === name).slice(0,20);
  }

  function companySocial(name) {
    return (state.social?.companies || []).find(item => canonicalCompany(item.name) === name);
  }

  function companyHighlight(name) {
    return (state.executive?.updates || []).find(item => canonicalCompany(item.company) === name);
  }

  function pmrAlignment(name, benchmarkCompany) {
    const projectText = (state.projects?.projects || []).map(item => `${item.project_name} ${item.sow_focus} ${item.next_step}`).join(' ').toLowerCase();
    const social = companySocial(name);
    const highlight = companyHighlight(name);
    const companyText = [benchmarkCompany?.facts?.join(' '), social?.top_theme, social?.posts_summary?.map(item => `${item.theme} ${item.summary}`).join(' '), highlight?.title, highlight?.summary, companyNews(name).map(item => `${item.title} ${item.description}`).join(' ')].join(' ').toLowerCase();
    const projectThemes = THEMES.filter(theme => projectText.includes(theme));
    const overlap = projectThemes.filter(theme => companyText.includes(theme));
    return clamp(35 + overlap.length * 7);
  }

  function socialScore(name) {
    const companies = state.social?.companies || [];
    const current = companySocial(name);
    if (!current || !companies.length) return 0;
    const maxPosts = Math.max(1,...companies.map(item => Number(item.posts || 0)));
    const maxEngagement = Math.max(1,...companies.map(item => Number(item.engagement_rate || 0)));
    const maxMomentum = Math.max(1,...companies.map(item => Number(item.momentum || 0)));
    return clamp((Number(current.posts || 0)/maxPosts)*45 + (Number(current.engagement_rate || 0)/maxEngagement)*35 + (Number(current.momentum || 0)/maxMomentum)*20);
  }

  function activityScore(name, counts) {
    const max = Math.max(1,...Object.values(counts));
    return clamp((counts[name] || 0) / max * 100);
  }

  function scoreClass(score) { return score >= 80 ? 'high' : score >= 60 ? 'mid' : 'low'; }
  function scoreCell(score) { const value = Math.round(clamp(score)); return `<span class="qv2-score ${scoreClass(value)}">${value}</span>`; }

  function renderBenchmark(view) {
    const panel = $('#qExecutiveDecisionMap', view) || findPanel(view, /EXECUTIVE DECISION MAP|Live workstream readiness and attention/i);
    if (!panel || !(state.benchmark?.companies || []).length) return;
    const counts = newsActivity();
    const rows = state.benchmark.companies.map(company => {
      const name = canonicalCompany(company.name);
      const scores = company.benchmark || {};
      return { company, name, scale:scores.enterprise_scale, reach:scores.clinical_reach, specialty:scores.specialty_depth, digital:scores.digital_access, global:scores.global_reach, activity:activityScore(name,counts), social:socialScore(name), pmr:pmrAlignment(name,company) };
    });
    panel.innerHTML = `<div class="qv2-head"><div><span class="qv2-kicker">EXECUTIVE COMPETITIVE BENCHMARK</span><h3>Company benchmark across public-source strength and PMR relevance</h3></div><button class="secondary-button" type="button" data-qv2-refresh>↻ Refresh data</button></div><div class="qv2-benchmark-head"><span class="qv2-chip">${rows.length} companies</span><span class="qv2-chip">8 parameters</span><span class="qv2-chip">Public facts + internet activity + social dataset + PMR themes</span></div><div class="qv2-matrix-wrap"><table class="qv2-matrix"><thead><tr><th>Company</th><th>Enterprise scale</th><th>Clinical reach</th><th>Specialty depth</th><th>Digital access</th><th>Global reach</th><th>Recent public activity</th><th>Social activity</th><th>PMR alignment</th></tr></thead><tbody>${rows.map(row => `<tr><td class="qv2-company"><strong>${esc(row.name)}</strong><small>${esc(row.company.scale_headline || '')}</small></td><td>${scoreCell(row.scale)}</td><td>${scoreCell(row.reach)}</td><td>${scoreCell(row.specialty)}</td><td>${scoreCell(row.digital)}</td><td>${scoreCell(row.global)}</td><td>${scoreCell(row.activity)}</td><td>${scoreCell(row.social)}</td><td>${scoreCell(row.pmr)}</td></tr>`).join('')}</tbody></table></div><div class="qv2-benchmark-highlights">${rows.map(row => { const highlight = companyHighlight(row.name); return `<article class="qv2-benchmark-highlight"><strong>${esc(row.name)}</strong><p>${esc(highlight?.executive_implication || highlight?.summary || 'Public-source baseline available.')}</p><a href="${esc(highlight?.url || row.company.source || '#')}" target="_blank" rel="noopener noreferrer">Source ↗</a></article>`; }).join('')}</div><div class="qv2-note">Scale, reach, specialty, digital and global values are directional normalized benchmark indices attached to verified public-source company facts. Recent public activity is calculated from the internet news feed; social activity is normalized from the connected social dataset; PMR alignment is a transparent keyword overlap with current Quest workstream themes.</div>`;
    $('[data-qv2-refresh]', panel)?.addEventListener('click', async () => { await loadData(); scheduleApply(); });
  }

  function navigate(regex) {
    const button = $$('.nav-item').find(node => regex.test(node.textContent || ''));
    if (button) button.click();
  }

  function apply() {
    const view = homeView();
    if (!view) return;
    updateExecutiveMetrics(view);
    renderSignalMonitor(view);
    renderCombinedPmr(view);
    renderVoiceInsights(view);
    renderMarketActivity(view);
    renderBenchmark(view);
  }

  function scheduleApply() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => { scheduled = false; apply(); }, 100);
  }

  async function boot() {
    injectStyles();
    await loadData();
    apply();
    const observer = new MutationObserver(scheduleApply);
    observer.observe(document.body, {childList:true,subtree:true});
    window.addEventListener('quest:layout-refresh', scheduleApply);
    window.addEventListener('quest:module-loaded', scheduleApply);
    document.addEventListener('click', event => { if (event.target.closest?.('.nav-item,#floHomeRefresh')) setTimeout(scheduleApply, 900); }, true);
    setInterval(async () => { await loadData(); scheduleApply(); }, 5 * 60 * 1000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();