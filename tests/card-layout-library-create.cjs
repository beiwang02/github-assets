const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const js=fs.readFileSync('console.js','utf8');
const make=(cls,button=false)=>{const set=new Set([cls]);return {dataset:{action:button?'copy':'asset-open'},classList:{add:x=>set.add(x),remove:x=>set.delete(x),contains:x=>set.has(x)},matches:s=>s.split(',').some(x=>x===('button')?button:x==='[role="button"]'?false:x.startsWith('.')&&set.has(x.slice(1))),hasAttribute:()=>true,setAttribute(){},removeAttribute(){},closest:()=>null};};
const cards=['asset-card','quick-asset','json-reference-row','library-list-row','library-empty-row'].map(c=>make(c)),nested=make('icon-btn',true),all=[...cards,nested];
for(const c of cards){c.classList.add('ui-button');c.dataset.ui='secondary';}
const ctx={NodeFilter:{SHOW_TEXT:4},document:{querySelectorAll:s=>s.startsWith('.library-list-row')?cards:all,createTreeWalker:()=>({nextNode:()=>false})},feedbackKindC:()=> 'surface'};
vm.createContext(ctx);vm.runInContext(js.slice(js.indexOf('function enhanceControlsC(){'),js.indexOf('const uiObserverC=')),ctx);
for(let pass=0;pass<5;pass++){
 ctx.enhanceControlsC();for(const card of cards){assert(!card.classList.contains('ui-button'));assert.equal(card.dataset.ui,undefined);assert.equal(card.tabIndex,0);}
 assert(nested.classList.contains('ui-button'));assert(nested.classList.contains('copy-control'));assert.equal(nested.dataset.ui,'icon');
}
console.log('PASS repeated enhancer: composite layout classes excluded and repaired; nested buttons enhanced');
