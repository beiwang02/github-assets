const assert=require('node:assert/strict');
const pairs=require('./move-groups-authorized.json');
const clientPairs=require('./move-groups-client-authorized.json');
const MOVE_BASELINE='70aa84d';
// Closed feature authorization: exact changed literals only, never an open-ended JS strip.
function normalizeMoveGroups(source,authorized=pairs){
 for(const [current,baseline] of authorized){
  assert(current.length>0,'Every move authorization must name a nonempty current literal');
  assert.equal(source.split(current).length-1,1,'Move literal must exist exactly once');
  source=source.replace(current,baseline);
 }
 return source;
}
function normalizeMoveClient(source){return normalizeMoveGroups(source,clientPairs);}
module.exports={normalizeMoveGroups,normalizeMoveClient,MOVE_BASELINE};
if(require.main===module){
 const fs=require('node:fs'),cp=require('node:child_process');
 assert.equal(normalizeMoveGroups(require('./release-127-normalize.cjs').normalize(fs.readFileSync('console.js','utf8'),'console.js')),cp.execFileSync('git',['show',MOVE_BASELINE+':console.js'],{encoding:'utf8'}),'Only exact authorized move UI changes allowed');
 assert.equal(normalizeMoveClient(fs.readFileSync('github.js','utf8')),cp.execFileSync('git',['show',MOVE_BASELINE+':github.js'],{encoding:'utf8'}),'Only exact authorized move client changes allowed');
 console.log('PASS move-groups-normalize: closed UI literal map; original selection, IME, copy and hero code unchanged');
}
