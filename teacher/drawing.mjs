import {projection,isoFaces,names,views} from './geometry.mjs';
const ink='#263b44',grid='#d3d9dc';
const esc=s=>String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// One vector display list powers preview and PDF. Coordinates are Letter points, top down.
export function drawing(state,answer=false){
 const out=[];
 const line=(x1,y1,x2,y2,color=ink,width=1)=>out.push({t:'line',x1,y1,x2,y2,color,width});
 const text=(s,x,y,size=11,bold=false,maxWidth=570-x)=>out.push({t:'text',s,x,y,size,bold,maxWidth,color:ink});
 const rect=(x,y,w,h,color=ink,width=1)=>{line(x,y,x+w,y,color,width);line(x+w,y,x+w,y+h,color,width);line(x+w,y+h,x,y+h,color,width);line(x,y+h,x,y,color,width);};
 rect(24,24,564,744,ink,1.2);rect(29,29,554,734,grid,.5);
 for(const [x,y] of [[24,24],[568,24],[24,748],[568,748]]){rect(x,y,20,20,ink,.7);line(x,y,x+20,y+20,grid,.6);}
 text('DM  /  MULTIVIEW PRACTICE',42,50,9,true);
 text(answer?'TEACHER ANSWER KEY':'STUDENT WORKSHEET',389,50,9,true);
 text(state.fields.title||'Multiview Practice',42,77,19,true);
 text(`Name: ${state.fields.name||'________________________________'}`,42,103,11);
 text(`Date: ${state.fields.date||'_________________'}`,42,124,11,false,285);
 text(`Bell: ${state.fields.bell||'____________'}`,352,124,11);
 text(answer?'Complete reference views of the authored model.':'Draw each missing view. Keep corresponding edges aligned.',42,149,11);
 const panels={top:{x:42,y:170},iso:{x:318,y:170},front:{x:42,y:430},right:{x:318,y:430}};
 for(const v of views){
  const {x,y}=panels[v],pop=answer||state.populated[v];
  text(names[v],x+8,y+17,13,true);text(pop?'GIVEN':'DRAW',x+188,y+17,8,true);
  if(v==='iso'){
   // Fixed lattice and scale reveal no hidden model dimensions in blank panels.
   for(let row=-5;row<=5;row++)for(let col=-4;col<=4;col++){
    const px=x+122+col*23*Math.sqrt(3)/2,py=y+132+row*23+(Math.abs(col)%2)*11.5;
    if(py>y+32&&py<y+224)out.push({t:'dot',x:px,y:py,r:.65,color:grid});
   }
   if(pop)for(const face of isoFaces(state.cubes)){
    const points=face.points.map(([u,w])=>[x+122+u*23,y+132+w*23]);
    out.push({t:'poly',points,color:'#ffffff'});
    points.forEach((p,i)=>{if(face.edges[i])line(...p,...points[(i+1)%4],ink,1.15);});
   }
   text('Front faces lower left; right faces lower right.',x+4,y+245,8);
   const a=[x+35,y+210],b=[x+67,y+192];line(...a,...b,ink,.9);line(b[0],b[1],b[0]-8,b[1]+1,ink,.9);line(b[0],b[1],b[0]-3,b[1]+7,ink,.9);text('FRONT',x+4,y+223,8,true);
  }else{
   const gx=x+36,gy=y+48,s=42;
   for(let i=0;i<=4;i++){line(gx+i*s,gy,gx+i*s,gy+4*s,grid,.45);line(gx,gy+i*s,gx+4*s,gy+i*s,grid,.45);}
   if(pop){
    const p=projection(state.cubes,v);
    for(const cell of p.filled){const [u,w]=cell.split(',').map(Number);out.push({t:'poly',points:[[gx+u*s,gy+w*s],[gx+(u+1)*s,gy+w*s],[gx+(u+1)*s,gy+(w+1)*s],[gx+u*s,gy+(w+1)*s]],color:'#ffffff'});}
    for(const [u,w,a,b] of p.edges)line(gx+u*s,gy+w*s,gx+a*s,gy+b*s,ink,1.35);
   }
   if(v==='top'){text('BACK',gx+66,gy-8,8);text('FRONT',gx+64,gy+4*s+16,8,true);}
   if(v==='front')text('LEFT',gx,gy+4*s+16,8),text('RIGHT',gx+141,gy+4*s+16,8);
   if(v==='right')text('FRONT',gx,gy+4*s+16,8,true),text('BACK',gx+142,gy+4*s+16,8);
  }
 }
 text('Visible edges only • hidden lines and coplanar cube seams omitted.',42,704,9);
 text('Top is above Front. Right Side shares Front’s height. One square = one cube.',42,720,9);
 text(answer?`Authored model: ${state.cubes.length} cubes. Other models may fit the given evidence.`:'Some evidence allows several valid solutions. Explain any assumptions you make.',42,740,9);
 return out;
}
export function svg(state,answer=false){
 const items=drawing(state,answer).map(o=>{
  if(o.t==='line')return `<line x1="${o.x1}" y1="${o.y1}" x2="${o.x2}" y2="${o.y2}" stroke="${o.color}" stroke-width="${o.width}"/>`;
  if(o.t==='text')return `<text x="${o.x}" y="${o.y}" font-size="${Math.min(o.size,o.maxWidth/(o.s.length*.6))}" font-weight="${o.bold?700:400}">${esc(o.s)}</text>`;
  if(o.t==='dot')return `<circle cx="${o.x}" cy="${o.y}" r="${o.r}" fill="${o.color}"/>`;
  return `<polygon points="${o.points.map(p=>p.join(',')).join(' ')}" fill="${o.color}" stroke="${o.color}" stroke-width=".4"/>`;
 });
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 612 792" role="img" aria-label="${answer?'Teacher answer key':'Student worksheet'} preview"><rect width="612" height="792" fill="white"/><g fill="${ink}" font-family="Comic Sans MS, Comic Sans, Comic Neue, sans-serif">${items.join('')}</g></svg>`;
}
