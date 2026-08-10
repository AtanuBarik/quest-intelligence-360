(() => {
  'use strict';

  const RELEASE = '20260810m';
  const DATA_URL = `data/pmr-repository-dashboard.json?v=${RELEASE}`;
  const TRACKER_URL = `data/project-tracker.json?v=${RELEASE}`;
  const state = { search:'', project:'All', objective:'All', theme:'All', research:'All', status:'All', artifact:'All' };
  let DATA = null;
  let TRACKER = null;
  let booted = false;

  const esc = (v='') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = (v='') => String(v).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const uniq = values => [...new Set(values.filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b)));
  const fmt = n => Number(n || 0).toLocaleString('en-US');

  function injectStyles(){
    let s = document.getElementById('pmrFinalStyles');
    if (!s) { s = document.createElement('style'); s.id = 'pmrFinalStyles'; document.head.appendChild(s); }
    s.textContent = `
      .pmrf{--q:#034c1f;--g:#35792a;--lime:#c6d52f;--blue:#00587c;--gold:#c78800;--purple:#80276c;--muted:#607168;--line:#dce6de;--soft:#f6faf5;color:#29362e}
      .pmrf *{box-sizing:border-box}.pmrf .page-heading{margin-bottom:12px}.pmrf .page-heading h1{font-size:30px!important;line-height:1.15!important}.pmrf .page-heading p{font-size:14px!important;line-height:1.55!important;max-width:1080px}.pmrf .section-kicker{font-size:12px!important}.pmrf a{color:var(--blue)}
      .pmrf-meta{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.pmrf-pill{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);background:#fff;border-radius:999px;padding:6px 9px;font-size:12px;color:var(--muted)}.pmrf-pill b{color:var(--q)}
      .pmrf-filterbar{display:grid;grid-template-columns:minmax(240px,1.45fr) repeat(6,minmax(135px,1fr)) auto;gap:9px;align-items:end;padding:14px;border:1px solid var(--line);border-radius:14px;background:linear-gradient(180deg,#fff,#f8fbf7);box-shadow:0 5px 18px rgba(3,76,31,.04);margin-bottom:12px}.pmrf-field label{display:block;font-size:12px;font-weight:800;color:var(--q);margin:0 0 5px}.pmrf-field input,.pmrf-field select{width:100%;height:42px;border:1px solid #cbd8cc;border-radius:9px;background:#fff;padding:0 10px;font-size:13px;color:#26342b}.pmrf-reset,.pmrf-export{height:42px;border:1px solid #afc4b1;border-radius:9px;background:#fff;color:var(--q);padding:0 14px;font-size:13px;font-weight:800;cursor:pointer}.pmrf-export{background:var(--q);color:#fff;border-color:var(--q)}
      .pmrf-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-bottom:12px}.pmrf-kpi{border:1px solid var(--line);border-radius:13px;background:#fff;padding:13px;min-height:92px;display:grid;grid-template-columns:42px 1fr;gap:10px;align-items:center;box-shadow:0 5px 18px rgba(3,76,31,.035)}.pmrf-icon{width:42px;height:42px;border-radius:12px;background:#edf5e9;color:var(--q);display:grid;place-items:center;font-size:20px}.pmrf-kpi strong{display:block;font-size:23px;line-height:1;color:var(--q)}.pmrf-kpi span{display:block;font-size:12px;line-height:1.35;color:var(--muted);margin-top:5px}
      .pmrf-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:12px}.pmrf-7{grid-column:span 7}.pmrf-5{grid-column:span 5}.pmrf-8{grid-column:span 8}.pmrf-4{grid-column:span 4}.pmrf-12{grid-column:span 12}.pmrf-panel{min-width:0;background:#fff;border:1px solid var(--line);border-radius:14px;padding:15px;box-shadow:0 5px 18px rgba(3,76,31,.035)}.pmrf-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px}.pmrf-kicker{display:block;font-size:11px;font-weight:900;letter-spacing:1px;color:var(--g)}.pmrf-head h3{font-size:18px!important;line-height:1.25!important;color:var(--q)!important;margin:4px 0!important}.pmrf-head p{font-size:12.5px!important;line-height:1.45!important;color:var(--muted)!important;margin:0!important}
      .pmrf-bars{display:grid;gap:11px}.pmrf-bar{display:grid;grid-template-columns:minmax(210px,290px) 1fr 52px;gap:10px;align-items:center}.pmrf-bar-label{display:flex;align-items:center;gap:8px;min-width:0}.pmrf-mark{width:34px;height:34px;border-radius:10px;background:#edf5e9;color:var(--q);display:grid;place-items:center;font-size:10px;font-weight:900;flex:0 0 34px}.pmrf-bar-label b{font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pmrf-track{height:15px;border-radius:999px;background:#edf1ed;overflow:hidden}.pmrf-track i{display:block;height:100%;min-width:4px;border-radius:999px;background:linear-gradient(90deg,var(--g),var(--lime))}.pmrf-bar-value{text-align:right;font-size:13px;font-weight:900;color:var(--q)}
      .pmrf-donutwrap{display:grid;grid-template-columns:190px 1fr;gap:18px;align-items:center;min-height:220px}.pmrf-donutbox{width:180px;height:180px;position:relative}.pmrf-donut{position:absolute;inset:0;border-radius:50%;background:#edf1ed}.pmrf-donut:after{content:'';position:absolute;inset:42px;border-radius:50%;background:#fff}.pmrf-center{position:absolute;inset:0;z-index:2;display:grid;place-items:center;text-align:center;color:var(--q);font-size:28px;font-weight:900}.pmrf-center span{display:block;font-size:11px;color:var(--muted);font-weight:700;margin-top:-50px}.pmrf-legend{display:grid;gap:8px}.pmrf-leg{display:grid;grid-template-columns:11px 1fr auto;gap:8px;align-items:center;font-size:12px}.pmrf-leg i{width:11px;height:11px;border-radius:50%}.pmrf-leg b{color:var(--q)}
      .pmrf-projects{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.pmrf-project{border:1px solid #e0e8e1;border-radius:12px;background:#fbfdfb;padding:12px}.pmrf-project-top{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}.pmrf-project h4{font-size:14px!important;line-height:1.35!important;color:var(--q)!important;margin:0!important}.pmrf-project p{font-size:12.5px!important;line-height:1.48!important;color:#526158!important;margin:7px 0!important}.pmrf-tags{display:flex;gap:6px;flex-wrap:wrap}.pmrf-tag{display:inline-flex;padding:5px 7px;border-radius:999px;background:#eef5e9;color:var(--g);font-size:11px;font-weight:800}.pmrf-tag.demo{background:#fff3da;color:#8a5b00}.pmrf-progress{height:8px;border-radius:999px;background:#e8ede9;overflow:hidden;margin:9px 0 5px}.pmrf-progress i{display:block;height:100%;background:linear-gradient(90deg,var(--g),var(--lime))}.pmrf-project small{font-size:11.5px;color:var(--muted);line-height:1.4}
      .pmrf-insights{display:grid;gap:9px}.pmrf-insight{border:1px solid #e1e8e2;border-left:4px solid var(--lime);border-radius:10px;background:#fbfdfb;padding:10px}.pmrf-insight b{display:block;font-size:12.5px;color:var(--q);margin-bottom:4px}.pmrf-insight p{font-size:12.5px!important;line-height:1.48!important;color:#526158!important;margin:0!important}.pmrf-imp{margin-top:10px;border-radius:10px;background:#eef5e9;padding:11px;font-size:12.5px;line-height:1.5;color:#38523a}.pmrf-imp b{color:var(--q)}
      .pmrf-heatwrap,.pmrf-tablewrap{overflow:auto;border:1px solid var(--line);border-radius:11px}.pmrf-heat,.pmrf-table{width:100%;border-collapse:collapse}.pmrf-heat{min-width:900px}.pmrf-table{min-width:1120px}.pmrf-heat th,.pmrf-heat td,.pmrf-table th,.pmrf-table td{padding:10px;border-bottom:1px solid #e7ede8;font-size:12px;line-height:1.42;vertical-align:top}.pmrf-heat th,.pmrf-table th{background:var(--q);color:#fff;text-align:left;position:sticky;top:0;z-index:2}.pmrf-heat td{text-align:center}.pmrf-heat td:first-child{position:sticky;left:0;background:#fff;text-align:left;color:var(--q);font-weight:800}.pmrf-dot{display:inline-grid;place-items:center;width:34px;height:30px;border-radius:8px;font-weight:900}.pmrf-dot.y{background:#dcebcf;color:#214d20}.pmrf-dot.n{background:#f0f3f0;color:#9aa59d}.pmrf-table td strong{color:var(--q)}.pmrf-note{margin-top:10px;padding:10px 11px;border-left:4px solid var(--lime);border-radius:8px;background:#f8faf2;color:var(--muted);font-size:11.5px;line-height:1.48}.pmrf-empty{padding:28px;text-align:center;border:1px dashed #cbd8cc;border-radius:12px;background:#fbfdfb;color:var(--muted);font-size:13px}.pmrf-empty b{display:block;color:var(--q);font-size:16px;margin-bottom:5px}
      @media(max-width:1450px){.pmrf-filterbar{grid-template-columns:repeat(4,minmax(150px,1fr))}.pmrf-field.search{grid-column:span 2}}
      @media(max-width:1150px){.pmrf-kpis{grid-template-columns:repeat(3,1fr)}.pmrf-7,.pmrf-5,.pmrf-8,.pmrf-4{grid-column:span 12}.pmrf-projects{grid-template-columns:1fr}}
      @media(max-width:760px){.pmrf-filterbar,.pmrf-kpis{grid-template-columns:1fr}.pmrf-field.search{grid-column:span 1}.pmrf-bar{grid-template-columns:1fr}.pmrf-bar-value{text-align:left}.pmrf-donutwrap{grid-template-columns:1fr}}
    `;
  }

  function trackerRows(project){
    const rows = TRACKER?.projects || [];
    const name = norm(project.name);
    const short = norm(project.short_name);
    return rows.filter(r => {
      const rn = norm(r.project_name);
      return rn === name || (short && rn.includes(short)) || (rn && name.includes(rn));
    });
  }

  function projects(){
    return (DATA?.projects || []).map(p => {
      const rows = trackerRows(p);
      const completed = rows.reduce((sum,r)=>sum + Number(r.completed || 0),0);
      const prog = rows.map(r=>Number(r.final_progress)).filter(Number.isFinite);
      const progress = prog.length ? Math.round(prog.reduce((a,b)=>a+b,0)/prog.length) : Number(p.final_progress || 0);
      const milestone = rows.map(r=>r.next_milestone).filter(Boolean).join(' / ');
      return {...p, tracker_rows:rows, tracker_respondents:rows.length?completed:Number(p.respondents||0), tracker_progress:progress, milestone};
    });
  }

  function matchingArtifacts(p){ return state.artifact === 'All' ? (p.artifacts||[]) : (p.artifacts||[]).filter(a=>a.type===state.artifact); }

  function filtered(){
    const q = state.search.toLowerCase().trim();
    return projects().filter(p => {
      const arts = matchingArtifacts(p);
      if (state.artifact !== 'All' && !arts.length) return false;
      if (state.project !== 'All' && p.name !== state.project) return false;
      if (state.objective !== 'All' && p.objective_group !== state.objective) return false;
      if (state.theme !== 'All' && !(p.themes||[]).includes(state.theme)) return false;
      if (state.research !== 'All' && !(p.research_types||[]).includes(state.research)) return false;
      if (state.status !== 'All' && p.status !== state.status) return false;
      if (!q) return true;
      const hay = [p.name,p.short_name,p.objective,p.objective_group,...(p.themes||[]),...(p.research_types||[]),...(p.key_findings||[]),...arts.flatMap(a=>[a.type,a.label,a.availability])].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }

  const option = (value,label=value) => `<option value="${esc(value)}">${esc(label)}</option>`;

  function filterBar(){
    const all = projects();
    const defs = [
      ['project','Project name',['All',...all.map(p=>p.name)]],
      ['objective','Objective',['All',...uniq(all.map(p=>p.objective_group))]],
      ['theme','Theme',['All',...uniq(all.flatMap(p=>p.themes||[]))]],
      ['research','Research type',['All',...uniq(all.flatMap(p=>p.research_types||[]))]],
      ['status','Status',['All',...uniq(all.map(p=>p.status))]],
      ['artifact','Evidence type',['All',...uniq(all.flatMap(p=>(p.artifacts||[]).map(a=>a.type)))]]
    ];
    return `<div class="pmrf-filterbar"><div class="pmrf-field search"><label>Search repository</label><input data-filter="search" value="${esc(state.search)}" placeholder="Project, objective, theme, finding or evidence type…"></div>${defs.map(([key,label,vals])=>`<div class="pmrf-field"><label>${esc(label)}</label><select data-filter="${key}">${vals.map(v=>`<option value="${esc(v)}"${String(state[key])===String(v)?' selected':''}>${esc(v)}</option>`).join('')}</select></div>`).join('')}<button class="pmrf-reset" id="pmrfReset">Reset</button></div>`;
  }

  function counts(ps){
    const artifacts = ps.flatMap(p=>matchingArtifacts(p));
    const files = artifacts.reduce((s,a)=>s+Number(a.count||0),0);
    const transcripts = artifacts.filter(a=>a.type==='Transcript').reduce((s,a)=>s+Number(a.count||0),0);
    const reports = artifacts.filter(a=>a.type==='Report'||a.type==='Presentation').reduce((s,a)=>s+Number(a.count||0),0);
    const surveyRespondents = ps.flatMap(p=>p.tracker_rows||[]).filter(r=>/survey/i.test(r.research_type||'')).reduce((s,r)=>s+Number(r.completed||0),0);
    return {files,transcripts,reports,surveyRespondents};
  }

  function kpis(ps){
    const c = counts(ps);
    const rows = [
      ['▤',ps.length,'Projects in view'],
      ['▦',c.files,'Mapped evidence items'],
      ['◫',c.transcripts,'Interview transcripts'],
      ['◉',c.surveyRespondents,'Survey completes'],
      ['✓',c.reports,'Reports + presentations']
    ];
    return `<div class="pmrf-kpis">${rows.map(([i,v,l])=>`<article class="pmrf-kpi"><div class="pmrf-icon">${i}</div><div><strong>${fmt(v)}</strong><span>${esc(l)}</span></div></article>`).join('')}</div>`;
  }

  function evidenceBars(ps){
    if (!ps.length) return '<div class="pmrf-empty"><b>No projects match</b>Adjust the filters to restore project evidence.</div>';
    const max = Math.max(...ps.map(p=>Number(p.evidence_files||0)),1);
    return `<div class="pmrf-bars">${ps.map(p=>`<div class="pmrf-bar"><div class="pmrf-bar-label"><span class="pmrf-mark">${esc((p.short_name||p.name).split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase())}</span><b title="${esc(p.name)}">${esc(p.short_name||p.name)}</b></div><div class="pmrf-track"><i style="width:${Math.max(3,Number(p.evidence_files||0)/max*100)}%"></i></div><div class="pmrf-bar-value">${fmt(p.evidence_files)}</div></div>`).join('')}</div>`;
  }

  function donut(ps){
    const palette = ['#35792a','#c6d52f','#00587c','#c78800','#80276c','#7a8b7c','#46a2b8','#9bbf77'];
    const sums = {};
    ps.forEach(p=>matchingArtifacts(p).forEach(a=>{sums[a.type]=(sums[a.type]||0)+Number(a.count||0);}));
    const rows = Object.entries(sums).sort((a,b)=>b[1]-a[1]);
    const total = rows.reduce((s,[,n])=>s+n,0);
    if (!total) return '<div class="pmrf-empty"><b>No evidence mix available</b>Select another evidence type or project.</div>';
    let acc=0; const stops=[];
    rows.forEach(([,n],i)=>{const start=acc/total*360;acc+=n;const end=acc/total*360;stops.push(`${palette[i%palette.length]} ${start}deg ${end}deg`);});
    return `<div class="pmrf-donutwrap"><div class="pmrf-donutbox"><div class="pmrf-donut" style="background:conic-gradient(${stops.join(',')})"></div><div class="pmrf-center">${fmt(total)}<span>mapped items</span></div></div><div class="pmrf-legend">${rows.map(([type,n],i)=>`<div class="pmrf-leg"><i style="background:${palette[i%palette.length]}"></i><span>${esc(type)}</span><b>${fmt(n)}</b></div>`).join('')}</div></div>`;
  }

  function heatmap(ps){
    const themes = uniq(ps.flatMap(p=>p.themes||[]));
    if (!themes.length) return '<div class="pmrf-empty"><b>No theme coverage</b>Change the current filter selection.</div>';
    const useThemes = themes.slice(0,10);
    return `<div class="pmrf-heatwrap"><table class="pmrf-heat"><thead><tr><th>Project</th>${useThemes.map(t=>`<th>${esc(t)}</th>`).join('')}</tr></thead><tbody>${ps.map(p=>`<tr><td>${esc(p.short_name||p.name)}</td>${useThemes.map(t=>`<td><span class="pmrf-dot ${(p.themes||[]).includes(t)?'y':'n'}">${(p.themes||[]).includes(t)?'●':'–'}</span></td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  function projectCards(ps){
    if (!ps.length) return '<div class="pmrf-empty"><b>No project cards</b>No project matches the current selection.</div>';
    return `<div class="pmrf-projects">${ps.map(p=>`<article class="pmrf-project"><div class="pmrf-project-top"><h4>${esc(p.name)}</h4><span class="pmrf-tag${/demo/i.test(p.analysis_status||'')?' demo':''}">${esc(p.analysis_status||'Mapped')}</span></div><p>${esc(p.objective)}</p><div class="pmrf-tags"><span class="pmrf-tag">${esc(p.status)}</span><span class="pmrf-tag">${fmt(p.tracker_respondents)} respondents</span><span class="pmrf-tag">${fmt(p.evidence_files)} evidence items</span></div><div class="pmrf-progress"><i style="width:${Math.max(0,Math.min(100,Number(p.tracker_progress||0)))}%"></i></div><small>${fmt(p.tracker_progress)}% final-output progress${p.milestone?` · ${esc(p.milestone)}`:''}</small></article>`).join('')}</div>`;
  }

  function analysis(ps){
    if (!ps.length) return '<div class="pmrf-empty"><b>No synthesis available</b>Select a project to review its mapped analysis.</div>';
    if (state.project !== 'All' && ps[0]) {
      const p=ps[0];
      return `<div class="pmrf-insights">${(p.key_findings||[]).map((f,i)=>`<div class="pmrf-insight"><b>Finding ${i+1}</b><p>${esc(f)}</p></div>`).join('')}<div class="pmrf-imp"><b>Executive implication:</b> ${esc(p.executive_implication||'')}</div></div>`;
    }
    const items = ps.slice(0,5).map(p=>({title:p.short_name||p.name,text:(p.key_findings||[])[0]||p.objective}));
    return `<div class="pmrf-insights">${items.map(x=>`<div class="pmrf-insight"><b>${esc(x.title)}</b><p>${esc(x.text)}</p></div>`).join('')}<div class="pmrf-note">Portfolio synthesis uses the mapped/demo analysis layer where confidential PMR source documents are not stored in this public repository.</div></div>`;
  }

  function repositoryTable(ps){
    const rows=[]; ps.forEach(p=>matchingArtifacts(p).forEach(a=>rows.push({project:p.short_name||p.name,...a})));
    if (!rows.length) return '<div class="pmrf-empty"><b>No repository items</b>Change the filters to show mapped reports, transcripts and other evidence.</div>';
    return `<div class="pmrf-tablewrap"><table class="pmrf-table"><thead><tr><th>Project</th><th>Evidence type</th><th>Repository item</th><th>Count</th><th>Availability</th></tr></thead><tbody>${rows.map(r=>`<tr><td><strong>${esc(r.project)}</strong></td><td>${esc(r.type)}</td><td>${esc(r.label)}</td><td>${fmt(r.count)}</td><td>${esc(r.availability)}</td></tr>`).join('')}</tbody></table></div><div class="pmrf-note">Repository inventory and analysis are presented as prototype metadata. Confidential PMR reports, transcripts and respondent-level source documents remain outside public GitHub.</div>`;
  }

  function template(){
    const ps=filtered();
    const reporting=TRACKER?.reporting_date||'Not available';
    return `<section class="view pmrf" data-view="pmr" data-pmr-final="true"><div class="page-heading"><div><span class="section-kicker">PRIMARY MARKET RESEARCH KNOWLEDGE HUB</span><h1>PMR Projects & Reports</h1><p>Filterable repository and analysis dashboard connecting Quest PMR projects, reports, transcripts, survey evidence, research instruments and cross-project insights.</p><div class="pmrf-meta"><span class="pmrf-pill"><b>Tracker:</b> ${esc(reporting)}</span><span class="pmrf-pill"><b>Repository:</b> metadata + mapped inventory</span><span class="pmrf-pill"><b>Source boundary:</b> confidential documents remain outside public GitHub</span></div></div><div class="heading-actions"><button class="pmrf-export" id="pmrfExport">↓ Export filtered inventory</button></div></div>${filterBar()}${kpis(ps)}<div class="pmrf-grid"><article class="pmrf-panel pmrf-7"><div class="pmrf-head"><div><span class="pmrf-kicker">EVIDENCE FOOTPRINT</span><h3>Repository volume by project</h3><p>Mapped evidence inventory updates with every filter selection.</p></div></div>${evidenceBars(ps)}</article><article class="pmrf-panel pmrf-5"><div class="pmrf-head"><div><span class="pmrf-kicker">REPOSITORY COMPOSITION</span><h3>Evidence type mix</h3><p>Reports, transcripts, survey data, instruments and analytical outputs.</p></div></div>${donut(ps)}</article><article class="pmrf-panel pmrf-12"><div class="pmrf-head"><div><span class="pmrf-kicker">CROSS-PROJECT COVERAGE</span><h3>Theme coverage matrix</h3><p>Shows where research themes recur across the filtered portfolio.</p></div></div>${heatmap(ps)}</article><article class="pmrf-panel pmrf-7"><div class="pmrf-head"><div><span class="pmrf-kicker">PROJECT REPOSITORY</span><h3>Projects, objectives and delivery status</h3><p>Source-backed tracker context combined with mapped research inventory.</p></div></div>${projectCards(ps)}</article><article class="pmrf-panel pmrf-5"><div class="pmrf-head"><div><span class="pmrf-kicker">ANALYSIS LAYER</span><h3>${state.project==='All'?'Portfolio insights':'Selected-project synthesis'}</h3><p>Choose a project to focus the analysis.</p></div></div>${analysis(ps)}</article><article class="pmrf-panel pmrf-12"><div class="pmrf-head"><div><span class="pmrf-kicker">REPORTS & TRANSCRIPTS REPOSITORY</span><h3>Mapped evidence inventory</h3><p>Metadata view of reports, transcripts, survey datasets, instruments and analytical outputs.</p></div></div>${repositoryTable(ps)}</article></div></section>`;
  }

  function locatePmr(){
    return document.querySelector('.view[data-view="pmr"]') || Array.from(document.querySelectorAll('.view[data-view]')).find(v=>/PMR Projects\s*&\s*Reports/i.test(v.querySelector('h1')?.textContent||''));
  }

  function exportCsv(){
    const rows=[]; filtered().forEach(p=>matchingArtifacts(p).forEach(a=>rows.push([p.name,p.objective_group,(p.themes||[]).join(' | '),(p.research_types||[]).join(' | '),p.status,a.type,a.label,a.count,a.availability])));
    const data=[['Project','Objective group','Themes','Research types','Status','Evidence type','Repository item','Count','Availability'],...rows].map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob=new Blob([data],{type:'text/csv;charset=utf-8'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='quest-pmr-filtered-inventory.csv'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),500);
  }

  function wire(view){
    view.querySelectorAll('[data-filter]').forEach(control=>{
      const evt=control.tagName==='INPUT'?'input':'change';
      control.addEventListener(evt,()=>{state[control.dataset.filter]=control.value; render();});
    });
    view.querySelector('#pmrfReset')?.addEventListener('click',()=>{Object.assign(state,{search:'',project:'All',objective:'All',theme:'All',research:'All',status:'All',artifact:'All'});render();});
    view.querySelector('#pmrfExport')?.addEventListener('click',exportCsv);
  }

  function render(){
    if (!DATA) return;
    const current=locatePmr(); if (!current) return;
    const holder=document.createElement('div'); holder.innerHTML=template().trim(); const replacement=holder.firstElementChild;
    if (current.classList.contains('active')) replacement.classList.add('active');
    current.replaceWith(replacement); wire(replacement);
  }

  async function load(){
    const [data,tracker]=await Promise.all([
      fetch(DATA_URL,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`PMR dashboard data ${r.status}`);return r.json();}),
      fetch(TRACKER_URL,{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null)
    ]); DATA=data; TRACKER=tracker;
  }

  async function boot(){
    if (booted) return; booted=true; injectStyles();
    try{await load();}catch(e){console.error('PMR final dashboard data unavailable:',e);return;}
    render();
    document.addEventListener('click',e=>{const nav=e.target.closest('.nav-item');if(nav && (nav.dataset.view==='pmr'||/PMR Projects|PMR Reports/i.test(nav.textContent||''))) setTimeout(render,0);},true);
    window.addEventListener('quest:layout-refresh',e=>{if(!e.detail?.group||e.detail.group==='pmr') setTimeout(render,0);});
    window.addEventListener('quest:module-loaded',e=>{if(/pmr/i.test(e.detail?.path||'')) setTimeout(render,0);});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();