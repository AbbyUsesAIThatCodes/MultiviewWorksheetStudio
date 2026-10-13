import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
const latest=JSON.parse(await fs.readFile('builds/teacher-latest.json','utf8'));
const root=path.resolve(latest.path),port=Number(process.env.PORT||4173);
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.woff2':'font/woff2','.pdf':'application/pdf'};
export const server=http.createServer(async(req,res)=>{
 try{const url=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+decodeURIComponent(url.pathname)+(url.pathname.endsWith('/')?'index.html':''));if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}const data=await fs.readFile(file);res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-cache');res.end(data);}catch{res.writeHead(404);res.end('Not found');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Multiview Worksheet Studio: http://127.0.0.1:${server.address().port}\n${latest.id}`));
