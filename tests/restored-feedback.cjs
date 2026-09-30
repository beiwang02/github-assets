const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const js=fs.readFileSync('console.js','utf8'),html=fs.readFileSync('index.html','utf8'),css=fs.readFileSync('ui-refresh.css','utf8');
const fn=js.slice(js.indexOf('function feedbackKindC('),js.indexOf('function enhanceControlsC('));const ctx={};vm.createContext(ctx);vm.runInContext(fn,ctx);
const el=(classes,hero=false)=>({dataset:{},matches:s=>s.split(',').some(c=>classes.includes(c)),closest:()=>hero});
assert.equal(ctx.feedbackKindC(el(['.btn-primary','button'])),'primary');assert.equal(ctx.feedbackKindC(el(['button'],true)),'control');assert.equal(ctx.feedbackKindC(el(['.btn-danger','button'])),'');assert.equal(ctx.feedbackKindC(el(['.asset-select','button'])),'');
assert(css.includes('body .btn.btn-primary{color:#fff;'));assert(css.includes('.settings-actions{border-top-color:var(--line)}'));assert(css.includes('body .assets-toolbar :is([data-action="select-all"],.sort-trigger,[data-action="refresh"])'));
const boot=html.match(/<script>([\s\S]*?)<\/script>/)[1];
for(const mode of ['light','dark','system','invalid','unavailable'])for(const systemDark of [false,true]){
 const root={style:{},classList:{toggle:(k,d)=>root.dark=d}},meta={};const c={localStorage:{getItem(){if(mode==='unavailable')throw Error('blocked');return mode;}},matchMedia:()=>({matches:systemDark}),document:{documentElement:root,querySelector:()=>meta}};
 vm.runInNewContext(boot,c);const dark=mode==='dark'||(mode!=='light'&&systemDark);assert.equal(root.dark,dark);assert.equal(root.style.colorScheme,dark?'dark':'light');assert.equal(meta.content,dark?'#0b1629':'#f6f8fc');
}
assert(js.includes("document.documentElement.style.colorScheme=dark?'dark':'light'"));assert(html.indexOf(boot)<html.indexOf('<link rel="stylesheet"'));
console.log('PASS restored feedback: primary border contract, toolbar theme palette, head restoration for light/dark/system/blocked storage');
