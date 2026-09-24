const fs=require('node:fs'),assert=require('node:assert/strict');
const ui=fs.readFileSync('ui-refresh.css','utf8'),js=fs.readFileSync('console.js','utf8'),base=fs.readFileSync('styles.css','utf8'),consoleCss=fs.readFileSync('console.css','utf8');
/* Tapping a search field always shows the same pale line; the upload drop zone opens
   the OS picker instantly, so its press feedback is the preview, not a border flash. */
assert(ui.includes(':is(.inner-search,.global-search,.drop-zone):focus-within{border-color:var(--ui-line-focus)!important}'));
assert(ui.includes(':is(.inner-search,.global-search):active{border-color:var(--ui-line-focus)!important}'));
assert(!/drop-zone\):active/.test(ui),'drop zone must not flash a press border');
assert(consoleCss.includes('.drop-zone,.repo-switcher,.asset-card,.library-list-row,.library-empty-row { -webkit-tap-highlight-color:transparent; }'),'non-button surfaces suppress gray highlight without changing appearance or gestures');
assert(ui.includes(':is(.asset-card,.quick-asset,.json-reference-row,.library-list-row,.repo-switcher,.group-pill,.library-picker,.library-picker-option):focus-within:not(:has(button:focus,a:focus,input:focus,select:focus,textarea:focus,[role="button"]:focus)){outline:2px solid var(--ui-line-focus);outline-offset:2px}'));
/* Bright focus rings were replaced at their source too. */
assert(consoleCss.includes('.repo-switcher:focus-visible { outline:2px solid var(--ui-line-focus); outline-offset:2px; }'));
assert(base.includes('.preview-clear:focus-visible { outline: 2px solid var(--ui-line-focus); outline-offset: 2px; }'));
assert(base.includes('.auth-theme-button:focus-visible { outline:2px solid var(--ui-line-focus); outline-offset:3px; }'));
/* No bright blue/purple click leftovers. */
assert(!consoleCss.includes('#8d98ff') && !base.includes('#8e9cff'), 'bright focus purple must not return');
assert(!consoleCss.includes('outline:2px solid #8d98ff') && !base.includes('outline: 2px solid #6672ff'), 'bright focus outline must not return');
/* A field must never look focused before a finger lands on it: autofocus only on fine pointers. */
assert(!/required autofocus/.test(js), 'ungated autofocus must not return');
assert.equal((js.match(/required\$\{finePointerC\(\)\?' autofocus':''\}>/g)||[]).length, 3);
assert(js.includes("if(finePointerC()) setTimeout(()=>$c(`#${kind}Form input`)?.select(),0);"));
assert(js.includes("function finePointerC(){ try { return window.matchMedia('(pointer:fine)').matches; } catch { return false; } }"));
console.log('PASS tap feedback: pale line on every control surface, no pre-focused fields on touch');
