const fs=require('node:fs'),assert=require('node:assert/strict');
const css=fs.readFileSync('ui-refresh.css','utf8'),js=fs.readFileSync('console.js','utf8');
assert(css.includes('.assets-toolbar button,.asset-card{user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}'),'image controls must not start native text-selection loupe');
assert(css.includes('.assets-toolbar .ui-button:active:not(:disabled){filter:none!important;box-shadow:none!important;transform:none!important}'),'asset toolbar press must not darken');
assert(css.includes('@media(hover:none){.asset-card:active{filter:none!important;outline:none!important}'),'touch card must not flash extra outline');
assert(css.includes('.asset-card.selected:active{box-shadow:0 0 0 2px rgba(126,168,207,.1)!important}'),'selected card keeps existing visual selection');
assert(js.includes("if(action==='asset-open'){e.preventDefault();e.stopImmediatePropagation();"),'card opens same detail without default click behavior');
console.log('PASS asset press: no text selection, no dark toolbar overlay, selection state preserved');
