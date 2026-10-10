const assert=require('node:assert/strict');
exports.normalize=(source,file)=>{
 source=require('./release-131-normalize.cjs').normalize(source,file);
 const pairs=file==='index.html'?[['console.js?v=https-initial-caption-103&amp;revision=clean-ui-release-130','console.js?v=https-initial-caption-103&amp;revision=clean-ui-release-129']]:file==='console.js'?[
 ['经典 Token 创建教程</button><button type="submit"','经典 Token 创建教程</button><button type="button" class="btn" data-action="retry-auth">重试自动登录</button><button type="submit"'],
 ["  const action=target.dataset.action;\n","  const action=target.dataset.action;\n  if(action==='retry-auth'){await runSubmission(target,'正在重试…',()=>bootAuth());return;}\n"]]:[];
 for(const [now,old] of pairs){assert.equal(source.split(now).length-1,1,'Exact release130 authorization: '+file);source=source.replace(now,old);}return source;
};
