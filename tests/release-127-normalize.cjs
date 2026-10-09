const assert=require('node:assert/strict'),pairs=require('./release-127-authorized.json');
exports.normalize=(source,file)=>{source=require('./release-128-normalize.cjs').normalize(source,file);for(const [now,old] of pairs[file]||[]){assert.equal(source.split(now).length-1,1,'Exact release127 authorization: '+file);source=source.replace(now,old);}return source;};
