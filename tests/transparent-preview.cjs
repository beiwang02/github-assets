const fs=require('node:fs'),assert=require('node:assert/strict');
const css=fs.readFileSync('ui-refresh.css','utf8');
const rule=css.match(/\.asset-preview img,\.quick-asset-image img\{([^}]+)\}/)?.[1];
assert(rule,'shared asset and overview thumbnail rule');
for(const item of ['box-shadow:none','object-fit:contain','width:72%','height:72%','left:14%','top:14%'])assert(rule.includes(item),item);
assert(fs.readFileSync('console.css','utf8').includes('body:not(.dark) .asset-preview,body:not(.dark) .quick-asset-image { background:#f2f5fb; }'),'outer preview background preserved');
console.log('PASS transparent previews: no rectangular image shadow, original geometry and outer background preserved');
