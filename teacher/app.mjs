import {Scene} from '../vendor/multiview-mystery/scene.mjs';
import {example,editModel,validateSave,ambiguityMessage,views} from './geometry.mjs';
import {svg} from './drawing.mjs';
import {createPdf} from './pdf.mjs';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const storageKey='multiview-worksheet-v1';
let state={cubes:structuredClone(example),fields:{title:'Multiview Practice',name:'',date:'',bell:''},populated:{iso:true,top:false,front:false,right:false}},history=[],tool='add';
let build={id:'Live Development · Local Teacher Companion'};
try{build=await (await fetch('build-manifest.json')).json();}catch{}
$('#build-identity').textContent=build.id;
let restoration='';try{const saved=localStorage.getItem(storageKey);if(saved){state=validateSave(JSON.parse(saved));restoration='Restored your last worksheet.';}}catch{restoration='Could not restore the last worksheet. You can open a saved model file.';}
const scene=new Scene($('#scene'),{onEdit:edit});
const status=s=>$('#status').textContent=s;
function persist(){try{localStorage.setItem(storageKey,JSON.stringify(saveData()));}catch{status('Browser autosave is unavailable. Use Save Model to keep your work.');}}
function saveData(){return {format:'multiview-worksheet',version:1,...state};}
function render(){scene.set(state.cubes,tool);$('#cube-count').textContent=`${state.cubes.length} Cubes`;$('#undo').disabled=!history.length;$('#preview').innerHTML=svg(state,$('#key-preview').checked);$('#ambiguity').textContent=ambiguityMessage(state.cubes,state.populated);for(const b of $$('.exports button'))b.disabled=!state.cubes.length;persist();}
function syncFields(){for(const k of ['title','name','date','bell'])$('#'+k).value=state.fields[k];for(const c of $$('[data-pop]'))c.checked=state.populated[c.dataset.pop];$('#preset').value='custom';$('#missing-wrap').hidden=true;}
function checkpoint(whole=false){history.push(structuredClone(whole?{state}:{cubes:state.cubes}));if(history.length>80)history.shift();}
function edit(c,mode=tool){const result=editModel(state.cubes,c,mode);if(result.error)return status(result.error);checkpoint();state.cubes=result.cubes;status(`${mode==='add'?'Added':'Removed'} cube at (${c.map(n=>n+1).join(', ')}).`);render();}
for(const b of $$('[data-tool]'))b.onclick=()=>{tool=b.dataset.tool;for(const t of $$('[data-tool]'))t.setAttribute('aria-pressed',String(t===b));scene.set(state.cubes,tool);status(`${tool==='add'?'Add':'Remove'} Cube selected. Drag to orbit; click to edit.`);};
for(const b of $$('[data-view]'))b.onclick=()=>scene.setView(b.dataset.view);
$('#edit-coordinate').onclick=()=>edit(['x','y','z'].map(k=>Number($('#'+k).value)-1));
$('#clear').onclick=()=>{if(state.cubes.length){checkpoint();state.cubes=[];render();status('Model cleared. Click a floor square to start, or Undo to restore.');}};
$('#undo').onclick=()=>{if(history.length){const previous=history.pop();if(previous.state){state=previous.state;syncFields();}else state.cubes=previous.cubes;render();status('Undid the last model change.');}};
$('#example').onclick=()=>{checkpoint();state.cubes=structuredClone(example);scene.setView('iso');render();status('Loaded an asymmetric example. Undo restores your previous model.');};
for(const k of ['title','name','date','bell'])$('#'+k).oninput=()=>{state.fields[k]=$('#'+k).value;render();};
function preset(){const p=$('#preset').value;$('#missing-wrap').hidden=p!=='missing';if(p==='custom')return;state.populated=Object.fromEntries(views.map(v=>[v,p==='iso'?v==='iso':p==='orthos'?v!=='iso':v!==$('#missing').value]));for(const c of $$('[data-pop]'))c.checked=state.populated[c.dataset.pop];render();}
$('#preset').onchange=preset;$('#missing').onchange=preset;
for(const c of $$('[data-pop]'))c.onchange=()=>{state.populated[c.dataset.pop]=c.checked;$('#preset').value='custom';$('#missing-wrap').hidden=true;render();};
$('#key-preview').onchange=render;
function download(bytes,name,type){const url=URL.createObjectURL(new Blob([bytes],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
$('#save').onclick=()=>{download(JSON.stringify(saveData(),null,2),'multiview-model.json','application/json');status('Saved worksheet model, fields, and view choices.');};
$('#load').onclick=()=>$('#file').click();
$('#file').onchange=async()=>{try{const f=$('#file').files[0];if(!f)return;if(f.size>100000)throw Error('Choose a model JSON file smaller than 100 KB.');const next=validateSave(JSON.parse(await f.text()));checkpoint(true);state=next;syncFields();render();status('Opened saved worksheet.');}catch(e){status(`Could not open model: ${e.message}`);}finally{$('#file').value='';}};
let fonts;
async function exportPdf(answer){
 if(!state.cubes.length)return status('Add a cube before exporting.');
 const snapshot=structuredClone(state);status('Preparing your PDF…');for(const b of $$('.exports button'))b.disabled=true;
 try{fonts??=Promise.all(['regular','bold'].map(async n=>new Uint8Array(await (await fetch(`fonts/comic-neue-${n}.ttf`)).arrayBuffer()))).then(([regular,bold])=>({regular,bold}));const bytes=await createPdf(snapshot,answer,await fonts,build);const safe=(snapshot.fields.title||'Multiview Practice').replace(/[^a-z0-9 -]/gi,'').trim().replace(/ +/g,'-').slice(0,60)||'Multiview';download(bytes,`${safe}-${answer?'Teacher-Key':'Student'}.pdf`,'application/pdf');status(`${answer?'Teacher key':'Student worksheet'} PDF ready. Print at Actual Size on Letter paper.`);}catch(e){fonts=null;status(`PDF export failed: ${e.message}`);}finally{for(const b of $$('.exports button'))b.disabled=!state.cubes.length;}
}
$('#student').onclick=()=>exportPdf(false);$('#key').onclick=()=>exportPdf(true);
if(restoration)syncFields();render();if(restoration)status(restoration);
