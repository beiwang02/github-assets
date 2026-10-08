const fs=require('node:fs'),assert=require('node:assert/strict');
const css=fs.readFileSync('ui-refresh.css','utf8'),js=fs.readFileSync('console.js','utf8');
/* Round-2 regressions: grid region (mask-free), switch-option selection frame, unified danger copy. */

/* ---- 1. Hero grid must never cross the left text column ---- */
const heroGrid=css.match(/body \.overview-hero::before\{content:""[^}]*\}/)[0];
assert(!/mask-image|-webkit-mask-image/.test(heroGrid),'grid patch does not rely on mask-image');
assert(heroGrid.includes('top:0;right:0;bottom:0'),'desktop grid is a right-side strip');
assert(heroGrid.includes('width:min(340px,calc(100% - 620px))'),'desktop strip stays right of the 570px content zone (+33px padding)');
assert(heroGrid.includes('linear-gradient(rgba(255,255,255,.042) 1px,transparent 1px)'),'light grid contrast lowered to .042');
assert(heroGrid.includes('background-size:34px 34px'),'grid cell unchanged');
assert(css.includes('@media(max-width:700px){body .overview-hero::before{width:min(160px,44%);height:40px;bottom:auto'),'mobile grid is a top-right corner patch only');
assert(css.includes('body .overview-hero .hero-content::after{content:"";position:absolute;right:0;bottom:0;width:min(170px,47%);height:44px'),'mobile bottom-right corner patch lives on hero-content');
assert(css.includes('body.dark .overview-hero::before,body.dark .overview-hero .hero-content::after{background-image:linear-gradient(rgba(255,255,255,.036) 1px,transparent 1px)'),'dark grid dimmer (.036)');
assert(!css.includes('mask-image:radial-gradient'),'no hero grid mask anywhere');
assert(!/overview-hero::after/.test(css),'no sparkle-layer ::after on the hero itself');
/* Content stays above both patches. */
assert(css.includes('body .overview-hero .hero-content{min-width:0;max-width:570px;position:relative;z-index:1}'),'hero content remains above the grid layers');

/* ---- 2. Library switch: selected option gets the image-card frame, unselected stay borderless ---- */
const selected=css.match(/body \.library-switch-option\[aria-checked=true\]\{[^}]*\}/)[0];
assert(selected.includes('color:var(--ui-selection-ink)'),'selected ink');
assert(selected.includes('border-color:var(--ui-line-focus)!important'),'selected theme frame like .asset-card.selected');
assert(selected.includes('background:var(--ui-selection-bg)'),'selected theme tint');
assert(selected.includes('box-shadow:0 0 0 2px var(--ui-selection-shadow)'),'selected ring like image cards');
assert(selected.length>60,'frame is real, not the bare color-only historical rule');
assert(css.includes('body .library-switch-option{border:1px solid transparent!important}'),'unselected options keep the same border box, no visible frame');
assert(css.includes('body .library-switch-option[aria-checked=true]:focus-visible{outline:none!important}'),'selected frame replaces the redundant focus outline');
assert(css.includes('@media(hover:none){'),'touch hardening block present');
const blockStart=css.lastIndexOf('@media(hover:none){');
let depth=0,i=blockStart;
while(i<css.length){if(css[i]==='{')depth++;else if(css[i]==='}'){depth--;if(depth===0)break;}i++;}
const touch=css.slice(blockStart,i+1);
for(const t of ['body .asset-card{transform:none!important;box-shadow:none!important;transition:none!important}','body .asset-card.selected{box-shadow:0 0 0 2px var(--ui-selection-shadow)!important}','body :is(.asset-select,.reference-select){transition:none!important;transform:none!important;filter:none!important}','body .library-switch-option:focus-visible{outline:none!important}'])assert(touch.includes(t),'touch guard: '+t);
assert(!touch.includes(':hover'),'hover:none block must never contain :hover selectors');

