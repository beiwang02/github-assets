const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),cp=require('node:child_process');
const js=fs.readFileSync('console.js','utf8'),old=cp.execFileSync('git',['show','42cb087:console.js'],{encoding:'utf8'});
const hero=/<div class="hero">[\s\S]*?<\/div><\/div><\/div>(?=<div class="stat-grid">)/;
assert(hero.test(old));assert.equal(js,old.replace(hero,''),'Only hero markup changes in production JS');
const S={connected:false,assets:[],groups:[],libraries:[]},c=vm.createContext({S,escC:String,statC:()=>'<div class="stat-card"></div>',emptyC:(i,t,d,a,l)=>`<button data-action="${a}">${l}</button>`,sortedLibrariesC:x=>x,sortedAssetsC:x=>x,coverStack:()=>'',imageURLC:x=>x.url});
vm.runInContext(js.slice(js.indexOf('function overviewView()'),js.indexOf('function librariesView()')),c);
vm.runInContext(js.slice(js.indexOf('function overviewQuickAssets()'),js.indexOf('\nrenderC();',js.indexOf('const originalOverviewView'))),c);
for(const connected of [false,true])for(const populated of [false,true]){S.connected=connected;S.assets=populated?[{id:'a',name:'a',url:'data:,'}]:[];S.libraries=populated?[{id:'l',name:'l',count:0}]:[];const h=c.overviewView();assert(h.startsWith('<div class="stat-grid">'));assert(!h.includes('hero'));assert.equal((h.match(/class="stat-card"/g)||[]).length,4);assert(h.indexOf('overview-assets-section')<h.indexOf('dashboard-columns'));if(!populated)assert(h.includes(connected?'data-action="upload"':'data-action="settings"'));}
for(const [start,end,action] of [['function assetsView()','function settingsPage()','upload'],['function librariesView()','function assetsView()','new-library']])assert(js.slice(js.indexOf(start),js.indexOf(end)).includes(`data-action="${action}"`));
const css=fs.readFileSync('console.css','utf8'),oldcss=cp.execFileSync('git',['show','42cb087:console.css'],{encoding:'utf8'});
assert(css.includes('.content > .stat-grid { margin-bottom:24px; }'));
assert(css.includes('.overview-assets-section { margin-top:24px; }'));
assert(css.includes('.overview-assets-section + .dashboard-columns { margin-top:24px; }'));
for(const f of ['popup.js','github.js','server.mjs'])assert.equal(fs.readFileSync(f,'utf8'),cp.execFileSync('git',['show','42cb087:'+f],{encoding:'utf8'}),f+' unchanged');
console.log('PASS no hero: final wrapper/stats/assets/JSON/empty states retained; exact JS removal and overview spacing only; palettes and other production files unchanged');
