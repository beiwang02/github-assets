const assert=require('node:assert/strict'),pairs=require('./release-131-authorized.json');
exports.normalize=(source,file)=>{for(const [now,old] of pairs[file]||[]){assert.equal(source.split(now).length-1,1,'Exact release131 authorization: '+file);source=source.replace(now,old);}return source;};
