import {PDFDocument,rgb} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import {drawing} from './drawing.mjs';
const color=h=>rgb(...h.slice(1).match(/../g).map(v=>parseInt(v,16)/255));
export async function createPdf(state,answer,fonts,build){
 const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);
 const regular=await pdf.embedFont(fonts.regular,{subset:true}),bold=await pdf.embedFont(fonts.bold,{subset:true});
 pdf.setTitle(`${state.fields.title||'Multiview Practice'} — ${answer?'Teacher Key':'Student Worksheet'}`);
 pdf.setSubject('Visible edges only. Fixed top/front/right projection.');pdf.setCreator(`Multiview Worksheet Studio | ${build.id}`);
 const page=pdf.addPage([612,792]);
 for(const o of drawing(state,answer)){
  if(o.t==='line')page.drawLine({start:{x:o.x1,y:792-o.y1},end:{x:o.x2,y:792-o.y2},thickness:o.width,color:color(o.color)});
  if(o.t==='text'){
   const font=o.bold?bold:regular,maxWidth=o.maxWidth;
   const size=Math.min(o.size,maxWidth/font.widthOfTextAtSize(o.s,1));
   page.drawText(o.s,{x:o.x,y:792-o.y,size,font,color:color(o.color)});
  }
  if(o.t==='dot')page.drawCircle({x:o.x,y:792-o.y,size:o.r,color:color(o.color)});
  if(o.t==='poly')page.drawSvgPath('M '+o.points.map(p=>p.join(' ')).join(' L ')+' Z',{x:0,y:792,color:color(o.color),borderColor:color(o.color),borderWidth:.4});
 }
 // Student PDF has only rendered given geometry; no model, JSON, or answer attachment.
 return pdf.save();
}
