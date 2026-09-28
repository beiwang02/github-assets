const fs=require('node:fs'),assert=require('node:assert/strict');
const css=fs.readFileSync('ui-refresh.css','utf8');
assert(css.includes('.asset-card .asset-select{position:relative;inset:auto;flex:0 0 28px;width:28px;height:28px;min-width:28px;min-height:28px;margin-left:0;padding:0;border:0;background:transparent;box-shadow:none;font-size:15px;isolation:isolate}'));
assert(css.includes('.asset-card.selected .asset-select{background:transparent}'),'selected tap target must stay transparent');
assert(css.includes('.asset-card .asset-select:before{content:\'\';position:absolute;inset:3px;border:1px solid var(--multi-border);border-radius:6px;background:var(--multi-bg);z-index:-1}'),'selected and unselected both use inset square');
assert(css.includes('@media(hover:none){.library-card .library-list-row:focus,.library-card .library-list-row:focus-visible,.library-card .library-list-row:focus-within{outline:none!important;box-shadow:none!important}'),'overview JSON row has no touch focus flash');
assert(css.includes('.library-list-row:focus-visible{outline:2px solid var(--ui-line-focus);outline-offset:-2px}'),'keyboard navigation keeps visible focus');
console.log('PASS equal selection frames and library row focus styles');
