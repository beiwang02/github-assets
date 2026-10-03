const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('console.js','utf8'),events={},S={assetQuery:'',iconQuery:'',libraryQuery:''};let renders=0,selection,active;
const document={addEventListener:(n,f)=>events[n]=f,get activeElement(){return active},querySelector:()=>({replaceWith:i=>{assert.equal(i,input)}})};
const input={dataset:{bind:'asset-search'},value:'',selectionStart:1,selectionEnd:2,selectionDirection:'backward',focus:()=>{active=input},setSelectionRange:(...s)=>{selection=s}};active=input;
const ctx=vm.createContext({document,S,pendingSubmission:false,WeakSet,renderC:()=>renders++});
vm.runInContext(source.slice(source.indexOf('const composingSearchC='),source.indexOf("document.addEventListener('input',updateSearchC);")+"document.addEventListener('input',updateSearchC);".length),ctx);
for(const bind of ['asset-search','icon-search']){input.dataset.bind=bind;const key=bind==='asset-search'?'assetQuery':'iconQuery';const before=renders;events.compositionstart({target:input});input.value='zhong';events.input({target:input,isComposing:true});events.input({target:input});assert.equal(renders,before);assert.equal(S[key],'');input.value='中文';events.compositionend({target:input});assert.equal(S[key],'中文');assert.equal(renders,before+1);assert.deepEqual(selection,[1,2,'backward']);for(const value of ['photo','中文 photo','','不存在']){input.value=value;events.input({target:input});assert.equal(S[key],value);}}
assert(!source.includes("sortSelectC('assets'"));assert(!source.includes("sortSelectC('icons'"));
console.log('PASS search IME: no render during composition; exact commit and plain input; original node/selection retained. Synthetic only.');
