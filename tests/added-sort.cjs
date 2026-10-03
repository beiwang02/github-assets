const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../console.js'),'utf8');
const ctx=vm.createContext({URL,S:{assets:[]},escC:String});vm.runInContext(source.slice(source.indexOf('const collatorC='),source.indexOf('function activityView')),ctx);
for(const [fn,field] of [['sortedAssetsC','createdAt'],['sortedIconsC','addedAt']]){
 const items=[{id:'u1',name:'Z',path:'z',updatedAt:'2099-01-01'},{id:'old',name:'B',path:'b',[field]:'2020-01-01',updatedAt:'2099-01-01'},{id:'u2',name:'A',path:'a',[field]:'invalid'},{id:'new',name:'C',path:'c',[field]:'2025-01-01'},{id:'same',name:'D',path:'d',[field]:'2025-01-01'}];
 const sort=mode=>Array.from(fn==='sortedIconsC'?ctx[fn]({},items,mode):ctx[fn](items,mode),x=>x.id);
 assert.deepEqual(sort('newest'),['new','same','old','u1','u2']);assert.deepEqual(sort('oldest'),['old','new','same','u1','u2']);
 assert.deepEqual(sort('name-asc'),['u2','old','new','same','u1']);assert.deepEqual(sort('name-desc'),['u1','same','new','old','u2']);
 items[1].name='Renamed';items[1].path='new-path';items[1].updatedAt='2100-01-01';items[0].path='a';items[0].name='renamed unknown';
 assert.deepEqual(sort('newest'),['new','same','old','u1','u2']);assert.deepEqual(sort('oldest'),['old','new','same','u1','u2']);
}
assert.equal(ctx.sortedLibrariesC([{name:'old',updatedAt:'2026-01-01'},{name:'new',updatedAt:'2025-01-01'}],'updated-desc')[0].name,'old');
assert(source.includes("sortedAssetsC(S.assets,'updated-desc').slice(0,6)"));assert(source.includes("sortedLibrariesC(S.libraries,'updated-desc').slice(0,5)"));
assert(!source.includes("sortSelectC('assets'"));assert(!source.includes("sortSelectC('icons'"));
for(const fn of ['sortedAssetsC','sortedIconsC']){const items=[{id:'old',createdAt:'2020-01-01',addedAt:'2020-01-01',updatedAt:'2026-01-01'},{id:'new',createdAt:'2025-01-01',addedAt:'2025-01-01'},{id:'tie',createdAt:'2025-01-01',addedAt:'2025-01-01'},{id:'unknown'},{id:'bad',updatedAt:'bad'}];const run=()=>Array.from(fn==='sortedAssetsC'?ctx[fn](items):ctx[fn]({},items),x=>x.id);assert.deepEqual(run(),['old','new','tie','unknown','bad']);items[1].updatedAt='2027-01-01';assert.deepEqual(run(),['new','old','tie','unknown','bad']);}
console.log('PASS fixed latest: new/modified first, stable ties/unknown last, retained sort helpers, no toolbar menus');
