// Append-only Git refs provide an atomic, durable ordinal reservation across runners.
export async function reserveCi({repository,token,revision,event={},ref,request=fetch}){
 if(!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository||'')||!token||!/^[a-f0-9]{40}$/.test(revision||''))throw Error('CI identity requires a repository, token, and full source revision.');
 const pr=event.pull_request?.number;
 if(pr!==undefined&&(!Number.isInteger(pr)||pr<1))throw Error('Invalid PR identity.');
 if(!pr&&ref!=='refs/heads/main')throw Error('Non-PR CI builds must use main; local branches retain local identities.');
 const scope=pr?`pr-${pr}`:'main';
 const api=(route,options={})=>request(`https://api.github.com/repos/${repository}/${route}`,{...options,headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','Content-Type':'application/json'}});
 for(let retry=0;retry<12;retry++){
  const found=await api(`git/matching-refs/tags/teacher-build-ledger/${scope}/`);
  if(!found.ok)throw Error(`Read CI build ledger: HTTP ${found.status}`);
  const refs=await found.json();if(!Array.isArray(refs))throw Error('Unexpected CI ledger response.');
  const ordinal=1+Math.max(0,...refs.map(r=>Number(r.ref.split('/').at(-1))).filter(Number.isSafeInteger));
  const created=await api('git/refs',{method:'POST',body:JSON.stringify({ref:`refs/tags/teacher-build-ledger/${scope}/${String(ordinal).padStart(6,'0')}`,sha:revision})});
  if(created.ok)return{scope,ordinal,pr:pr||null,prHead:event.pull_request?.head.sha||null};
  if(created.status!==422)throw Error(`Reserve CI build ordinal: HTTP ${created.status}`);
 }
 throw Error('Could not reserve a unique CI build ordinal.');
}
