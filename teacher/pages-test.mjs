import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {reserveCi} from './reserve-ci.mjs';
const latest=JSON.parse(await fs.readFile('builds/teacher-latest.json','utf8')),root=path.resolve(latest.path),base='/MultiviewWorksheetStudio/';
const checks=[],ok=(v,s)=>{assert(v,s);checks.push(s);};
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.ttf':'font/ttf'};
const server=http.createServer(async(req,res)=>{try{const pathname=new URL(req.url,'http://localhost').pathname;if(!pathname.startsWith(base)){res.writeHead(404);return res.end();}const rel=decodeURIComponent(pathname.slice(base.length))||'index.html',file=path.resolve(root,rel);if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||undefined});
const page=await browser.newPage(),requests=[],failures=[],errors=[],downloads=[];
page.on('request',r=>requests.push({url:r.url(),method:r.method()}));page.on('response',r=>{if(r.status()>=400)failures.push(r.url());});page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',async route=>route.request().url().startsWith(origin+base)?route.continue():route.abort());
try{
 await page.goto(origin+base);await page.evaluate(()=>document.fonts.ready);
 ok(await page.locator('#build-identity').innerText()===latest.id,'Project subpath loads exact build identity');
 for(const id of ['student','key']){const pending=page.waitForEvent('download');await page.locator('#'+id).click();const file=await pending;const data=await fs.readFile(await file.path());ok(data.subarray(0,5).toString()==='%PDF-',`${id}: direct PDF export works from project subpath`);downloads.push({name:file.suggestedFilename(),bytes:data.length});}
 ok(requests.some(r=>r.url.endsWith('.woff2'))&&requests.some(r=>r.url.endsWith('.ttf')),'UI and PDF fonts resolve under project base path');
 ok(requests.every(r=>r.url.startsWith(origin+base)&&r.method==='GET'),'No external runtime requests or data writes');
 ok(failures.length===0&&errors.length===0,'No missing assets or browser errors at project subpath');
 await page.locator('#title').fill('Local Worksheet');await page.reload();ok(await page.locator('#title').inputValue()==='Local Worksheet','Autosave works at hosted project path');
 // Warm PDF fonts again after reload, then emulate an Internet outage in the open tab.
 const warm=page.waitForEvent('download');await page.locator('#student').click();await warm;
 await page.context().setOffline(true);await page.locator('#title').fill('Offline After Loading');
 const offline=page.waitForEvent('download');await page.locator('#key').click();ok(!(await (await offline).failure()),'Loaded tab can edit and export offline after fonts are loaded');
 await page.context().setOffline(false);
}finally{await browser.close();await new Promise(r=>server.close(r));}
// Test the remote allocator's conflict retry without calling or mutating GitHub.
const refs=[];const request=async(url,opt)=>{
 if(!opt.method){const prefix='refs/'+url.split('/git/matching-refs/')[1];return{ok:true,json:async()=>structuredClone(refs.filter(r=>r.ref.startsWith(prefix)))};}
 const body=JSON.parse(opt.body);if(refs.some(r=>r.ref===body.ref))return{ok:false,status:422};refs.push({ref:body.ref});return{ok:true};
};
const input={repository:'Owner/Repo',token:'test-only',revision:'a'.repeat(40),ref:'refs/heads/main',request};
const reserved=await Promise.all([reserveCi(input),reserveCi(input)]);ok(new Set(reserved.map(x=>x.ordinal)).size===2,'Concurrent mocked CI reservations remain unique after collision');
const prReservation=await reserveCi({...input,event:{pull_request:{number:7,head:{sha:'b'.repeat(40)}}}});ok(prReservation.scope==='pr-7'&&prReservation.ordinal===1,'New PR starts its own ordinal at one');
await assert.rejects(()=>reserveCi({...input,ref:'refs/heads/unreviewed'}));checks.push('Arbitrary CI branch cannot be mislabeled main');
const output=path.join('test-results','teacher',latest.id);await fs.mkdir(output,{recursive:true});await fs.writeFile(path.join(output,'pages-results.json'),JSON.stringify({id:latest.id,base,checks,requests,downloads,errors},null,2));console.log(`PASS ${checks.length} Pages/CI readiness checks. No deployment performed.`);
