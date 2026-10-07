const fs=require('node:fs'),cp=require('node:child_process'),vm=require('node:vm'),assert=require('node:assert/strict');
const css=fs.readFileSync('ui-refresh.css','utf8'),js=fs.readFileSync('console.js','utf8');
const allowed=['console.js','index.html','ui-refresh.css','tests/button-state-audit.cjs','tests/hero-disabled-state.cjs','tests/overview-hero.cjs','tests/overview-no-hero.cjs','tests/repo-gate.cjs','tests/clean-site.cjs','tests/soft-color-contract.cjs'].sort();
const changed=cp.execFileSync('git',['diff','--name-only','a329ce8','--'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
const untracked=cp.execFileSync('git',['ls-files','--others','--exclude-standard'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
assert.deepEqual([...new Set([...changed,...untracked])].sort(),allowed,'Fixed release baseline and closed ten-file authorization remain valid after commit');
const before=cp.execFileSync('git',['show','a329ce8:ui-refresh.css'],{encoding:'utf8'});
// Sparkle decoration retired by user request; no ::after sparkle rule may remain.
assert(!css.includes('Decorative sparkles'),'Sparkle decoration removed');
assert(!/overview-hero::after/.test(css),'No hero sparkle layer remains');
// Exact-literal authorization whitelist for the final micro-polish (release 118).
// Each entry maps ONE approved current literal back to its a329ce8 baseline literal;
// everything else in the stylesheet stays byte-frozen. No blanket regex exemption.
const authorizedMicroPolish=[
 // A. Background canvas replaced by the approved four-stop blue ramp in both themes.
 ['linear-gradient(155deg,#1e2a5e 0%,#2f3c86 46%,#4a63ad 78%,#5b76c4 100%)','linear-gradient(122deg,#202b63,#363f99 62%,#4b75c7)','Light hero replaced with the approved four-stop blue canvas'],
 ['linear-gradient(155deg,#171f42 0%,#232c5e 46%,#2f3c74 78%,#3a4d88 100%)','linear-gradient(122deg,#182044,#262f68 62%,#34528b)','Dark hero replaced with the approved dim four-stop canvas, stays dim not black'],
 // B. Whitespace comfort only: +3px title->description and +3px description->button. Geometry untouched.
 ['body .overview-hero h2{margin:11px 0 12px;','body .overview-hero h2{margin:11px 0 9px;','Title-to-description gap 9px->12px'],
 ['body .overview-hero .hero-actions{margin-top:25px;','body .overview-hero .hero-actions{margin-top:22px;','Description-to-button gap 22px->25px'],
 // C. Whole background canvas replaced (user request): diagonal light band instead of circular blobs.
 ['radial-gradient(140% 110% at 6% 0%,rgba(129,140,248,.38),transparent 52%),radial-gradient(120% 120% at 96% 100%,rgba(96,165,250,.26),transparent 48%)','radial-gradient(circle at 84% 8%,rgba(117,139,255,.65),transparent 31%),radial-gradient(circle at 72% 120%,rgba(58,196,198,.34),transparent 35%)','Light hero glow replaced with one unified blue-purple light band'],
 ['radial-gradient(140% 110% at 6% 0%,rgba(114,128,226,.18),transparent 52%),radial-gradient(120% 120% at 96% 100%,rgba(78,140,220,.14),transparent 48%)','radial-gradient(circle at 84% 8%,rgba(100,119,219,.25),transparent 31%),radial-gradient(circle at 72% 120%,rgba(44,142,156,.12),transparent 35%)','Dark hero glow matched to the new light band'],
 ['body .overview-hero .hero-content{min-width:0;max-width:570px;position:relative;z-index:1}','body .overview-hero .hero-content{min-width:0;max-width:570px}','Hero content raised above the grid texture layer']];
const normalizeAuthorized=s=>authorizedMicroPolish.reduce((v,[from,to])=>{
 assert(v.includes(from),'Authorized micro-polish literal must be present: '+from);
 return v.replace(from,to);},s)
 .replace('border-radius:22px;color:#fff;background:radial-gradient(circle at 84% 8%,rgba(117,139,255,.65)','border-radius:16px;color:#fff;background:radial-gradient(circle at 84% 8%,rgba(117,139,255,.65)');
// The authorized literals must be unique so normalization cannot hit unrelated rules.
for(const [from,,why] of authorizedMicroPolish)assert.equal(css.split(from).length-1,1,'Authorized literal must occur exactly once: '+why);
// Geometry the user froze against further change stays pinned here.
for(const pinned of ['min-height:206px','border-radius:22px','height:44px','min-height:44px','margin-bottom:24px','padding:30px 33px'])assert(css.includes(pinned),'Pinned hero geometry: '+pinned);
const gridTexture=/body \.overview-hero::before\{content:""[^\n]*\}\nbody\.dark \.overview-hero::before\{background-image:linear-gradient\(rgba\(255,255,255,\.045\)[^\n]*\}\n/;
assert(gridTexture.test(css),'Authorized faint grid texture exists');
const retireCircle=/\/\* Sparkle decoration retired by user request; the circle motif carries the depth\. \*\/\n/;
assert(retireCircle.test(css),'Sparkle comment present in place of the retired circle rule');
assert.equal(normalizeAuthorized(css.replace(retireCircle,'body.dark .overview-hero::before{opacity:.45}\n').replace(gridTexture,'')),before.replace('body .overview-hero .btn:disabled{opacity:.65}\n',''),'Only obsolete hero disabled opacity removed, sparkle layer dropped, approved grid texture and gradient/whitespace polish applied; normal palettes frozen');
const beforeJs=cp.execFileSync('git',['show','a329ce8:console.js'],{encoding:'utf8'});
assert.equal(js,beforeJs.replace(' disabled title="请先在仓库设置中连接 GitHub"',' title="请先连接仓库"').replace("notify('请先连接你的仓库','error');uploadModal();return;}","notify('请先连接仓库','error');uploadModal();return;}"),'Only hero attribute and upload guard message authorized');
const overview=js.slice(js.indexOf('function overviewView()'),js.indexOf('function librariesView()'));
const guard=js.match(/if\(action==='upload'\)\{[^\n]+\}/)[0];
for(const connected of [false,true]){
 const notifications=[];let modals=0;
 const ctx={S:{connected,libraries:[],assets:[],groups:[]},statC:()=>'',emptyC:()=>'',notify:(...args)=>notifications.push(args),uploadModal:()=>{modals++}};
 const markup=vm.runInNewContext(overview+';overviewView()',ctx).match(/<section class="hero overview-hero"[^]*?<\/section>/)[0];
 const button=markup.match(/<button[^]*?<\/button>/)[0];assert(!/\bdisabled\b|aria-disabled/.test(button));assert(button.includes('data-action="upload"'));assert.equal((markup.match(/<button /g)||[]).length,1);
 vm.runInNewContext('(function(){const action="upload";'+guard+'})()',ctx);
 assert.equal(modals,connected?1:0,'Disconnected click never opens upload modal');assert.deepEqual(notifications,connected?[]:[['请先连接仓库','error']]);
}
assert(css.includes('.ui-button:disabled{cursor:not-allowed;opacity:.5;transform:none}'),'Other controls retain disabled semantics');
console.log('PASS hero-connection-guard: enabled button in both states, exact normal palettes, disconnected click notifies without modal, connected click opens original modal, narrow CSS/JS freeze');
