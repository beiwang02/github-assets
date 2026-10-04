const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const js=fs.readFileSync('console.js','utf8'),css=fs.readFileSync('ui-refresh.css','utf8');
const S={connected:true,assets:[],groups:[],libraries:[]};
const ctx=vm.createContext({S,escC:v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;'),statC:()=>'',emptyC:(i,t)=>`<div class="empty-state">${t}</div>`,sortedLibrariesC:x=>x,sortedIconsC:(l,x)=>x,imageURLC:x=>x.url});
vm.runInContext(js.slice(js.indexOf('function coverStack('),js.indexOf('function relativeTimeC(')),ctx);
vm.runInContext(js.slice(js.indexOf('function overviewView()'),js.indexOf('function librariesView()')),ctx);
for(const connected of [false,true])for(const count of [0,1,3,6]){
 S.connected=connected;S.libraries=Array.from({length:count},(_,i)=>({id:'lib'+i,name:'真实库'+i,count:i%2,icons:i%2?[{url:'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}]:[],description:i%3===0?'用户说明':i%3===1?'':'   ',file:`lib${i}.json`}));
 const html=ctx.overviewView();
 assert(!html.includes('library-empty-row'));assert(!html.includes('library-card-header'));
 assert.equal((html.match(/class="library-list-row"/g)||[]).length,Math.min(count,5));
 for(let i=0;i<Math.min(count,5);i++){
  const row=html.split('class="library-list-row"')[i+1].split('class="library-list-row"')[0];
  assert(row.includes(`<b>真实库${i}</b>`));assert(row.includes(`<strong>${i%2} 个</strong><span>已读取</span>`));
  assert(row.includes('library-row-icon'));assert(!row.includes('<img '));assert(!row.includes('library-preview-strip'));assert(!row.includes('暂无图片引用'));assert(!row.includes(`lib${i}.json`));assert.equal(row.includes('<small>'),i%3===0);if(i%3===0)assert(row.includes('<small>用户说明</small>'));
 }
 if(!count)assert(html.includes('class="empty-state"'));
}
const purple='linear-gradient(135deg,#7580ff,#8c64e9)';
const maps=[...js.matchAll(/data\.libraries\.map\(([^;]+)\);/g)];assert.equal(maps.length,2);
for(const map of maps){const fn=vm.runInNewContext(`(${map[1]})`);for(const items of [[{id:'e'}],[{id:'a'},{id:'e'},{id:'b'}],[{id:'e'},{id:'b'},{id:'a'},{id:'new'}]]){const before=JSON.stringify(items);const result=items.map(fn);assert(result.every(x=>x.gradient===purple));assert.equal(JSON.stringify(items),before);}}
assert(!js.includes('i%3'));assert(!js.includes('#ffb26d'));assert(!js.includes('#6672ff,#7b8af1'));
assert.equal((js.match(/lib\.gradient\|\|'linear-gradient\(135deg,#7580ff,#8c64e9\)'/g)||[]).length,2);
assert(css.includes('body .library-logo,body .library-row-icon{background:'+purple+'}'));
assert(css.includes('.library-card .library-row-icon{flex:0 0 36px;width:36px;height:36px'));
for(const count of [0,1,4]){const html=ctx.coverStack({name:'真实库',icons:Array.from({length:count},()=>({url:'image'}))});assert.equal(html,'<span class="library-row-icon" aria-hidden="true"><span class="library-initial">真</span></span>');}
console.log('PASS library initials: uniform empty/populated; real descriptions only; no preview/file fallback; fixed purple; five limit');
