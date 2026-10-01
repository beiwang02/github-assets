const fs=require('node:fs'),assert=require('node:assert/strict');
const css=fs.readFileSync('ui-refresh.css','utf8'),html=fs.readFileSync('index.html','utf8');
const scope='body .assets-toolbar :is([data-action="select-all"],.sort-trigger,[data-action="refresh"])';
assert(css.includes(scope+'{background:var(--surface);border-color:var(--line);color:var(--muted)}'));
assert(css.includes('body .assets-toolbar .sort-trigger b{color:inherit}'));
assert(css.includes('body .sort-trigger[aria-expanded="true"]:not(:disabled):not([aria-disabled="true"]):not([aria-busy="true"]){border-color:var(--ui-line-focus)!important;background:var(--ui-selection-bg)!important;color:var(--ui-selection-ink)!important;filter:none!important}'));
assert(html.includes('ui-refresh.css?v=overview-no-bar-93'));
console.log('PASS auxiliary muted: precisely three resting controls, inherited caret, existing expanded theme feedback and narrow cache update');
