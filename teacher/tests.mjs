import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
import {createCanvas} from '@napi-rs/canvas';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {example,projection,isoPoint,isoFaces,editModel,validateSave,ambiguityMessage,views} from './geometry.mjs';
import {drawing} from './drawing.mjs';
import {createPdf} from './pdf.mjs';
const latest=JSON.parse(await fs.readFile('builds/teacher-latest.json','utf8'));
const output=path.resolve('test-results/teacher',latest.id);await fs.mkdir(output,{recursive:true});
const checks=[],ok=(v,label)=>{assert(v,label);checks.push(label);};
const n=null;
assert.deepEqual(projection(example,'front').depths,[[n,n,n,n],[0,n,n,n],[0,1,0,n],[1,2,0,n]]);checks.push('Asymmetric front heights and depths match hand-calculated coordinates');
assert.deepEqual(projection(example,'top').depths,[[2,0,1,n],[0,1,n,n],[n,0,n,n],[n,n,n,n]]);checks.push('Asymmetric top: back at top, front at bottom; X unmirrored');
assert.deepEqual(projection(example,'right').depths,[[n,n,n,n],[n,n,n,0],[n,n,1,2],[n,1,1,2]]);checks.push('Asymmetric right: front at left, back at right; height aligned');
assert.deepEqual(isoPoint([0,1,0]),[0,-1]);ok(isoPoint([1,0,0])[0]>0&&isoPoint([0,0,1])[0]<0,'Isometric right direction and front direction agree with editor');
ok(projection([[0,0,0],[1,0,0]],'front').edges.length===6,'Coplanar orthographic seam omitted');
ok(isoFaces([[0,0,0],[1,0,0]]).flatMap(f=>f.edges).filter(Boolean).length===16,'Isometric coplanar seams omitted');
ok(editModel([[0,0,0],[0,1,0]],[0,0,0],'remove').error,'Unsupported removal rejected');
ok(editModel([[0,0,0],[1,0,0],[2,0,0]],[1,0,0],'remove').error,'Disconnecting removal rejected');
ok(editModel([],[-1,0,0],'add').error,'Out-of-bounds add rejected');
let fields={title:'Asymmetric Practice',name:'',date:'',bell:''};
const state={cubes:example,fields,populated:{iso:true,top:false,front:false,right:false}};
assert.deepEqual(validateSave({format:'multiview-worksheet',version:1,...state}),state);checks.push('Version 1 file roundtrip preserves model and worksheet');
assert.throws(()=>validateSave({format:'multiview-worksheet',version:1,cubes:[[5,0,0]]}));checks.push('Malformed model rejected');
ok(ambiguityMessage([[0,0,0],[0,0,1]],{front:true,top:false,right:false,iso:false}).includes('Ambiguous'),'Known ambiguous evidence is detected');
for(let bits=0;bits<16;bits++){
 const populated=Object.fromEntries(views.map((v,i)=>[v,Boolean(bits&(1<<i))]));
 const draw=drawing({...state,populated});
 for(const o of draw)if(o.t==='line')ok([o.x1,o.x2].every(x=>x>=24&&x<=588)&&[o.y1,o.y2].every(y=>y>=24&&y<=768),`Page bounds ${bits}`);
 if(bits===0)ok(!draw.some(o=>o.t==='poly'),'No shape polygons in all-blank student display list');
}
// Use existing artifact: a test run must never mint a new build identity.
const before=await fs.readFile('.git/teacher-builds/ledger.json','utf8');
process.env.PORT='0';const {server}=await import('./serve.mjs');if(!server.listening)await new Promise(r=>server.once('listening',r));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||undefined});
const page=await browser.newPage({viewport:{width:1540,height:1050}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
const url=`http://127.0.0.1:${server.address().port}`;
const count=async()=>Number((await page.locator('#cube-count').innerText()).split(' ')[0]);
const download=async(id,name)=>{const pending=page.waitForEvent('download');await page.locator(id).click();const file=await pending;await file.saveAs(path.join(output,name));};
try{
 await page.goto(url);await page.locator('#student').waitFor();await page.evaluate(()=>document.fonts.ready);
 ok(await count()===10,'Example opens with 10 cubes');
 ok(await page.locator('#missing-wrap').isHidden(),'Missing-view control hidden for isometric preset');
 ok(await page.locator('#build-identity').innerText()===latest.id,'Visible full ID matches manifest and enclosing artifact');
 await page.locator('#title').fill('Asymmetric Practice');
 await download('#student','sample-student.pdf');await download('#key','sample-teacher-key.pdf');
 await page.screenshot({path:path.join(output,'studio-desktop.png'),fullPage:true});
 await page.locator('[data-tool=remove]').click();ok(await page.locator('[data-tool][aria-pressed=true]').count()===1,'Editing modes are mutually exclusive');
 const box=await page.locator('#scene').boundingBox(),initial=await count();
 for(const t of ['add','remove']){await page.locator(`[data-tool=${t}]`).click();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+90,box.y+box.height/2-50,{steps:8});await page.mouse.up();ok(await count()===initial,`Mouse drag in ${t} rotates without edit`);}
 await page.locator('#clear').click();ok(await count()===0,'Clear supports empty model');ok(await page.locator('#student').isDisabled()&&await page.locator('#key').isDisabled(),'Empty export blocked');
 await page.locator('#title').fill('Keep This Title');await page.locator('#undo').click();ok(await count()===10,'Undo restores cleared model');ok(await page.locator('#title').inputValue()==='Keep This Title','Model undo preserves later field edits');await page.locator('#title').fill('Asymmetric Practice');await page.locator('#clear').click();
 await page.locator('summary').click();await page.locator('[data-tool=add]').click();
 for(let i=1;i<=4;i++){await page.locator('#y').fill(String(i));await page.locator('#edit-coordinate').click();}ok(await count()===4,'Repeated coordinate adds build a tower');
 await page.locator('#edit-coordinate').click();ok(await count()===4,'Duplicate edit rejected');
 await page.locator('[data-tool=remove]').click();await page.locator('#y').fill('1');await page.locator('#edit-coordinate').click();ok(await count()===4,'Browser rejects unsupported removal');
 for(let i=4;i>=1;i--){await page.locator('#y').fill(String(i));await page.locator('#edit-coordinate').click();}ok(await count()===0,'Repeated removes reach empty model');
 await page.locator('[data-tool=add]').click();await page.locator('[data-view=top]').click();
 // Original Scene: top view maps floor coordinates directly to X and Z in screen space.
 const p=await page.locator('#scene').evaluate(el=>{const r=el.getBoundingClientRect(),s=Math.min(r.width/8.4,r.height/6.8);return{x:r.left+r.width/2-1.5*s,y:r.top+r.height/2-1.5*s};});
 await page.mouse.click(p.x,p.y);ok(await count()===1,'Pointer floor click adds a cube');await page.locator('[data-tool=remove]').click();await page.mouse.click(p.x,p.y);ok(await count()===0,'Pointer face click removes a cube');
 await page.locator('#example').click();await page.locator('#preset').selectOption('orthos');
 for(const v of views)ok(await page.locator(`[data-pop=${v}]`).isChecked()===(v!=='iso'),`Three-view preset ${v}`);
 await page.locator('#preset').selectOption('missing');await page.locator('#missing').selectOption('top');
 ok(await page.locator('#missing-wrap').isVisible(),'Missing-view selector appears for its preset');
 for(const v of views)ok(await page.locator(`[data-pop=${v}]`).isChecked()===(v!=='top'),`Missing-view preset ${v}`);
 await page.locator('[data-pop=iso]').uncheck();ok(await page.locator('#preset').inputValue()==='custom','Checkbox edits make custom view selection');
 await page.locator('#name').fill('Practice Group');await download('#save','saved-model.json');
 const saved=JSON.parse(await fs.readFile(path.join(output,'saved-model.json'),'utf8'));ok(saved.cubes.length===10&&saved.fields.name==='Practice Group','Save captures fields and cubes');
 await page.reload();ok(await count()===10&&await page.locator('#name').inputValue()==='Practice Group','Browser autosave survives reload');
 await page.locator('#clear').click();await page.locator('#file').setInputFiles(path.join(output,'saved-model.json'));await page.waitForFunction(()=>document.querySelector('#status').textContent==='Opened saved worksheet.');ok(await count()===10&&await page.locator('[data-pop=top]').isChecked()===false,'Open restores model and view selection');
 await page.locator('#file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"version":999}')});await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Could not open model:'));ok(await count()===10,'Invalid save does not replace model');
 await page.locator('#name').fill('');await page.locator('#preset').selectOption('iso');
 await page.locator('#key-preview').check();ok((await page.locator('#preview').textContent()).includes('TEACHER ANSWER KEY'),'Key preview labels answers clearly');await page.locator('#key-preview').uncheck();
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(output,'studio-phone.png'),fullPage:true});ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Phone has no horizontal overflow');
 // Real touch drag on reused editor; no cube edits on release.
 const touch=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await touch.goto(url);const tb=await touch.locator('#scene').boundingBox(),cdp=await touch.context().newCDPSession(touch);
 for(const tool of ['add','remove']){await touch.locator(`[data-tool=${tool}]`).click();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:tb.x+140,y:tb.y+150}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:tb.x+210,y:tb.y+110}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});ok((await touch.locator('#cube-count').innerText()).startsWith('10 '),`Touch drag in ${tool} does not edit`);}await touch.close();
 ok(errors.length===0,`No browser errors: ${errors.join('; ')}`);
}finally{await browser.close();server.close();}
// Render actual downloaded PDFs with PDF.js; inspect dimensions, text, and page pixels.
async function renderPdf(bytes,name){const loading=getDocument({data:new Uint8Array(bytes),useSystemFonts:false});const doc=await loading.promise;ok(doc.numPages===1,`${name}: one page`);const p=await doc.getPage(1);assert.deepEqual(p.view,[0,0,612,792]);const vp=p.getViewport({scale:1.5}),canvas=createCanvas(vp.width,vp.height);await p.render({canvasContext:canvas.getContext('2d'),viewport:vp}).promise;const text=(await p.getTextContent()).items.map(i=>i.str).join(' '),metadata=await doc.getMetadata();await fs.writeFile(path.join(output,`${name}.png`),canvas.toBuffer('image/png'));await loading.destroy();return{canvas,text,metadata};}
const student=await renderPdf(await fs.readFile(path.join(output,'sample-student.pdf')),'student-render'),key=await renderPdf(await fs.readFile(path.join(output,'sample-teacher-key.pdf')),'key-render');
ok(!student.text.includes('10 cubes')&&!student.text.includes('ANSWER KEY'),'Student PDF does not reveal key label or cube count');ok(key.text.includes('10 cubes')&&key.text.includes('TEACHER ANSWER KEY'),'Key PDF includes full authored-model context');
ok(student.metadata.info.Creator.includes(latest.id)&&key.metadata.info.Creator.includes(latest.id),'Both actual PDFs retain build identity');
const fonts={regular:new Uint8Array(await fs.readFile('teacher/fonts/comic-neue-regular.ttf')),bold:new Uint8Array(await fs.readFile('teacher/fonts/comic-neue-bold.ttf'))};
const blank={...state,populated:{iso:false,top:false,front:false,right:false}};
const blankA=await renderPdf(await createPdf(blank,false,fonts,latest.manifest),'blank-a');
const blankB=await renderPdf(await createPdf({...blank,cubes:[[3,0,3]]},false,fonts,latest.manifest),'blank-b');
ok(blankA.canvas.toBuffer('image/png').equals(blankB.canvas.toBuffer('image/png')),'All-blank actual PDFs are pixel-identical across different hidden models');
function region(canvas,x,y,w,h){return Buffer.from(canvas.getContext('2d').getImageData(x*1.5,y*1.5,w*1.5,h*1.5).data);}
for(const [v,x,y] of [['top',70,212],['front',70,472],['right',346,472]])ok(region(student.canvas,x,y,184,182).equals(region(blankA.canvas,x,y,184,182)),`${v}: student blank grid contains zero leaked answer pixels`);
// Check black edge pixels at hand-derived locations on the actual key raster, away from text.
const dark=(x,y)=>{const a=key.canvas.getContext('2d').getImageData(Math.round(x*1.5)-1,Math.round(y*1.5)-1,3,3).data;for(let i=0;i<a.length;i+=4)if(a[i]<100&&a[i+1]<120&&a[i+2]<130)return true;return false;};
ok(dark(99,520)&&dark(183,562),'Front PDF silhouette follows hand-calculated asymmetric heights');
ok(dark(417,646)&&dark(501,520),'Right PDF has front at left and tall back at right');
ok(dark(78,261)&&dark(141,344),'Top PDF uses X alignment and back-to-front depth');
ok(!dark(99,562),'No coplanar cube seam leaks into the front PDF');
const full=Array.from({length:64},(_,i)=>[i%4,Math.floor(i/4)%4,Math.floor(i/16)]);
const fullState={...state,cubes:full,fields:{...fields,title:'Full Building Space'},populated:{iso:true,top:true,front:true,right:true}};
const fullBytes=await createPdf(fullState,true,fonts,latest.manifest);await fs.writeFile(path.join(output,'full-space-key.pdf'),fullBytes);await renderPdf(fullBytes,'full-space-key');
for(const face of isoFaces(full))for(const [u,w] of face.points){const px=318+122+u*23,py=170+132+w*23;ok(px>=336&&px<=562&&py>=202&&py<400,'Maximum isometric model stays clear of labels and captions');}
const originalBytes=await fs.readFile(path.join(output,'sample-student.pdf'));
const pdfTask=getDocument({data:new Uint8Array(originalBytes)});const pdfDoc=await pdfTask.promise;ok(await pdfDoc.getAttachments()===null,'Student PDF has no embedded model or answer attachment');await pdfTask.destroy();
const second=[[0,0,3],[0,1,3],[1,0,3],[1,0,2],[2,0,2],[2,1,2],[2,2,2]];
assert.deepEqual(projection(second,'front').depths,[[n,n,n,n],[n,n,2,n],[3,n,2,n],[3,3,2,n]]);
assert.deepEqual(projection(second,'right').depths,[[n,n,n,n],[n,2,n,n],[0,2,n,n],[1,2,n,n]]);
assert.deepEqual(projection(second,'top').depths,[[n,n,n,n],[n,n,n,n],[n,0,2,n],[1,0,n,n]]);checks.push('Second asymmetric front-loaded fixture matches independent matrices');
const secondBytes=await createPdf({...fullState,cubes:second,fields:{...fields,title:'Front-Loaded Asymmetry'}},true,fonts,latest.manifest);await fs.writeFile(path.join(output,'second-asymmetric-key.pdf'),secondBytes);await renderPdf(secondBytes,'second-asymmetric-key');
const longBytes=await createPdf({...state,fields:{title:'W'.repeat(60),name:'W'.repeat(36),date:'W'.repeat(36),bell:'W'.repeat(36)}},false,fonts,latest.manifest);await fs.writeFile(path.join(output,'long-fields.pdf'),longBytes);await renderPdf(longBytes,'long-fields');
ok(await fs.readFile('.git/teacher-builds/ledger.json','utf8')===before,'Reusing artifact for tests preserves build identity');
const result={id:latest.id,passed:checks.length,checks:[...new Set(checks)],browserErrors:errors};await fs.writeFile(path.join(output,'results.json'),JSON.stringify(result,null,2));console.log(`PASS ${checks.length} assertions; evidence: ${output}`);
