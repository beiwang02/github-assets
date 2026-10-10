const assert=require('node:assert/strict'),pairs=require('./release-132-authorized.json');
exports.normalize=(source,file)=>{for(const [now,old] of pairs[file]||[]){assert(now,'No broad deletion exemptions');assert.equal(source.split(now).length-1,1,'Exact release132 authorization: '+file);source=source.replace(now,old);}return source;};
