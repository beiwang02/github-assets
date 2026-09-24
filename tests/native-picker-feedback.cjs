const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const js=fs.readFileSync('console.js','utf8'),css=fs.readFileSync('ui-refresh.css','utf8');
const start=js.indexOf('function uploadPickerTargetC('),end=js.indexOf('/* Pick-once controls',start);
assert(start>0&&end>start);
const handlers={},els=[];
vm.runInNewContext(js.slice(start,end),{document:{addEventListener:(n,fn)=>handlers[n]=fn,querySelectorAll:()=>els}});
function el(name){const attrs=new Set();return {name,open:false,attrs,matches(s){return s===':open'?this.open:['group','library'].includes(name)},setAttribute(k){attrs.add(k)},removeAttribute(k){attrs.delete(k)},hasAttribute(k){return attrs.has(k)}}}
for(const name of ['group','library']){
 const t=el(name);els.push(t);
 handlers.pointerdown({target:t,pointerType:'touch'});
 assert(t.hasAttribute('data-picker-touch'));
 assert(!t.hasAttribute('data-picker-open-seen'),'never hide border on initial touch');
 handlers.animationstart({target:t,animationName:'upload-native-picker-open'});
 assert(!t.hasAttribute('data-picker-open-seen'),'parser support without open state must not enable fix');
 t.open=true;handlers.animationstart({target:t,animationName:'upload-native-picker-open'});
 assert(t.hasAttribute('data-picker-open-seen'));
 t.open=false;assert(t.hasAttribute('data-picker-open-seen'),'same-value dismissal needs no change event');
 handlers.pointerdown({target:t,pointerType:'touch'});assert(!t.hasAttribute('data-picker-open-seen'),'reopen resets only detection, retains focus feedback');
 t.open=true;handlers.animationstart({target:t,animationName:'upload-native-picker-open'});
 handlers.keydown({key:'Tab'});assert(!t.hasAttribute('data-picker-touch'),'keyboard restores original focus');
 handlers.pointerdown({target:t,pointerType:'mouse'});assert(!t.hasAttribute('data-picker-touch'));
}
const other=el('name');handlers.pointerdown({target:other,pointerType:'touch'});assert.equal(other.attrs.size,0);
assert(css.includes('[data-picker-touch]:open{animation:upload-native-picker-open'));
assert(css.includes('[data-picker-touch][data-picker-open-seen]:not(:open){border-color:#e4e8f0!important'));
assert(css.includes('body.dark #uploadForm'));
assert(!js.includes('touch-picker-open'));assert(!js.includes('function initTouchUploadGroup'));
console.log('PASS native upload pickers: group/library, same-value dismissal, real-open gate, reopen, keyboard, dark fallback');