/* ---- 3. Danger copy restored to the historical terms the user asked back ---- */
assert(js.includes('移除引用'),'reference removal = 移除引用');
assert(js.includes('删除原图'),'asset bulk term = 删除原图');
assert(js.includes('删除引用'),'reference detail term = 删除引用');
assert(!js.includes('移出此库'),'temporary 移出此库 term fully retired');
assert(js.includes("confirmC('移除图片引用',`从 ${lib.name} 中移除选中的 ${indexes.length} 条图片引用？图片文件不会删除。`"),'bulk remove confirm: clear no-original impact');
assert(js.includes("confirmC('移除图片引用',`从 ${lib.name} 中移除这个图片引用？图片文件不会删除。`"),'single remove confirm: clear no-original impact');
assert(js.includes("confirmC('永久删除图片',`永久删除 ${item.name}？相关 JSON 引用会同步移除。`"),'asset confirm states permanent + JSON impact');
assert(js.includes("confirmC('永久删除选中图片',`永久删除选中的 ${items.length} 张图片？`"),'bulk asset confirm states permanent');
assert(js.includes("confirmC('永久删除 JSON 文件',`永久删除 ${lib.name}？"),'library confirm states permanent');
assert(js.includes("confirmC('永久删除分组',`永久删除分组 ${group} 及其中图片？`"),'group confirm states permanent');
assert(js.includes('aria-label="删除JSON库${escC(lib.name)}">删除</button>'),'switch row explicit delete text restored');
assert(js.includes('class="btn btn-danger" data-action="delete-library" data-id="${escC(lib.id)}">删除'),'detail page delete label restored');
console.log('PASS round-2 regressions: mask-free right/corner grid patches, image-card-framed switch selection, unified danger copy with permanent/impact clarity');
/* ---- 4. Real centered dialog, keyboard loop and unchanged dispatch ---- */
const vm=require('node:vm');
const picker=js.slice(js.indexOf('function libraryPickerModal()'),js.indexOf('\nfunction ',js.indexOf('function libraryPickerModal()')+1));
assert(!picker.includes('AnchoredMenu'));assert(!css.includes('library-picker-menu'));
let markup='',keyHandler,active;
const attrs={},triggerAttrs={};const first={focus(){active=first}},last={focus(){active=last}},current={focus(){active=current}};
const modal={setAttribute(k,v){attrs[k]=v},querySelector(s){return s.includes('aria-checked')?current:first},querySelectorAll(){return [first,current,last]},addEventListener(k,fn){if(k==='keydown')keyHandler=fn}};
const trigger={setAttribute(k,v){triggerAttrs[k]=v}};
const ctx={S:{libraries:[{id:'a',name:'真实库',file:'json/a.json',count:0},{id:'b',name:'说明库',description:'真实说明',file:'json/b.json',count:2}],selectedLibrary:'a'},sortedLibrariesC:x=>x,escC:String,openC(h){markup=h},$c:s=>s==='.library-name-trigger'?trigger:modal,document:{get activeElement(){return active}}};
const iconFunction=js.slice(js.indexOf('function uiIconC(name)'),js.indexOf('\nfunction feedbackKindC'));
vm.runInNewContext(iconFunction+'\n'+picker+';libraryPickerModal()',ctx);
assert.equal(attrs.role,'dialog');assert.equal(attrs['aria-modal'],'true');assert.equal(triggerAttrs['aria-expanded'],'true');assert.equal(modal.id,'library-picker-dialog');assert.equal(active,current);
active=first;let prevented=false;keyHandler({key:'Tab',shiftKey:true,preventDefault(){prevented=true}});assert(prevented);assert.equal(active,last);
active=last;prevented=false;keyHandler({key:'Tab',shiftKey:false,preventDefault(){prevented=true}});assert(prevented);assert.equal(active,first);
assert.equal((markup.match(/class="library-description"/g)||[]).length,1,'No fabricated description for blank library');
assert(markup.includes('0 个图片引用 · a.json'));assert(markup.includes('data-action="new-library"'));assert(markup.includes('data-action="delete-library"'));
assert(js.includes("if(e.key==='Escape'&&!pendingSubmission)closeC()"));
const selectAction=js.match(/  if\(action==='select-library'\)\{[^\n]+/)[0];
let closed=0,rendered=0,focused=0;const state={selectedLibrary:'a',selectedIcons:new Set([0]),iconQuery:'x'};
vm.runInNewContext('(function(){const action="select-library";'+selectAction+'})()',{S:state,target:{dataset:{id:'b'}},closeC(){closed++},renderC(){rendered++},$c:()=>({focus(){focused++}})});
assert.equal(state.selectedLibrary,'b');assert.equal(state.selectedIcons.size,0);assert.equal(state.iconQuery,'');assert.equal(closed,1);assert.equal(rendered,1);assert.equal(focused,1);
assert(css.includes('.library-switch-modal-body .library-switch-option{height:84px;min-height:84px;max-height:84px;padding:6px 12px;gap:10px;'),'All library options use a fixed equal height');
assert(css.includes('.library-switch-option[aria-checked=true]{box-shadow:none;background:var(--ui-library-selected-bg,#fafaff)}'),'Light selected frame has no extra ring');
assert(css.includes('-webkit-line-clamp:2'),'Descriptions clamp to two lines');
assert(css.includes('.library-switch-meta{display:block;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap'),'Metadata stays one clipped line');
assert(css.includes('.library-switch-modal-body .library-switch-delete.ui-button{flex:0 0 44px;'));
assert(css.includes('@media(max-width:360px){\n body :is(.assets-toolbar,.json-reference-toolbar),body.dark :is(.assets-toolbar,.json-reference-toolbar){grid-template-columns:64px 44px minmax(0,1fr)}'),'320px keeps refresh at 44px with a narrower select column');
assert(css.includes('button{padding-inline:6px;flex-shrink:0}'),'Narrow bulk actions retain uncompressed text and 44px targets');
assert(css.includes('min-height:44px;font-size:12px;padding-inline:14px;white-space:nowrap'),'390px accepted padding and targets remain unchanged');
console.log('PASS restored picker: actual dialog semantics, initial focus, forward/reverse trap, Escape contract, selection close/update, true descriptions and retained create/delete dispatch');
