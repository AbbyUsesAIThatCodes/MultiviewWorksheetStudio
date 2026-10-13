import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {build} from 'esbuild';
import {reserveCi} from './reserve-ci.mjs';
const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
const revision=git('rev-parse','HEAD'),release=JSON.parse(await fs.readFile('release.json','utf8'));
async function reserveLocal(){
const ledgerDir=path.join(git('rev-parse','--git-dir'),'teacher-builds');await fs.mkdir(ledgerDir,{recursive:true});
const lock=path.join(ledgerDir,'lock');
for(let i=0;;i++){try{await fs.mkdir(lock);break;}catch(e){if(e.code!=='EEXIST'||i>100)throw e;await new Promise(r=>setTimeout(r,30));}}
let identity;
try{try{identity=JSON.parse(await fs.readFile(path.join(ledgerDir,'ledger.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;identity={scope:`local-teacher-${randomUUID().slice(0,8)}`,ordinal:0};}identity.ordinal++;await fs.writeFile(path.join(ledgerDir,'ledger.json'),JSON.stringify(identity));}finally{await fs.rmdir(lock);}
return identity;
}
const identity=process.env.GITHUB_ACTIONS==='true'?await reserveCi({repository:process.env.GITHUB_REPOSITORY,token:process.env.GITHUB_TOKEN,revision,ref:process.env.GITHUB_REF,event:JSON.parse(await fs.readFile(process.env.GITHUB_EVENT_PATH,'utf8'))}):await reserveLocal();
const hash=createHash('sha256');
async function fingerprint(p){const s=await fs.stat(p);if(s.isDirectory())for(const f of (await fs.readdir(p)).sort())await fingerprint(path.join(p,f));else hash.update(p.replaceAll('\\','/')).update(await fs.readFile(p));}
for(const p of ['teacher','vendor','release.json','package.json','package-lock.json','THIRD_PARTY_NOTICES.md','.github/workflows'])await fingerprint(p);
const sourceFingerprint=hash.digest('hex'),dirty=Boolean(git('status','--porcelain')),builtAt=new Date().toISOString();
const stamp=builtAt.replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
const id=`${release.version}_${release.slug}_${identity.scope}_build-${String(identity.ordinal).padStart(3,'0')}_${stamp}_g${revision.slice(0,12)}${dirty?`-dirty-${sourceFingerprint.slice(0,10)}`:''}_teacher`;
const output=path.join('builds',id),manifest={...release,...identity,id,builtAt,sourceRevision:revision,dirty,sourceFingerprint,target:'teacher-companion'};
console.log(`BUILD START ${id}`);
try{
 await fs.mkdir(output,{recursive:true});
 await build({entryPoints:['teacher/app.mjs'],bundle:true,format:'esm',target:'es2022',outfile:path.join(output,'app.js'),legalComments:'linked'});
 await fs.mkdir(path.join(output,'licenses'),{recursive:true});
 for(const name of ['pdf-lib','@pdf-lib/fontkit','@pdf-lib/standard-fonts','@pdf-lib/upng','pako','tslib']){
  const directory=path.join('node_modules',name);
  for(const file of await fs.readdir(directory))if(/^(license|copyright)/i.test(file))await fs.copyFile(path.join(directory,file),path.join(output,'licenses',name.replaceAll('/','-').replace('@','')+'-'+file));
 }
 await fs.copyFile('THIRD_PARTY_NOTICES.md',path.join(output,'THIRD_PARTY_NOTICES.md'));
 // fontkit's published package places its MIT notice in README, not a LICENSE file.
 for(const file of ['README.md','package.json'])await fs.copyFile(path.join('node_modules/@pdf-lib/fontkit',file),path.join(output,'licenses','pdf-lib-fontkit-'+file));
 const fontkitSource=await fs.readFile('node_modules/@pdf-lib/fontkit/dist/fontkit.es.js','utf8');
 const notices=(fontkitSource.match(/\/\*[\s\S]*?\*\/|(?:^[ \t]*\/\/.*\r?\n)+/gm)||[]).filter(c=>/copyright|licen[sc]e/i.test(c));
 await fs.writeFile(path.join(output,'licenses','pdf-lib-fontkit-bundled-notices.txt'),notices.join('\n\n'));
 await fs.copyFile('teacher/style.css',path.join(output,'style.css'));await fs.cp('vendor/multiview-mystery/fonts',path.join(output,'fonts'),{recursive:true});await fs.cp('teacher/fonts',path.join(output,'fonts'),{recursive:true});
 await fs.writeFile(path.join(output,'index.html'),(await fs.readFile('teacher/index.html','utf8')).replace('Live Development · Local Teacher Companion',id));
 await fs.writeFile(path.join(output,'build-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 await fs.writeFile(path.join(output,'BUILD-REPORT.md'),`# Teacher Build Report\n\nBuild: ${id}\n\nSource: ${revision}\n\nBuilt At: ${builtAt}\n\nSource Fingerprint: ${sourceFingerprint}\n\nStatus: Packaged. See docs/MIGRATION.md for test evidence.\n`);
 await fs.writeFile('builds/teacher-latest.json',JSON.stringify({id,path:output,manifest},null,2)+'\n');
 if(process.env.GITHUB_OUTPUT)await fs.appendFile(process.env.GITHUB_OUTPUT,`id=${id}\npath=${output.replaceAll('\\','/')}\n`);
 if(process.env.GITHUB_STEP_SUMMARY)await fs.appendFile(process.env.GITHUB_STEP_SUMMARY,`## Worksheet Build\n\n\`${id}\`\n\nSource: \`${revision}\`\n`);
 console.log(`BUILD SUCCESS ${id}`);
}catch(e){console.error(`BUILD FAILED ${id}`);throw e;}
