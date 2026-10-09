/* Evidence context and retrieval shared by the MACI workspace and its reports. */
(() => {
  'use strict';
  const IDS = ['health-system-experience','digital-customer-journey','data-ecosystem-needs','data-ecosystem-extended','lab-stewardship','consumer-testing'];
  const canonical = id => String(id || '').replace(/-pulse$/, '').replace(/^data-ai-readiness$/, 'data-ecosystem-needs');
  const words = s => String(s || '').toLowerCase();
  function matchTracker(id, name) {
    const n=words(name);
    return ({'health-system-experience':/health.system experience|enterprise decision/,'digital-customer-journey':/digital customer journey/,'data-ecosystem-needs':/data ecosystem/,'data-ecosystem-extended':/data ecosystem/,'lab-stewardship':/lab stewardship/,'consumer-testing':/consumer testing/}[id] || /$^/).test(n) && (id==='data-ecosystem-needs'?!/extended/.test(n):id==='data-ecosystem-extended'?/extended/.test(n):true);
  }
  function build(raw, local=[]) {
    const context=raw.context;
    const studies=(raw.pmr.projects||[]).filter(p=>IDS.includes(p.id)).map(p=>{
      const delivery=(raw.tracker.projects||[]).filter(t=>matchTracker(p.id,t.project_name));
      const topics=context.topics.filter(t=>t.projects.includes(p.id));
      return {...p,delivery,topics,proposed_kbqs:topics.map(t=>t.next_question),owner:[...new Set(delivery.map(t=>t.evs_lead).filter(Boolean))].join('; ')||'Not recorded',sponsor_contacts:[...new Set(delivery.map(t=>t.client_owner).filter(Boolean))].join('; ')||'Not recorded',business_unit:'Not recorded',vendor:'Not recorded',geography:p.id==='consumer-testing'?'United States (project title)':'Not recorded',source:'data/project-tracker.json',status_source:delivery.map(t=>t.status).join('; ')||'Not recorded'};
    });
    const approved=local.filter(r=>r.status==='Approved' && validEvidence(r).length===0 && IDS.includes(r.project));
    return {...raw,context,studies,local,approved,public:context.sources,tracker_date:raw.tracker.reporting_date};
  }
  function topicsFor(model, question) {
    const q=words(question);
    const matched=model.context.topics.filter(t=>t.terms.some(term=>q.includes(term)));
    if(matched.length)return matched;
    if(/all relevant|across.*stud|research.*already|previously|evidence gap|sufficient evidence|kbq|research portfolio/.test(q))return model.context.topics;
    return [];
  }
  function retrieve(model, question, project='all', demo=false) {
    const topics=topicsFor(model,question), keys=topics.map(t=>t.id);
    const studies=model.studies.filter(p=>(project==='all'||p.id===project)&&p.topics.some(t=>keys.includes(t.id)));
    const relevant=new Set(studies.flatMap(p=>p.topics.map(t=>t.id)).filter(t=>keys.includes(t)));
    const publicRows=model.public.filter(s=>s.topics.some(t=>relevant.has(t)));
    const approved=model.approved.filter(r=>(project==='all'||r.project===project)&&relevant.has(r.topic));
    const demos=demo?studies.flatMap(p=>(model.insights.projects?.[p.id]?.insights||[]).map(r=>({...r,project:p.id,authority:'Illustrative PMR synthesis',source:'data/pmr-insight-library.json'}))):[];
    return {question,topics,studies,public:publicRows,approved,demos,quant:publicRows.filter(s=>s.kind==='Quantitative'||s.kind==='Mixed methods'),qual:publicRows.filter(s=>s.kind==='Qualitative'||s.kind==='Mixed methods'),suppliers:publicRows.filter(s=>s.kind==='Supplier description')};
  }
  function ageMonths(date, asOf) {
    if(!date || /not |applicable|through/i.test(date))return null;
    const m=String(date).match(/(20\d\d)(?:-(\d\d))?/);if(!m)return null;
    const d=new Date(asOf), year=Number(m[1]),month=Number(m[2]||12)-1;
    return (d.getUTCFullYear()-year)*12+d.getUTCMonth()-month;
  }
  function conflicts(rows) {
    const pairs=[];
    rows.forEach((a,i)=>rows.slice(i+1).forEach(b=>{
      if(!['Supports','Challenges'].includes(a.stance)||!['Supports','Challenges'].includes(b.stance)||a.stance===b.stance)return;
      const fields=['topic','kbq','segment','geography','period','method'];
      if(fields.every(k=>a[k] && b[k] && words(a[k]).trim()===words(b[k]).trim()))pairs.push([a,b]);
    }));return pairs;
  }
  function health(model, project='all') {
    const topics=model.context.topics.filter(t=>project==='all'||t.projects.includes(project));
    const coverage=topics.map(t=>{
      const pub=model.public.filter(s=>s.topics.includes(t.id)&&s.kind!=='Supplier description');
      const internal=model.approved.filter(r=>r.topic===t.id&&(project==='all'||r.project===project));
      const methods=new Set(internal.map(r=>r.method));
      return {topic:t,public_count:pub.length,approved_count:internal.length,level:internal.length?'Approved excerpts available':pub.length>=2?'Multiple public studies':pub.length?'Limited public context':'Evidence gap',needs_quant:!methods.has('Quantitative'),needs_qual:!methods.has('Qualitative'),missing_segments:!internal.length?'No approved segment coverage supplied':internal.some(r=>!r.segment)?'Segment metadata missing':'Review target-segment coverage',missing_geographies:!internal.length?'No approved geography coverage supplied':'Review target-geography coverage',missing_stakeholders:!internal.length?'No approved stakeholder coverage supplied':'Review target-stakeholder coverage'};
    });
    const aged=model.public.filter(s=>ageMonths(s.collection_end||s.published,model.context.reviewed_at)>model.context.policy.age_review_months && s.kind!=='Supplier description');
    const inconsistent=model.studies.flatMap(p=>p.delivery.filter(t=>Number(t.final_progress)===100 && /started|progress/i.test(t.final_status)).map(t=>({study:p.id,record:t.id,message:`${p.short_name}: final progress is 100% while deliverable status is “${t.final_status}”. Verify tracker metadata.`})));
    return {coverage,aged,conflicts:conflicts(model.approved.filter(r=>project==='all'||r.project===project)),inconsistent};
  }
  function overlap(model, question, existing=[]) {
    const r=retrieve(model,question);
    const keys=r.topics.map(t=>t.id);
    return {studies:r.studies,public:r.public,requests:existing.filter(x=>topicsFor(model,x.question).some(t=>keys.includes(t.id))),gap:r.approved.length?'Check relevance and sufficiency of approved excerpts.':'No approved Quest customer excerpts are available for this question.',note:'Topic overlap is a review cue, not proof that studies are duplicates or that the decision is answered.'};
  }
  function validEvidence(r) {
    const required=['title','project','topic','kbq','method','segment','geography','period','sample','summary','source','locator','limitations'];
    return required.filter(k=>!String(r[k]||'').trim() || /^(unknown|not recorded|n\/a)$/i.test(String(r[k]).trim()));
  }
  const can = (role,action) => action==='read'||action==='export'||(role==='Hub Owner')||(role==='Contributor'&&['request','evidence'].includes(action));
  window.QuestMaciModel={IDS,canonical,build,retrieve,topicsFor,health,overlap,validEvidence,conflicts,can,ageMonths};
})();
