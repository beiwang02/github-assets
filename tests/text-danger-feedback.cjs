const fs=require('node:fs'),assert=require('node:assert/strict'),cp=require('node:child_process');
const css=require('./action-spacing-normalize.cjs').normalizeActionSpacing(fs.readFileSync('ui-refresh.css','utf8')),js=fs.readFileSync('console.js','utf8');
const scope='body :is(.library-switch-delete,.library-picker-delete,.group-delete-link)';
const paint='color:var(--ui-danger-ink)!important;background:transparent!important;border-color:transparent!important;box-shadow:none!important';
assert(css.includes(scope+'{'+paint+'}'));
assert(css.includes(scope+':active,\n'+scope+':focus{'+paint+'}'));
assert(css.includes('@media(hover:hover){'+scope+':hover{'+paint+'}}'));
assert(css.includes(scope+':focus:not(:focus-visible){outline:none!important}'));
assert(css.includes('.ui-button:focus-visible{outline:2px solid var(--ui-line-focus)!important'));
assert(css.includes('body .assets-toolbar .asset-bulk-actions{gap:4px;margin-left:8px}'));
assert(css.includes('.library-switch-modal-body .library-switch-delete.ui-button{font-size:12px;font-weight:600}'));
assert(css.includes('.library-switch-modal-body .library-switch-delete.ui-button{flex:0 0 44px;width:44px;min-width:44px;height:44px;min-height:44px;padding:0}'));
assert(js.includes('aria-label="删除JSON库${escC(lib.name)}">删除</button>'));
assert(js.includes("close:'m6 6 12 12M18 6 6 18'"));assert(!js.includes('library-delete-trash'));
assert(css.includes('.btn-danger{color:var(--ui-danger-ink);background:var(--ui-danger-bg);border:1px solid var(--ui-danger-line)}'));
assert(css.includes('background:var(--ui-danger-bg);box-shadow:none;transform:none;pointer-events:none;z-index:0}'));
assert(css.includes('--ui-danger-ink:#e5a0ad;--ui-danger-line:#70434d;--ui-danger-bg:#30212b'));
const base=cp.execFileSync('git',['show','HEAD:console.js'],{encoding:'utf8'});
assert.equal(js,base,'Picker text restored; all confirmation and file deletion JS stays exactly HEAD');
// Run real dispatch branches and confirmation renderer in an isolated VM; no network.
const vm=require('node:vm');
const confirmFn=js.slice(js.indexOf('function confirmC('),js.indexOf('\nfunction ',js.indexOf('function confirmC(')+1));
for(const action of ['delete-library','confirm-delete-group']){
 const start=js.indexOf("  if(action==='"+action+"')");
 const end=action==='delete-library'?js.indexOf("  if(action==='delete-icon')",start):js.indexOf('\n});',start);
 let markup='',stopped=0,writes=0,closed=0;
 const state={libraries:[{id:'real',name:'真实 JSON 库',file:'json/real.json'}],selectedLibrary:'other',group:'真实分组'};
 const ctx={S:state,action,target:{dataset:{id:'real',group:'真实分组'}},e:{stopPropagation(){stopped++}},escC:String,openC(h){markup=h},closeC(){closed++},currentClient(){writes++;throw Error('No writes allowed before confirmation')}};
 vm.runInNewContext(confirmFn+'\n(function(){'+js.slice(start,end)+'})()',ctx);
 assert(markup.includes(action==='delete-library'?'永久删除 JSON 文件':'永久删除分组'));
 assert(markup.includes(action==='delete-library'?'真实 JSON 库':'真实分组'));
 assert(markup.includes('class="btn btn-danger" data-action="confirm-exec"'));
 assert.equal(typeof state.modalConfirm,'function');assert.equal(writes,0);assert.equal(closed,0);assert.equal(state.selectedLibrary,'other');
 if(action==='delete-library')assert.equal(stopped,1,'Delete text stops row selection propagation');
}
assert(css.includes('.ui-button:disabled{cursor:not-allowed;opacity:.5;transform:none}'),'Disabled dimming untouched');
function lum(h){return h.match(/[a-f\d]{2}/gi).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0)}
const ratios=['#17243a','#30212b'].map(bg=>(lum('#e5a0ad')+.05)/(lum(bg)+.05));ratios.forEach(r=>assert(r>=4.5));
console.log('PASS text-danger-feedback: explicit delete text/ink, transparent hover/active/pointer focus, keyboard outline, 44px text hit, equal bulk pair gaps, ordinary danger/JSON paint preserved, JS actions frozen; dark AA '+ratios.map(r=>r.toFixed(2)).join('/')+':1');
