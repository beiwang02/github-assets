const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const js=fs.readFileSync('console.js','utf8');
const S={connected:true,assets:[],groups:[],libraries:[]};
const ctx=vm.createContext({S,escC:String,statC:()=>'',emptyC:(i,t,d,a,l)=>`<div class="empty-state"><button data-action="${a}">${l}</button></div>`,sortedLibrariesC:x=>x,coverStack:()=>'<div class="library-preview-strip"></div>'});
vm.runInContext(js.slice(js.indexOf('function overviewView()'),js.indexOf('function librariesView()')),ctx);
for(const connected of [false,true])for(const count of [0,1,3,6]){
 S.connected=connected;S.libraries=Array.from({length:count},(_,i)=>({id:'lib'+i,name:'库'+i,count:i%2,icons:[],file:`lib${i}.json`}));
 const html=ctx.overviewView();
 assert(!/library-card-header|library-logo|我的 JSON 库|GitHub 上的 JSON 引用集合/.test(html));
 assert(html.includes('<h3>JSON 库</h3>'));assert(html.includes('data-view="libraries">查看全部'));
 assert(html.includes('<div class="card library-card">'));
 assert.equal((html.match(/data-action="open-library"/g)||[]).length,Math.min(count,5));
 for(let i=0;i<Math.min(count,5);i++)assert(html.includes(`data-id="lib${i}"`));
 if(!count)assert(html.includes(`data-action="${connected?'new-library':'settings'}"`));
}
assert(js.includes("if(action==='open-library'){S.selectedLibrary=target.dataset.id;S.view='libraries';S.iconQuery='';S.selectedIcons.clear();closeC();renderC();return;}"));
console.log('PASS overview header removed: empty/one/multiple/5-limit, outer title and CTA, row IDs and existing library navigation preserved');
