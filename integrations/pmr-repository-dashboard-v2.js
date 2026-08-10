(() => {
  'use strict';

  const RELEASE = '20260810k';
  const DATA_URL = `data/pmr-repository-dashboard.json?v=${RELEASE}`;
  const TRACKER_URL = `data/project-tracker.json?v=${RELEASE}`;
  const STATE = { search:'', project:'All', objective:'All', theme:'All', research:'All', status:'All', artifact:'All' };
  let DATA = null;
  let TRACKER = null;
  let mounting = false;

  const esc = (value='') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const unique = values => [...new Set(values.filter(Boolean))].sort((a,b) => a.localeCompare(b));
  const fmt = value => Number(value || 0).toLocaleString('en-US');

  function injectStyles() {
    let style = document.getElementById('pmrRepositoryDashboardV2Styles');
    if (!style) {
      style = document.createElement('style');
      style.id = 'pmrRepositoryDashboardV2Styles';
      document.head.appendChild(style);
    }
    style.textContent = `
      .pmr2{--dark:#034c1f;--green:#35792a;--lime:#c6d52f;--blue:#00587c;--gold:#c78800;--purple:#80276c;--muted:#607168;--line:#dce6de;color:#29362e}
      .pmr2 *{box-sizing:border-box}.pmr2 .page-heading p{font-size:14px!important;line-height:1.5!important;max-width:980px}.pmr2 a{color:var(--blue)}
      .pmr2-badges{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.pmr2-badge{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);border-radius:999px;background:#fff;padding:6px 9px;font-size:12px;color:var(--muted)}.pmr2-badge b{color:var(--dark)}
      .pmr2-filterbar{display:grid;grid-template-columns:minmax(220px,1.4fr) repeat(6,minmax(135px,1fr)) auto;gap:9px;align-items:end;padding:14px;margin:14px 0 12px;border:1px solid var(--line);border-radius:14px;background:linear-gradient(180deg,#fff,#f8faf7);box-shadow:0 5px 18px rgba(3,76,31,.04)}
      .pmr2-filter label{display:block;font-size:12px;font-weight:800;color:var(--dark);margin:0 0 5px}.pmr2-filter input,.pmr2-filter select{width:100%;height:42px;border:1px solid #ccd8cd;border-radius:9px;background:#fff;padding:0 10px;font-size:13px;color:#26342b}.pmr2-reset{height:42px;border:1px solid #aec3b0;border-radius:9px;background:#fff;color:var(--dark);padding:0 14px;font-size:13px;font-weight:800;cursor:pointer}.pmr2-reset:hover{background:#edf5e9}
      .pmr2-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-bottom:12px}.pmr2-kpi{min-height:88px;border:1px solid var(--line);border-radius:13px;background:#fff;padding:13px;display:grid;grid-template-columns:40px 1fr;gap:10px;align-items:center;box-shadow:0 5px 18px rgba(3,76,31,.035)}.pmr2-kpi-icon{width:40px;height:40px;border-radius:12px;background:#edf5e9;color:var(--dark);display:grid;place-items:center;font-size:19px}.pmr2-kpi strong{display:block;font-size:22px;line-height:1;color:var(--dark)}.pmr2-kpi span{display:block;font-size:12px;line-height:1.35;color:var(--muted);margin-top:5px}
      .pmr2-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:12px}.pmr2-7{grid-column:span 7}.pmr2-5{grid-column:span 5}.pmr2-8{grid-column:span 8}.pmr2-4{grid-column:span 4}.pmr2-12{grid-column:span 12}
      .pmr2-panel{background:#fff;border:1px solid var(--line);border-radius:14px;padding:15px;min-width:0;box-shadow:0 5px 18px rgba(3,76,31,.035)}.pmr2-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px}.pmr2-kicker{font:800 10px Arial;letter-spacing:1.15px;color:var(--green)}.pmr2-head h3{font-size:18px!important;line-height:1.3!important;color:var(--dark)!important;margin:3px 0 4px!important}.pmr2-head p{font-size:12px!important;line-height:1.45!important;color:var(--muted)!important;margin:0!important}.pmr2-chip{display:inline-flex;padding:5px 8px;border-radius:999px;background:#eef5e9;color:var(--green);font-size:11px;font-weight:800}.pmr2-chip.demo{background:#fff3da;color:#8a5b00}
      .pmr2-bars{display:grid;gap:11px}.pmr2-bar{display:grid;grid-template-columns:minmax(210px,270px) 1fr 42px;gap:10px;align-items:center}.pmr2-bar-label{display:flex;align-items:center;gap:8px;min-width:0}.pmr2-mark{width:32px;height:32px;border-radius:9px;background:#edf5e9;color:var(--dark);display:grid;place-items:center;font-size:10px;font-weight:900;flex:0 0 32px}.pmr2-bar-label b{font-size:12px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pmr2-track{height:14px;border-radius:999px;background:#edf1ed;overflow:hidden}.pmr2-track i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--green),var(--lime));min-width:4px}.pmr2-bar-value{text-align:right;font-size:13px;font-weight:900;color:var(--dark)}
      .pmr2-donut-wrap{display:grid;grid-template-columns:180px 1fr;gap:16px;align-items:center;min-height:210px}.pmr2-donut-box{width:174px;height:174px;position:relative}.pmr2-donut{position:absolute;inset:0;border-radius:50%;background:#edf1ed}.pmr2-donut:after{content:'';position:absolute;inset:39px;border-radius:50%;background:#fff}.pmr2-donut-center{position:absolute;inset:0;z-index:2;display:grid;place-items:center;text-align:center;font-size:25px;font-weight:900;color:var(--dark)}.pmr2-donut-center span{display:block;font-size:11px;color:var(--muted);font-weight:700;margin-top:-48px}.pmr2-legend{display:grid;gap:8px}.pmr2-legend-row{display:grid;grid-template-columns:10px 1fr auto;gap:8px;align-items:center;font-size:12px}.pmr2-legend-row i{width:10px;height:10px;border-radius:50%}.pmr2-legend-row b{color:var(--dark)}
      .pmr2-methods{margin-top:12px;padding-top:12px;border-top:1px solid #e5ebe5;display:flex;gap:7px;flex-wrap:wrap}.pmr2-method{display:inline-flex;align-items:center;gap:6px;padding:6px 8px;border-radius:9px;background:#f7faf6;border:1px solid #e1e8e2;font-size:11.5px;color:#3d4b42}.pmr2-method b{color:var(--dark)}
      .pmr2-heat-wrap{overflow:auto;border:1px solid var(--line);border-radius:11px}.pmr2-heat{width:100%;min-width:980px;border-collapse:collapse}.pmr2-heat th,.pmr2-heat td{padding:10px;border-bottom:1px solid #e8ede8;text-align:center;font-size:12px}.pmr2-heat thead th{background:var(--dark);color:#fff;position:sticky;top:0;z-index:2}.pmr2-heat th:first-child,.pmr2-heat td:first-child{text-align:left;position:sticky;left:0;background:#fff;z-index:1;font-weight:800;color:var(--dark)}.pmr2-heat thead th:first-child{background:var(--dark);z-index:3}.pmr2-dot{display:inline-grid;place-items:center;width:32px;height:30px;border-radius:8px;font-weight:900}.pmr2-dot.y{background:#dcebcf;color:#214d20}.pmr2-dot.n{background:#f0f3f0;color:#9aa59d}
      .pmr2-projects{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.pmr2-project{border:1px solid #e0e8e1;border-radius:12px;background:#fbfdfb;padding:12px;min-width:0}.pmr2-project-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.pmr2-project h4{font-size:14px;line-height:1.35;color:var(--dark);margin:0}.pmr2-project p{font-size:12px;line-height:1.47;color:#536158;margin:7px 0}.pmr2-project-meta{display:flex;gap:6px;flex-wrap:wrap}.pmr2-project .pmr2-progress{height:8px;background:#e8ede9;border-radius:999px;overflow:hidden;margin:9px 0 5px}.pmr2-project .pmr2-progress i{height:100%;display:block;background:linear-gradient(90deg,var(--green),var(--lime))}.pmr2-insights{display:grid;gap:9px}.pmr2-insight{border:1px solid #e2e9e2;border-left:4px solid var(--lime);border-radius:10px;padding:10px;background:#fbfdfb}.pmr2-insight b{display:block;font-size:12.5px;color:var(--dark);margin-bottom:4px}.pmr2-insight p{font-size:12px;line-height:1.48;color:#536158;margin:0}.pmr2-implication{margin-top:10px;border-radius:10px;background:#eef5e9;padding:11px;font-size:12px;line-height:1.48;color:#38523a}.pmr2-implication b{color:var(--dark)}
      .pmr2-table-wrap{overflow:auto;border:1px solid var(--line);border-radius:11px}.pmr2-table{width:100%;min-width:1150px;border-collapse:collapse}.pmr2-table th,.pmr2-table td{padding:10px 11px;border-bottom:1px solid #e8ede8;text-align:left;vertical-align:top;font-size:12px;line-height:1.42}.pmr2-table th{background:var(--dark);color:#fff;position:sticky;top:0;z-index:1}.pmr2-table td strong{color:var(--dark)}.pmr2-table tbody tr:hover{background:#f8faf7}.pmr2-count{font-size:16px;font-weight:900;color:var(--dark)}.pmr2-empty{padding:28px;text-align:center;border:1px dashed #ccd8cd;border-radius:12px;background:#fbfdfb;color:var(--muted);font-size:13px}.pmr2-empty b{display:block;font-size:16px;color:var(--dark);margin-bottom:5px}.pmr2-note{margin-top:10px;padding:10px 11px;border-left:4px solid var(--lime);border-radius:8px;background:#f8faf2;color:var(--muted);font-size:11.5px;line-height:1.48}
      @media(max-width:1450px){.pmr2-filterbar{grid-template-columns:repeat(4,minmax(150px,1fr))}.pmr2-filter:first-child{grid-column:span 2}}
      @media(max-width:1150px){.pmr2-kpis{grid-template-columns:repeat(3,1fr)}.pmr2-7,.pmr2-5,.pmr2-8,.pmr2-4{grid-column:span 12}.pmr2-projects{grid-template-columns:1fr}}
      @media(max-width:760px){.pmr2-filterbar,.pmr2-kpis{grid-template-columns:1fr}.pmr2-filter:first-child{grid-column:span 1}.pmr2-bar{grid-template-columns:1fr}.pmr2-bar-value{text-align:left}.pmr2-donut-wrap{grid-template-columns:1fr}.pmr2-panel{padding:13px}}
    `;
  }

  function trackerRowsFor(project) {
    const rows = TRACKER?.projects || [];
    const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
    const name = normalize(project.name);
    return rows.filter(row => {
      const trackerName = normalize(row.project_name);
      return trackerName === name || trackerName.includes(normalize(project.short_name)) || name.includes(trackerName);
    });
  }

  function enrichedProjects() {
    return (DATA?.projects || []).map(project => {
      const matches = trackerRowsFor(project);
      const respondents = matches.reduce((sum,row) => sum + Number(row.completed || 0), 0);
      const progressValues = matches.map(row => Number(row.final_progress)).filter(Number.isFinite);
      const trackerProgress = progressValues.length ? Math.round(progressValues.reduce((a,b)=>a+b,0)/progressValues.length) : null;
      const milestone = matches.map(row => row.next_milestone).filter(Boolean).join(' / ');
      const trackerStatus = unique(matches.map(row => row.status)).join(', ');
      return { ...project, tracker_rows:matches, tracker_respondents:matches.length ? respondents : project.respondents, tracker_progress:trackerProgress ?? project.final_progress, milestone, tracker_status:trackerStatus || project.status };
    });
  }

  function matchingArtifacts(project) {
    const rows = project.artifacts || [];
    return STATE.artifact === 'All' ? rows : rows.filter(row => row.type === STATE.artifact);
  }

  function filteredProjects() {
    const search = STATE.search.toLowerCase().trim();
    return enrichedProjects().filter(project => {
      const artifacts = matchingArtifacts(project);
      if (STATE.artifact !== 'All' && !artifacts.length) return false;
      if (STATE.project !== 'All' && project.name !== STATE.project) return false;
      if (STATE.objective !== 'All' && project.objective_group !== STATE.objective) return false;
      if (STATE.theme !== 'All' && !(project.themes || []).includes(STATE.theme)) return false;
      if (STATE.research !== 'All' && !(project.research_types || []).includes(STATE.research)) return false;
      if (STATE.status !== 'All' && project.status !== STATE.status) return false;
      if (!search) return true;
      const haystack = [project.name, project.short_name, project.objective, project.objective_group, ...(project.themes||[]), ...(project.research_types||[]), ...(project.key_findings||[]), ...artifacts.flatMap(a=>[a.type,a.label,a.availability])].join(' ').toLowerCase();
      return haystack.includes(search);
    });
  }

  function option(value,label=value) { return `<option value="${esc(value)}">${esc(label)}</option>`; }

  function filterBar(projects) {
    const all = enrichedProjects();
    const artifactTypes = unique(all.flatMap(p => (p.artifacts||[]).map(a => a.type)));
    const filters = [
      ['project','Project name',['All',...all.map(p=>p.name)]],
      ['objective','Objective',['All',...unique(all.map(p=>p.objective_group))]],
      ['theme','Theme',['All',...unique(all.flatMap(p=>p.themes||[]))]],
      ['research','Research type',['All',...unique(all.flatMap(p=>p.research_types||[]))]],
      ['status','Status',['All',...unique(all.map(p=>p.status))]],
      ['artifact','Evidence type',['All',...artifactTypes]]
    ];
    return `<section class="pmr2-filterbar"><div class="pmr2-filter"><label for="pmr2-search">Search repository & analysis</label><input id="pmr2-search" data-filter="search" value="${esc(STATE.search)}" placeholder="Search objectives, themes, reports, transcripts or insights…"></div>${filters.map(([key,label,values])=>`<div class="pmr2-filter"><label for="pmr2-${key}">${label}</label><select id="pmr2-${key}" data-filter="${key}">${values.map(v=>`<option value="${esc(v)}" ${STATE[key]===v?'selected':''}>${esc(v==='All'?'All':v)}</option>`).join('')}</select></div>`).join('')}<button class="pmr2-reset" id="pmr2Reset">Reset</button></section>`;
  }

  function metrics(projects) {
    const artifacts = projects.flatMap(project => matchingArtifacts(project).map(a => ({...a, project})));
    const evidence = artifacts.reduce((sum,row)=>sum+Number(row.count||0),0);
    const transcripts = artifacts.filter(a=>a.type==='Transcript').reduce((sum,row)=>sum+Number(row.count||0),0);
    const reports = artifacts.filter(a=>['Report','Presentation'].includes(a.type)).reduce((sum,row)=>sum+Number(row.count||0),0);
    const respondents = projects.reduce((sum,p)=>sum+Number(p.tracker_respondents||0),0);
    const avg = projects.length ? Math.round(projects.reduce((sum,p)=>sum+Number(p.tracker_progress||0),0)/projects.length) : 0;
    return {evidence, transcripts, reports, respondents, avg};
  }

  function kpis(projects) {
    const m = metrics(projects);
    return `<div class="pmr2-kpis">
      <article class="pmr2-kpi"><div class="pmr2-kpi-icon">▤</div><div><strong>${projects.length}</strong><span>Projects in filtered portfolio</span></div></article>
      <article class="pmr2-kpi"><div class="pmr2-kpi-icon">◎</div><div><strong>${fmt(m.evidence)}</strong><span>Mapped repository evidence items</span></div></article>
      <article class="pmr2-kpi"><div class="pmr2-kpi-icon">🎙</div><div><strong>${fmt(m.transcripts)}</strong><span>Mapped interview transcripts</span></div></article>
      <article class="pmr2-kpi"><div class="pmr2-kpi-icon">▣</div><div><strong>${fmt(m.reports)}</strong><span>Reports & presentation outputs</span></div></article>
      <article class="pmr2-kpi"><div class="pmr2-kpi-icon">✓</div><div><strong>${m.avg}%</strong><span>Average final-output progress</span></div></article>
    </div>`;
  }

  function evidenceBars(projects) {
    if (!projects.length) return empty('No projects match the selected filters.');
    const rows = projects.map(p => [p, matchingArtifacts(p).reduce((sum,a)=>sum+Number(a.count||0),0)]).sort((a,b)=>b[1]-a[1]);
    const max = Math.max(1,...rows.map(r=>r[1]));
    return `<div class="pmr2-bars">${rows.map(([p,count],i)=>`<div class="pmr2-bar"><div class="pmr2-bar-label"><span class="pmr2-mark">${esc(p.short_name.split(/\s+/).map(x=>x[0]).join('').slice(0,2))}</span><b title="${esc(p.name)}">${esc(p.short_name)}</b></div><div class="pmr2-track"><i style="width:${Math.max(4,count*100/max)}%;background:${['#35792a','#034c1f','#c6d52f','#00587c','#c78800','#80276c','#6b8f71'][i%7]}"></i></div><div class="pmr2-bar-value">${count}</div></div>`).join('')}</div>`;
  }

  function artifactDonut(projects) {
    const colors = ['#35792a','#034c1f','#c6d52f','#00587c','#c78800','#80276c','#829588','#9caf8c'];
    const counts = {};
    projects.forEach(p => matchingArtifacts(p).forEach(a => { counts[a.type]=(counts[a.type]||0)+Number(a.count||0); }));
    const entries = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
    const total = entries.reduce((sum,row)=>sum+row[1],0);
    if (!total) return empty('No repository evidence matches the selected filters.');
    let cursor = 0; const stops=[];
    entries.forEach(([name,count],i)=>{const start=cursor;cursor+=count*100/total;stops.push(`${colors[i%colors.length]} ${start}% ${cursor}%`);});
    const methods = {};
    projects.forEach(p => (p.research_types||[]).forEach(r => methods[r]=(methods[r]||0)+1));
    return `<div class="pmr2-donut-wrap"><div class="pmr2-donut-box"><div class="pmr2-donut" style="background:conic-gradient(${stops.join(',')})"></div><div class="pmr2-donut-center">${total}<span>evidence items</span></div></div><div class="pmr2-legend">${entries.map(([name,count],i)=>`<div class="pmr2-legend-row"><i style="background:${colors[i%colors.length]}"></i><span>${esc(name)}</span><b>${count}</b></div>`).join('')}</div></div><div class="pmr2-methods">${Object.entries(methods).map(([name,count])=>`<span class="pmr2-method"><b>${count}</b> ${esc(name)}</span>`).join('')}</div>`;
  }

  function themeHeatmap(projects) {
    if (!projects.length) return empty('No theme coverage is available for this filter combination.');
    const themes = STATE.theme === 'All' ? unique(projects.flatMap(p=>p.themes||[])) : [STATE.theme];
    return `<div class="pmr2-heat-wrap"><table class="pmr2-heat"><thead><tr><th>Theme</th>${projects.map(p=>`<th>${esc(p.short_name)}</th>`).join('')}</tr></thead><tbody>${themes.map(theme=>`<tr><td>${esc(theme)}</td>${projects.map(p=>`<td><span class="pmr2-dot ${(p.themes||[]).includes(theme)?'y':'n'}">${(p.themes||[]).includes(theme)?'✓':'·'}</span></td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  function analysisPanels(projects) {
    if (!projects.length) return empty('No analysis is available for this filter combination.');
    const selected = STATE.project !== 'All' ? projects[0] : null;
    if (selected) {
      return `<div class="pmr2-insights">${(selected.key_findings||[]).map((finding,i)=>`<div class="pmr2-insight"><b>${['Key pattern','Evidence signal','Decision implication'][i]||'Insight'}</b><p>${esc(finding)}</p></div>`).join('')}</div><div class="pmr2-implication"><b>Executive implication:</b> ${esc(selected.executive_implication)}</div><div class="pmr2-note"><b>${esc(selected.analysis_status)}:</b> ${esc(DATA.method_note)}</div>`;
    }
    const allFindings = projects.slice(0,4).map(p=>`<div class="pmr2-insight"><b>${esc(p.short_name)}</b><p>${esc((p.key_findings||[])[0]||p.objective)}</p></div>`).join('');
    const shared = unique(projects.flatMap(p=>p.themes||[])).slice(0,5).join(', ');
    return `<div class="pmr2-insights">${allFindings}</div><div class="pmr2-implication"><b>Cross-project pattern:</b> The current filtered portfolio concentrates on ${esc(shared || 'multiple research themes')}. Use the filters to isolate a single project for a deeper synthesis.</div><div class="pmr2-note">Analysis summaries are demo/curated where the underlying confidential PMR reports or transcripts are not stored in this public repository.</div>`;
  }

  function projectCards(projects) {
    if (!projects.length) return empty('No project cards match the selected filters.');
    return `<div class="pmr2-projects">${projects.map(p=>`<article class="pmr2-project"><div class="pmr2-project-top"><h4>${esc(p.short_name)}</h4><span class="pmr2-chip ${p.analysis_status==='Demo synthesis'?'demo':''}">${esc(p.status)}</span></div><p>${esc(p.objective)}</p><div class="pmr2-project-meta"><span class="pmr2-chip">${esc(p.objective_group)}</span>${(p.research_types||[]).map(r=>`<span class="pmr2-chip">${esc(r)}</span>`).join('')}</div><div class="pmr2-progress"><i style="width:${Number(p.tracker_progress||0)}%"></i></div><p style="margin:0">Final output ${Number(p.tracker_progress||0)}% · ${fmt(p.tracker_respondents)} respondents · ${matchingArtifacts(p).reduce((s,a)=>s+Number(a.count||0),0)} mapped evidence items</p></article>`).join('')}</div>`;
  }

  function repositoryTable(projects) {
    const rows = projects.flatMap(p => matchingArtifacts(p).map(a => ({...a, project:p})));
    if (!rows.length) return empty('No repository items match the selected filters.');
    return `<div class="pmr2-table-wrap"><table class="pmr2-table"><thead><tr><th>Project</th><th>Evidence type</th><th>Repository item</th><th>Count</th><th>Research method</th><th>Availability</th><th>Project status</th></tr></thead><tbody>${rows.map(row=>`<tr><td><strong>${esc(row.project.short_name)}</strong><br>${esc(row.project.objective_group)}</td><td><span class="pmr2-chip">${esc(row.type)}</span></td><td>${esc(row.label)}</td><td><span class="pmr2-count">${Number(row.count||0)}</span></td><td>${esc((row.project.research_types||[]).join(', '))}</td><td>${esc(row.availability)}</td><td>${esc(row.project.status)}</td></tr>`).join('')}</tbody></table></div>`;
  }

  function empty(message) { return `<div class="pmr2-empty"><b>No matching repository content</b>${esc(message)}</div>`; }

  function exportCsv(projects) {
    const rows = [['Project','Objective group','Theme(s)','Research type(s)','Status','Evidence type','Repository item','Count','Availability']];
    projects.forEach(p => matchingArtifacts(p).forEach(a => rows.push([p.name,p.objective_group,(p.themes||[]).join('; '),(p.research_types||[]).join('; '),p.status,a.type,a.label,a.count,a.availability])));
    const csv = rows.map(row=>row.map(value=>`"${String(value??'').replaceAll('"','""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    link.download = 'quest-pmr-repository-filtered.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function template() {
    const projects = filteredProjects();
    const reporting = TRACKER?.reporting_date || 'Not available';
    return `<section class="view pmr2" data-view="projects" data-pmr-repository-v2="true"><div class="page-heading"><div><span class="section-kicker">PRIMARY MARKET RESEARCH KNOWLEDGE HUB</span><h1>PMR Projects & Reports</h1><p>Filterable repository and analysis dashboard connecting Quest PMR projects, reports, transcripts, survey evidence, research instruments and cross-project insights.</p><div class="pmr2-badges"><span class="pmr2-badge"><b>Tracker:</b> ${esc(reporting)}</span><span class="pmr2-badge"><b>Repository mode:</b> Metadata + mapped inventory</span><span class="pmr2-badge"><b>Confidentiality:</b> source documents remain outside public GitHub</span></div></div><div class="heading-actions"><button class="secondary-button" id="pmr2Export">↓ Export filtered inventory</button></div></div>${filterBar(projects)}${kpis(projects)}<div class="pmr2-grid"><article class="pmr2-panel pmr2-7"><div class="pmr2-head"><div><span class="pmr2-kicker">EVIDENCE FOOTPRINT</span><h3>Repository volume by project</h3><p>Mapped evidence inventory updates with every filter selection.</p></div></div>${evidenceBars(projects)}</article><article class="pmr2-panel pmr2-5"><div class="pmr2-head"><div><span class="pmr2-kicker">REPOSITORY COMPOSITION</span><h3>Evidence type mix</h3><p>Reports, transcripts, survey data, instruments and analytical outputs.</p></div></div>${artifactDonut(projects)}</article><article class="pmr2-panel pmr2-12"><div class="pmr2-head"><div><span class="pmr2-kicker">CROSS-PROJECT COVERAGE</span><h3>Theme coverage matrix</h3><p>Shows where research themes recur across the filtered portfolio.</p></div></div>${themeHeatmap(projects)}</article><article class="pmr2-panel pmr2-7"><div class="pmr2-head"><div><span class="pmr2-kicker">PROJECT REPOSITORY</span><h3>Projects, objectives and delivery status</h3><p>Source-backed delivery context combined with mapped research inventory.</p></div></div>${projectCards(projects)}</article><article class="pmr2-panel pmr2-5"><div class="pmr2-head"><div><span class="pmr2-kicker">ANALYSIS LAYER</span><h3>${STATE.project==='All'?'Portfolio insights':'Selected-project synthesis'}</h3><p>Use Project name to focus the synthesis on one study.</p></div></div>${analysisPanels(projects)}</article><article class="pmr2-panel pmr2-12"><div class="pmr2-head"><div><span class="pmr2-kicker">REPORTS & TRANSCRIPTS REPOSITORY</span><h3>Mapped evidence inventory</h3><p>Repository metadata only; confidential source documents are not exposed through the public frontend.</p></div></div>${repositoryTable(projects)}</article></div></section>`;
  }

  function wire(view) {
    view.querySelectorAll('[data-filter]').forEach(control => {
      const eventName = control.tagName === 'INPUT' ? 'input' : 'change';
      control.addEventListener(eventName, () => {
        STATE[control.dataset.filter] = control.value;
        renderInto(view);
      });
    });
    view.querySelector('#pmr2Reset')?.addEventListener('click', () => {
      Object.assign(STATE,{search:'',project:'All',objective:'All',theme:'All',research:'All',status:'All',artifact:'All'});
      renderInto(view);
    });
    view.querySelector('#pmr2Export')?.addEventListener('click', () => exportCsv(filteredProjects()));
  }

  function renderInto(view) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = template().trim();
    const replacement = wrapper.firstElementChild;
    if (view.classList.contains('active')) replacement.classList.add('active');
    view.replaceWith(replacement);
    wire(replacement);
  }

  function mount() {
    if (!DATA) return;
    const view = document.querySelector('.view[data-view="projects"]');
    if (!view || view.dataset.pmrRepositoryV2 === 'true') return;
    renderInto(view);
  }

  async function loadData() {
    const [data, tracker] = await Promise.all([
      fetch(DATA_URL,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`PMR dashboard data ${r.status}`);return r.json();}),
      fetch(TRACKER_URL,{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null)
    ]);
    DATA = data; TRACKER = tracker;
  }

  async function boot() {
    if (mounting) return;
    mounting = true;
    injectStyles();
    try { await loadData(); } catch (error) { console.error('PMR repository dashboard data unavailable:', error); return; }
    mount();
    document.addEventListener('click', event => {
      const nav = event.target.closest('.nav-item');
      if (nav && /pmr projects|reports/i.test(nav.textContent||'')) setTimeout(mount,120);
    }, true);
    window.addEventListener('quest:layout-refresh', event => { if (!event.detail?.group || event.detail.group === 'governance') setTimeout(mount,100); });
    window.addEventListener('quest:module-loaded', () => setTimeout(mount,100));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
