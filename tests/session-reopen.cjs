const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const js=fs.readFileSync('console.js','utf8');
function setup({remember='consented-fixture',user=null,failure='',invalid=0}={}){
 const store=new Map([['gh-image-repo','saved-repo']]);if(remember)store.set('gh-image-remembered-token',remember);
 let calls=[],restored=0,detected=0,active=user;
 const c={S:{auth:null,repo:{owner:'owner',repo:'saved',branch:'feature',assetsPath:'pictures'}},location:{protocol:'https:'},window:{addEventListener(){}},localStorage:{getItem:k=>store.get(k)||null,removeItem:k=>store.delete(k)},sessionStorage:{getItem:()=>null},renderC(){},notify(){},loadAdminPolicy:async()=>{},readRepo:async f=>{restored++;assert.equal(f.elements.branch.value,'feature');assert.equal(f.elements.assetsPath.value,'pictures')},autoSelectRepository:async()=>{detected++},fetch:async(url)=>{calls.push(url);if(failure)throw Error('offline');if(url==='/api/auth/token'){if(invalid)return{ok:false,status:invalid};active={login:'owner'};return{ok:true};}return{ok:true,json:async()=>({user:active,csrf:active?'fresh-csrf':null,tokenLoginEnabled:true})}}};
 vm.createContext(c);vm.runInContext(js.slice(js.indexOf('function rememberedToken()'),js.indexOf('function finePointerC()'))+js.slice(js.indexOf('async function silentTokenLogin()'),js.indexOf('function loginView()'))+js.slice(js.indexOf('async function bootAuth('),js.indexOf("document.addEventListener('click'",js.indexOf('async function bootAuth('))),c);
 return{c,store,calls,get restored(){return restored},get detected(){return detected},online(){failure=''},expire(){active=null}};
}
(async()=>{
 for(const user of [{login:'owner'},null]){const t=setup({user});await t.c.bootAuth();assert.equal(t.restored,1);assert.equal(t.detected,0);assert(t.c.S.auth);assert.equal(t.calls.filter(x=>x.endsWith('/token')).length,user?0:1);assert(t.store.has('gh-image-remembered-token'));}
 const n=setup({remember:''});await n.c.bootAuth();assert.equal(n.restored,0);assert.equal(n.calls.length,1);assert(n.store.has('gh-image-repo'));
 const f=setup({failure:'offline'});await f.c.bootAuth();assert(f.store.has('gh-image-remembered-token'));assert(f.store.has('gh-image-repo'));f.online();await f.c.bootAuth();assert.equal(f.restored,1);
 for(const status of [401,403]){const t=setup({invalid:status});await t.c.bootAuth();assert(!t.store.has('gh-image-remembered-token'));assert.equal(t.restored,0);}
 const g=setup({invalid:502});await g.c.bootAuth();assert(g.store.has('gh-image-remembered-token'));assert(g.store.has('gh-image-repo'));
 const p=setup();await Promise.all([p.c.recoverSession(),p.c.recoverSession()]);assert.equal(p.calls.filter(x=>x.endsWith('/token')).length,1);p.expire();await p.c.recoverSession();assert.equal(p.calls.filter(x=>x.endsWith('/token')).length,2);
 console.log('PASS session-reopen: fresh tab valid cookie, expired/restarted session + consented token, no remember, offline then retry, 401/403 invalidation, 502 preservation, repo/branch/path restoration, single-flight and retry');
})().catch(e=>{console.error(e);process.exitCode=1});
