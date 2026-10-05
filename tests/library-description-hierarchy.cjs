const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const js=fs.readFileSync('console.js','utf8');
const lib={id:'a',name:'真实库',description:'中文真实说明',file:'json/emby.json',count:2,icons:[]};
const S={connected:true,libraries:[lib],selectedLibrary:'a',iconQuery:'',selectedIcons:new Set()};
let modal='';const c=vm.createContext({S,escC:String,uiIconC:()=>'',sortedLibrariesC:x=>x,sortedIconsC:(l,x)=>x,rawLibrary:l=>'https://raw.example/'+l.file,emptyC:()=>'',openC:h=>modal=h,document:{querySelector:()=>null},$c:()=>null});
vm.runInContext(js.slice(js.indexOf('function librariesView()'),js.indexOf('function groupView()')),c);
vm.runInContext(js.slice(js.indexOf('function libraryPickerModal()'),js.indexOf('\nfunction ',js.indexOf('function libraryPickerModal()')+1)),c);
for(const description of ['中文真实说明',undefined,'','  ']){
 lib.description=description;const h=c.librariesView();c.libraryPickerModal();
 const chooser=h.slice(h.indexOf('class="library-current-copy"'),h.indexOf('class="library-name-chevron"'));
 for(const text of [chooser,modal]){assert(text.includes('emby.json'));assert(!text.includes('json/'));assert.equal(text.includes('class="library-description"'),Boolean(description?.trim()));if(description?.trim()){assert(text.indexOf('真实库')<text.indexOf(description));assert(text.indexOf(description)<text.indexOf('2 个图片引用'));}}
 assert(h.includes('data-copy="https://raw.example/json/emby.json"'));assert.equal(lib.file,'json/emby.json');
}
assert(js.includes('name="file"'));assert(js.includes('data-action="delete-library"'));assert(js.includes('data-action="select-library"'));
console.log('PASS current selector and picker hide filename, description under name, real path/raw/edit retained (synthetic)');
