export const SIZE=4;
export const key=([x,y,z])=>`${x},${y},${z}`;
export const unkey=k=>k.split(',').map(Number);
export const inside=c=>Array.isArray(c)&&c.length===3&&c.every(v=>Number.isInteger(v)&&v>=0&&v<SIZE);
const columns=items=>items.flatMap(([x,z,h])=>Array.from({length:h},(_,y)=>[x,y,z]));
export const levels=[
 {title:'Meet The Three Views',tag:'GUIDED EXAMPLE',prompt:'Rotate the model. Watch how the three drawings describe the same object.',cubes:columns([[1,1,2],[2,1,1],[1,2,1],[2,2,1]]),hint:'The small tower changes the top view as well as the front view.'},
 {title:'A Small Step',tag:'PUZZLE 01 / 05',prompt:'Build a step that matches all three drawings.',cubes:columns([[1,1,2],[2,1,1]]),hint:'Start with two cubes side by side. Which one needs a second cube?'},
 {title:'Around The Corner',tag:'PUZZLE 02 / 05',prompt:'Find the corner, then work out where the tower belongs.',cubes:columns([[1,1,2],[2,1,1],[1,2,1]]),hint:'The top view shows an L. Its raised corner is visible in two other views.'},
 {title:'Three Steps Up',tag:'PUZZLE 03 / 05',prompt:'Use the front view to find the heights. Check the depth from above.',cubes:columns([[0,1,1],[1,1,2],[2,1,3]]),hint:'There are three columns, but only one row from back to front.'},
 {title:'The Courtyard',tag:'PUZZLE 04 / 05',prompt:'Some cubes are hidden from one direction. Use every view.',cubes:columns([[0,0,2],[1,0,1],[2,0,2],[0,1,1],[2,1,1]]),hint:'Find the empty square in the top view before you add height.'},
 {title:'The Lookout',tag:'PUZZLE 05 / 05',prompt:'Combine everything you know. Match the outline and the inside edges.',cubes:columns([[1,0,3],[2,0,2],[1,1,1],[2,1,2],[2,2,1]]),hint:'The top view reveals the footprint. The front and right views reveal the steps.'}
];
export function projection(cubes,view){
 const depths=Array.from({length:SIZE},()=>Array(SIZE).fill(null));
 for(const [x,y,z] of cubes){let u,v,d;if(view==='top'){u=x;v=z;d=y}else if(view==='front'){u=x;v=SIZE-1-y;d=z}else if(view==='right'){u=SIZE-1-z;v=SIZE-1-y;d=x}else throw Error('Unknown view');depths[v][u]=depths[v][u]===null?d:Math.max(depths[v][u],d)}
 const filled=[],edges=[];
 for(let v=0;v<SIZE;v++)for(let u=0;u<SIZE;u++){let d=depths[v][u];if(d===null)continue;filled.push(`${u},${v}`);if(v===0||depths[v-1][u]!==d)edges.push([u,v,u+1,v]);if(u===0||depths[v][u-1]!==d)edges.push([u,v,u,v+1]);if(v===SIZE-1||depths[v+1][u]===null)edges.push([u,v+1,u+1,v+1]);if(u===SIZE-1||depths[v][u+1]===null)edges.push([u+1,v,u+1,v+1]);}
 return{depths,filled,edges};
}
export const signature=p=>JSON.stringify([p.filled,[...p.edges].map(e=>e.join(',')).sort()]);
export function rules(cubes){if(!cubes.length)return{ok:false,reason:'Add a cube to begin.'};if(cubes.some(c=>!inside(c)))return{ok:false,reason:'Keep every cube inside the building space.'};const s=new Set(cubes.map(key));if(s.size!==cubes.length)return{ok:false,reason:'Two cubes cannot occupy the same space.'};for(const [x,y,z] of cubes)if(y>0&&!s.has(key([x,y-1,z])))return{ok:false,reason:'Every upper cube needs a cube directly below it.'};const visited=new Set(),queue=[cubes[0]];while(queue.length){const c=queue.pop(),k=key(c);if(visited.has(k))continue;visited.add(k);for(const d of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]){const n=c.map((v,i)=>v+d[i]);if(s.has(key(n))&&!visited.has(key(n)))queue.push(n)}}return visited.size===s.size?{ok:true}:{ok:false,reason:'Join the cubes into one model. Cubes must share a face.'};}
export function check(cubes,target){const views=Object.fromEntries(['top','front','right'].map(v=>[v,signature(projection(cubes,v))===signature(projection(target,v))]));const valid=rules(cubes);return{views,rules:valid,solved:valid.ok&&Object.values(views).every(Boolean)}}
export function predictionOptions(cubes,view,seed){const p=projection(cubes,view);const a=structuredClone(p.depths),b=structuredClone(p.depths);const first=p.filled[0].split(',').map(Number);a[first[1]][first[0]]=null;outer:for(let v=0;v<SIZE;v++)for(let u=0;u<SIZE;u++)if(b[v][u]===null){b[v][u]=0;break outer}const fromDepth=d=>{const cc=[];for(let v=0;v<SIZE;v++)for(let u=0;u<SIZE;u++)if(d[v][u]!==null)cc.push([u,SIZE-1-v,d[v][u]]);return projection(cc,'front')};const options=[p,fromDepth(a),fromDepth(b)];const offset=seed%3;return options.map((_,i)=>({drawing:options[(i+offset)%3],correct:(i+offset)%3===0}));}
