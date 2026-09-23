const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const js=read('console.js');
const sheets=['styles.css','console.css','ui-refresh.css'];

/* Minimal CSS walker: report any :hover selector that is not inside a hover-capable media context. */
function parse(css){
  const items=[]; let i=0;
  while(i<css.length){
    const j=css.indexOf('{',i);
    if(j===-1){ items.push([css.slice(i),null]); break; }
    let depth=1,k=j+1;
    while(k<css.length&&depth){ if(css[k]==='{')depth++; else if(css[k]==='}')depth--; k++; }
    assert.equal(depth,0,'unbalanced braces');
    items.push([css.slice(i,j),css.slice(j+1,k-1)]);
    i=k;
  }
  return items;
}
function atRule(prelude){
  const head=prelude.trim().split('{')[0].trim().toLowerCase();
  return head.startsWith('@media')||head.startsWith('@supports')||head.startsWith('@layer');
}
function walk(prelude,body,gated,file,naked){
  if(body===null)return;
  if(atRule(prelude)){ const inner=gated||prelude.includes('hover:hover'); for(const [p,b] of parse(body)) walk(p,b,inner,file,naked); return; }
  if(prelude.includes(':hover')&&!gated)naked.push(file+': '+prelude.trim().slice(0,70));
}
for(const file of sheets){
  const css=read(file), naked=[];
  for(const [p,b] of parse(css)) walk(p,b,false,file,naked);
  assert.deepEqual(naked,[],'hover must not fire on touch devices');
  assert(css.includes('@media(hover:hover)'),file+' must gate hover');
}
/* Mixed selector lists keep their non-hover half alive on touch. */
const base=read('styles.css');
assert(base.includes('.text-link:focus,.text-link:active {'),'focus/active half must stay');
assert(base.includes('@media(hover:hover){.text-link:hover{'),'hover half must be gated');
assert(base.includes('.group-pill.active {'),'active pill state must stay');
assert(base.includes('.drop-zone.dragging {'),'drag state must stay');
/* Pick-once controls drop focus after the value commits; text fields keep it. */
assert(js.includes("document.addEventListener('change',e=>{const t=e.target;if(!t||!t.matches||!t.matches('select,input[type=file],input[type=checkbox],input[type=radio]')||!hoverlessC())return;t.blur();});"));
assert(js.includes("function hoverlessC(){ try { return !window.matchMedia('(hover:hover)').matches; } catch { return false; } }"));
assert(!/addEventListener\('change'[\s\S]{0,120}input\[type=text\]/.test(js),'text fields must keep focus');
console.log('PASS hover gate: no hover state can stick on touch, pick-once controls release focus');
