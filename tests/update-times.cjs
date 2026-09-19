const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=require('node:path').join(__dirname,'..'),source=fs.readFileSync(root+'/console.js','utf8');
const sorting=source.slice(source.indexOf('const collatorC='),source.indexOf('function activityView'));
const ui=vm.createContext({URL,S:{assets:[],iconSort:'newest',assetSort:'newest',librarySort:'updated-desc'},escC:String,window:{}});
vm.runInContext(sorting,ui);
const icons=[{name:'A',url:'https://example.invalid/a',addedAt:'2020-01-01',updatedAt:'2026-09-01',index:0},{name:'B',url:'https://example.invalid/b',addedAt:'2025-01-01',index:1},{name:'C',url:'https://example.invalid/c',addedAt:'2026-01-01',index:2},{name:'D',url:'https://example.invalid/d',addedAt:'2026-09-02',index:3},{name:'unknown',url:'https://example.invalid/u',index:4}];
const original=JSON.stringify(icons),lib={icons};
for(const mode of ['newest','oldest','name-asc','name-desc']){ui.S.iconSort=mode;const html=ui.coverStack(lib);assert(html.indexOf('/d')<html.indexOf('/a'));assert(html.indexOf('/a')<html.indexOf('/c'));assert(!html.includes('invalid/b'));}
assert.equal(ui.sortedIconsC(lib,icons,'oldest')[0].index,0);assert.equal(ui.sortedIconsC(lib,icons,'newest')[0].index,3);assert.equal(JSON.stringify(icons),original);
assert.equal(ui.compareTimedC({}, {}, 'latest',-1),0);assert.equal(ui.compareTimedC({updatedAt:'bad',addedAt:'2020-01-01'},{addedAt:'2020-01-01'},'latest',-1),0);
const asset={name:'A',path:'a',url:'https://raw.githubusercontent.com/o/r/main/a.png',sha:'blob2',createdAt:'2020-01-01',updatedAt:'2026-09-01'};ui.S.assets=[asset];assert(ui.imageURLC({url:asset.url}).endsWith('?v=blob2'));assert(!asset.url.includes('?'));assert.equal(ui.sortedAssetsC([asset,{path:'b',createdAt:'2025-01-01'}],'newest')[0].path,'a');assert.equal(ui.sortedAssetsC([asset,{path:'b',createdAt:'2025-01-01'}],'oldest')[0].path,'a');
const ctx=vm.createContext({window:{},structuredClone,URL,TextDecoder,Uint8Array,atob,btoa});vm.runInContext(fs.readFileSync(root+'/github.js','utf8'),ctx);const Client=ctx.window.GitHubClient;
const c=new Client({owner:'o',repo:'r',branch:'main',assetsPath:'assets'}),url=c.raw('assets/g/a.png'),doc={path:'json/x.json',sha:'docsha',value:{name:'X',description:'',icons:[{name:'A',url},{name:'Other',url:c.raw('assets/g/b.png')}]}};
let metadata={version:1,assets:{'assets/g/a.png':{createdAt:'2020-01-01'}},libraries:{'json/x.json':{createdAt:'2020-01-01',updatedAt:'2020-01-01',references:doc.value.icons.map(i=>({...i,addedAt:'2020-01-01'}))},'json/unrelated.json':{updatedAt:'2020-01-01',references:[]}}};
let changes;const snap=()=>({head:'h',entries:[{path:'assets/g/a.png',sha:'blob'},{path:'.github-assets-meta.json',content:btoa(JSON.stringify(metadata))}],docs:[doc,{path:'json/unrelated.json',value:{icons:[]}}]});c.atomic=async(_,build)=>{changes=await build(snap());return {changed:!!changes.length};};const saved=()=>JSON.parse(changes.find(x=>x.path==='.github-assets-meta.json').content);
(async()=>{
 await c.saveIcon(doc.path,0,'A',url,'docsha');assert.equal(changes.length,0);
 await c.saveIcon(doc.path,0,'Edited',url,'docsha');let m=saved();assert.equal(m.libraries[doc.path].references[0].addedAt,'2020-01-01');assert(m.libraries[doc.path].references[0].updatedAt);assert.equal(JSON.parse(changes[0].content).icons[1].name,'Other');
 await c.renameAsset({path:'assets/g/a.png',name:'A'},'Renamed');m=saved();assert.equal(m.assets['assets/g/Renamed.png'].createdAt,'2020-01-01');assert(m.assets['assets/g/Renamed.png'].updatedAt);assert(m.libraries[doc.path].references[0].updatedAt);assert.equal(m.libraries[doc.path].references[0].addedAt,'2020-01-01');assert.equal(m.libraries['json/unrelated.json'].updatedAt,'2020-01-01');
 await c.renameGroup('g','next');m=saved();assert(m.libraries[doc.path].references[0].updatedAt);assert.equal(m.libraries['json/unrelated.json'].updatedAt,'2020-01-01');
 await c.appendToLibrary(doc.path,[{name:'New',url:c.raw('new.png')}]);m=saved();assert(m.libraries[doc.path].references[2].updatedAt);assert(m.libraries[doc.path].references[2].addedAt);
 await c.appendToLibrary(doc.path,[{name:'A',url}]);assert.equal(changes.length,0);
 await c.removeIcons(doc.path,[],'docsha');assert.equal(changes.length,0);
 await c.saveLibrary(doc.path,doc.path,'X','');assert.equal(changes.length,0);
 c.request=async()=>({sha:'newblob'});await c.upload({name:'new.png',arrayBuffer:async()=>new Uint8Array([1]).buffer},'New','g',doc.path);m=saved();assert.equal(m.assets['assets/g/New.png'].updatedAt,m.assets['assets/g/New.png'].createdAt);
 assert.throws(()=>c.metadataFromSnapshot({entries:[{path:'.github-assets-meta.json',content:btoa('bad')}]}));
 console.log('PASS update-times: covers all UI sorts; latest/oldest; stable unknown/equal; immutable original indexes; upload/add/edit/no-op; asset/group rename linked refs; unrelated library unchanged; raw URL/cache; corrupt metadata safe. Mock only.');
})().catch(e=>{console.error(e);process.exitCode=1;});
// Browser fixture executes the same production sorting helpers, never the app bootstrap.
const fixture=`<!doctype html><meta charset="utf-8"><title>最近更新安全夹具</title><style>body{font:16px sans-serif;padding:30px}img{width:70px;height:70px}section{padding:16px;border:1px solid #ddd;margin:15px}</style><h1>最近更新排序 · 无网络写入夹具</h1><div id="result"></div><script>const S={assets:[],iconSort:'name-desc',assetSort:'oldest',librarySort:'updated-desc'};const escC=String;${sorting}\nconst icons=${JSON.stringify(icons)};for(const i of icons)i.url='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="70" height="70"><rect width="70" height="70" fill="lightblue"/><text x="15" y="40">'+i.name+'</text></svg>');const lib={icons};document.getElementById('result').innerHTML=['newest','oldest','name-asc','name-desc'].map(mode=>{S.iconSort=mode;return '<section><h2>UI '+mode+'</h2>封面应始终 D / A / C'+coverStack(lib)+'<p>库顺序：'+sortedIconsC(lib,icons).map(i=>i.name+' [原索引 '+i.index+']').join(' → ')+'</p></section>'}).join('');</script>`;
fs.writeFileSync(__dirname+'/update-times-fixture.html',fixture);
