const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const js=fs.readFileSync('console.js','utf8'),css=fs.readFileSync('console.css','utf8');
const S={connected:false,assets:[],groups:[],libraries:[],activity:[{title:'读取了 GitHub 仓库',detail:'fixture',time:Date.now()}]};
const ctx=vm.createContext({S,escC:String,statC:()=>'<div>stat</div>',emptyC:()=>'<div>empty</div>',sortedLibrariesC:x=>x,sortedAssetsC:x=>x,coverStack:()=>'',imageURLC:x=>x.url,activityView:()=>'<time>log preserved</time>'});
vm.runInContext(js.slice(js.indexOf('function overviewView()'),js.indexOf('function librariesView()')),ctx);
vm.runInContext(js.slice(js.indexOf('function overviewQuickAssets()'),js.indexOf('\nrenderC();',js.indexOf('const originalOverviewView'))),ctx);
for(const connected of [false,true])for(const populated of [false,true]){
 S.connected=connected;S.libraries=populated?[{id:'lib',count:0,name:'fixture'}]:[];S.assets=populated?[{id:'a',name:'fixture',url:'data:,',group:'test'}]:[];
 const html=ctx.overviewView();assert(!html.includes('最近动态'));assert(!html.includes('data-view="activity"'));assert(!html.includes('activity-card'));assert(html.includes('最近图片资源'));assert(html.includes('我的 JSON 库'));assert.equal((html.match(/class="dashboard-columns"/g)||[]).length,1);assert(html.indexOf('overview-assets-section')<html.indexOf('dashboard-columns'));assert.equal(S.activity.length,1);
}
vm.runInContext(js.slice(js.indexOf('function activityPage()'),js.indexOf('function adminPage()')),ctx);
assert(ctx.activityPage().includes('log preserved'));assert(js.includes('S.activity.unshift('));assert(css.includes('.dashboard-columns { margin-top:28px; grid-template-columns:minmax(0,1fr); }'));
console.log('PASS final overview: no activity region/entry, quick assets and libraries retained, one column, independent activity page and internal logging retained');
