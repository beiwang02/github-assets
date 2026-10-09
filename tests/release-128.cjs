const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const js=fs.readFileSync('console.js','utf8');
(async()=>{
 let fail=false,release;const repos=[{owner:{login:'me'},name:'saved',default_branch:'main'},{owner:{login:'me'},name:'other',default_branch:'main'}];
 const S={auth:{login:'me'},view:'settings',connected:true,repo:{owner:'me',repo:'saved',branch:'custom',assetsPath:'pictures'},repos:[],projectCandidates:[]};
 const client={listRepos:async()=>{if(fail)throw Error('offline');return repos},findProjectRepositories:async()=>[{owner:'me',repo:'other'}]};
 const c=vm.createContext({S,currentClient:()=>client,renderC(){}});
 vm.runInContext(js.slice(js.indexOf('function compatibleRepos()'),js.indexOf('function settingsPage()')),c);
 assert.equal(c.compatibleRepos()[0].name,'saved','saved repo fallback before asynchronous discovery');
 const original=JSON.stringify(S.repo);await c.refreshRepositoryChoicesC();assert.equal(c.compatibleRepos().length,2);assert.equal(JSON.stringify(S.repo),original);assert(S.connected);
 const oldRepos=S.repos,oldCandidates=S.projectCandidates;fail=true;await c.refreshRepositoryChoicesC();assert.equal(S.repos,oldRepos);assert.equal(S.projectCandidates,oldCandidates);assert(S.connected);
 fail=false;client.findProjectRepositories=async()=>{throw Error('scan failure')};await c.refreshRepositoryChoicesC();assert.equal(S.repos,oldRepos);assert.equal(S.projectCandidates,oldCandidates);
 client.findProjectRepositories=async()=>[{owner:'me',repo:'other'}];client.listRepos=()=>new Promise(r=>release=r);const pending=c.refreshRepositoryChoicesC();assert.equal(c.compatibleRepos().length,2);release(repos);await pending;
 const boot=js.slice(js.indexOf('async function bootAuth('),js.indexOf("window.addEventListener('online'"));assert(boot.includes('void refreshRepositoryChoicesC();'));assert(boot.indexOf('void refreshRepositoryChoicesC();')<boot.indexOf('await readRepo('));
 const asset=js.slice(js.indexOf('function assetView('),js.indexOf('function filteredAssets('));assert(!asset.includes('class="asset-meta"'));assert(asset.indexOf('class="asset-select"')<asset.indexOf('<b title='));
 assert(!js.includes('class="quick-copy'));assert(js.includes('title="复制 JSON 直链"'));
 console.log('PASS release128: saved-repo fallback, background choices, no branch/path switch, list/connection retention on list/scan failures, nonblocking discovery, inline asset selection, no overview copy');
})().catch(e=>{console.error(e);process.exitCode=1});
