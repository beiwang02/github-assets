const fs=require('fs'),assert=require('assert');
const css=fs.readFileSync('ui-refresh.css','utf8'),js=fs.readFileSync('console.js','utf8');
// Pointer activation must never be converted into persistent theme-blue focus state.
assert(!css.includes('data-focus-active'));
assert(!js.includes('data-focus-active'));
assert(!/\.ui-button[^\{]*(?::focus|focus-visible)[^\{]*\{[^}]*var\(--primary\)/s.test(css));
assert(!/\.copy-control[^\{]*:focus[^\{]*\{[^}]*(?:color|border-color|outline-color):var\(--primary\)/s.test(css));
assert(!/\.(?:asset-select|reference-select):focus[^\{]*\{[^}]*var\(--primary\)/s.test(css));
assert(!/closest\(['"]button['"]\)[\s\S]{0,120}focus\(/.test(js));
assert(!/action==='(?:toggle-theme|select-all|asset-select|copy)'[\s\S]{0,260}target\.focus\(/.test(js));
// Existing transient press feedback and intentional semantic colors remain.
assert(css.includes('.ui-button:active:not(:disabled){transform:translateY(1px);filter:brightness(.92)}'));
assert(css.includes('.ui-button[data-ui=danger]'));
assert(css.includes(':is(.asset-card.selected .asset-select,.json-reference-row.selected .reference-select)'));
assert(css.includes('--multi-mark:#fff'));
assert(css.includes('--multi-bg:var(--multi-fill)'));
assert(css.includes('.json-workspace .library-switch-trigger.ui-button'));
assert(css.includes('color:var(--primary)'));
assert(css.includes('#uploadForm .modal-inline-create'));
// Safari touch release still clears sticky native focus.
assert(js.includes("document.addEventListener('pointerup',e=>{const button=e.target.closest('button');if(button&&e.pointerType==='touch')button.blur();});"));
console.log('focus reset regression: ok');
