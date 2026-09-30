const fs=require('node:fs'),assert=require('node:assert/strict');
const ui=fs.readFileSync('ui-refresh.css','utf8'),base=fs.readFileSync('console.css','utf8');
// Pressing controls must retain their normal surface/color; only the approved focus line remains.
assert(ui.includes(':where(button,.btn,.ui-button,.icon-btn,.text-link,.nav-item,.asset-select,.reference-select,.asset-copy,.quick-copy,.modal-close,.top-icon,.project-link,.token-eye,.token-guide-button):not(:disabled):active{filter:none!important;box-shadow:none!important}'));
assert(ui.includes('var(--ui-line-focus)'),'keyboard/focus feedback token remains present');
assert(base.includes('-webkit-tap-highlight-color:rgba(0,0,0,0)'),'native WebKit tap highlight remains suppressed');
assert(!/button:active[^{}]*filter:brightness\(/.test(ui),'base button press must not darken');
assert(!/\.ui-button:active[^{}]*filter:brightness\(/.test(ui),'component button press must not darken');
assert(ui.includes('.auth-head-actions>.ui-button{width:34px;height:34px;min-width:34px;min-height:34px}'));
assert(ui.includes('body .auth-head-actions>.ui-button{box-shadow:none!important}'));
assert(ui.includes('.auth-head-actions>.ui-button svg{width:var(--ui-icon-size);height:var(--ui-icon-size)}'));
assert(!/:active[^{}]*\{[^{}]*brightness\(/.test(base),'unified active layer must not darken');
console.log('PASS active feedback: light/dark controls preserve normal surface on press; focus/disabled semantics retained');
