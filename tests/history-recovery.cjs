const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const ctx=vm.createContext({window:{},URL,TextDecoder,Uint8Array,atob,btoa,structuredClone});vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../github.js'),'utf8'),ctx);const C=ctx.window.GitHubClient;
const config={owner:'o',repo:'r',branch:'main',assetsPath:'assets'},old='2020-01-01T00:00:00Z';
function fixture(){
 const blobs=new Map(),trees=new Map(),commits=new Map();let head='h0',n=0,failHistory=false,failContents=false,patchMode='',patches=0;
 const blob=s=>{const sha=crypto.createHash('sha1').update(s).digest('hex');blobs.set(sha,s);return sha;};
 const c=new C(config),url=c.raw('assets/g/a.png'),initial={name:42,description:{bad:true},icons:[{name:'A',url}]};
 trees.set('t0',[{path:'assets/g/a.png',type:'blob',sha:blob('image')},{path:'json/x.json',type:'blob',sha:blob(JSON.stringify(initial))}]);commits.set('h0',{tree:{sha:'t0'},parents:[]});
 function client(){const c=new C(config);c.request=async(p,m='GET',body)=>{
 if(p===c.base)return {size:1};
 if(p.includes('/git/ref/')){if(patchMode==='unreadable'&&patches)throw Error('offline');return {object:{sha:head}};}
 if(p.includes('/git/refs/')){patches++;if(patchMode!=='unreadable'&&patchMode!=='not-landed')head=body.sha;if(patchMode)throw Error('lost response');return {};}
 if(p.endsWith('/git/blobs'))return {sha:blob(body.content)};
 if(p.includes('/git/blobs/'))return {content:btoa(blobs.get(p.split('/').at(-1)))};
 if(p.endsWith('/git/trees')){const map=new Map(trees.get(body.base_tree).map(e=>[e.path,{...e}]));for(const e of body.tree){if(e.sha===null)map.delete(e.path);else map.set(e.path,{path:e.path,type:'blob',sha:e.sha||blob(e.content)});}const sha='t'+(++n);trees.set(sha,[...map.values()]);return {sha};}
 if(p.includes('/git/trees/'))return {tree:structuredClone(trees.get(p.split('/').at(-1).split('?')[0]))};
 if(p.endsWith('/git/commits')){const sha='h'+(++n);commits.set(sha,{tree:{sha:body.tree},parents:body.parents});return {sha};}
 if(p.includes('/git/commits/'))return commits.get(p.split('/').at(-1));
 if(p.includes('/commits?')){if(failHistory)throw Error('temporary 503');return [{sha:'h0',commit:{committer:{date:old}}}];}
 if(p.includes('/contents/')){if(failContents)throw Error('temporary content');return {content:btoa(JSON.stringify(initial))};}
 if(p.includes('/compare/'))return {status:'ahead'};
 throw Error(p);
 };return c;}
 return {client,setHistory:v=>failHistory=v,setContents:v=>failContents=v,setPatch:v=>patchMode=v,get patches(){return patches;},external(){const t=structuredClone(trees.get(commits.get(head).tree.sha));const e=t.find(e=>e.path==='json/x.json');e.sha=blob(JSON.stringify({icons:[{name:'Other',url:'https://example.invalid/new'}]}));trees.set('external',t);commits.set('external',{tree:{sha:'external'}});head='external';}};
}
(async()=>{
 for(const preload of [false,true]){const f=fixture(),c=f.client();if(preload)await c.load();await c.renameAsset({path:'assets/g/a.png',name:'A'},'Renamed');const a=await c.load(),b=await f.client().load();for(const d of [a,b]){assert.equal(d.assets[0].createdAt,old);assert.equal(d.libraries[0].icons[0].addedAt,old);assert.equal(d.libraries[0].icons[0].name,'Renamed');assert.equal(d.libraries[0].name,'x.json');assert.equal(d.libraries[0].description,'');}f.external();const changed=await f.client().load();assert.notEqual(changed.libraries[0].icons[0].addedAt,old,'stale metadata must not label replacement');}
 for(const kind of ['History','Contents']){const f=fixture(),c=f.client();f['set'+kind](true);let d=await c.load();assert(d.historyWarnings.length);f['set'+kind](false);d=await c.load();assert.equal(d.historyWarnings.length,0);assert.equal(d.libraries[0].icons[0].addedAt,old);assert.equal(d.assets[0].createdAt,old);}
 for(const mode of ['lost','unreadable','not-landed']){const f=fixture(),c=f.client();f.setPatch(mode);if(mode==='lost'){const r=await c.createGroup('new');assert(r.recovered);}else await assert.rejects(c.createGroup('new'),e=>e.code==='COMMIT_OUTCOME_UNKNOWN'&&e.requiresRefresh);assert.equal(f.patches,1);}
 const c=new C(config);for(const path of ['assets/g/a.png','assets/g/nested/a.png','assets/g']){c.atomic=async(_,build)=>build({entries:[{path}],directories:[]});await assert.rejects(c.createGroup('g'),/已经存在/);}
 let changes;const url=n=>c.raw('assets/g/'+n+'.png'),doc={path:'json/x.json',sha:'d',value:{icons:[{name:'A',url:url(1)},{name:'B',url:url(2)}]}};c.atomic=async(_,build)=>{changes=await build({entries:[],docs:[doc]});};await c.saveIcon(doc.path,1,'A',url(2),'d');assert.equal(JSON.parse(changes[0].content).icons[1].name,'A');
 console.log('PASS history-recovery: first rename with/without preload; same/new client blob-bound time inheritance; external stale metadata rejected; same-HEAD history/content recovery; lost PATCH response and uncertain outcome; group prefix conflicts; duplicate names; non-string library fallback. Mock only.');
})().catch(e=>{console.error(e);process.exitCode=1;});
