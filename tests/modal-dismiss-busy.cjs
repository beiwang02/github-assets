const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('console.js','utf8');let current;
const ctx=vm.createContext({Set,document:{getElementById:()=>current,querySelector:()=>current},notify(){}});
vm.runInContext(source.slice(source.indexOf('// One UI operation'),source.indexOf('async function formSubmit')),ctx);
function button(text,type='button',disabled=false){return {disabled,innerHTML:text,textContent:text,type,dataset:{},attrs:{},matches:s=>s==='button',getAttribute(k){return this.attrs[k]??null},setAttribute(k,v){this.attrs[k]=v},removeAttribute(k){delete this.attrs[k]}};}
function fixture(standalone=false){const x=button('×'),cancel=button('取消'),submit=button('提交','submit'),other=button('×');const modal={querySelectorAll:()=>[x,cancel]};const form={id:'testForm',dataset:{},attrs:{},matches:()=>false,querySelectorAll:()=>[cancel,submit],closest:()=>modal,getAttribute:submit.getAttribute,setAttribute:submit.setAttribute,removeAttribute:submit.removeAttribute};submit.closest=()=>modal;submit.dataset.action='confirm-exec';return {x,cancel,submit,other,scope:standalone?submit:form};}
(async()=>{for(const standalone of [false,true])for(const failure of [false,true]){
 const f=fixture(standalone);current=f.scope;let resolve,reject;const p=new Promise((a,b)=>{resolve=a;reject=b});
 const task=ctx.runSubmission(f.scope,'正在提交…',()=>p);
 for(const b of [f.x,f.cancel,f.submit])assert(b.disabled);
 assert.equal(f.x.textContent,'×');assert.equal(f.cancel.textContent,'取消');assert.equal(f.other.disabled,false);
 ctx.restoreSubmissionC();assert.equal(ctx.beginSubmission(f.scope),null);
 if(failure)reject(Error('mock failure'));else resolve();await task;
 for(const b of [f.x,f.cancel,f.submit])assert.equal(b.disabled,false);
 assert.equal(f.submit.innerHTML,'提交');
 }
 const old=fixture();current=old.scope;old.x.disabled=true;const done=ctx.beginSubmission(old.scope);
 const next=fixture();current=next.scope;ctx.restoreSubmissionC();assert(next.x.disabled);done();assert(old.x.disabled,'preserve originally disabled');assert(!next.x.disabled);assert(!old.cancel.disabled);
 console.log('PASS modal dismiss busy: form/standalone success/failure, X/Cancel, no relabel, dedupe, redraw, original disabled restoration');
})().catch(e=>{console.error(e);process.exitCode=1});
