import {SIZE,projection,key,rules,signature} from '../vendor/multiview-mystery/logic.mjs';
export {SIZE,projection,rules};
export const views=['iso','top','front','right'];
export const names={iso:'Isometric',top:'Top',front:'Front',right:'Right Side'};
export const example=[[0,0,0],[0,1,0],[0,2,0],[1,0,0],[2,0,0],[2,1,0],[0,0,1],[1,0,1],[1,1,1],[1,0,2]];
export const isoPoint=([x,y,z])=>[(x-z)*Math.sqrt(3)/2,(x+z)/2-y];
const faces=[{n:[1,0,0],p:[[1,0,0],[1,1,0],[1,1,1],[1,0,1]]},{n:[0,1,0],p:[[0,1,0],[0,1,1],[1,1,1],[1,1,0]]},{n:[0,0,1],p:[[0,0,1],[1,0,1],[1,1,1],[0,1,1]]}];
export function isoFaces(cubes){
 const occupied=new Set(cubes.map(key)),out=[];
 for(const c of cubes)for(const f of faces){
  if(occupied.has(key(c.map((v,i)=>v+f.n[i]))))continue;
  const points=f.p.map(p=>p.map((v,i)=>v+c[i]));
  const edges=points.map((p,i)=>{
   const b=points[(i+1)%4],mid=p.map((v,j)=>(v+b[j])/2),center=c.map((v,j)=>v+.5+f.n[j]*.5);
   const across=mid.map((v,j)=>Math.round(2*(v-center[j]))),neighbor=c.map((v,j)=>v+across[j]);
   // Coplanar exposed faces share no visible seam. A raised neighbor creates a real edge.
   return !occupied.has(key(neighbor))||occupied.has(key(neighbor.map((v,j)=>v+f.n[j])));
  });
  out.push({points:points.map(isoPoint),edges,depth:points.reduce((s,p)=>s+p[0]+p[1]+p[2],0)/4});
 }
 return out.sort((a,b)=>a.depth-b.depth);
}
export function editModel(cubes,c,mode){
 if(!Array.isArray(c)||c.some(v=>!Number.isInteger(v)||v<0||v>=SIZE))return {error:'Keep cubes inside the 4 × 4 × 4 space.'};
 const exists=cubes.some(v=>key(v)===key(c));
 if(mode==='add'&&exists)return {error:'That space already has a cube.'};
 if(mode==='remove'&&!exists)return {error:'There is no cube in that space.'};
 const next=mode==='add'?[...cubes,c]:cubes.filter(v=>key(v)!==key(c));
 const valid=next.length?rules(next):{ok:true};return valid.ok?{cubes:next}:{error:valid.reason};
}
export function validateSave(value){
 if(value?.format!=='multiview-worksheet'||value.version!==1||!Array.isArray(value.cubes)||value.cubes.length>64)throw Error('Choose a Multiview Worksheet model file (version 1).');
 if(value.cubes.length&&!rules(value.cubes).ok)throw Error('The saved cubes must be supported, joined, and inside the grid.');
 const fields={};for(const k of ['title','name','date','bell']){if(typeof value.fields?.[k]!=='string'||value.fields[k].length>(k==='title'?60:36))throw Error('The file has invalid worksheet fields.');fields[k]=value.fields[k];}
 if(views.some(v=>typeof value.populated?.[v]!=='boolean'))throw Error('The file has invalid view choices.');
 return {cubes:structuredClone(value.cubes),fields,populated:Object.fromEntries(views.map(v=>[v,value.populated[v]]))};
}
export function ambiguityMessage(cubes,populated){
 if(!views.some(v=>populated[v]))return 'No given views selected. This sheet provides blank grids only.';
 if(!populated.iso){
  const evidence=views.filter(v=>v!=='iso'&&populated[v]);
  for(let x=0;x<SIZE;x++)for(let z=0;z<SIZE;z++){
   const h=cubes.filter(c=>c[0]===x&&c[2]===z).length;
   for(const [y,mode] of [[h,'add'],[h-1,'remove']]){
    const alt=editModel(cubes,[x,y,z],mode).cubes;
    if(alt?.length&&evidence.every(v=>signature(projection(cubes,v))===signature(projection(alt,v))))return 'Ambiguous evidence: another supported model matches the selected drawings. Accept valid alternatives; the key shows your model.';
   }
  }
 }
 return 'Views can hide cubes or leave a missing view ambiguous. The key shows your model; it does not prove a unique solution.';
}
