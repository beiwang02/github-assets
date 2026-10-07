const fs=require('node:fs'),assert=require('node:assert/strict');
// Closed literal allowlist, not a regex blanket exemption: all geometry stays frozen.
const replacements={
 '#b23c55':'var(--ui-danger-ink)','#d84f67':'var(--ui-danger-ink)','#d66a76':'var(--ui-danger-ink)','#c34f61':'var(--ui-danger-ink)','#c6445e':'var(--ui-danger-ink)','#efa5b3':'var(--ui-danger-ink)','#ff9cac':'var(--ui-danger-ink)','#e58a96':'var(--ui-danger-ink)',
 '#fff1f3':'var(--ui-danger-bg)','#fff7f8':'var(--ui-danger-bg)','#392633':'var(--ui-danger-bg)','#30212b':'var(--ui-danger-bg)',
 '#f3cbd3':'var(--ui-danger-line)','#f0b5c0':'var(--ui-danger-line)','#f0aebb':'var(--ui-danger-line)','#654052':'var(--ui-danger-line)','#70434d':'var(--ui-danger-line)'};
exports.normalizeAuthorizedColors=s=>Object.entries(replacements).reduce((v,[a,b])=>v.replaceAll(a,b),s);
/* User-requested danger-entry unification (Round 2b): text danger entries share one
   comfortable size, hover tint and press feedback. Map the new styles back to the
   frozen baseline so the console sheet stays frozen outside these two selectors. */
const unifyDangerEntries=s=>s
 .replace('padding:6px 8px; color:var(--ui-danger-ink); border:0; border-radius:8px; background:transparent; font-size:12px; font-weight:600; white-space:nowrap; cursor:pointer; transition:background .12s,color .12s; }','padding:4px 2px; color:var(--ui-danger-ink); border:0; border-radius:0; background:transparent; font-size:10px; font-weight:700; white-space:nowrap; cursor:pointer; }')
 .replace('padding:4px 6px; color:var(--ui-danger-ink); font-size:12px; font-weight:600; border-radius:8px; transition:background .12s,color .12s; }','padding:0; color:var(--ui-danger-ink); font-size:10px; }')
 .replaceAll('@media(hover:hover){.library-picker-delete:hover { color:var(--ui-danger-ink); background:var(--ui-danger-bg); }}','@media(hover:hover){.library-picker-delete:hover { color:var(--ui-danger-ink); background:transparent; }}')
 .replaceAll('@media(hover:hover){.group-delete-link:hover { color:var(--ui-danger-ink); background:var(--ui-danger-bg); }}','@media(hover:hover){.group-delete-link:hover { color:var(--ui-danger-ink); background:transparent; }}')
 .replace('.library-switch-delete.ui-button{width:auto;height:44px;min-width:44px;min-height:44px;padding:0 10px;background:transparent;border:0;color:var(--ui-danger-ink);flex:0 0 auto;font-size:12px;font-weight:600;border-radius:8px;transition:background .12s,color .12s}body.dark .library-switch-delete.ui-button{color:var(--ui-danger-ink)}@media(hover:hover){.library-switch-delete.ui-button:not(:disabled):hover{background:var(--ui-danger-bg)}}body .library-switch-delete.ui-button:not(:disabled):active{background:var(--ui-danger-bg)}','.library-switch-delete.ui-button{width:auto;height:44px;min-width:44px;min-height:44px;padding:0 12px;background:transparent;border:0;color:var(--ui-danger-ink);flex:0 0 auto;font-size:12px}body.dark .library-switch-delete.ui-button{color:var(--ui-danger-ink)}');
exports.unifyDangerEntries=unifyDangerEntries;
const css=fs.readFileSync('ui-refresh.css','utf8'),consoleCss=fs.readFileSync('console.css','utf8');
const dangerTokens=['--ui-danger-ink:#d84f67','--ui-danger-line:#f0b5c0','--ui-danger-bg:#fff7f8','--ui-danger-ink:#ff9cac','--ui-danger-line:#70434d','--ui-danger-bg:#30212b'];
for(const t of [...dangerTokens,'--ui-hero-upload-bg:#f7f8fc','--ui-hero-upload-bg:#d6ddea'])assert(css.includes(t),t);
// Approved red literals occur only in the six exact declarations; consumers remain unified.
const consumers=dangerTokens.reduce((s,t)=>s.replace(t,''),css);
for(const old of Object.keys(replacements))assert(!consoleCss.includes(old)&&!consumers.includes(old),'No divergent legacy danger color '+old);
const cp=require('node:child_process'),base=cp.execFileSync('git',['show','6b29a31:console.css'],{encoding:'utf8'});
assert.equal(unifyDangerEntries(consoleCss),exports.normalizeAuthorizedColors(base),'Console stylesheet frozen outside authorized color literals and the two unified danger-entry selectors');
function lum(h){return h.match(/[a-f\d]{2}/gi).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0)}
const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
// Authorized early soft red: honestly record the normal-text AA exception, never darken it.
const approvedLightRatio=ratio('#d84f67','#fff7f8');
assert.equal(approvedLightRatio.toFixed(2),'3.80','Actual light danger contrast');
assert(approvedLightRatio<4.5,'Known approved light normal-text AA exception');
for(const bg of ['#ffffff','#f7f8fc'])assert(ratio('#d84f67',bg)>=3,'Light X non-text contrast / '+bg);
for(const [ink,bg] of [['#ff9cac','#17243a'],['#ff9cac','#30212b'],['#273172','#d6ddea'],['#273172','#c0ccdf']])assert(ratio(ink,bg)>=4.5,ink+' / '+bg);
for(const [ink,bg] of [['#b2bbef','#293451'],['#dfb695','#3a3040'],['#91c5c8','#203b45'],['#a0c6ae','#293c3c']])assert(ratio(ink,bg)>=3);
console.log('PASS soft colors: closed authorization allowlist, frozen console geometry, restored early soft red; light danger contrast '+approvedLightRatio.toFixed(2)+':1 (does NOT meet normal-text AA; approved exception); theme-filled X non-text >=3:1; dark danger/upload AA and dark stat icons >=3:1');

// Final finite colour refinement: selection-only override, no global focus/geometry change.
assert(css.includes('body.dark .json-reference-row.selected:not(:focus-visible){border-color:#626fa8!important}'));
assert(css.includes('body.dark .json-reference-row.selected:not(:focus-visible)::after{border-color:#626fa8}'));
assert(css.includes('body.dark{--ui-line-focus:#7785c8;'));
const html=fs.readFileSync('index.html','utf8');
assert(html.includes('console.css?v=library-initial-latest-100&amp;revision=clean-ui-release-120'));

// Restore only the 34px JSON removal paint, never fill the 44px touch target.
const removal='body .json-reference-actions [data-action="delete-icon"]';
const rule=s=>{const i=css.indexOf(s+'{');assert(i>=0,s);return css.slice(i+s.length+1,css.indexOf('}',i));};
assert(rule(removal+'::before').includes('background:var(--ui-danger-bg)'));
assert(rule(removal+',body.dark .json-reference-actions [data-action="delete-icon"]').includes('background:transparent!important'));
assert(ratio('#d84f67','#fff7f8')>=3,'Filled light X non-text contrast');
for(const [file,version] of [['console.css','library-initial-latest-100'],['ui-refresh.css','https-initial-caption-103'],['console.js','https-initial-caption-103']])assert(html.includes(file+'?v='+version+'&amp;revision=clean-ui-release-120'));
assert(!html.includes('clean-ui-release-114'));
