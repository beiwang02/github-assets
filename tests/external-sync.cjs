const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context=vm.createContext({window:{},URL,TextDecoder,Uint8Array,atob,btoa,structuredClone});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../github.js'),'utf8'),context);
const C=context.window.GitHubClient,c=new C({owner:'o',repo:'r',branch:'feature/test',assetsPath:'assets'});
const date=n=>`2026-09-${String(n).padStart(2,'0')}T00:00:00Z`,row=n=>({sha:'h'+n,commit:{committer:{date:date(n)}}});
const a={name:'A',url:c.raw('assets/g/a.png')},b={name:'B',url:'https://example.invalid/b'};
let head=1,calls=[],invalid=false;
const docs={1:{name:'Old',icons:[a,b]},2:{name:'New',description:'changed',icons:[a,{...b,name:'B2'}]},4:{name:'New',icons:[a,{...b,name:'B3'},{name:'C',url:'https://example.invalid/c'}]}};
const content=n=>btoa(JSON.stringify(docs[n]));
c.request=async(path,method='GET')=>{
 calls.push(path);assert.equal(method,'GET','sync must never write');
 if(path===c.base)return {size:1,default_branch:'main'};
 if(path.includes('/git/ref/')){assert(path.endsWith('feature%2Ftest'));return {object:{sha:'h'+head}};}
 if(path.includes('/git/commits/'))return {tree:{sha:'t'+head}};
 if(path.includes('/git/trees/'))return {tree:[{type:'tree',path:'assets/g'},{type:'blob',path:'assets/g/'+(head>=4?'renamed':'a')+'.png',sha:head>=2?'img2':'img1'},...(head<4?[{type:'blob',path:'assets/g/extra.png',sha:'extra'}]:[]),{type:'blob',path:'json/x.json',sha:'doc'+(head===3?2:head)},...(invalid?[{type:'blob',path:'.github-assets-meta.json',sha:'bad'}]:[])]};
 if(path.includes('/git/blobs/')){if(path.endsWith('bad'))return {content:btoa('{bad')};return {content:content(Number(path.match(/doc(\d+)/)[1]))};}
 if(path.includes('/commits/h'))return {files:[{filename:'assets/g/a.png',status:'added'},{filename:'assets/g/extra.png',status:'added'},{filename:'json/x.json',status:'added'}],parents:[]};
 if(path.includes('/commits?')){const p=new URL('https://a'+path).searchParams.get('path');if(p==='json/x.json')return (head>=4?[4,2,1]:head>=2?[2,1]:[1]).map(row);return [row(head>=2?2:1)];}
 if(path.includes('/contents/'))return {content:content(Number(path.match(/ref=h(\d+)/)[1]))};
 throw new Error(path);
};
(async()=>{
 const first=await c.load();assert.deepEqual(Array.from(first.libraries[0].icons,i=>i.name),['A','B']);calls=[];
 assert.equal(await c.load(),first);assert.equal(calls.length,1);
 head=2;const second=await c.load();assert.equal(second.libraries[0].name,'New');assert.equal(second.libraries[0].icons[1].name,'B2');
 head=3;calls=[];await c.load();assert(!calls.some(x=>x.includes('/commits?')||x.includes('/git/blobs/')));
 head=4;const fourth=await c.load();assert.equal(fourth.assets.length,1);assert(fourth.assets[0].path.endsWith('renamed.png'));assert.deepEqual(Array.from(fourth.libraries[0].icons,i=>i.name),['A','B3','C']);
 head=5;invalid=true;docs[5]=docs[4];calls=[];await c.load();assert(!calls.some(x=>x.endsWith('/bad')),'metadata is not read, even malformed');assert(!calls.some(x=>x.includes('/contents/')),'no reference history replay');
 const paging=new C(c.config);let count=0;paging.request=async()=>{count++;return Array.from({length:100},()=>row(1));};assert.equal((await paging.pathHistory('a')).createdAt,null);assert.equal(count,3);
 console.log('PASS external-sync GET-only, branch fastpath, external edits preserve source order, unrelated HEAD skips blobs/history, obsolete malformed metadata ignored');
})().catch(e=>{console.error(e);process.exitCode=1});
