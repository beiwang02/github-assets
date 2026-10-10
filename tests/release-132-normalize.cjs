require('./historical-133.cjs');
const assert=require('node:assert/strict'),pairs=require('./release-132-authorized.json');
exports.normalize=(source,file)=>{const next=require('./release-133-authorized.json')[file]?.[0];if(next&&source===next[0])source=require('./release-133-normalize.cjs').normalize(source,file);for(const [now,old] of pairs[file]||[]){assert(now,'No broad deletion exemptions');assert.equal(source.split(now).length-1,1,'Exact release132 authorization: '+file);source=source.replace(now,old);}return source;};
