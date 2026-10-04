const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../console.js'),'utf8');
const ctx=vm.createContext({URL,S:{assets:[]},escC:String});vm.runInContext(source.slice(source.indexOf('const collatorC='),source.indexOf('function activityView')),ctx);
const assets=[{id:'old',path:'z',createdAt:'2020-01-01',updatedAt:'2099-01-01'},{id:'new',path:'a',createdAt:'2025-01-01'},{id:'tie',path:'b',createdAt:'2025-01-01'},{id:'unknown',path:'u'}];
const run=()=>Array.from(ctx.sortedAssetsC(assets),x=>x.id);assert.deepEqual(run(),['new','tie','old','unknown']);assets[0].name='Renamed';assets[0].updatedAt='2100-01-01';assert.deepEqual(run(),['new','tie','old','unknown']);
const icons=[{name:'duplicate',index:0},{name:'duplicate',index:1},{name:'new',index:2}];assert.deepEqual(Array.from(ctx.sortedIconsC({},icons),x=>x.index),[2,1,0]);assert.equal(icons[0].index,0);icons[1].name='Edited';assert.deepEqual(Array.from(ctx.sortedIconsC({},icons),x=>x.index),[2,1,0]);
assert.deepEqual(Array.from(ctx.sortedLibrariesC(assets),x=>x.id),['new','tie','old','unknown']);
assert(!source.includes("sortSelectC('assets'"));assert(!source.includes("sortSelectC('icons'"));
console.log('PASS newest-created first; modifications ignored; reverse-copy source references preserve duplicate occurrence indexes; no sort dropdowns');
