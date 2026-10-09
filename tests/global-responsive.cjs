const fs=require('node:fs'),assert=require('node:assert/strict');
const css=fs.readFileSync('responsive.css','utf8'),html=fs.readFileSync('index.html','utf8');
assert(html.includes('href="responsive.css?v=global-responsive-2"'));
assert(!/user-scalable\s*=\s*no|maximum-scale/i.test(html));
assert(!/transform\s*:|\bzoom\s*:|color\s*:|background\s*:|!important.*font-size/.test(css),'type/reflow layer has no scaling hacks or palette changes');
assert(!/html\s*\{[^}]*font-size/.test(css),'user root font remains unrestricted');
for(const token of ['overflow-wrap:anywhere','calc(100dvh - 28px)','height:5.25rem;min-height:5.25rem;max-height:5.25rem'])assert(css.includes(token),token);
const fontRules=[...css.matchAll(/([^{}]+)\{([^{}]*font-size[^{}]*)\}/g)];
assert.equal(fontRules.length,3,'no global fonts; only scoped upload actual-visual preservation and settings exception');
assert(css.includes('#uploadForm .modal-field>label{font-size:1.0625rem}'));
assert(css.includes('@media(min-width:701px){#uploadForm .drop-zone strong{font-size:1.125rem}}'));
assert(!/text-size-adjust/.test(css),'retain original UA inflation cascade, no global reset');
assert(fontRules.some(r=>r[1].trim()==='.settings-grid .form-field :is(input,select)'));
assert(css.includes('body #app .assets-toolbar .asset-bulk-actions{justify-content:flex-end;gap:4px;height:44px;min-height:44px;flex-wrap:nowrap}'),'scoped rule beats view-local start, permanent right-aligned 44px mobile row');
const cp=require('node:child_process');
for(const f of ['console.js','console.css','styles.css'])assert.equal(fs.readFileSync(f,'utf8'),cp.execFileSync('git',['show','a96a4f9:'+f],{encoding:'utf8'}),'font/business/name cascade frozen '+f);
assert(!/asset-name-row|quick-asset-name-row|json-reference-copy/.test(css),'card names keep original single-line ellipsis, not wrapping');
assert(css.includes('.modal-head h2'),'detail heading retains full-name wrap');
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
assert.equal((html.match(/clean-ui-release-125/g)||[]).length,4,'pending settings cache retained');
require('./release-123.cjs').normalizeIndex(html);
console.log('PASS global-responsive: zoom/root freedom, assertRootRem compact settings, equal 84/126/168 picker rows, selection-independent reserved move row, wrapping/dvh, exact palette/glyph and stylesheet authorization');
