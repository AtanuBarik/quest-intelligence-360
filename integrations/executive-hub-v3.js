(() => {
  'use strict';

  const RELEASE = '20260809f';
  const URLS = {
    projects: `data/project-tracker.json?v=${RELEASE}`,
    news: `data/laboratory-news.json?v=${RELEASE}`,
    social: `data/social-intelligence.json?v=${RELEASE}`,
    benchmark: `data/public-demo-intelligence.json?v=${RELEASE}`,
  };
  const state = { projects:null, news:null, social:null, benchmark:null };
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const esc = (v='') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clamp = v => Math.max(0, Math.min(100, Number(v) || 0));
  let applying = false;

  function injectStyles(){
    if ($('#qExecutiveV3Styles')) return;
    const style = document.createElement('style');
    style.id = 'qExecutiveV3Styles';
    style.textContent = `
      .qv3-insights-row{display:grid!important;grid-template-columns:minmax(0,1.18fr) minmax(0,.92fr)!important;gap:16px!important;align-items:stretch!important;width:100%!important}
      .qv3-insights-row>.panel,.qv3-insights-row>.flo-panel,.qv3-insights-row>.q-ui-card{min-width:0!important;width:auto!important;max-width:none!important}
      .qv3-voice,.qv3-social{height:100%!important;min-height:0!important}
      .qv3-voice .qv2-voice-insights{margin-top:14px;padding-top:12px}.qv3-voice .qv2-voice-insights h4{font-size:12px!important;margin-bottom:9px!important}.qv3-voice .qv2-voice-insights ul{list-style:none!important;padding:0!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:9px!important;font-size:10px!important;line-height:1.5!important}.qv3-voice .qv2-voice-insights li{margin:0!important;padding:10px!important;border:1px solid #dce4dd;border-top:3px solid #35792a;border-radius:8px;background:#fbfdfb}.qv3-voice .qv2-voice-insights li:nth-child(2){border-top-color:#c6d52f}.qv3-voice .qv2-voice-insights li:nth-child(3){border-top-color:#00587c}
      .qv3-social .qv2-head{margin-bottom:14px}.qv3-social .qv2-bar-row{grid-template-columns:150px minmax(110px,1fr) 32px!important;font-size:10px!important;gap:9px!important}.qv3-social .qv2-track{height:12px!important}.qv3-social .qv2-social-list{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:9px!important}.qv3-social .qv2-social-item{font-size:10px!important;line-height:1.48!important;padding:10px!important}.qv3-social .qv2-note,.qv3-social .qv2-sub{font-size:10px!important;line-height:1.45!important}.qv3-social .qv2-head h3{font-size:16px!important}
      .qv3-pmr .qv2-mini span,.qv3-pmr .qv2-project-meta,.qv3-pmr .qv2-footer,.qv3-pmr .qv2-sub{font-size:10px!important}.qv3-pmr .qv2-project strong{font-size:11px!important}.qv3-pmr .qv2-action{font-size:10px!important;line-height:1.45!important}.qv3-combined-note{display:inline-block;margin-left:6px;padding:2px 6px;border-radius:4px;background:#edf4e9;color:#034c1f;font-size:9px;font-weight:700}
      .qv3-bubble-wrap{overflow:hidden;border:1px solid #dce4dd;border-radius:10px;background:linear-gradient(180deg,#fff,#fbfdfb)}.qv3-bubble-svg{display:block;width:100%;height:auto;min-height:470px}.qv3-bubble-grid{stroke:#dfe5e0;stroke-width:1}.qv3-bubble-axis{fill:#4f5952;font-size:12px}.qv3-bubble-axis-title{fill:#034c1f;font-size:13px;font-weight:700}.qv3-bubble-label{fill:#202834;font-size:12px;font-weight:700}.qv3-bubble-sub{fill:#667069;font-size:10px}.qv3-bubble-value{fill:#fff;font-size:11px;font-weight:800;text-anchor:middle}.qv3-bubble-legend{display:flex;gap:18px;flex-wrap:wrap;align-items:center;padding:11px 14px;border-top:1px solid #e2e7e3;font-size:10px;color:#58635c}.qv3-bubble-legend i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:5px}.qv3-bubble-cards{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-top:10px}.qv3-bubble-card{padding:9px;border:1px solid #dfe5e0;border-radius:8px;background:#fff}.qv3-bubble-card strong{display:block;color:#034c1f;font-size:10px}.qv3-bubble-card span{display:block;margin-top:4px;color:#626c65;font-size:10px;line-height:1.4}.qv3-benchmark-note{margin-top:8px;color:#707a72;font-size:10px;line-height:1.5}
      .qv3-v2-sentinel{display:none!important}
      @media(max-width:1100px){.qv3-insights-row{grid-template-columns:1fr!important}.qv3-voice .qv2-voice-insights ul,.qv3-social .qv2-social-list{grid-template-columns:1fr!important}.qv3-bubble-cards{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:680px){.qv3-social .qv2-bar-row{grid-template-columns:100px minmax(80px,1fr) 28px!important}.qv3-bubble-cards{grid-template-columns:1fr}.qv3-bubble-svg{min-height:380px}}
    `;
    document.head.appendChild(style);
  }

  async function loadData(){
    const entries = await Promise.all(Object.entries(URLS).map(async ([k,u]) => {
      try { const r = await fetch(`${u}&refresh=${Date.now()}`, {cache:'no-store'}); return [k, r.ok ? await r.json() : null]; }
      catch (_) { return [k, null]; }
    }));
    entries.forEach(([k,v]) => { if (v) state[k] = v; });
  }

  const homeView = () => $('.view[data-view="home"],.view[data-view="executive"],.view[data-view="hub"],.view[data-view="dashboard"],.view[data-view="my-hub"]');
  const findPanel = (view, re) => $$('.panel,.flo-panel,.q-ui-card', view).find(n => re.test((n.textContent || '').replace(/\s+/g,' ')));
  const outstanding = p => { const a = String(p?.next_step || '').trim().toLowerCase(); return Boolean(a) && !/no outstanding|completed final report|not applicable/.test(a); };
  const overdue = p => { if (!outstanding(p) || !p?.milestone_due) return false; const d = new Date(`${p.milestone_due}T23:59:59Z`); return !Number.isNaN(d.valueOf()) && d < Date.now(); };

  function groupKey(project){
    const name = String(project?.project_name || 'Workstream');
    if (/Data Ecosystem/i.test(name)) return 'Data Ecosystem';
    if (/Digital Customer Journey/i.test(name)) return 'Digital Customer Journey';
    return name;
  }

  function groupProjects(){
    const groups = new Map();
    for (const project of state.projects?.projects || []) {
      const key = groupKey(project);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(project);
    }
    return [...groups.entries()].map(([name, members]) => {
      const openMembers = members.filter(outstanding);
      const actions = [...new Set(openMembers.map(p => p.next_step).filter(Boolean))];
      const dues = openMembers.map(p => p.milestone_due).filter(Boolean).sort();
      const owners = [...new Set(openMembers.map(p => p.next_step_owner || p.evs_lead).filter(Boolean))];
      const progress = members.length ? Math.round(members.reduce((sum,p) => sum + clamp(p.final_progress),0) / members.length) : 0;
      const attention = members.some(p => overdue(p) || (p.risk && !/^(na|n\/a|not applicable|none)$/i.test(String(p.risk).trim())));
      const completed = members.every(p => p.status === 'Completed' || !outstanding(p));
      return { name, members, progress, attention, completed, actions, due:dues[0] || '', owners };
    });
  }

  function updateGroupedTopKpi(view, groups){
    const open = groups.filter(g => g.actions.length).length;
    const pending = groups.filter(g => g.progress < 100).length;
    const card = $('#qExecutiveFollowupKpi', view) || $$('.kpi-card', view).find(n => /Open workstream follow-ups/i.test(n.textContent || ''));
    if (card) card.innerHTML = `<span>Open workstream follow-ups</span><strong>${open}</strong><small>${pending} grouped final output${pending === 1 ? '' : 's'} still in progress</small>`;
  }

  function renderGroupedPmr(view){
    const panel = $('#qExecutiveActions', view) || findPanel(view, /PMR DELIVERY & EXECUTIVE ACTIONS|Project progress and next actions/i);
    if (!panel || !(state.projects?.projects || []).length) return;
    const groups = groupProjects().sort((a,b) => Number(b.attention) - Number(a.attention) || a.progress - b.progress);
    const open = groups.filter(g => g.actions.length).length;
    const pending = groups.filter(g => g.progress < 100).length;
    const healthy = groups.filter(g => !g.attention).length;
    panel.classList.add('qv3-pmr');
    panel.innerHTML = `<div class="qv2-head"><div><span class="qv2-kicker">PMR DELIVERY & EXECUTIVE ACTIONS</span><h3>Project progress and next actions</h3></div><span class="qv2-sub">Tracker ${esc(state.projects?.reporting_date || '')}</span></div><div class="qv2-pmr-summary"><div class="qv2-mini"><span>Grouped workstreams</span><strong>${groups.length}</strong></div><div class="qv2-mini"><span>Open actions</span><strong>${open}</strong></div><div class="qv2-mini"><span>Final outputs pending</span><strong>${pending}</strong></div><div class="qv2-mini"><span>Without escalation</span><strong>${healthy}</strong></div></div>${groups.map(g => `<article class="qv2-project"><div class="qv2-project-top"><strong>${esc(g.name)}${g.members.length > 1 ? `<span class="qv3-combined-note">${g.members.length} projects combined</span>` : ''}</strong><span class="qv2-attention ${g.attention ? '' : 'qv2-ontrack'}">${g.attention ? 'Action' : (g.completed ? 'Complete' : 'On track')}</span></div><div class="qv2-action">${esc(g.actions.length ? g.actions.join(' · ') : 'No outstanding action recorded.')}</div><div class="qv2-project-meta">${g.progress}% average final output${g.due ? ` · Next due ${esc(g.due)}` : ''}${g.owners.length ? ` · Owner: ${esc(g.owners.join(', '))}` : ''}</div><div class="qv2-progress"><i style="width:${g.progress}%"></i></div></article>`).join('')}<div class="qv2-footer"><span>Data Ecosystem and Digital Customer Journey entries are consolidated for executive review; underlying PMR records remain unchanged.</span><button class="qv2-button" type="button" data-qv3-tracker>Open Project Tracker →</button></div>`;
    panel.insertAdjacentHTML('beforeend','<span class="qv2-matrix qv3-v2-sentinel" aria-hidden="true"></span>');
    $('[data-qv3-tracker]', panel)?.addEventListener('click', () => $$('.nav-item').find(n => /Project Tracker/i.test(n.textContent || ''))?.click());
    updateGroupedTopKpi(view, groups);
  }

  function improveInsightsLayout(view){
    const voice = findPanel(view, /VOICE OF EXPERTS|Top unmet needs/i);
    const social = findPanel(view, /PUBLIC & SOCIAL ACTIVITY|Company activity pulse/i);
    if (!voice || !social) return;
    voice.classList.add('qv3-voice'); social.classList.add('qv3-social');
    if (voice.parentElement === social.parentElement) voice.parentElement.classList.add('qv3-insights-row');
  }

  function canonical(v=''){
    const t = String(v).toLowerCase();
    if (t.includes('quest')) return 'Quest Diagnostics';
    if (t.includes('labcorp')) return 'Labcorp';
    if (t.includes('arup')) return 'ARUP Laboratories';
    if (t.includes('mayo')) return 'Mayo Clinic Laboratories';
    if (t.includes('sonic')) return 'Sonic Healthcare';
    return String(v || 'Market');
  }

  function activityCounts(){
    const names = (state.benchmark?.companies || []).map(x => canonical(x.name));
    const counts = Object.fromEntries(names.map(n => [n,0]));
    (state.news?.items || []).forEach(x => { const n = canonical(x.company); if (n in counts) counts[n] += 1; });
    return counts;
  }

  function companySocial(name){ return (state.social?.companies || []).find(x => canonical(x.name) === name); }
  function socialScore(name){
    const all = state.social?.companies || [], x = companySocial(name);
    if (!x || !all.length) return 0;
    const maxPosts = Math.max(1,...all.map(i => Number(i.posts || 0)));
    const maxEng = Math.max(1,...all.map(i => Number(i.engagement_rate || 0)));
    const maxMom = Math.max(1,...all.map(i => Number(i.momentum || 0)));
    return clamp(Number(x.posts || 0)/maxPosts*45 + Number(x.engagement_rate || 0)/maxEng*35 + Number(x.momentum || 0)/maxMom*20);
  }

  const THEMES = ['health system','digital','workflow','interoperability','analytics','ai','partnership','consumer','specialty','testing','stewardship','oncology','patient','data','access','innovation','genomic','genetic','automation'];
  function pmrAlignment(name, company){
    const projectText = (state.projects?.projects || []).map(x => `${x.project_name} ${x.sow_focus} ${x.next_step}`).join(' ').toLowerCase();
    const social = companySocial(name);
    const companyNews = (state.news?.items || []).filter(x => canonical(x.company) === name).slice(0,20);
    const companyText = [company?.facts?.join(' '), social?.top_theme, social?.posts_summary?.map(x => `${x.theme} ${x.summary}`).join(' '), companyNews.map(x => `${x.title} ${x.description}`).join(' ')].join(' ').toLowerCase();
    const active = THEMES.filter(t => projectText.includes(t));
    return clamp(35 + active.filter(t => companyText.includes(t)).length * 7);
  }

  function bubbleRows(){
    const counts = activityCounts();
    const maxActivity = Math.max(1,...Object.values(counts));
    return (state.benchmark?.companies || []).map(company => {
      const name = canonical(company.name), b = company.benchmark || {};
      const strength = Math.round(([b.enterprise_scale,b.clinical_reach,b.specialty_depth,b.digital_access,b.global_reach].reduce((s,v) => s + Number(v || 0),0))/5);
      return { name, company, strength, pmr:Math.round(pmrAlignment(name, company)), activity:Math.round((counts[name] || 0)/maxActivity*100), social:Math.round(socialScore(name)) };
    });
  }

  function bubbleSvg(rows){
    const W=1180,H=500,L=86,R=60,T=45,B=70,PW=W-L-R,PH=H-T-B;
    const x=v=>L+clamp(v)/100*PW, y=v=>T+(100-clamp(v))/100*PH;
    const ticks=[0,20,40,60,80,100];
    const grid=ticks.map(t=>`<line class="qv3-bubble-grid" x1="${x(t)}" y1="${T}" x2="${x(t)}" y2="${T+PH}"/><text class="qv3-bubble-axis" x="${x(t)}" y="${T+PH+24}" text-anchor="middle">${t}</text><line class="qv3-bubble-grid" x1="${L}" y1="${y(t)}" x2="${L+PW}" y2="${y(t)}"/><text class="qv3-bubble-axis" x="${L-16}" y="${y(t)+4}" text-anchor="end">${t}</text>`).join('');
    const palette=['#034c1f','#35792a','#c6d52f','#00587c','#c78800'];
    const labelOffsets=[[0,-44],[0,55],[-70,-38],[65,45],[-55,52]];
    const bubbles=rows.map((r,i)=>{
      const cx=x(r.strength),cy=y(r.pmr),radius=22+Math.sqrt(Math.max(1,r.activity))*2.0;
      const [dx,dy]=labelOffsets[i%labelOffsets.length], lx=Math.max(105,Math.min(W-105,cx+dx)), ly=Math.max(28,Math.min(H-32,cy+dy));
      const short=r.name.replace(' Laboratories','').replace(' Healthcare','');
      return `<g><line x1="${cx}" y1="${cy}" x2="${lx}" y2="${ly}" stroke="#9cab9f" stroke-width="1"/><circle cx="${cx}" cy="${cy}" r="${radius}" fill="${palette[i%palette.length]}" fill-opacity=".88" stroke="#034c1f" stroke-width="1.6"><title>${esc(r.name)} — public strength ${r.strength}, PMR relevance ${r.pmr}, public activity ${r.activity}, social activity ${r.social}</title></circle><text class="qv3-bubble-value" x="${cx}" y="${cy+4}">${r.strength}</text><text class="qv3-bubble-label" x="${lx}" y="${ly}" text-anchor="middle">${esc(short)}</text><text class="qv3-bubble-sub" x="${lx}" y="${ly+15}" text-anchor="middle">PMR ${r.pmr} · activity ${r.activity}</text></g>`;
    }).join('');
    return `<svg class="qv3-bubble-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Competitive benchmark bubble chart"><rect x="${L}" y="${T}" width="${PW}" height="${PH}" fill="#fff" stroke="#cfd8d1"/>${grid}${bubbles}<text class="qv3-bubble-axis-title" x="${L+PW/2}" y="${H-15}" text-anchor="middle">Composite public-source competitive strength (0–100)</text><text class="qv3-bubble-axis-title" transform="translate(22 ${T+PH/2}) rotate(-90)" text-anchor="middle">PMR thematic relevance (0–100)</text></svg>`;
  }

  function renderBubbleBenchmark(view){
    const panel = $('#qExecutiveDecisionMap', view) || findPanel(view, /EXECUTIVE COMPETITIVE BENCHMARK|Company benchmark across public-source strength and PMR relevance/i);
    const rows = bubbleRows();
    if (!panel || !rows.length) return;
    panel.innerHTML = `<div class="qv2-head"><div><span class="qv2-kicker">EXECUTIVE COMPETITIVE BENCHMARK</span><h3>Company benchmark across public-source strength and PMR relevance</h3></div><button class="secondary-button" type="button" data-qv3-refresh>↻ Refresh data</button></div><div class="qv2-benchmark-head"><span class="qv2-chip">${rows.length} companies</span><span class="qv2-chip">Bubble size = recent public activity</span><span class="qv2-chip">Bubble color distinguishes companies</span></div><div class="qv3-bubble-wrap">${bubbleSvg(rows)}<div class="qv3-bubble-legend"><span><i style="background:#034c1f"></i>Quest</span><span><i style="background:#35792a"></i>Labcorp</span><span><i style="background:#c6d52f"></i>ARUP</span><span><i style="background:#00587c"></i>Mayo</span><span><i style="background:#c78800"></i>Sonic</span></div></div><div class="qv3-bubble-cards">${rows.map(r=>`<div class="qv3-bubble-card"><strong>${esc(r.name)}</strong><span>Strength ${r.strength} · PMR relevance ${r.pmr}</span><span>Public activity ${r.activity} · Social activity ${r.social}</span></div>`).join('')}</div><div class="qv3-benchmark-note">Composite public-source strength is the average of the existing enterprise scale, clinical reach, specialty depth, digital access and global reach indices. PMR relevance is calculated from overlap with current Quest workstream themes. Bubble size reflects relative current public-news activity; social activity is shown in the summary cards below.</div><span class="qv2-matrix qv3-v2-sentinel" aria-hidden="true"></span>`;
    $('[data-qv3-refresh]', panel)?.addEventListener('click', async () => { await loadData(); apply(); });
  }

  function apply(){
    if (applying) return;
    applying = true;
    try {
      const view = homeView();
      if (!view) return;
      renderGroupedPmr(view);
      improveInsightsLayout(view);
      renderBubbleBenchmark(view);
    } finally { applying = false; }
  }

  async function boot(){
    injectStyles();
    await loadData();
    setTimeout(apply, 120);
    window.addEventListener('quest:layout-refresh', () => setTimeout(apply, 260));
    window.addEventListener('quest:module-loaded', () => setTimeout(apply, 260));
    document.addEventListener('click', e => { if (e.target.closest?.('.nav-item,#floHomeRefresh')) setTimeout(apply, 1000); }, true);
    window.setInterval(apply, 30000);
    window.setInterval(async () => { await loadData(); apply(); }, 5 * 60 * 1000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
})();
