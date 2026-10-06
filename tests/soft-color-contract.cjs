const fs=require('node:fs'),assert=require('node:assert/strict');
// Closed literal allowlist, not a regex blanket exemption: all geometry stays frozen.
const replacements={
 '#b23c55':'var(--ui-danger-ink)','#d84f67':'var(--ui-danger-ink)','#d66a76':'var(--ui-danger-ink)','#c34f61':'var(--ui-danger-ink)','#c6445e':'var(--ui-danger-ink)','#efa5b3':'var(--ui-danger-ink)','#ff9cac':'var(--ui-danger-ink)','#e58a96':'var(--ui-danger-ink)',
 '#fff1f3':'var(--ui-danger-bg)','#fff7f8':'var(--ui-danger-bg)','#392633':'var(--ui-danger-bg)','#30212b':'var(--ui-danger-bg)',
 '#f3cbd3':'var(--ui-danger-line)','#f0b5c0':'var(--ui-danger-line)','#f0aebb':'var(--ui-danger-line)','#654052':'var(--ui-danger-line)','#70434d':'var(--ui-danger-line)'};
exports.normalizeAuthorizedColors=s=>Object.entries(replacements).reduce((v,[a,b])=>v.replaceAll(a,b),s);
const css=fs.readFileSync('ui-refresh.css','utf8'),consoleCss=fs.readFileSync('console.css','utf8');
const dangerTokens=['--ui-danger-ink:#dc2626','--ui-danger-line:#fecaca','--ui-danger-bg:#fff5f5','--ui-danger-ink:#f87171','--ui-danger-line:#99454b','--ui-danger-bg:#302126'];
for(const t of [...dangerTokens,'--ui-hero-upload-bg:#f7f8fc','--ui-hero-upload-bg:#d6ddea'])assert(css.includes(t),t);
// Approved red literals occur only in the six exact declarations; consumers remain unified.
const consumers=dangerTokens.reduce((s,t)=>s.replace(t,''),css);
for(const old of Object.keys(replacements))assert(!consoleCss.includes(old)&&!consumers.includes(old),'No divergent legacy danger color '+old);
const cp=require('node:child_process'),base=cp.execFileSync('git',['show','6b29a31:console.css'],{encoding:'utf8'});
assert.equal(consoleCss,exports.normalizeAuthorizedColors(base),'Console stylesheet frozen outside authorized color literals');
function lum(h){return h.match(/[a-f\d]{2}/gi).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0)}
const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
// Standard bright red: require normal-text AA, including transparent remove controls.
const approvedLightRatio=ratio('#dc2626','#fff5f5');
assert(approvedLightRatio>=4.5,'Standard light red must meet normal-text AA');
assert.equal(approvedLightRatio.toFixed(2),'4.51','Actual light danger contrast');
for(const bg of ['#ffffff','#f7f8fc'])assert(ratio('#dc2626',bg)>=4.5,'Transparent light X / '+bg);
for(const [ink,bg] of [['#f87171','#17243a'],['#f87171','#302126'],['#273172','#d6ddea'],['#273172','#c0ccdf']])assert(ratio(ink,bg)>=4.5,ink+' / '+bg);
for(const [ink,bg] of [['#b2bbef','#293451'],['#dfb695','#3a3040'],['#91c5c8','#203b45'],['#a0c6ae','#293c3c']])assert(ratio(ink,bg)>=3);
console.log('PASS soft colors: closed authorization allowlist, frozen console geometry, standard bright red; light danger contrast '+approvedLightRatio.toFixed(2)+':1 (normal-text AA); dark danger/upload AA and dark stat icons >=3:1');

// Final finite colour refinement: selection-only override, no global focus/geometry change.
assert(css.includes('body.dark .json-reference-row.selected:not(:focus-visible){border-color:#626fa8!important}'));
assert(css.includes('body.dark .json-reference-row.selected:not(:focus-visible)::after{border-color:#626fa8}'));
assert(css.includes('body.dark{--ui-line-focus:#7785c8;'));
const html=fs.readFileSync('index.html','utf8');
assert(html.includes('console.css?v=library-initial-latest-100&amp;revision=clean-ui-release-113'));
