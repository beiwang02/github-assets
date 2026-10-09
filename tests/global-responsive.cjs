const fs=require('node:fs'),assert=require('node:assert/strict');
const css=fs.readFileSync('responsive.css','utf8'),html=fs.readFileSync('index.html','utf8');
assert(html.includes('href="responsive.css?v=global-responsive-1"'));
assert(!/user-scalable\s*=\s*no|maximum-scale/i.test(html));
assert(!/transform\s*:|\bzoom\s*:|color\s*:|background\s*:|!important.*font-size/.test(css),'type/reflow layer has no scaling hacks or palette changes');
assert(!/html\s*\{[^}]*font-size/.test(css),'user root font remains unrestricted');
for(const token of ['--type-caption:.625rem','--type-small:.75rem','--type-body:.8125rem','--type-section:.9375rem','text-size-adjust:100%','overflow-wrap:anywhere','calc(100dvh - 28px)','font-size:max(1rem,16px)','height:5.25rem;min-height:5.25rem;max-height:5.25rem','height:max(44px,calc(11rem - 132px))'])assert(css.includes(token),token);
assert(css.includes('.settings-grid .form-field :is(input,select){font-size:clamp(.8125rem,.75rem + .25vw,.875rem)}'),'approved compact settings input scales with root');
assert(!css.includes(':not(:empty){grid-column')&&!css.includes('grid-row:3'),'no selection-dependent new toolbar row');
assert(!/settings-grid[^\n]*max\(1rem,16px\)/.test(css),'settings must not revive 16px input floor');
function assertRootRem(){
 const input=css.match(/\.settings-grid \.form-field :is\(input,select\)\{font-size:clamp\(([\d.]+)rem,([\d.]+)rem \+ ([\d.]+)vw,([\d.]+)rem\)\}/);assert(input);
 const clamp=(root,width)=>Math.max(+input[1]*root,Math.min(+input[4]*root,+input[2]*root+ +input[3]*width/100));
 for(const w of [320,390,1440]){assert(clamp(16,w)>=13&&clamp(16,w)<=14);assert(clamp(24,w)>clamp(16,w));assert(clamp(32,w)>clamp(24,w));}
 const row=+css.match(/library-switch-option\{height:([\d.]+)rem/)[1];assert.deepEqual([16,24,32].map(r=>r*row),[84,126,168]);
 assert.equal(Math.max(44,11*16-132),44,'mobile permanent row default height unchanged');
 assert(!/(?:html|body)\s*\{[^}]*font-size\s*:\s*\d+px/.test(css));
}
assertRootRem();
assert(css.includes('white-space:normal!important'),'legacy nowrap overridden only for text-bearing field/group controls');
assert(!/\.(?:asset-select|reference-select|copy-control-icon|ui-icon)\s*\{/.test(css),'existing 44px targets/34px painted glyph frames untouched');
assert.equal((html.match(/clean-ui-release-124/g)||[]).length,4,'pending settings cache retained');
require('./release-123.cjs').normalizeIndex(html);
console.log('PASS global-responsive: zoom/root freedom, assertRootRem compact settings, equal 84/126/168 picker rows, selection-independent reserved move row, wrapping/dvh, exact palette/glyph and stylesheet authorization');
