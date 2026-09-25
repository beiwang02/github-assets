#!/usr/bin/env node
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../console.js'),'utf8');
const start=source.indexOf('// Detail-only original-file saving.'),end=source.indexOf('function bulkModal',start);
assert(start>=0&&end>start);
let status='';const statuses=[];let links=0,created=0,revoked=0;
const modal={querySelector:sel=>sel==='[data-image-save-status]'?{set textContent(v){status=v;statuses.push(v)},get textContent(){return status}}:null};
const document={querySelector:sel=>sel==='#modalRoot'?{querySelector:modal.querySelector}:null,createElement:()=>({style:{},click(){links++},set hidden(v){},set href(v){},set download(v){},remove(){}}),body:{appendChild(){},}};
let fetchImpl=async()=>{throw new TypeError('CORS')};
const timers=new Map();let timerId=0;
const escC=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
class MockURL extends URL {};
MockURL.createObjectURL=()=>{created++;return 'blob:test'+created};MockURL.revokeObjectURL=()=>{revoked++};
const ctx=vm.createContext({console,URL:MockURL,Blob,File:require('node:buffer').File,AbortController,DOMException,TextDecoder,Uint8Array,decodeURIComponent,encodeURIComponent,escC,document,$c:s=>s==='#modalRoot'?modal:s.includes('[data-image-save-status]')?modal.querySelector('[data-image-save-status]'):null,S:{repo:{owner:'o',repo:'r',branch:'main'},assets:[]},fetch:(...a)=>fetchImpl(...a),navigator:{},setTimeout:(f,ms)=>{timers.set(++timerId,{f,ms});return timerId},clearTimeout:id=>timers.delete(id)});
vm.runInContext(source.slice(start,end),ctx);
const run=s=>vm.runInContext(s,ctx),flush=async()=>{for(let i=0;i<10;i++)await Promise.resolve()};
const item={name:'bad/名?.png',url:'https://raw.githubusercontent.com/o/r/main/assets/folder/a%20b.png',path:'assets/folder/a b.png'};
ctx.item=item;
(async()=>{
assert.equal(run(`safeImageURLC('javascript:alert(1)')`),'');
assert.match(run(`detailLinkC('https://example.test/a?x=<&quot;','<label>')`),/target="_blank" rel="noopener noreferrer"/);
assert(run(`detailLinkC('https://example.test/a?x=<&quot;','<label>')`).includes('href="https://example.test/a?x=%3C&amp;quot;"'));
ctx.S.assets=[item];const repo=run('detailRepositoryC(item)');assert.match(repo,/github\.com\/o\/r\/blob\/main\/assets\/folder\/a%20b\.png/);assert(!run(`detailRepositoryC({url:'https://evil.test/a.png',path:'assets/a.png'})`),'external URL must not get repository link');
const bytes=Uint8Array.from([0,1,2,255,13,10]);const rawBlob=new Blob([bytes],{type:'image/png'});const response={ok:true,headers:{get:k=>k==='content-length'?String(bytes.length):'image/png'},body:{getReader(){let done=false;return {read:async()=>{if(done)return {done:true};done=true;return {done:false,value:new Uint8Array(bytes)}},cancel:async()=>{},releaseLock(){}}}}};
fetchImpl=async(url,opts)=>{assert.equal(opts.credentials,'omit');assert.equal(opts.mode,'cors');return response};
run(`prepareImageSaveC(item)`);await run('imageSaveC.ready');assert.equal(run('imageSaveC.phase'),'ready');assert.deepEqual([...new Uint8Array(await run('imageSaveC.blob').arrayBuffer())],[...bytes]);assert.equal(run('imageSaveC.file.type'),'image/png');assert.equal(run('imageSaveC.name'),'a b.png');
let shareCalls=0;let releaseShare;ctx.navigator={share:()=>{shareCalls++;return new Promise(r=>releaseShare=r)},canShare:()=>true};const button={disabled:false,dataset:{},setAttribute(){},removeAttribute(){}};ctx.button=button;const first=run('saveOriginalC(button)');assert.equal(shareCalls,1,'share invoked synchronously before yielding gesture');const second=run('saveOriginalC(button)');await flush();assert.equal(shareCalls,1,'repeated taps must not duplicate share');releaseShare();await first;assert.equal(button.disabled,false);
run('disposeImageSaveC()');fetchImpl=async()=>{throw new TypeError('Failed to fetch')};run(`prepareImageSaveC(item)`);await run('imageSaveC.ready');assert.equal(run('imageSaveC.phase'),'failed');assert.match(status,/无法读取原图/);
fetchImpl=async()=>response;ctx.navigator={canShare:()=>false};ctx.URL.createObjectURL=()=>{created++;return 'blob:test'};ctx.URL.revokeObjectURL=()=>{revoked++};run(`prepareImageSaveC(item)`);await run('imageSaveC.ready');run('saveOriginalC(button)');await flush();assert.equal(created,1);assert.equal(links,1);assert.match(status,/已发起原图下载/);
fetchImpl=async()=>response;run(`prepareImageSaveC(item)`);const old=run('imageSaveC');run(`prepareImageSaveC({...item,url:'https://raw.githubusercontent.com/o/r/main/other.png'})`);assert.equal(old.controller.signal.aborted,true,'replacement aborts prior prefetch');run('disposeImageSaveC()');assert.equal(ctx.imageSaveC,undefined); // lexical state intentionally stays private
const server=fs.readFileSync(path.join(__dirname,'../server.mjs'),'utf8');assert.match(server,/connect-src 'self' https:\/\/raw\.githubusercontent\.com;/);
// Unsafe schemes/credentials stay plain text, with no actionable fallback.
for(const url of ['javascript:alert(1)','data:image/png;base64,AA==','https://u:p@example.test/a.png','//example.test/a.png']){
 ctx.testURL=url;assert.equal(run('safeImageURLC(testURL)'),'');assert(!run('detailLinkC(testURL)').includes('<a '));assert(!run('imageSaveMarkupC({url:testURL})').includes('<a '));
}
assert.match(run(`detailLinkC('https://example.test/a?x=1&y=2', '\"<b>')`),/&amp;y=2/);assert(!run(`detailLinkC('https://example.test', '<b>')`).includes('<b>'));
const branch='feature/new #图',assetPath='assets/图 /a%#?&\".png';ctx.S.repo={owner:'o name',repo:'r#图',branch};
const encoded=[ctx.S.repo.owner,ctx.S.repo.repo,branch].map(encodeURIComponent).join('/');
ctx.encodedItem={url:`https://raw.githubusercontent.com/${encoded}/${assetPath.split('/').map(encodeURIComponent).join('/')}`,path:assetPath};ctx.S.assets=[ctx.encodedItem];
assert(run('detailRepositoryC(encodedItem)').includes(`/blob/${encodeURIComponent(branch)}/`));assert(run('detailRepositoryC(encodedItem)').includes('a%25%23%3F%26%22.png'));assert(run('detailRepositoryC(encodedItem)').includes('&amp;&quot;.png'));
assert.equal(run(`detailRepositoryC({...encodedItem,url:encodedItem.url+'?other=1'})`),'');
ctx.sample=rawBlob;ctx.binaryItem={url:'https://example.test/a%2Fb%5Cc%00%22%3C%3E.png'};
const named=run('originalFileC(sample,binaryItem)');assert(!/[\\/\u0000"<>]/.test(named.name));assert.deepEqual([...new Uint8Array(await named.file.arrayBuffer())],[...bytes]);
for(const [ext,type]of [['gif','image/gif'],['svg','image/svg+xml'],['webp','image/webp'],['jpg','image/jpeg']]){
 ctx.sample=new Blob([bytes],{type:'application/octet-stream'});ctx.binaryItem={url:`https://example.test/original.${ext}`};const f=run('originalFileC(sample,binaryItem)');assert.equal(f.file.type,type);assert.equal(f.name,'original.'+ext);assert.deepEqual([...new Uint8Array(await f.file.arrayBuffer())],[...bytes]);
}
ctx.sample=new Blob([bytes],{type:'text/html'});assert.throws(()=>run('originalFileC(sample,binaryItem)'),/不是/);
// Cancellation is silent, does not download, restores busy and allows retry.
fetchImpl=async()=>response;run('prepareImageSaveC(item)');await run('imageSaveC.ready');
ctx.navigator={canShare:()=>true,share:()=>Promise.reject(new DOMException('cancel','AbortError'))};let before=statuses.length,beforeLinks=links;
await run('saveOriginalC(button)');assert.equal(statuses.length,before);assert.equal(links,beforeLinks);assert.equal(button.disabled,false);assert.equal(button.dataset.busy,undefined);
ctx.navigator.share=()=>Promise.reject(new TypeError('unsupported'));await run('saveOriginalC(button)');assert.match(status,/再次点击/);assert.equal(links,beforeLinks);await run('saveOriginalC(button)');assert.equal(links,beforeLinks+1);
// No asynchronous auto-share when an early tap races the prefetch.
let releaseFetch;fetchImpl=()=>new Promise(r=>releaseFetch=r);run('prepareImageSaveC(item)');shareCalls=0;
ctx.navigator={canShare:()=>true,share:()=>{shareCalls++;return Promise.resolve()}};
await run('saveOriginalC(button)');assert.match(status,/再次点击/);releaseFetch(response);await run('imageSaveC.ready');assert.equal(shareCalls,0);await run('saveOriginalC(button)');assert.equal(shareCalls,1);
// External origins do not cause CSP-blocked requests; explicit real link remains.
let requested=0;fetchImpl=async()=>{requested++;return response};run(`prepareImageSaveC({url:'https://example.test/a.png'})`);assert.equal(requested,0);assert.match(status,/外部来源/);assert.match(run(`imageSaveMarkupC({url:'https://example.test/a.png'})`),/href="https:\/\/example.test\/a.png"/);
// Enforce both advertised and streamed sizes, timeout and HTTP failures.
fetchImpl=async()=>({...response,headers:{get:k=>k==='content-length'?String(33*1024*1024):'image/png'}});run('prepareImageSaveC(item)');await run('imageSaveC.ready');assert.match(status,/32 MB/);
let cancelled=0;fetchImpl=async()=>({...response,headers:{get:()=>null},body:{getReader:()=>({read:async()=>({value:{byteLength:33*1024*1024}}),cancel:async()=>cancelled++,releaseLock(){}})}});run('prepareImageSaveC(item)');await run('imageSaveC.ready');assert.match(status,/32 MB/);assert.equal(cancelled,1);
fetchImpl=async()=>({...response,ok:false,status:404});run('prepareImageSaveC(item)');await run('imageSaveC.ready');assert.match(status,/HTTP 404/);
fetchImpl=(_url,opts)=>new Promise((_resolve,reject)=>opts.signal.addEventListener('abort',()=>reject(new DOMException('abort','AbortError'))));run('prepareImageSaveC(item)');timers.get(run('imageSaveC.timer')).f();await run('imageSaveC.ready');assert.match(status,/超时/);
// Production modal lifecycle, not a duplicate test implementation.
vm.runInContext(source.slice(source.indexOf('function openC('),source.indexOf('function confirmC(')),ctx);ctx.closeSortMenus=()=>{};ctx.imageURLC=i=>i.url;ctx.S.uploadDraft=null;ctx.$c=s=>s==='#modalRoot'?modal:s.includes('[data-image-save-status]')?modal.querySelector('[data-image-save-status]'):null;
fetchImpl=async()=>response;ctx.S.repo={owner:'o',repo:'r',branch:'main'};ctx.S.assets=[item];run('assetModal(item)');assert.equal((modal.innerHTML.match(/class="btn(?: |")/g)||[]).length,5);assert.match(modal.innerHTML,/复制直链<\/button><button[^>]+save-original[^>]*>保存图片/);const oldState=run('imageSaveC');run('iconModal({...item,index:0})');assert(oldState.controller.signal.aborted);assert.equal((modal.innerHTML.match(/class="btn(?: |")/g)||[]).length,3);await run('imageSaveC.ready');ctx.navigator={canShare:()=>false};await run('saveOriginalC(button)');const last=run('imageSaveC');before=revoked;run('closeC()');assert.equal(run('imageSaveC'),null);assert.equal(last.blob,null);assert.equal(last.file,null);assert.equal(revoked,before+1);assert.equal(timers.size,0);assert.equal(modal.innerHTML,'');
run('iconModal({...item,index:0})');await run('imageSaveC.ready');assert.equal(run('imageSaveC.phase'),'ready');run('openC("replacement")');assert.equal(run('imageSaveC'),null);assert.match(modal.innerHTML,/replacement/);
ctx.sample=rawBlob;ctx.binaryItem={url:'https://example.test/'+encodeURIComponent('图😀'.repeat(200))+'.png'};const longName=run('originalFileC(sample,binaryItem)').name;assert(new Blob([longName]).size<200);assert(longName.endsWith('.png'));
ctx.binaryItem={url:'https://example.test/CON.png'};assert.equal(run('originalFileC(sample,binaryItem)').name,'_CON.png');
run('assetModal(item)');await run('imageSaveC.ready');ctx.navigator={canShare:()=>{throw Error('unsupported')},share:()=>{throw Error('must not call')}};beforeLinks=links;await run('saveOriginalC(button)');assert.equal(links,beforeLinks+1);
let endShare;ctx.navigator={canShare:()=>true,share:()=>new Promise(r=>endShare=r)};const pendingShare=run('saveOriginalC(button)');assert(button.disabled);run('closeC()');run('assetModal(item)');await run('imageSaveC.ready');const replacementState=run('imageSaveC');before=statuses.length;endShare();await pendingShare;assert.equal(statuses.length,before,'old share completion cannot change reopened modal');assert.equal(replacementState.busy,false);assert.equal(button.disabled,false);run('closeC()');assert.equal(timers.size,0);
assert(source.includes("window.addEventListener('pagehide',disposeImageSaveC)"));assert(!source.slice(start,end).includes('pendingSubmission'));assert(!/toDataURL|toBlob|getContext\(/.test(source.slice(start,end)));assert(!source.slice(start,end).includes('已保存到'));
assert(!/connect-src[^;]*(?:https:\s|\*)/.test(server));
console.log('PASS image-save: escaped/encoded safe links, exact bytes/type/name, synchronous gesture share, staged early taps, CORS/HTTP/timeouts/size limits, unsupported download, cancellation/repeats, modal cleanup/reopen, CSP. All network/share/download operations mocked.');
})().catch(error=>{console.error(error);process.exitCode=1});
