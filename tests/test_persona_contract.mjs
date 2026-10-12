import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const data=JSON.parse(readFileSync('data/persona-intelligence.json','utf8'));
assert.equal(data.schema_version,1);
assert.deepEqual(Object.keys(data.personas),['executive','strategy','maci','operations']);
assert.equal(data.workflow_stages[0],'Observed');
assert.equal(data.workflow_stages.at(-1),'Monitoring');
const sources=new Set(data.capabilities.map(x=>x.id));
assert.equal(sources.size,data.capabilities.length);
for(const c of data.capabilities){assert.match(c.url,/^https:\/\//);assert.ok(c.scope&&c.capability&&c.question);}
for(const o of data.opportunities){assert.ok(o.id&&o.problem&&o.validation&&o.projects.length);for(const id of o.sources)assert.ok(sources.has(id));}
for(const p of Object.values(data.personas)){assert.ok(p.assistant&&p.lens);assert.equal(p.reports.length,4);}
const engine=readFileSync('integrations/persona-intelligence.js','utf8');
assert.ok(engine.includes('scopedModel'));assert.ok(engine.includes("can('review')"));assert.ok(engine.includes('Evidence-backed'));
assert.ok(readFileSync('integrations/team-workspaces.js','utf8').includes('quest360-session-v2'));
assert.ok(readFileSync('scripts/build_pages_materialized.py','utf8').includes(data.release));
console.log('Persona source and provenance contracts passed.');
