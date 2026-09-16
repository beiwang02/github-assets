const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=require('node:path').join(__dirname,'..');
const ctx=vm.createContext({window:{},structuredClone,URL,console});vm.runInContext(fs.readFileSync(root+'/github.js','utf8'),ctx);
const Client=ctx.window.GitHubClient, a={id:'a',name:'A',url:'https://example.invalid/a'},b={id:'b',name:'B',url:'https://example.invalid/b'};
async function check(items,icons,added,skipped,retryIcons){
 const c=new Client({branch:'main'});let snapshots=0,posts=0,patches=0;
 c.snapshot=async()=>({head:'h'+snapshots++,tree:'t',docs:[{path:'x.json',value:{icons:snapshots>1&&retryIcons?retryIcons:icons}}]});
 c.request=async(path,method)=>{if(method==='POST'){posts++;return {sha:'new'};}if(method==='PATCH'){patches++;if(retryIcons&&patches===1)throw Object.assign(new Error('race'),{status:409});return {};}return {object:{sha:'other'}};};
 const result=await c.appendToLibrary('x.json',items);assert.equal(result.added,added);assert.equal(result.skipped,skipped);assert.equal(result.changed,added>0);
 if(!added&&!retryIcons)assert.equal(posts,0);if(retryIcons)assert.equal(snapshots,2);
}
const source=fs.readFileSync(root+'/console.js','utf8'),messages=[];let html='',f,calls=0,fail=false,resolve;
function form(){const button={disabled:false,innerHTML:'加入 JSON 库',textContent:'加入 JSON 库',type:'submit'};return {id:'bulkForm',dataset:{},attrs:{},buttons:[button],matches:()=>false,getAttribute(k){return this.attrs[k]??null;},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];},querySelectorAll(){return this.buttons;}};}
const ui=vm.createContext({console,Set,FormData:class{get(){return 'x.json';}},S:{selected:new Set(['b']),assets:[a,b],libraries:[{file:'x.json',name:'test',count:0}]},escC:String,openC:h=>{html=h;f=form();},$c:()=>f,notify:m=>messages.push(m),closeC(){},renderC(){},refreshRepo:async()=>ui.S.selected.clear(),currentClient:()=>({appendToLibrary:async(path,items)=>{calls++;assert.equal(items[0].id,'a');if(fail)throw new Error('mock failure');await new Promise(r=>resolve=r);return {changed:true,added:1,skipped:0};}})});
vm.runInContext(source.slice(source.indexOf('function bulkModal('),source.indexOf('async function readRepo')),ui);
vm.runInContext(source.slice(source.indexOf('// One UI operation'),source.indexOf('async function logoutC')),ui);
(async()=>{
 await check([a],[],1,0);await check([a],[a],0,1);await check([a,b,b],[a],1,2);await check([a,b],[a,b],0,2);await check([a,b],[],1,1,[a]);await check([a],[],0,1,[a]);
 ui.bulkModal(a);assert.deepEqual([...ui.S.selected],['b']);assert.equal(f.singleAsset,true);assert.equal(f.libraryItems.length,1);
 fail=true;await ui.formSubmit({preventDefault(){},target:f});assert.equal(f.dataset.busy,undefined);assert.equal(f.buttons[0].disabled,false);assert.deepEqual([...ui.S.selected],['b']);
 fail=false;const p=ui.formSubmit({preventDefault(){},target:f});await ui.formSubmit({preventDefault(){},target:f});assert.equal(calls,2);assert.equal(f.buttons[0].disabled,true);resolve();await p;assert.deepEqual([...ui.S.selected],['b']);assert.match(messages.at(-1),/新增 1 张，跳过重复 0 张/);
 ui.bulkModal();assert.equal(f.singleAsset,false);assert.equal(f.libraryItems[0].id,'b');ui.S.libraries=[];ui.bulkModal(a);assert.match(html,/暂无 JSON 库/);assert.match(html,/disabled/);
 console.log('PASS: single/batch duplicate counts; all duplicates zero commits; conflict snapshot recomputation; single selection isolation; failure retry; busy double-submit suppression; empty library. Mock only, no network.');
})().catch(e=>{console.error(e);process.exitCode=1;});
