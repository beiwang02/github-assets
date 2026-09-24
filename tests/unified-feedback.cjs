const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const css=read('ui-refresh.css'),base=read('styles.css'),consoleCss=read('console.css'),js=read('console.js'),html=read('index.html'),source=css+base+consoleCss+js+html;
/* Neutral controls share one pale line; dangerous/primary semantics stay out. */
for(const token of ['appearance-button','github-repo-link','auth-theme-button','project-link','copy-control.ui-button','library-switch-trigger'])assert(source.includes(token),token+' must be covered');
assert(css.includes('border-color:var(--ui-line-focus)!important'));
assert(css.includes('[data-feedback="control"]'));
for(const state of [':not(:disabled)',':not([aria-disabled="true"])',':not([aria-busy="true"])',':not(.active)',':not(.selected)',':not([aria-checked="true"])'])assert(css.includes('[data-feedback="control"]')&&css.includes(state),'ignore '+state);
assert(js.includes("return el.matches('button,.project-link,[role=\"button\"]')?'control':'';"));
assert(js.includes("if(el.dataset.action==='copy')return 'control';"));
assert(js.includes("if(el.matches('.library-switch-trigger,.library-picker-create'))return 'control';"));
/* Red actions and blue CTAs are explicitly excluded from the unified pale rule. */
assert(js.includes("if(el.matches('.btn-danger,.library-picker-delete,.library-switch-delete,.group-delete-link"));
assert(js.includes("if(el.matches('.btn-primary,.btn-github,.asset-select,.reference-select,.sidebar-overlay')||el.closest('.hero-actions'))return '';"));
/* Nested copy/select/delete controls must not activate the whole parent card. */
assert(base.includes('.asset-card:hover:not(:where(:has(button:hover,a:hover)))'));
assert(base.includes('.library-list-row:hover:not(:where(:has(button:hover,a:hover)))'));
assert(consoleCss.includes(':active:not(:where(:has(button:active,a:active)))'));
assert(consoleCss.includes('Nested actions are excluded from ancestor hover/press rules'));
/* Static cache versions advance with the CSS/JS change. */
assert(html.includes('styles.css?v=tap-cleanup-50'));
assert(html.includes('console.css?v=tap-cleanup-50'));
assert(html.includes('ui-refresh.css?v=tap-cleanup-50'));
assert(html.includes('console.js?v=tap-cleanup-50'));
console.log('PASS unified feedback: auxiliary icons, copy, library switch share pale feedback; primary/danger stay semantic');
