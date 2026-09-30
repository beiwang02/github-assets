#!/usr/bin/env node
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../console.js'),'utf8');
const listeners={},messages=[];
const context=vm.createContext({console,Set,FormData:class{constructor(f){this.f=f;}get(k){return this.f.values?.[k]||'';}},document:{addEventListener:(t,f)=>listeners[t]=f},notify:m=>messages.push(m),S:{modalConfirm:null,uploadDraft:null,group:''},closeC(){},refreshRepo:async()=>{},uploadModal(){},currentClient:()=>context.client});
vm.runInContext(source.slice(source.indexOf('// One UI operation'),source.indexOf('async function logoutC')),context);
vm.runInContext(source.slice(source.indexOf("document.addEventListener('click', async"),source.indexOf("document.addEventListener('click',e=>")),context);
function node(button=false){return {dataset:{},attrs:{},disabled:false,innerHTML:'保存',textContent:'保存',type:'submit',matches:()=>button,getAttribute(k){return this.attrs[k]??null;},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];},querySelectorAll(){return this.buttons;}};}
function form(id){const f=node();f.id=id;f.buttons=[node(true)];f.values={name:'test'};f.elements={group:{value:'test'},file:{files:[{}]},name:{value:'test'},library:{value:''}};return f;}
function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};}
(async()=>{
 let count=0;
 for(const id of ['groupCreateForm','uploadForm'])for(const fail of [false,true]){
  const d=deferred(),f=form(id);context.client={createGroup:()=>{count++;return d.promise;},upload:()=>{count++;return d.promise;}};
  const before=count,p=context.formSubmit({preventDefault(){},target:f});
  assert.equal(f.dataset.busy,'1');assert.equal(f.buttons[0].disabled,true);assert.match(f.buttons[0].textContent,/正在/);
  await context.formSubmit({preventDefault(){},target:f});assert.equal(count,before+1);
  fail?d.reject(new Error('mock failure')):d.resolve({name:'test'});await p;
  assert.equal(f.dataset.busy,undefined);assert.equal(f.buttons[0].disabled,false);assert.equal(f.buttons[0].innerHTML,'保存');
 }
 const b=node(true);b.dataset.action='confirm-exec';const event={target:{closest:()=>b},preventDefault(){}};
 let calls=0,d=deferred();const callback=()=>{calls++;return d.promise;};context.S.modalConfirm=callback;
 const first=listeners.click(event);await listeners.click(event);assert.equal(calls,1);assert.equal(b.disabled,true);
 d.reject(new Error('mock delete failure'));await first;assert.equal(context.S.modalConfirm,callback);assert.equal(b.disabled,false);
 d=deferred();const retry=listeners.click(event);assert.equal(calls,2);d.resolve();await retry;assert.equal(context.S.modalConfirm,null);assert.equal(b.disabled,false);
 const f=form('unknown'),d2=deferred();f.buttons[0].disabled=true;const task=context.runSubmission(f,'处理中',()=>d2.promise);d2.reject(new Error('restore'));await task;assert.equal(f.buttons[0].disabled,true);
 console.log('PASS: group/upload success, failure, immediate busy, duplicate suppression; confirmation failure retry and success cleanup; original disabled state restored. No real network or resource deletion.');
})().catch(e=>{console.error(e);process.exitCode=1;});
