const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../github.js'),'utf8'),ctx=vm.createContext({window:{},URL,TextDecoder,Uint8Array,atob,btoa,structuredClone});vm.runInContext(source,ctx);const C=ctx.window.GitHubClient;
const cfg={owner:'o',repo:'r',branch:'main',assetsPath:'assets'},old='2020-01-01T00:00:00Z',recent='2026-01-01T00:00:00Z';
(async()=>{
 for(const sameBlob of [false,true])for(const cold of [false,true]){
  const c=new C(cfg),calls=[];c.request=async p=>{calls.push(p);if(p.includes('/commits?')){const u=new URL('https://test'+p),path=u.searchParams.get('path');return [{sha:path==='assets/g/a.png'?'birth':path==='assets/next/b.png'?'move':'rename',commit:{committer:{date:path==='assets/g/a.png'?old:recent}}}];}
   if(p.endsWith('/commits/birth'))return {files:[{filename:'assets/g/a.png',status:'added',sha:'blob'}],parents:[]};
   if(p.endsWith('/commits/rename'))return {files:[{filename:'assets/g/b.png',status:'renamed',previous_filename:'assets/g/a.png',sha:'blob'}],parents:[{sha:'before-rename'}]};
   if(p.endsWith('/commits/move'))return {files:sameBlob?[{filename:'assets/next/b.png',status:'added',sha:'blob'},{filename:'assets/g/b.png',status:'removed',sha:'blob'}]:[{filename:'assets/next/b.png',status:'renamed',previous_filename:'assets/g/b.png',sha:'blob'}],parents:[{sha:'before-move'}]};throw Error(p);};
  if(!cold)await c.pathHistory('assets/g/b.png');const t=await c.pathHistory('assets/next/b.png');assert.equal(t.createdAt,old);assert.equal(t.originPath,'assets/g/a.png');assert(calls.some(p=>p.includes('sha=before-move')));assert(calls.some(p=>p.includes('sha=before-rename')));
 }
 const c=new C(cfg);c.request=async p=>p.includes('/commits?')?[{sha:'x',commit:{committer:{date:recent}}}]:{files:[]};assert.equal((await c.pathHistory('x')).createdAt,null);
 c.request=async()=>Array.from({length:100},()=>({sha:'x'}));assert.equal((await c.pathHistory('x')).source,'git-history-limited');
 c.request=async()=>{throw Error('offline')};assert((await c.pathHistory('x')).retryable);
 let changes;const url=c.raw('assets/g/a.png'),doc={path:'json/x.json',sha:'doc',value:{name:'X',description:'',custom:1,icons:[{name:'A',url,extra:1},{name:'A',url},{name:'Last',url:c.raw('last.png')}]}};
 c.atomic=async(_,build)=>{changes=await build({entries:[{path:'assets/g/a.png',sha:'blob'},{path:'.github-assets-meta.json',sha:'meta'}],docs:[doc],directories:[]});return {changed:!!changes.length};};c.request=async()=>({sha:'newblob'});
 const check=()=>assert(changes.every(x=>x.path!=='.github-assets-meta.json'));
 await c.saveIcon(doc.path,1,'Edited',url,'doc');check();let v=JSON.parse(changes[0].content);assert.equal(v.icons[0].name,'A');assert.equal(v.icons[1].name,'Edited');assert.equal(v.icons[2].name,'Last');assert.equal(v.custom,1);
 await assert.rejects(c.saveIcon(doc.path,1,'Edited',url,'stale'),/其他客户端/);
 await c.removeIcons(doc.path,[1],'doc');check();assert.deepEqual(JSON.parse(changes[0].content).icons.map(i=>i.name),['A','Last']);
 await c.appendToLibrary(doc.path,[{name:'New',url:c.raw('new.png')}]);check();assert.equal(JSON.parse(changes[0].content).icons.at(-1).name,'New');
 await c.renameAsset({path:'assets/g/a.png',name:'A'},'Renamed');check();v=JSON.parse(changes.find(x=>x.content).content);assert.deepEqual(v.icons.map(i=>i.name),['Renamed','Renamed','Last']);assert.equal(v.icons[0].extra,1);
 await c.renameGroup('g','next');check();await c.deleteSelected([{path:'assets/g/a.png'}]);check();await c.deleteGroup('g');check();await c.deleteAsset({path:'assets/g/a.png',name:'A'});check();await c.upload({name:'new.png',arrayBuffer:async()=>new Uint8Array([1]).buffer},'New','g',doc.path);check();await c.createLibrary('new','New','');check();await c.saveLibrary(doc.path,'next','Next','');check();await c.deleteLibrary(doc.path);check();
 assert(!source.includes('metadataChange'));assert(!source.includes('referenceHistory'));assert(!source.includes('syncMetadata'));
 console.log('PASS metadata-free CRUD; append/source indexes/duplicates/SHA protection; cold+warm rename and group-move ancestry including same-blob fallback; unknown/limited/error age; no reference history replay');
})().catch(e=>{console.error(e);process.exitCode=1});
