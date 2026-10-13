import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
const run=()=>new Promise((resolve,reject)=>{const p=spawn(process.execPath,['teacher/build.mjs'],{stdio:['ignore','pipe','pipe']});let out='';p.stdout.on('data',d=>out+=d);p.stderr.on('data',d=>out+=d);p.on('error',reject);p.on('close',code=>code?reject(Error(out)):resolve(out));});
const runs=await Promise.all([run(),run()]);
const ids=runs.map(r=>r.match(/BUILD SUCCESS (.+)/)[1]);assert.notEqual(ids[0],ids[1]);
const manifests=await Promise.all(ids.map(id=>fs.readFile(`builds/${id}/build-manifest.json`,'utf8').then(JSON.parse)));
assert.equal(manifests[0].scope,manifests[1].scope);assert.equal(Math.abs(manifests[0].ordinal-manifests[1].ordinal),1);
for(const m of manifests){const html=await fs.readFile(`builds/${m.id}/index.html`,'utf8'),report=await fs.readFile(`builds/${m.id}/BUILD-REPORT.md`,'utf8');assert(html.includes(m.id));assert(report.includes(m.id));assert.equal(m.builtAt.replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z'),m.id.match(/_(\d{8}T\d{6}Z)_/)[1]);}
await fs.mkdir('test-results/teacher',{recursive:true});await fs.writeFile('test-results/teacher/build-identity.json',JSON.stringify({concurrentAllocation:'passed',ids,manifests},null,2));console.log(runs.join('\n'));console.log('PASS: concurrent builds reserve unique sequential ordinals; console, filename, UI, manifest and report agree.');
