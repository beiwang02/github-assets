const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const css=read('ui-refresh.css'),base=read('styles.css'),consoleCss=read('console.css'),js=read('console.js'),html=read('index.html'),source=css+base+consoleCss+js+html;
/* Neutral controls share one pale line; dangerous/primary semantics stay out. */
for(const token of ['appearance-button','github-repo-link','auth-theme-button','project-link','copy-control.ui-button','library-switch-trigger'])assert(source.includes(token),token+' must be covered');
assert(css.includes('border-color:var(--ui-line-focus)!important'));
assert(css.includes('[data-feedback="control"]'));
for(const state of [':not(:disabled)',':not([aria-disabled="true"])',':not([aria-busy="true"])',':not(.active)',':not(.selected)',':not([aria-checked="true"])'])assert(css.includes('[data-feedback="control"]')&&css.includes(state),'ignore '+state);
assert(js.includes("return el.matches('button,.project-link,[role=\"button\"]')?'control':'';"));
assert(js.includes('const UNIFIED_COPY_FEEDBACK = true;'));
assert(js.includes("if(el.dataset.action==='copy')return UNIFIED_COPY_FEEDBACK?'control':'';"));
assert(js.includes("if(el.matches('.library-switch-trigger,.library-picker-create'))return 'control';"));
/* Red actions and blue CTAs are explicitly excluded from the unified pale rule. */
assert(js.includes("if(el.matches('.btn-danger,.library-picker-delete,.library-switch-delete,.group-delete-link"));
assert(js.includes("if(el.matches('.btn-primary,.btn-github,.asset-select,.reference-select,.sidebar-overlay')||el.closest('.hero-actions'))return '';"));
/* Static cache versions advance with the CSS/JS change. */
assert(html.includes('styles.css?v=audit-latest-44'));
assert(html.includes('console.css?v=audit-latest-44'));
assert(html.includes('ui-refresh.css?v=audit-latest-44'));
assert(html.includes('console.js?v=audit-latest-44'));
console.log('PASS unified feedback: auxiliary icons, copy, library switch share pale feedback; primary/danger stay semantic');
