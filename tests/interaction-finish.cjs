const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const js=fs.readFileSync('console.js','utf8');let handler;
vm.runInNewContext(js.slice(js.lastIndexOf("document.addEventListener('keydown'")),{document:{addEventListener:(name,fn)=>handler=fn}});
for(const cls of ['library-list-row','library-empty-row','json-reference-row','asset-card','quick-asset'])for(const key of ['Enter',' ','Escape']){
 let clicked=0,prevented=0;handler({key,preventDefault(){prevented++},target:{matches:s=>s.split(',').includes('.'+cls+'[data-action]'),click(){clicked++}}});assert.equal(clicked,key==='Escape'?0:1);assert.equal(prevented,clicked);
}
let nested=0;handler({key:'Enter',preventDefault(){nested++},target:{matches:()=>false,click(){nested++}}});assert.equal(nested,0,'nested buttons keep their own native keyboard activation');
const html=fs.readFileSync('index.html','utf8');for(const file of ['styles.css','console.css','ui-refresh.css','console.js'])assert(html.includes(file+'?v='+(['console.css','ui-refresh.css'].includes(file)?'overview-no-hero-90':file==='console.js'?'overview-no-hero-90':'overview-no-hero-90')));
console.log('PASS final interaction: Enter/Space activates each row/card, Escape and nested controls remain independent; all four resource versions match. Runtime geometry matrix: tests/interaction-finish.js');
