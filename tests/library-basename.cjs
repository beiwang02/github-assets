const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const js=fs.readFileSync('console.js','utf8');
const S={repo:{owner:'fixture',repo:'fixture',branch:'main'},connected:true,libraries:[],selectedLibrary:'a',iconQuery:'',selectedIcons:new Set()};
let modal='';const ctx=vm.createContext({S,sortedLibrariesC:x=>x,sortedIconsC:(l,x)=>x,emptyC:()=>'',openC:html=>modal=html});
vm.runInContext(js.slice(js.indexOf('const escC ='),js.indexOf('let repositoryClient='))+'\nglobalThis.escC=escC;globalThis.rawLibrary=rawLibrary;',ctx);
vm.runInContext(js.slice(js.indexOf('function librariesView()'),js.indexOf('function groupView()')),ctx);
vm.runInContext(js.slice(js.indexOf('function libraryModal('),js.indexOf('function editIconModal(')),ctx);
for(const file of ['json/1.json','json/nested/1.json','1.json','json/中文/中文 & <库> "测试".json']){
 const lib={id:'a',name:'测试库',description:'真实说明 json/保持',file,count:0,icons:[]};S.libraries=[lib];
 const before=JSON.stringify(lib),base=file.split('/').pop(),html=ctx.librariesView();
 assert(html.includes(`<em>0 个图片引用 · ${ctx.escC(base)}</em>`));
 assert(html.includes(`<p class="json-library-summary">${ctx.escC(lib.description)}</p>`));
 assert(html.includes(`data-copy="${ctx.escC(ctx.rawLibrary(lib))}"`));
 assert.equal(ctx.rawLibrary(lib),'https://raw.githubusercontent.com/fixture/fixture/main/'+file.split('/').map(encodeURIComponent).join('/'));
 ctx.libraryModal(true);
 // Preserve the existing edit dialog exactly: filename without extension, not a new full-path UI.
 assert(modal.includes(`name="path" value="${ctx.escC(base.replace(/\.json$/i,''))}"`));
 assert.equal(JSON.stringify(lib),before);
}
assert(fs.readFileSync('index.html','utf8').includes('console.js?v=https-initial-caption-103'));
assert(js.includes('<small>${lib.count} 个图片引用 · ${escC(lib.file)}</small>'));
console.log('PASS current-library basename: nested paths, .json retained, Chinese/HTML escaped, file immutable, full raw URL and existing edit/picker preserved');
