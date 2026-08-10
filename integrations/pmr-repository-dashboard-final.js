(() => {
  'use strict';

  const RELEASE = '20260810n';
  const DATA_URL = `data/pmr-repository-dashboard.json?v=${RELEASE}`;
  const TRACKER_URL = `data/project-tracker.json?v=${RELEASE}`;
  const INSIGHT_URL = `data/pmr-insight-library.json?v=${RELEASE}`;
  const state = { search:'', project:'All', objective:'All', theme:'All', research:'All', status:'All', artifact:'All' };
  let DATA = null;
  let TRACKER = null;
  let INSIGHT_LIBRARY = null;
  let booted = false;

  const esc = (v='') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = (v='') => String(v).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const uniq = values => [...new Set(values.filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b)));
  const fmt = n => Number(n || 0).toLocaleString('en-US');
  const avg = values => values.length ? Math.round(values.reduce((a,b)=>a+Number(b||0),0)/values.length) : 0;
  const clamp = (n,min=0,max=100) => Math.max(min,Math.min(max,Number(n||0)));
  const kindLabel = kind => ({Finding:'Finding',Opportunity:'Opportunity',Recommendation:'Recommendation',Risk:'Risk'}[kind] || kind || 'Insight');
  const kindIcon = kind => ({Finding:'◎',Opportunity:'↗',Recommendation:'✓',Risk:'!'}[kind] || '•');

  function injectStyles(){
    let s = document.getElementById('pmrFinalStyles');
    if (!s) { s = document.createElement('style'); s.id = 'pmrFinalStyles'; document.head.appendChild(s); }
    s.textContent = `
      .pmrf{--q:#034c1f;--g:#35792a;--lime:#c6d52f;--blue:#00587c;--gold:#c78800;--purple:#80276c;--red:#b52f45;--muted:#607168;--line:#dce6de;--soft:#f6faf5;color:#29362e}
      .pmrf *{box-sizing:border-box}.pmrf .page-heading{margin-bottom:12px}.pmrf .page-heading h1{font-size:30px!important;line-height:1.15!important}.pmrf .page-heading p{font-size:14px!important;line-height:1.55!important;max-width:1080px}.pmrf .section-kicker{font-size:12px!important}.pmrf a{color:var(--blue)}
      .pmrf-meta{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.pmrf-pill{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);background:#fff;border-radius:999px;padding:6px 9px;font-size:12px;color:var(--muted)}.pmrf-pill b{color:var(--q)}
      .pmrf-filterbar{display:grid;grid-template-columns:minmax(240px,1.45fr) repeat(6,minmax(135px,1fr)) auto;gap:9px;align-items:end;padding:14px;border:1px solid var(--line);border-radius:14px;background:linear-gradient(180deg,#fff,#f8fbf7);box-shadow:0 5px 18px rgba(3,76,31,.04);margin-bottom:12px}.pmrf-field label{display:block;font-size:12px;font-weight:800;color:var(--q);margin:0 0 5px}.pmrf-field input,.pmrf-field select{width:100%;height:42px;border:1px solid #cbd8cc;border-radius:9px;background:#fff;padding:0 10px;font-size:13px;color:#26342b}.pmrf-reset,.pmrf-export{height:42px;border:1px solid #afc4b1;border-radius:9px;background:#fff;color:var(--q);padding:0 14px;font-size:13px;font-weight:800;cursor:pointer}.pmrf-export{background:var(--q);color:#fff;border-color:var(--q)}
      .pmrf-context{margin:0 0 12px;padding:11px 13px;border:1px solid #dbe6d9;border-left:4px solid var(--lime);border-radius:10px;background:linear-gradient(90deg,#f8fbf5,#fff);font-size:12.5px;line-height:1.5;color:#526158}.pmrf-context b{color:var(--q)}
      .pmrf-kpis,.pmra-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-bottom:12px}.pmrf-kpi,.pmra-kpi{border:1px solid var(--line);border-radius:13px;background:#fff;padding:13px;min-height:92px;display:grid;grid-template-columns:42px 1fr;gap:10px;align-items:center;box-shadow:0 5px 18px rgba(3,76,31,.035)}.pmrf-icon,.pmra-icon{width:42px;height:42px;border-radius:12px;background:#edf5e9;color:var(--q);display:grid;place-items:center;font-size:20px}.pmrf-kpi strong,.pmra-kpi strong{display:block;font-size:23px;line-height:1;color:var(--q)}.pmrf-kpi span,.pmra-kpi span{display:block;font-size:12px;line-height:1.35;color:var(--muted);margin-top:5px}.pmra-kpi small{display:block;margin-top:4px;font-size:10.5px;color:#849087}
      .pmrf-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:12px}.pmrf-7{grid-column:span 7}.pmrf-5{grid-column:span 5}.pmrf-8{grid-column:span 8}.pmrf-4{grid-column:span 4}.pmrf-12{grid-column:span 12}.pmrf-panel{min-width:0;background:#fff;border:1px solid var(--line);border-radius:14px;padding:15px;box-shadow:0 5px 18px rgba(3,76,31,.035)}.pmrf-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px}.pmrf-kicker{display:block;font-size:11px;font-weight:900;letter-spacing:1px;color:var(--g)}.pmrf-head h3{font-size:18px!important;line-height:1.25!important;color:var(--q)!important;margin:4px 0!important}.pmrf-head p{font-size:12.5px!important;line-height:1.45!important;color:var(--muted)!important;margin:0!important}
      .pmrf-bars,.pmra-signal-bars{display:grid;gap:11px}.pmrf-bar,.pmra-signal{display:grid;grid-template-columns:minmax(210px,290px) 1fr 52px;gap:10px;align-items:center}.pmrf-bar-label,.pmra-signal-label{display:flex;align-items:center;gap:8px;min-width:0}.pmrf-mark,.pmra-signal-icon{width:34px;height:34px;border-radius:10px;background:#edf5e9;color:var(--q);display:grid;place-items:center;font-size:10px;font-weight:900;flex:0 0 34px}.pmrf-bar-label b,.pmra-signal-label b{font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pmrf-track,.pmra-track{height:15px;border-radius:999px;background:#edf1ed;overflow:hidden}.pmrf-track i,.pmra-track i{display:block;height:100%;min-width:4px;border-radius:999px;background:linear-gradient(90deg,var(--g),var(--lime))}.pmrf-bar-value,.pmra-signal-value{text-align:right;font-size:13px;font-weight:900;color:var(--q)}.pmra-signal-note{grid-column:1/-1;margin:-4px 0 0 44px;font-size:11px;color:var(--muted);line-height:1.4}
      .pmrf-donutwrap{display:grid;grid-template-columns:190px 1fr;gap:18px;align-items:center;min-height:220px}.pmrf-donutbox{width:180px;height:180px;position:relative}.pmrf-donut{position:absolute;inset:0;border-radius:50%;background:#edf1ed}.pmrf-donut:after{content:'';position:absolute;inset:42px;border-radius:50%;background:#fff}.pmrf-center{position:absolute;inset:0;z-index:2;display:grid;place-items:center;text-align:center;color:var(--q);font-size:28px;font-weight:900}.pmrf-center span{display:block;font-size:11px;color:var(--muted);font-weight:700;margin-top:-50px}.pmrf-legend{display:grid;gap:8px}.pmrf-leg{display:grid;grid-template-columns:11px 1fr auto;gap:8px;align-items:center;font-size:12px}.pmrf-leg i{width:11px;height:11px;border-radius:50%}.pmrf-leg b{color:var(--q)}
      .pmrf-projects{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.pmrf-project{border:1px solid #e0e8e1;border-radius:12px;background:#fbfdfb;padding:12px}.pmrf-project-top{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}.pmrf-project h4{font-size:14px!important;line-height:1.35!important;color:var(--q)!important;margin:0!important}.pmrf-project p{font-size:12.5px!important;line-height:1.48!important;color:#526158!important;margin:7px 0!important}.pmrf-tags,.pmra-tags{display:flex;gap:6px;flex-wrap:wrap}.pmrf-tag,.pmra-tag{display:inline-flex;padding:5px 7px;border-radius:999px;background:#eef5e9;color:var(--g);font-size:11px;font-weight:800}.pmrf-tag.demo,.pmra-tag.demo{background:#fff3da;color:#8a5b00}.pmra-tag.blue{background:#e8f3f7;color:var(--blue)}.pmra-tag.red{background:#fff0f4;color:var(--red)}.pmra-tag.purple{background:#f3eaf3;color:var(--purple)}.pmrf-progress{height:8px;border-radius:999px;background:#e8ede9;overflow:hidden;margin:9px 0 5px}.pmrf-progress i{display:block;height:100%;background:linear-gradient(90deg,var(--g),var(--lime))}.pmrf-project small{font-size:11.5px;color:var(--muted);line-height:1.4}
      .pmrf-insights{display:grid;gap:9px}.pmrf-insight{border:1px solid #e1e8e2;border-left:4px solid var(--lime);border-radius:10px;background:#fbfdfb;padding:10px}.pmrf-insight b{display:block;font-size:12.5px;color:var(--q);margin-bottom:4px}.pmrf-insight p{font-size:12.5px!important;line-height:1.48!important;color:#526158!important;margin:0!important}.pmrf-imp{margin-top:10px;border-radius:10px;background:#eef5e9;padding:11px;font-size:12.5px;line-height:1.5;color:#38523a}.pmrf-imp b{color:var(--q)}
      .pmra-summary{padding:15px;border:1px solid #d8e5d8;border-radius:13px;background:linear-gradient(135deg,#f4f9ef,#fff);margin-bottom:12px}.pmra-summary-top{display:flex;gap:12px;align-items:flex-start}.pmra-summary-icon{width:44px;height:44px;flex:0 0 44px;border-radius:13px;background:var(--q);color:#fff;display:grid;place-items:center;font-size:21px}.pmra-summary h4{margin:0 0 6px!important;color:var(--q)!important;font-size:16px!important}.pmra-summary p{margin:0!important;font-size:13px!important;line-height:1.55!important;color:#4f5e55!important}.pmra-gauges{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px}.pmra-gauge{border:1px solid #e0e8e1;border-radius:10px;background:#fff;padding:9px}.pmra-gauge span{display:flex;justify-content:space-between;gap:8px;font-size:10.5px;color:var(--muted)}.pmra-gauge b{color:var(--q)}.pmra-gauge i{display:block;height:7px;background:#edf1ed;border-radius:999px;overflow:hidden;margin-top:6px}.pmra-gauge i em{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--g),var(--lime))}
      .pmra-mix{display:grid;gap:10px}.pmra-mix-row{display:grid;grid-template-columns:120px 1fr 36px;gap:9px;align-items:center;font-size:12px}.pmra-mix-row b{color:var(--q)}.pmra-mix-row i{height:13px;background:#edf1ed;border-radius:999px;overflow:hidden}.pmra-mix-row i em{display:block;height:100%;border-radius:999px}.pmra-mix-row.finding i em{background:var(--blue)}.pmra-mix-row.opportunity i em{background:var(--g)}.pmra-mix-row.recommendation i em{background:var(--lime)}.pmra-mix-row.risk i em{background:var(--red)}
      .pmra-scatter-wrap{position:relative;padding:12px 18px 28px 42px}.pmra-scatter{height:260px;position:relative;border-left:1px solid #b9c8be;border-bottom:1px solid #b9c8be;background:linear-gradient(90deg,transparent 49.7%,#edf1ed 50%,transparent 50.3%),linear-gradient(0deg,transparent 49.7%,#edf1ed 50%,transparent 50.3%)}.pmra-scatter:before{content:'Higher impact';position:absolute;left:-40px;top:3px;writing-mode:vertical-rl;transform:rotate(180deg);font-size:10px;color:var(--muted)}.pmra-scatter:after{content:'Higher confidence →';position:absolute;right:0;bottom:-22px;font-size:10px;color:var(--muted)}.pmra-point{position:absolute;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:10px;font-weight:900;box-shadow:0 0 0 5px rgba(3,76,31,.08);cursor:default}.pmra-point.finding{background:var(--blue)}.pmra-point.opportunity{background:var(--g)}.pmra-point.recommendation{background:var(--q)}.pmra-point.risk{background:var(--red)}.pmra-scatter-legend{display:flex;gap:12px;flex-wrap:wrap;margin-top:8px;font-size:10px;color:var(--muted)}.pmra-scatter-legend span:before{content:'';display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:5px;background:var(--blue)}.pmra-scatter-legend .o:before{background:var(--g)}.pmra-scatter-legend .r:before{background:var(--q)}.pmra-scatter-legend .x:before{background:var(--red)}
      .pmra-rec-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.pmra-rec{border:1px solid #dfe7df;border-radius:12px;background:#fbfdfb;padding:12px;position:relative}.pmra-rec-priority{position:absolute;right:10px;top:10px;display:inline-grid;place-items:center;min-width:34px;height:25px;border-radius:999px;background:var(--q);color:#fff;font-size:10px;font-weight:900}.pmra-rec h4{font-size:13.5px!important;color:var(--q)!important;margin:0 42px 6px 0!important;line-height:1.35!important}.pmra-rec p{font-size:11.8px!important;line-height:1.47!important;color:#536158!important;margin:5px 0!important}.pmra-rec .why{padding-top:7px;border-top:1px solid #e6ece6}.pmra-rec-metrics{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:9px}.pmra-rec-metrics span{font-size:10.5px;color:var(--muted)}.pmra-rec-metrics b{display:block;color:var(--q);font-size:12px;margin-top:2px}
      .pmra-feed{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.pmra-card{border:1px solid #dfe7df;border-radius:12px;padding:12px;background:#fff;display:grid;grid-template-columns:42px 1fr;gap:10px}.pmra-card-icon{width:42px;height:42px;border-radius:12px;background:#edf5e9;color:var(--q);display:grid;place-items:center;font-size:18px;font-weight:900}.pmra-card.finding .pmra-card-icon{background:#e8f3f7;color:var(--blue)}.pmra-card.opportunity .pmra-card-icon{background:#edf5e9;color:var(--g)}.pmra-card.recommendation .pmra-card-icon{background:#f4f8dc;color:var(--q)}.pmra-card.risk .pmra-card-icon{background:#fff0f4;color:var(--red)}.pmra-card h4{margin:3px 0 5px!important;font-size:13.5px!important;color:var(--q)!important;line-height:1.35!important}.pmra-card p{margin:0!important;font-size:11.9px!important;line-height:1.48!important;color:#536158!important}.pmra-card .imp{margin-top:7px!important;color:#294532!important}.pmra-card-meta{grid-column:1/-1;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:2px}.pmra-card-meta span{padding:6px 7px;background:#f6f8f6;border-radius:8px;font-size:10.5px;color:var(--muted)}.pmra-card-meta b{color:var(--q)}
      .pmra-risk-list{display:grid;gap:9px}.pmra-risk{border:1px solid #eadfe2;border-left:4px solid var(--red);border-radius:10px;padding:10px;background:#fffafb}.pmra-risk.medium{border-left-color:var(--gold);background:#fffdf7}.pmra-risk h4{margin:0 0 4px!important;font-size:13px!important;color:var(--q)!important}.pmra-risk p{margin:0!important;font-size:11.8px!important;line-height:1.45!important;color:#5c6460!important}.pmra-risk .mit{margin-top:6px!important;color:#38523a!important}.pmra-risk-level{float:right;font-size:10px;font-weight:900;text-transform:uppercase;color:var(--red)}.pmra-risk.medium .pmra-risk-level{color:#8a5b00}
      .pmra-voices{display:grid;gap:9px}.pmra-voice{margin:0;border:1px solid #e1e8e2;border-left:4px solid var(--blue);border-radius:10px;background:#f9fcfd;padding:11px;font-size:12px;line-height:1.5;color:#46564d}.pmra-voice cite{display:block;margin-top:7px;font-style:normal;font-size:10.5px;color:var(--muted)}
      .pmra-questions{display:flex;gap:8px;flex-wrap:wrap}.pmra-question{display:inline-flex;align-items:center;gap:7px;padding:8px 10px;border:1px solid #dce6de;border-radius:999px;background:#f8fbf7;font-size:11.5px;color:#38523a}.pmra-question:before{content:'?';display:grid;place-items:center;width:20px;height:20px;border-radius:50%;background:var(--q);color:#fff;font-weight:900;font-size:10px}
      .pmrf-heatwrap,.pmrf-tablewrap{overflow:auto;border:1px solid var(--line);border-radius:11px}.pmrf-heat,.pmrf-table{width:100%;border-collapse:collapse}.pmrf-heat{min-width:900px}.pmrf-table{min-width:1120px}.pmrf-heat th,.pmrf-heat td,.pmrf-table th,.pmrf-table td{padding:10px;border-bottom:1px solid #e7ede8;font-size:12px;line-height:1.42;vertical-align:top}.pmrf-heat th,.pmrf-table th{background:var(--q);color:#fff;text-align:left;position:sticky;top:0;z-index:2}.pmrf-heat td{text-align:center}.pmrf-heat td:first-child{position:sticky;left:0;background:#fff;text-align:left;color:var(--q);font-weight:800}.pmrf-dot{display:inline-grid;place-items:center;width:34px;height:30px;border-radius:8px;font-weight:900}.pmrf-dot.y{background:#dcebcf;color:#214d20}.pmrf-dot.n{background:#f0f3f0;color:#9aa59d}.pmrf-table td strong{color:var(--q)}.pmrf-note{margin-top:10px;padding:10px 11px;border-left:4px solid var(--lime);border-radius:8px;background:#f8faf2;color:var(--muted);font-size:11.5px;line-height:1.48}.pmrf-empty{padding:28px;text-align:center;border:1px dashed #cbd8cc;border-radius:12px;background:#fbfdfb;color:var(--muted);font-size:13px}.pmrf-empty b{display:block;color:var(--q);font-size:16px;margin-bottom:5px}
      @media(max-width:1450px){.pmrf-filterbar{grid-template-columns:repeat(4,minmax(150px,1fr))}.pmrf-field.search{grid-column:span 2}.pmra-rec-grid{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:1150px){.pmrf-kpis,.pmra-kpis{grid-template-columns:repeat(3,1fr)}.pmrf-7,.pmrf-5,.pmrf-8,.pmrf-4{grid-column:span 12}.pmrf-projects,.pmra-feed{grid-template-columns:1fr}.pmra-gauges{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:760px){.pmrf-filterbar,.pmrf-kpis,.pmra-kpis,.pmra-rec-grid{grid-template-columns:1fr}.pmrf-field.search{grid-column:span 1}.pmrf-bar,.pmra-signal{grid-template-columns:1fr}.pmrf-bar-value,.pmra-signal-value{text-align:left}.pmra-signal-note{margin:0}.pmrf-donutwrap{grid-template-columns:1fr}.pmra-gauges{grid-template-columns:1fr}.pmra-card-meta{grid-template-columns:1fr}}
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
      const analysis = INSIGHT_LIBRARY?.projects?.[p.id] || null;
      return {...p, tracker_rows:rows, tracker_respondents:rows.length?completed:Number(p.respondents||0), tracker_progress:progress, milestone, analysis};
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
      const analysisText = p.analysis ? JSON.stringify(p.analysis) : '';
      const hay = [p.name,p.short_name,p.objective,p.objective_group,...(p.themes||[]),...(p.research_types||[]),...(p.key_findings||[]),...arts.flatMap(a=>[a.type,a.label,a.availability]),analysisText].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }

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
    return `<div class="pmrf-filterbar"><div class="pmrf-field search"><label>Search repository + insights</label><input data-filter="search" value="${esc(state.search)}" placeholder="Project, objective, theme, insight or evidence…"></div>${defs.map(([key,label,vals])=>`<div class="pmrf-field"><label>${esc(label)}</label><select data-filter="${key}">${vals.map(v=>`<option value="${esc(v)}"${String(state[key])===String(v)?' selected':''}>${esc(v)}</option>`).join('')}</select></div>`).join('')}<button class="pmrf-reset" id="pmrfReset">Reset</button></div>`;
  }

  function activeLens(ps){
    const parts=[];
    if (state.project!=='All') parts.push(`project <b>${esc(state.project)}</b>`);
    if (state.objective!=='All') parts.push(`objective <b>${esc(state.objective)}</b>`);
    if (state.theme!=='All') parts.push(`theme <b>${esc(state.theme)}</b>`);
    if (state.research!=='All') parts.push(`research type <b>${esc(state.research)}</b>`);
    if (state.status!=='All') parts.push(`status <b>${esc(state.status)}</b>`);
    if (state.artifact!=='All') parts.push(`evidence lens <b>${esc(state.artifact)}</b>`);
    if (state.search) parts.push(`search <b>${esc(state.search)}</b>`);
    return `<div class="pmrf-context"><b>Dynamic analysis lens:</b> ${parts.length?parts.join(' · '):'All projects and evidence types'}. The insight feed, signal scores, recommendation ranking, risks, evidence voice and confidence map below are recomputed from ${ps.length} matching project${ps.length===1?'':'s'}.</div>`;
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
    const c=counts(ps);
    const avgProgress=ps.length?Math.round(ps.reduce((s,p)=>s+Number(p.tracker_progress||0),0)/ps.length):0;
    return `<div class="pmrf-kpis"><div class="pmrf-kpi"><div class="pmrf-icon">▤</div><div><strong>${fmt(ps.length)}</strong><span>Matching projects</span></div></div><div class="pmrf-kpi"><div class="pmrf-icon">▣</div><div><strong>${fmt(c.files)}</strong><span>Mapped evidence items</span></div></div><div class="pmrf-kpi"><div class="pmrf-icon">♟</div><div><strong>${fmt(c.transcripts)}</strong><span>Transcript records</span></div></div><div class="pmrf-kpi"><div class="pmrf-icon">▧</div><div><strong>${fmt(c.reports)}</strong><span>Reports + presentations</span></div></div><div class="pmrf-kpi"><div class="pmrf-icon">◷</div><div><strong>${avgProgress}%</strong><span>Average final-output progress${c.surveyRespondents?` · ${fmt(c.surveyRespondents)} survey completes`:''}</span></div></div></div>`;
  }

  function evidenceBars(ps){
    if(!ps.length) return '<div class="pmrf-empty"><b>No evidence footprint</b>No project matches the current filters.</div>';
    const rows=ps.map(p=>({label:p.short_name||p.name,value:matchingArtifacts(p).reduce((s,a)=>s+Number(a.count||0),0)}));
    const max=Math.max(1,...rows.map(r=>r.value));
    return `<div class="pmrf-bars">${rows.map((r,i)=>`<div class="pmrf-bar"><div class="pmrf-bar-label"><span class="pmrf-mark">${String(i+1).padStart(2,'0')}</span><b title="${esc(r.label)}">${esc(r.label)}</b></div><div class="pmrf-track"><i style="width:${Math.max(3,Math.round(r.value/max*100))}%"></i></div><div class="pmrf-bar-value">${fmt(r.value)}</div></div>`).join('')}</div>`;
  }

  function donut(ps){
    const rows={}; ps.flatMap(p=>matchingArtifacts(p)).forEach(a=>rows[a.type]=(rows[a.type]||0)+Number(a.count||0));
    const entries=Object.entries(rows).sort((a,b)=>b[1]-a[1]); const total=entries.reduce((s,r)=>s+r[1],0);
    if(!total) return '<div class="pmrf-empty"><b>No evidence mix</b>Select another evidence filter.</div>';
    const colors=['#35792a','#00587c','#c78800','#80276c','#c6d52f','#6f8b75','#b52f45']; let start=0;
    const stops=entries.map(([,v],i)=>{const end=start+v/total*100;const s=`${colors[i%colors.length]} ${start}% ${end}%`;start=end;return s;});
    return `<div class="pmrf-donutwrap"><div class="pmrf-donutbox"><div class="pmrf-donut" style="background:conic-gradient(${stops.join(',')})"></div><div class="pmrf-center">${fmt(total)}<span>items</span></div></div><div class="pmrf-legend">${entries.map(([k,v],i)=>`<div class="pmrf-leg"><i style="background:${colors[i%colors.length]}"></i><span>${esc(k)}</span><b>${fmt(v)}</b></div>`).join('')}</div></div>`;
  }

  function heatmap(ps){
    if(!ps.length) return '<div class="pmrf-empty"><b>No theme coverage</b>Change the filters to restore matching projects.</div>';
    const themes=state.theme!=='All'?[state.theme]:uniq(ps.flatMap(p=>p.themes||[]));
    return `<div class="pmrf-heatwrap"><table class="pmrf-heat"><thead><tr><th>Project</th>${themes.map(t=>`<th>${esc(t)}</th>`).join('')}</tr></thead><tbody>${ps.map(p=>`<tr><td>${esc(p.short_name||p.name)}</td>${themes.map(t=>`<td><span class="pmrf-dot ${(p.themes||[]).includes(t)?'y':'n'}">${(p.themes||[]).includes(t)?'✓':'–'}</span></td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  function projectCards(ps){
    if (!ps.length) return '<div class="pmrf-empty"><b>No project cards</b>No project matches the current selection.</div>';
    return `<div class="pmrf-projects">${ps.map(p=>`<article class="pmrf-project"><div class="pmrf-project-top"><h4>${esc(p.name)}</h4><span class="pmrf-tag${/demo/i.test(p.analysis_status||'')?' demo':''}">${esc(p.analysis_status||'Mapped')}</span></div><p>${esc(p.objective)}</p><div class="pmrf-tags"><span class="pmrf-tag">${esc(p.status)}</span><span class="pmrf-tag">${fmt(p.tracker_respondents)} respondents</span><span class="pmrf-tag">${fmt(p.evidence_files)} evidence items</span>${p.analysis?`<span class="pmrf-tag">${fmt(p.analysis.opportunity_score)} opportunity</span>`:''}</div><div class="pmrf-progress"><i style="width:${clamp(p.tracker_progress)}%"></i></div><small>${fmt(p.tracker_progress)}% final-output progress${p.milestone?` · ${esc(p.milestone)}`:''}</small></article>`).join('')}</div>`;
  }

  function lensMatch(item,p){
    if(!item) return false;
    if(state.theme!=='All' && !(item.tags||[]).includes(state.theme)) return false;
    if(state.research!=='All' && item.research_types && item.research_types.length && !item.research_types.includes(state.research)) return false;
    if(state.artifact!=='All' && item.evidence_types && item.evidence_types.length && !item.evidence_types.includes(state.artifact)) return false;
    if(state.search){
      const q=state.search.toLowerCase();
      const hay=[p.name,item.kind,item.title,item.body,item.implication,item.action,item.rationale,item.description,item.mitigation,...(item.tags||[]),...(item.evidence_types||[])].join(' ').toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  }

  function insightRecords(ps){
    const out=[];
    ps.forEach(p=>{
      const items=p.analysis?.insights||[];
      items.forEach(item=>{if(lensMatch(item,p)) out.push({...item,project:p.short_name||p.name,projectId:p.id});});
    });
    return out.sort((a,b)=>(b.impact+b.confidence+b.urgency)-(a.impact+a.confidence+a.urgency));
  }

  function recommendations(ps){
    const out=[];
    ps.forEach(p=>(p.analysis?.recommendations||[]).forEach(item=>{if(lensMatch(item,p)) out.push({...item,project:p.short_name||p.name});}));
    return out.sort((a,b)=>(b.impact+b.confidence)-(a.impact+a.confidence));
  }

  function risks(ps){
    const out=[];
    ps.forEach(p=>(p.analysis?.risks||[]).forEach(item=>{
      const proxy={...item,evidence_types:[],research_types:p.research_types||[]};
      if(lensMatch(proxy,p)) out.push({...item,project:p.short_name||p.name});
    }));
    return out;
  }

  function signals(ps){
    const out=[];
    ps.forEach(p=>(p.analysis?.signals||[]).forEach(item=>{
      if(state.theme!=='All' && !(item.tags||[]).includes(state.theme)) return;
      if(state.search && ![p.name,item.name,item.note,...(item.tags||[])].join(' ').toLowerCase().includes(state.search.toLowerCase())) return;
      out.push({...item,project:p.short_name||p.name});
    }));
    const grouped={};
    out.forEach(s=>{
      const key=s.name;
      if(!grouped[key]) grouped[key]={name:key,score:0,count:0,direction:s.direction,note:s.note,projects:[]};
      grouped[key].score+=Number(s.score||0); grouped[key].count+=1; grouped[key].projects.push(s.project);
    });
    return Object.values(grouped).map(s=>({...s,score:Math.round(s.score/s.count)})).sort((a,b)=>b.score-a.score);
  }

  function voices(ps){
    const out=[];
    ps.forEach(p=>(p.analysis?.voices||[]).forEach(v=>{
      if(state.theme!=='All' && v.theme!==state.theme) return;
      if(state.artifact!=='All' && v.evidence_type!==state.artifact) return;
      if(state.search && ![p.name,v.role,v.quote,v.theme,v.evidence_type].join(' ').toLowerCase().includes(state.search.toLowerCase())) return;
      out.push({...v,project:p.short_name||p.name});
    }));
    return out;
  }

  function analysisKpis(ps){
    const items=insightRecords(ps); const recs=recommendations(ps); const rr=risks(ps);
    const conf=avg(items.map(i=>i.confidence)); const impact=avg(items.map(i=>i.impact));
    const highRecs=recs.filter(r=>r.impact>=90).length; const highRisk=rr.filter(r=>String(r.level).toLowerCase()==='high').length;
    return `<div class="pmra-kpis"><div class="pmra-kpi"><div class="pmra-icon">✦</div><div><strong>${fmt(items.length)}</strong><span>Context-matched insights</span><small>Findings, opportunities, recommendations and risks</small></div></div><div class="pmra-kpi"><div class="pmra-icon">◉</div><div><strong>${conf}%</strong><span>Average confidence</span><small>Illustrative evidence-strength score</small></div></div><div class="pmra-kpi"><div class="pmra-icon">↗</div><div><strong>${impact}%</strong><span>Average strategic impact</span><small>Priority-weighted demo score</small></div></div><div class="pmra-kpi"><div class="pmra-icon">✓</div><div><strong>${fmt(highRecs)}</strong><span>High-impact recommendations</span><small>Impact score ≥ 90</small></div></div><div class="pmra-kpi"><div class="pmra-icon">!</div><div><strong>${fmt(highRisk)}</strong><span>High risks to watch</span><small>Changes with project/theme lens</small></div></div></div>`;
  }

  function portfolioSummary(ps){
    if(!ps.length) return '<div class="pmrf-empty"><b>No analysis summary</b>Change the filters to restore matching projects.</div>';
    if(ps.length===1 && ps[0].analysis){
      const a=ps[0].analysis;
      const gauges=[['Decision readiness',a.decision_readiness],['Evidence confidence',a.evidence_confidence],['Opportunity score',a.opportunity_score],['Execution complexity',a.execution_complexity]];
      return `<div class="pmra-summary"><div class="pmra-summary-top"><div class="pmra-summary-icon">✦</div><div><h4>${esc(ps[0].short_name||ps[0].name)} — strategic synthesis</h4><p>${esc(a.summary)}</p></div></div><div class="pmra-gauges">${gauges.map(([l,v])=>`<div class="pmra-gauge"><span>${esc(l)} <b>${fmt(v)}</b></span><i><em style="width:${clamp(v)}%"></em></i></div>`).join('')}</div></div>`;
    }
    const analyses=ps.map(p=>p.analysis).filter(Boolean);
    const topSignals=signals(ps).slice(0,3).map(s=>s.name).join(', ');
    const summary=`Across the current filter set, the strongest recurring signals are ${topSignals||'workflow integration, measurable outcomes and enterprise value'}. The portfolio suggests that Quest can create differentiated value by connecting diagnostic scale and trust with workflow integration, governed data, actionable decision support and evidence-backed service models.`;
    const gauges=[['Decision readiness',avg(analyses.map(a=>a.decision_readiness))],['Evidence confidence',avg(analyses.map(a=>a.evidence_confidence))],['Opportunity score',avg(analyses.map(a=>a.opportunity_score))],['Execution complexity',avg(analyses.map(a=>a.execution_complexity))]];
    return `<div class="pmra-summary"><div class="pmra-summary-top"><div class="pmra-summary-icon">360°</div><div><h4>Filtered portfolio synthesis</h4><p>${esc(summary)}</p></div></div><div class="pmra-gauges">${gauges.map(([l,v])=>`<div class="pmra-gauge"><span>${esc(l)} <b>${fmt(v)}</b></span><i><em style="width:${clamp(v)}%"></em></i></div>`).join('')}</div></div>`;
  }

  function signalBars(ps){
    const rows=signals(ps).slice(0,7);
    if(!rows.length) return '<div class="pmrf-empty"><b>No strategic signals</b>No signal object matches this exact filter lens.</div>';
    return `<div class="pmra-signal-bars">${rows.map((s,i)=>`<div class="pmra-signal"><div class="pmra-signal-label"><span class="pmra-signal-icon">${s.direction==='rising'?'↗':'→'}</span><b title="${esc(s.name)}">${esc(s.name)}</b></div><div class="pmra-track"><i style="width:${clamp(s.score)}%"></i></div><div class="pmra-signal-value">${fmt(s.score)}</div><div class="pmra-signal-note">${esc(s.note)}${s.projects?.length>1?` · ${fmt(s.projects.length)} projects`:''}</div></div>`).join('')}</div>`;
  }

  function insightMix(ps){
    const items=insightRecords(ps); const kinds=['Finding','Opportunity','Recommendation','Risk'];
    const total=Math.max(1,items.length);
    return `<div class="pmra-mix">${kinds.map(k=>{const n=items.filter(i=>i.kind===k).length;return `<div class="pmra-mix-row ${k.toLowerCase()}"><b>${kindIcon(k)} ${k}</b><i><em style="width:${Math.round(n/total*100)}%"></em></i><strong>${n}</strong></div>`}).join('')}<div class="pmrf-note">The mix reflects only insight objects that match the active project, theme, research-type, evidence-type and search lens.</div></div>`;
  }

  function scatter(ps){
    const items=insightRecords(ps).slice(0,14);
    if(!items.length) return '<div class="pmrf-empty"><b>No confidence map</b>No insight objects match the active lens.</div>';
    return `<div class="pmra-scatter-wrap"><div class="pmra-scatter">${items.map((i,idx)=>`<span class="pmra-point ${String(i.kind||'').toLowerCase()}" style="left:${clamp(i.confidence,5,95)}%;bottom:${clamp(i.impact,5,95)}%" title="${esc(i.project)} · ${esc(i.title)} · confidence ${fmt(i.confidence)} · impact ${fmt(i.impact)}">${idx+1}</span>`).join('')}</div><div class="pmra-scatter-legend"><span>Finding</span><span class="o">Opportunity</span><span class="r">Recommendation</span><span class="x">Risk</span></div></div>`;
  }

  function recommendationCards(ps){
    const recs=recommendations(ps).slice(0,6);
    if(!recs.length) return '<div class="pmrf-empty"><b>No recommendations under this lens</b>Try removing the evidence-type or theme filter.</div>';
    return `<div class="pmra-rec-grid">${recs.map(r=>`<article class="pmra-rec"><span class="pmra-rec-priority">${esc(r.priority||'P2')}</span><h4>${esc(r.title)}</h4><p>${esc(r.action)}</p><p class="why"><b>Why:</b> ${esc(r.rationale)}</p><div class="pmra-tags"><span class="pmra-tag blue">${esc(r.project)}</span><span class="pmra-tag">${esc(r.horizon||'Next horizon')}</span></div><div class="pmra-rec-metrics"><span>Impact<b>${fmt(r.impact)}/100</b></span><span>Confidence<b>${fmt(r.confidence)}/100</b></span></div></article>`).join('')}</div>`;
  }

  function insightFeed(ps){
    let items=insightRecords(ps).slice(0,10);
    if(!items.length && ps.length){
      items=ps.flatMap(p=>(p.key_findings||[]).map((body,i)=>({kind:'Finding',title:`Mapped finding ${i+1}`,body,implication:p.executive_implication,confidence:75,impact:80,urgency:70,project:p.short_name||p.name,icon:'◎'}))).slice(0,8);
    }
    if(!items.length) return '<div class="pmrf-empty"><b>No insight feed</b>No insight content matches the active filters.</div>';
    return `<div class="pmra-feed">${items.map(i=>`<article class="pmra-card ${String(i.kind||'').toLowerCase()}"><div class="pmra-card-icon">${esc(i.icon||kindIcon(i.kind))}</div><div><div class="pmra-tags"><span class="pmra-tag ${i.kind==='Risk'?'red':i.kind==='Recommendation'?'purple':''}">${esc(kindLabel(i.kind))}</span><span class="pmra-tag blue">${esc(i.project)}</span></div><h4>${esc(i.title)}</h4><p>${esc(i.body)}</p>${i.implication?`<p class="imp"><b>Implication:</b> ${esc(i.implication)}</p>`:''}</div><div class="pmra-card-meta"><span>Confidence <b>${fmt(i.confidence)}%</b></span><span>Impact <b>${fmt(i.impact)}%</b></span><span>Urgency <b>${fmt(i.urgency)}%</b></span></div></article>`).join('')}</div>`;
  }

  function riskWatch(ps){
    const rows=risks(ps).slice(0,6);
    if(!rows.length) return '<div class="pmrf-empty"><b>No specific risks under this lens</b>The filtered content does not contain a matching risk object.</div>';
    return `<div class="pmra-risk-list">${rows.map(r=>`<article class="pmra-risk ${String(r.level).toLowerCase()}"><span class="pmra-risk-level">${esc(r.level)}</span><h4>${esc(r.title)}</h4><p>${esc(r.description)}</p><p class="mit"><b>Mitigation:</b> ${esc(r.mitigation)}</p><div class="pmra-tags" style="margin-top:7px"><span class="pmra-tag blue">${esc(r.project)}</span>${(r.tags||[]).slice(0,2).map(t=>`<span class="pmra-tag">${esc(t)}</span>`).join('')}</div></article>`).join('')}</div>`;
  }

  function evidenceVoices(ps){
    const rows=voices(ps).slice(0,6);
    if(!rows.length) return '<div class="pmrf-empty"><b>No evidence voice under this lens</b>Change the theme or evidence-type filter to reveal illustrative source snippets.</div>';
    return `<div class="pmra-voices">${rows.map(v=>`<blockquote class="pmra-voice">${esc(v.quote)}<cite>${esc(v.role)} · ${esc(v.project)} · ${esc(v.theme)} · ${esc(v.evidence_type)}</cite></blockquote>`).join('')}</div><div class="pmrf-note">These are explicitly illustrative paraphrases/syntheses for prototype demonstration and should be replaced with approved source excerpts in a production environment.</div>`;
  }

  function nextQuestions(ps){
    let qs=[]; ps.forEach(p=>qs.push(...(p.analysis?.next_questions||[])));
    if(state.search) qs=qs.filter(q=>q.toLowerCase().includes(state.search.toLowerCase())||state.project!=='All');
    qs=uniq(qs).slice(0,8);
    if(!qs.length) return '<div class="pmrf-empty"><b>No follow-up questions</b>Broaden the active lens.</div>';
    return `<div class="pmra-questions">${qs.map(q=>`<span class="pmra-question">${esc(q)}</span>`).join('')}</div>`;
  }

  function analysisLegacy(ps){
    if (!ps.length) return '<div class="pmrf-empty"><b>No synthesis available</b>Select a project to review its mapped analysis.</div>';
    if (state.project !== 'All' && ps[0]) {
      const p=ps[0];
      return `<div class="pmrf-insights">${(p.key_findings||[]).map((f,i)=>`<div class="pmrf-insight"><b>Finding ${i+1}</b><p>${esc(f)}</p></div>`).join('')}<div class="pmrf-imp"><b>Executive implication:</b> ${esc(p.executive_implication||'')}</div></div>`;
    }
    const items=ps.slice(0,5).map(p=>({title:p.short_name||p.name,text:(p.key_findings||[])[0]||p.objective}));
    return `<div class="pmrf-insights">${items.map(x=>`<div class="pmrf-insight"><b>${esc(x.title)}</b><p>${esc(x.text)}</p></div>`).join('')}<div class="pmrf-note">Portfolio synthesis uses the mapped/demo analysis layer where confidential PMR source documents are not stored in GitHub.</div></div>`;
  }

  function repositoryTable(ps){
    const rows=[]; ps.forEach(p=>matchingArtifacts(p).forEach(a=>rows.push({project:p.short_name||p.name,...a})));
    if (!rows.length) return '<div class="pmrf-empty"><b>No repository items</b>Change the filters to show mapped reports, transcripts and other evidence.</div>';
    return `<div class="pmrf-tablewrap"><table class="pmrf-table"><thead><tr><th>Project</th><th>Evidence type</th><th>Repository item</th><th>Count</th><th>Availability</th></tr></thead><tbody>${rows.map(r=>`<tr><td><strong>${esc(r.project)}</strong></td><td>${esc(r.type)}</td><td>${esc(r.label)}</td><td>${fmt(r.count)}</td><td>${esc(r.availability)}</td></tr>`).join('')}</tbody></table></div><div class="pmrf-note">Repository inventory and analysis are presented as prototype metadata. Confidential PMR reports, transcripts and respondent-level source documents remain outside public GitHub.</div>`;
  }

  function template(){
    const ps=filtered();
    const reporting=TRACKER?.reporting_date||'Not available';
    return `<section class="view pmrf" data-view="pmr" data-pmr-final="true"><div class="page-heading"><div><span class="section-kicker">PRIMARY MARKET RESEARCH KNOWLEDGE HUB</span><h1>PMR Projects & Reports</h1><p>Filterable repository and decision-intelligence dashboard connecting Quest PMR projects, reports, transcripts, survey evidence, research instruments, cross-project insights, risks and recommended actions.</p><div class="pmrf-meta"><span class="pmrf-pill"><b>Tracker:</b> ${esc(reporting)}</span><span class="pmrf-pill"><b>Insight engine:</b> filter-responsive demo synthesis</span><span class="pmrf-pill"><b>Repository:</b> metadata + mapped inventory</span><span class="pmrf-pill"><b>Source boundary:</b> confidential documents remain outside public GitHub</span></div></div><div class="heading-actions"><button class="pmrf-export" id="pmrfExport">↓ Export filtered inventory</button></div></div>${filterBar()}${activeLens(ps)}${kpis(ps)}${analysisKpis(ps)}<div class="pmrf-grid"><article class="pmrf-panel pmrf-12"><div class="pmrf-head"><div><span class="pmrf-kicker">EXECUTIVE SYNTHESIS</span><h3>${ps.length===1?'Selected-project decision brief':'Filtered portfolio decision brief'}</h3><p>Strategic interpretation recomputed from the current filter context.</p></div></div>${portfolioSummary(ps)}</article><article class="pmrf-panel pmrf-7"><div class="pmrf-head"><div><span class="pmrf-kicker">SIGNAL STRENGTH</span><h3>What is most strategically important?</h3><p>Theme and opportunity signals ranked within the active filter lens.</p></div></div>${signalBars(ps)}</article><article class="pmrf-panel pmrf-5"><div class="pmrf-head"><div><span class="pmrf-kicker">INSIGHT MIX</span><h3>Type of intelligence returned</h3><p>Findings, opportunities, recommendations and risks in the current context.</p></div></div>${insightMix(ps)}</article><article class="pmrf-panel pmrf-12"><div class="pmrf-head"><div><span class="pmrf-kicker">EXECUTIVE RECOMMENDATIONS</span><h3>Ranked actions from the selected evidence context</h3><p>Recommendations re-rank by impact and confidence when filters change.</p></div></div>${recommendationCards(ps)}</article><article class="pmrf-panel pmrf-7"><div class="pmrf-head"><div><span class="pmrf-kicker">DYNAMIC INSIGHT FEED</span><h3>Findings, opportunities and implications</h3><p>Project-specific content filtered by theme, research method, evidence type and search terms.</p></div></div>${insightFeed(ps)}</article><article class="pmrf-panel pmrf-5"><div class="pmrf-head"><div><span class="pmrf-kicker">IMPACT × CONFIDENCE</span><h3>Decision-readiness map</h3><p>Upper-right items combine higher strategic impact with stronger confidence.</p></div></div>${scatter(ps)}</article><article class="pmrf-panel pmrf-7"><div class="pmrf-head"><div><span class="pmrf-kicker">RISK WATCH</span><h3>What could reduce value or slow execution?</h3><p>Risks and mitigations tied to the selected project/theme context.</p></div></div>${riskWatch(ps)}</article><article class="pmrf-panel pmrf-5"><div class="pmrf-head"><div><span class="pmrf-kicker">VOICE OF EVIDENCE</span><h3>Illustrative source-style signals</h3><p>Demo paraphrases that show how transcript/report evidence could appear.</p></div></div>${evidenceVoices(ps)}</article><article class="pmrf-panel pmrf-12"><div class="pmrf-head"><div><span class="pmrf-kicker">NEXT RESEARCH QUESTIONS</span><h3>What should the team test or validate next?</h3><p>Follow-up questions generated from the currently selected projects.</p></div></div>${nextQuestions(ps)}</article><article class="pmrf-panel pmrf-7"><div class="pmrf-head"><div><span class="pmrf-kicker">EVIDENCE FOOTPRINT</span><h3>Repository volume by project</h3><p>Mapped evidence inventory updates with every filter selection.</p></div></div>${evidenceBars(ps)}</article><article class="pmrf-panel pmrf-5"><div class="pmrf-head"><div><span class="pmrf-kicker">REPOSITORY COMPOSITION</span><h3>Evidence type mix</h3><p>Reports, transcripts, survey data, instruments and analytical outputs.</p></div></div>${donut(ps)}</article><article class="pmrf-panel pmrf-12"><div class="pmrf-head"><div><span class="pmrf-kicker">CROSS-PROJECT COVERAGE</span><h3>Theme coverage matrix</h3><p>Shows where research themes recur across the filtered portfolio.</p></div></div>${heatmap(ps)}</article><article class="pmrf-panel pmrf-7"><div class="pmrf-head"><div><span class="pmrf-kicker">PROJECT REPOSITORY</span><h3>Projects, objectives and delivery status</h3><p>Source-backed tracker context combined with mapped research inventory.</p></div></div>${projectCards(ps)}</article><article class="pmrf-panel pmrf-5"><div class="pmrf-head"><div><span class="pmrf-kicker">SOURCE-MAPPED SYNTHESIS</span><h3>${state.project==='All'?'Existing portfolio findings':'Existing selected-project findings'}</h3><p>Original mapped synthesis retained alongside the richer demo insight layer.</p></div></div>${analysisLegacy(ps)}</article><article class="pmrf-panel pmrf-12"><div class="pmrf-head"><div><span class="pmrf-kicker">REPORTS & TRANSCRIPTS REPOSITORY</span><h3>Mapped evidence inventory</h3><p>Metadata view of reports, transcripts, survey datasets, instruments and analytical outputs.</p></div></div>${repositoryTable(ps)}</article></div></section>`;
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
    const [data,tracker,insights]=await Promise.all([
      fetch(DATA_URL,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`PMR dashboard data ${r.status}`);return r.json();}),
      fetch(TRACKER_URL,{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null),
      fetch(INSIGHT_URL,{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null)
    ]); DATA=data; TRACKER=tracker; INSIGHT_LIBRARY=insights;
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
