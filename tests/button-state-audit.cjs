const fs=require('node:fs'),assert=require('node:assert/strict');
const css=fs.readFileSync('ui-refresh.css','utf8'),js=fs.readFileSync('console.js','utf8');
for(const state of [':not(:disabled)',':not([aria-disabled="true"])',':not([aria-busy="true"])',':not(.selected)',':not([aria-pressed="true"])'])assert(css.includes('[data-feedback="control"]')&&css.includes(state),'Feedback exclusion '+state);
for(const selector of ['.ui-button:focus-visible','.copy-control.ui-button:not(:disabled):active',':is(.asset-select,.reference-select):is(:disabled,[aria-busy=true])','body .sort-trigger[aria-expanded="true"]:not(:disabled)'])assert(css.includes(selector),selector);
for(const text of ["scope.setAttribute('aria-busy','true')","button.disabled=true","button.textContent=state.label","button.disabled=disabled;button.innerHTML=html",'if(pendingSubmission || scope.dataset.busy',"if(action==='upload'){if(!S.connected)"])assert(js.includes(text),'Submission/connection guard '+text);
assert(css.includes('--ui-danger-ink:#d84f67'));assert(css.includes('--ui-danger-ink:#e5a0ad'));
assert(css.includes('background:var(--copy-bg)'));assert(css.includes('--ui-selection-ink'));
// Hero labels keep their normal theme palettes in both connection states.
function lum(h){return h.match(/[a-f\d]{2}/gi).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0)}
for(const [a,b] of [['#273172','#f7f8fc'],['#273172','#d6ddea']])assert(css.includes('--ui-hero-upload-bg:'+b)&&((Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05)>=4.5),'Normal hero label legible');
console.log('PASS button-state-audit: scoped feedback exclusions, primary/danger/copy/selection palette, disabled and busy semantics, restoration and keyboard focus retained');
