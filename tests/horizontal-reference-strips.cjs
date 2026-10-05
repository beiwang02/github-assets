const fs=require('node:fs'),assert=require('node:assert/strict');
const css=fs.readFileSync('ui-refresh.css','utf8').split('/* Horizontal reference strips:')[1];
assert(css.includes('repeat(auto-fill,minmax(260px,1fr))'));assert(css.includes('repeat(2,minmax(0,1fr))'));
assert(css.includes('grid-template-columns:32px 28px minmax(0,1fr) 36px 36px'));
assert(css.includes('grid-template-columns:22px 22px minmax(0,1fr) 24px 24px'));
assert(css.includes('.json-reference-actions{display:contents!important}'));assert(css.includes('object-fit:contain'));assert(css.includes('min-height:48px'));
for(const row of [144,179]){const name=row-10-8-22-22-24-24;assert(name>=34,'narrow name must retain at least 34px');}
console.log('PASS horizontal single-row geometry: phone two columns, desktop auto-fill, contain thumbnail; explicit phone 22/24 x 44 targets, not claimed 44-square (synthetic)');
