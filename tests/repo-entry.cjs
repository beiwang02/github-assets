const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const js=fs.readFileSync('console.js','utf8');
const S={repo:{owner:'fixture',repo:'images',branch:'main',assetsPath:'assets'},libraries:[],assets:[],groups:[],auth:{login:'fixture'},connected:false};
const c=vm.createContext({S,statC:()=>'',activityView:()=>'',compatibleRepos:()=>[],escC:String,emptyC:(i,t,d,a,l)=>JSON.stringify({title:t,description:d,action:a,label:l})});
vm.runInContext(js.slice(js.indexOf('function overviewView()'),js.indexOf('function librariesView()')),c);
vm.runInContext(js.slice(js.indexOf('function settingsPage()'),js.indexOf('async function loadAdminPolicy()')),c);
for(const connected of [false,true])for(const isAdmin of [false,true]){
 Object.assign(S,{connected,isAdmin,connectionError:''});const overview=c.overviewView(),settings=c.settingsPage();
 assert(!overview.includes('create-repo'));assert(settings.includes('data-action="create-repo"'));
 assert(overview.includes(connected?'新建 JSON 库':'前往仓库设置'));
 assert(!overview.includes('class="hero"'));assert(overview.startsWith('<div class="stat-grid">'));assert(!overview.includes('overview-quickbar'));
 const assets=js.slice(js.indexOf('function assetsView()'),js.indexOf('function settingsPage()'));
 const libraries=js.slice(js.indexOf('function librariesView()'),js.indexOf('function assetsView()'));
 assert(assets.includes('data-action="upload"'));assert(libraries.includes('data-action="new-library"'));
}
S.connected=false;S.connectionError='连接失败';assert(c.overviewView().includes('连接失败'));assert(!c.overviewView().includes('create-repo'));
const occurrences=js.match(/data-action="create-repo"/g)||[];assert.equal(occurrences.length,1,'only settings renders create-repo');
assert(!js.includes('repoScan'),'no new scan gating');
console.log('PASS repo entry: overview/settings, connected/disconnected/admin/error, manual create retained');
