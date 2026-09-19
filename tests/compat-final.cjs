const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../github.js'),'utf8');const ctx=vm.createContext({window:{},URL,TextDecoder,Uint8Array,atob,btoa,structuredClone});vm.runInContext(source,ctx);const C=ctx.window.GitHubClient;
const config={owner:'o',repo:'r',branch:'main',assetsPath:'assets'},old='2020-01-01T00:00:00Z',recent='2025-01-01T00:00:00Z';
const encode=s=>Buffer.from(s).toString('base64');const hash=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0'+s).digest('hex');
function fixture(mismatch=false){
 const blobs=new Map(),trees=new Map(),commits=new Map();let head='initial',n=0;const rows=[];
 function blob(s){const sha=hash(s);blobs.set(sha,s);return sha;}
 function record(id,tree,date,parent){trees.set(id,tree);commits.set(id,{tree:{sha:id},parents:parent?[{sha:parent}]:[]});rows.unshift({sha:id,commit:{committer:{date}}});head=id;}
 record('initial',[{path:'json/x.json',type:'blob',sha:blob(JSON.stringify({icons:[{name:'Old',url:'https://example.invalid/old'}]}))}],old);
 function client(){const c=new C(config);c.request=async(p,m='GET',body)=>{
 if(p===c.base)return {size:1};if(p.includes('/git/ref/'))return {object:{sha:head}};
 if(p.includes('/git/refs/')){head=body.sha;return {};}
 if(p.endsWith('/git/blobs'))return {sha:blob(body.content)};
 if(p.includes('/git/blobs/'))return {content:encode(blobs.get(p.split('/').at(-1)))};
 if(p.endsWith('/git/trees')){const map=new Map(trees.get(body.base_tree).map(e=>[e.path,{...e}]));for(const e of body.tree)if(e.sha===null)map.delete(e.path);else map.set(e.path,{path:e.path,type:'blob',sha:e.sha||blob(e.content)});const id='t'+(++n);trees.set(id,[...map.values()]);return {sha:id};}
 if(p.includes('/git/trees/'))return {tree:structuredClone(trees.get(p.split('/').at(-1).split('?')[0]))};
 if(p.endsWith('/git/commits')){const id='system'+(++n);record(id,trees.get(body.tree),'2024-01-01T00:00:00Z',head);return {sha:id};}
 if(p.includes('/git/commits/'))return commits.get(p.split('/').at(-1));
 if(p.includes('/commits?'))return structuredClone(rows);
 if(p.includes('/contents/')){const ref=new URL('https://test'+p).searchParams.get('ref'),file=trees.get(commits.get(ref).tree.sha).find(e=>e.path==='json/x.json');return {sha:mismatch?'wrong-sha':file.sha,content:encode(blobs.get(file.sha))};}
 throw Error(p);
 };return c;}
 return {client,external(){const t=structuredClone(trees.get(commits.get(head).tree.sha)),e=t.find(e=>e.path==='json/x.json');const value=JSON.parse(blobs.get(e.sha));value.description='external';value.icons.push({name:'New',url:'https://example.invalid/new'});e.sha=blob(JSON.stringify(value));record('external',t,recent,head);}};
}
(async()=>{
 for(const mismatch of [false,true]){const f=fixture(mismatch),c=f.client(),initial=await c.load();await c.saveIcon('json/x.json',0,'Changed','https://raw.githubusercontent.com/o/r/main/assets/changed.png',initial.libraries[0].sha);f.external();const loaded=await f.client().load();assert.equal(loaded.libraries[0].description,'external');assert.equal(loaded.libraries[0].icons[0].addedAt,mismatch?'2024-01-01T00:00:00Z':old);assert.equal(loaded.libraries[0].icons[1].addedAt,recent);}
 for(const kind of ['unknown','limited']){const c=new C(config);let snapshots=0,history=0;c.request=async p=>p===c.base?{size:1}:{object:{sha:'head'}};c.snapshot=async()=>{snapshots++;return {head:'head',directories:[],entries:[],docs:[{path:'json/x.json',sha:'blob',value:{icons:[{name:'a',url:'external'}]}}]}};c.pathHistory=async()=>{history++;return {rows:[],complete:false,createdAt:null,updatedAt:null,source:kind==='limited'?'git-history-limited':'unknown',retryable:false}};const first=await c.load();assert.equal(first.historyWarnings[0].code,kind==='limited'?'HISTORY_LIMITED':'HISTORY_UNKNOWN');assert.strictEqual(await c.load(),first);assert.equal(snapshots,1);assert.equal(history,1);}
 const c=new C(config),baseline={blobSha:'b',references:[{name:'x',url:'y',addedAt:old}]};const refs=await c.referenceHistory({path:'x',value:{icons:[{name:'x',url:'y'}]}},{rows:[],complete:false},undefined,baseline);assert.equal(refs[0].addedAt,null,'unverified baseline never trusted without matching contents SHA');
 const consoleSource=fs.readFileSync(path.join(__dirname,'../console.js'),'utf8');const ui=vm.createContext({HTMLFormElement:Object,FormData:class{constructor(f){this.f=f}get(k){return this.f[k]}},S:{repo:{},selected:new Set(),activity:[]},localStorage:{setItem(){}},renderC(){},currentClient:()=>({load(){}}),notify(){},repositoryEpoch:0});vm.runInContext(consoleSource.slice(consoleSource.indexOf('async function readRepo'),consoleSource.indexOf('let refreshFlight=')),ui);
 // Missing owner stops before network; validation still runs first.
 for(const p of ['图片/a.b','a b/组','a.b','a b'])await ui.readRepo({assetsPath:p,owner:'',repo:''});
 for(const p of ['/a','a/','a//b','.','..','a/../b','a\\b','a\u0000','a\u0085'])await assert.rejects(ui.readRepo({assetsPath:p,owner:'',repo:''}),/资源目录/);
 assert(source.includes("split('/').map(encodeURIComponent).join('/')}/.gitkeep"));
 console.log('PASS compat-final: Git blob SHA/content per commit, system name+URL edit then external append and cold load; mismatched/absent baseline rejected; permanent history warning fastpath; Unicode path validation and initialization encoding. Mock only.');
})().catch(e=>{console.error(e);process.exitCode=1});
