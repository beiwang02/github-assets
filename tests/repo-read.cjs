const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../console.js'),'utf8');
const messages=[];let active,calls=0,resolve,reject;
function form(){const b={disabled:false,innerHTML:'保存并读取仓库',textContent:'保存并读取仓库',type:'submit'};return {id:'repoForm',dataset:{},values:{owner:'mock',repo:'fixture',branch:'main',assetsPath:'assets'},attrs:{},buttons:[b],matches:()=>false,querySelectorAll(){return this.buttons},getAttribute(k){return this.attrs[k]??null},setAttribute(k,v){this.attrs[k]=v},removeAttribute(k){delete this.attrs[k]}}}
const S={repo:{},view:'settings',selected:new Set(),activity:[],groups:[],assets:[],libraries:[]};
const ctx=vm.createContext({console,Set,S,HTMLFormElement:Object,FormData:class{constructor(f){this.f=f}get(k){return this.f.values[k]}},notify:(...m)=>messages.push(m),localStorage:{setItem(){}},document:{getElementById:()=>active,querySelector:()=>null},syncStatusC(message){S.syncError=message},scheduleRepositorySyncC(){},renderC(){active=form();ctx.restoreSubmissionC()},currentClient:()=>ctx.client});
ctx.client={load(){calls++;return new Promise((a,b)=>{resolve=a;reject=b})}};
vm.runInContext('let repositoryEpoch=0;',ctx);
vm.runInContext(source.slice(source.indexOf('async function readRepo'),source.indexOf('let refreshFlight=')),ctx);
vm.runInContext(source.slice(source.indexOf('// One UI operation'),source.indexOf('async function logoutC')),ctx);
(async()=>{for(const mode of ['success','failure','stale-success','stale-failure']){
 S.view='settings';messages.length=0;active=form();const before=calls;
 const p=ctx.formSubmit({preventDefault(){},target:active});
 assert.equal(active.buttons[0].textContent,'正在读取仓库…');assert.equal(active.buttons[0].disabled,true);assert.equal(S.view,'settings');assert.equal(messages.length,0);
 await ctx.formSubmit({preventDefault(){},target:active});assert.equal(calls,before+1);
 ctx.renderC();assert.equal(active.buttons[0].disabled,true);assert.equal(active.dataset.busy,'1');
 if(mode.startsWith('stale'))vm.runInContext('repositoryEpoch++',ctx);
 if(mode.endsWith('failure'))reject(Error('mock failure'));else resolve({root:'assets',groups:[],assets:[],libraries:[]});await p;
 assert.equal(active.buttons[0].disabled,false);assert.equal(active.buttons[0].innerHTML,'保存并读取仓库');assert.equal(S.loading,false);
 assert.equal(S.view,mode==='success'?'overview':'settings');assert.equal(messages.length,mode.startsWith('stale')?0:1);
 assert.equal(active.values.repo,'fixture');
 }console.log('PASS repo-read: immediate label/disabled, no start toast, duplicate suppression, redraw, success/failure, stale success/error, loading release, input preservation (mock only).');
})().catch(e=>{console.error(e);process.exitCode=1});
