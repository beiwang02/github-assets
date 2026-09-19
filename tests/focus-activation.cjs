const fs=require('fs'),assert=require('assert');
const css=fs.readFileSync('ui-refresh.css','utf8'),js=fs.readFileSync('console.js','utf8');
assert(css.includes('.ui-button:not([data-ui=danger]):focus{color:var(--primary);border-color:var(--primary)}'));
assert(css.includes('.asset-select:focus:before{border-color:var(--primary)}'));
assert(css.includes('.reference-select:focus{color:var(--primary);border-color:var(--primary)}'));
assert(!/action==='asset-select'[\s\S]{0,240}target\.blur\(\)/.test(js));
assert(!/action==='select-icon'[\s\S]{0,240}target\.blur\(\)/.test(js));
assert(css.includes('.ui-button[data-ui=danger]'));
console.log('focus activation regression: ok');
