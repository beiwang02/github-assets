const assert=require('node:assert/strict'),pairs=require('./release-133-authorized.json');
exports.normalize=(source,file)=>{for(const [now,old] of pairs[file]||[]){assert(now);assert.equal(source.split(now).length-1,1,'Exact release133 authorization: '+file);source=source.replace(now,old);}return source;};
