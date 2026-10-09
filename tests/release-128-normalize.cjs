const assert=require('node:assert/strict'),pairs=require('./release-128-authorized.json');
exports.normalize=(source,file)=>{for(const [now,old] of pairs[file]||[]){assert.equal(source.split(now).length-1,1,'Exact release128 authorization: '+file);source=source.replace(now,old);}return source;};
