const fs=require('node:fs'),assert=require('node:assert/strict');
const all=require('./action-spacing-normalize.cjs').normalizeActionSpacing(fs.readFileSync('ui-refresh.css','utf8')),css=all.split('/* JSON references: horizontal list rows;')[1].split('/* Both card types')[0];
assert(css,'horizontal list layout must replace rejected image-first cards');
for(const token of ['grid-template-columns:minmax(0,1fr)','container-type:inline-size','@media(min-width:701px)','@container references (min-width:660px)','@container references (min-width:1020px)','repeat(2,minmax(0,1fr))','repeat(3,minmax(0,1fr))','grid-template-columns:44px 48px minmax(0,1fr) 44px 44px','grid-template-columns:44px 40px minmax(0,1fr) 44px 44px','display:contents!important','grid-column:1;grid-row:1','grid-column:2;grid-row:1','grid-column:3;grid-row:1','grid-column:4','grid-column:5','width:40px;height:40px','object-fit:contain','max-height:100%','min-width:44px','width:44px!important','font-size:13px;line-height:1.5'])assert(css.includes(token),token);
for(const token of ['height:88px','height:104px','repeat(auto-fill,minmax(180px,1fr))','grid-template-columns:22px 22px','repeat(4,'])assert(!all.includes(token),token);
assert(css.includes('.copy-control-icon.ui-button{grid-column:4;width:44px!important;height:44px!important;min-width:44px;min-height:44px;max-width:none;max-height:none}'));
assert(all.includes('border:1px solid var(--copy-line)'));
assert(all.includes('.copy-control-icon)::before{content:"";position:absolute;inset:5px;box-sizing:border-box'));
assert(all.includes('body .repo-quick.active{color:var(--primary)!important}'));
assert(all.includes('body.dark .repo-quick.active{color:var(--ui-selection-ink)!important}'));
assert(all.includes('.library-current-copy .library-description'));
// Container boundaries model the CSS, not browser geometry (measured separately).
function columns(viewport,content){return viewport<=700?1:content>=1020?3:content>=660?2:1}
for(const [v,c,n] of [[320,292,1],[390,362,1],[640,612,1],[700,672,1],[768,722,2],[1024,704,2],[1440,1080,3],[1920,1360,3],[701,659,1],[701,660,2],[1440,1019,2],[1440,1020,3]])assert.equal(columns(v,c),n);
for(const width of [660,700,1019,1020,1360]){const n=columns(1920,width);if(n>1)assert((width-(n-1)*12)/n>=324)}
console.log('PASS horizontal references: phone single column, content-aware desktop max three columns, contain 40/48px, same-row 44px controls, 13px names, retained copy outline and active repository ink (static; browser separate)');
