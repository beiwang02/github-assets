const fs=require('node:fs'),cp=require('node:child_process'),assert=require('node:assert/strict');
const pairs=require('./release-123-index-authorized.json');
function normalizeIndex(source){for(const [now,old] of pairs){assert(now.length>0);assert.equal(source.split(now).length-1,1);source=source.replace(now,old);}return source;}
module.exports={normalizeIndex};
if(require.main===module){
 const html=fs.readFileSync('index.html','utf8');
 assert.equal(normalizeIndex(html),cp.execFileSync('git',['show','70aa84d:index.html'],{encoding:'utf8'}));
 assert.equal((html.match(/clean-ui-release-125/g)||[]).length,4);
 for(const f of ['console.js','console.css','ui-refresh.css','github.js'])assert(html.includes(f+'?')&&html.match(new RegExp(f.replace('.','\\.')+'\\?[^"\\n]*clean-ui-release-125')));
 for(const f of ['favicon.svg','favicon-16.png','favicon-32.png','favicon.ico','apple-touch-icon.png'])assert(html.includes('icons/'+f+'?v=brand-1'));
 assert(!html.includes('maximum-scale=')&&!html.includes('user-scalable=no'));
 assert.equal(require('./settings-simplify-normalize.cjs').normalizeSettingsSimplify(fs.readFileSync('ui-refresh.css','utf8')),cp.execFileSync('git',['show','70aa84d:ui-refresh.css'],{encoding:'utf8'}),'Settings typography and all approved styles unchanged');
 console.log('PASS release-123 exact index authorization, four JS/CSS cache keys, brand-1 favicon cache, settings typography preserved');
}
