const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),cp=require('node:child_process');
const js=fs.readFileSync('console.js','utf8'),old=cp.execFileSync('git',['show','f84318d:console.js'],{encoding:'utf8'});
const bar=/<section class="overview-quickbar"[\s\S]*?<\/section>(?=<div class="stat-grid">)/;
assert(!bar.test(js));assert.equal(js,old,'Removing only the quickbar restores the exact pre-bar production JS');
const currentCSS=fs.readFileSync('ui-refresh.css','utf8'),approvedCSS=cp.execFileSync('git',['show','a20d300:ui-refresh.css'],{encoding:'utf8'});
assert.equal(currentCSS,approvedCSS.replace(/\/\* Compact overview shortcuts only;[^]*?\n(?=\n\n\/\* Theme-local feedback)/,''),'Only quickbar CSS removed; auxiliary ink and feedback unchanged');
const S={connected:false,assets:[],groups:[],libraries:[]},c=vm.createContext({S,escC:String,statC:()=>'<div class="stat-card"></div>',emptyC:(i,t,d,a,l)=>`<button data-action="${a}">${l}</button>`,sortedLibrariesC:x=>x,sortedAssetsC:x=>x,coverStack:()=>'',imageURLC:x=>x.url});
vm.runInContext(js.slice(js.indexOf('function overviewView()'),js.indexOf('function librariesView()')),c);
vm.runInContext(js.slice(js.indexOf('function overviewQuickAssets()'),js.indexOf('\nrenderC();',js.indexOf('const originalOverviewView'))),c);
for(const connected of [false,true])for(const populated of [false,true]){S.connected=connected;S.assets=populated?[{id:'a',name:'a',url:'data:,'}]:[];S.libraries=populated?[{id:'l',name:'l',count:0}]:[];const h=c.overviewView();assert(h.startsWith('<div class="stat-grid">'));assert(!h.includes('hero'));assert(!h.includes('overview-quickbar'));assert.equal((h.match(/class="stat-card"/g)||[]).length,4);assert(h.indexOf('overview-assets-section')<h.indexOf('dashboard-columns'));if(!populated)assert(h.includes(connected?'data-action="upload"':'data-action="settings"'));}
for(const [start,end,action] of [['function assetsView()','function settingsPage()','upload'],['function librariesView()','function assetsView()','new-library']])assert(js.slice(js.indexOf(start),js.indexOf(end)).includes(`data-action="${action}"`));
const css=fs.readFileSync('console.css','utf8'),oldcss=cp.execFileSync('git',['show','42cb087:console.css'],{encoding:'utf8'});
assert(css.includes('.content > .stat-grid { margin-bottom:24px; }'));
assert(css.includes('.overview-assets-section { margin-top:24px; }'));
assert(css.includes('.overview-assets-section + .dashboard-columns { margin-top:24px; }'));
for(const f of ['popup.js','github.js','server.mjs'])assert.equal(fs.readFileSync(f,'utf8'),cp.execFileSync('git',['show','42cb087:'+f],{encoding:'utf8'}),f+' unchanged');
console.log('PASS overview without hero or quickbar: stats/assets/JSON/empty states retained; only quickbar removed, auxiliary ink and feedback preserved');
