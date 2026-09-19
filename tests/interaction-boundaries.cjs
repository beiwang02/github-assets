const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const s=fs.readFileSync(require('node:path').join(__dirname,'../console.js'),'utf8');
let ok=false,removed=0,notifications=0,redirects=0,disposed=0;
const c=vm.createContext({navigator:{clipboard:{writeText:async()=>{throw Error('denied')}}},document:{createElement:()=>({select(){},remove(){removed++}}),body:{appendChild(){}},execCommand:()=>ok},notify:()=>notifications++,fetch:async()=>({ok}),disposeRepositorySyncC:()=>disposed++,S:{connected:true},localStorage:{removeItem(){}},location:{replace(){redirects++}}});
vm.runInContext(s.slice(s.indexOf('async function copyC'),s.indexOf('function statC')),c);
vm.runInContext(s.slice(s.indexOf('async function logoutC'),s.indexOf('async function autoSelectRepository')),c);
(async()=>{await assert.rejects(c.copyC('url'),/复制失败/);assert.equal(removed,1);assert.equal(notifications,0);await assert.rejects(c.logoutC(),/退出失败/);assert.equal(redirects,0);assert.equal(disposed,0);assert(c.S.connected);ok=true;await c.copyC('url');assert.equal(notifications,1);await c.logoutC();assert.equal(redirects,1);assert.equal(disposed,1);
const listener=s.match(/if\(action==='select-all-icons'\)\{(.*?)return;\}/)[1];c.visibleIcons=()=>[{index:1},{index:3}];c.syncIconSelectionUI=()=>{};c.target={blur(){}};c.S.selectedIcons=new Set([8]);vm.runInContext("{"+listener+"}",c);assert.deepEqual([...c.S.selectedIcons],[8,1,3]);vm.runInContext("{"+listener+"}",c);assert.deepEqual([...c.S.selectedIcons],[8]);assert(s.includes('没有匹配的图片引用'));console.log('PASS interaction-boundaries: clipboard failure/success cleanup; logout failure/success; filtered select-all preserves hidden selections; search empty-state.');})().catch(e=>{console.error(e);process.exitCode=1});

(async()=>{
 const values=new Map([['gh-image-remembered-token','previous']]);let responseOK=false,reloads=0,finished=0,busy=false,calls=0,release;
 const form={id:'tokenLoginForm',querySelector:()=>({}),token:'new-valid-token',remember:'on'};
 const ctx=vm.createContext({FormData:class{constructor(f){this.f=f}get(k){return k==='token'?this.f.token:this.f.remember}},beginSubmission:()=>{if(busy)return null;busy=true;return()=>{busy=false;finished++}},notify(){},localStorage:{setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},sessionStorage:{setItem(){}},location:{reload(){reloads++}},fetch:async()=>{calls++;await new Promise(r=>release=r);return{ok:responseOK,status:401,json:async()=>({})}}});
 vm.runInContext(s.slice(s.indexOf('async function formSubmit'),s.indexOf('async function logoutC')),ctx);
 const event={preventDefault(){},target:form};let pending=ctx.formSubmit(event);await ctx.formSubmit(event);assert.equal(calls,1);assert.equal(values.get('gh-image-remembered-token'),'previous');release();await pending;assert.equal(values.get('gh-image-remembered-token'),'previous');assert.equal(form.token,'new-valid-token');assert.equal(reloads,0);assert.equal(busy,false);
 responseOK=true;pending=ctx.formSubmit(event);release();await pending;assert.equal(values.get('gh-image-remembered-token'),'new-valid-token');assert.equal(reloads,1);
 form.remember='';pending=ctx.formSubmit(event);release();await pending;assert.equal(values.has('gh-image-remembered-token'),false);assert.equal(finished,3);
 console.log('PASS token remember: failed login preserves prior storage/input, only success saves/removes, concurrent submit blocked and busy restored');
})().catch(e=>{console.error(e);process.exitCode=1});
