const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const js=fs.readFileSync(path.join(__dirname,'..','console.js'),'utf8');
/* Every repo-dependent entry point refuses with the same message. */
for (const entry of ['upload','new-library','new-icon','new-group','new-group-from-upload','manage-group']) {
  const re=new RegExp("action==='"+entry+"'\\)\\{if\\(!S\\.connected\\)return notify\\('请先连接你的仓库','error'\\)");
  assert(re.test(js), entry+' must refuse without a connected repository');
}
/* Heads hide repo actions until a repository is connected; the empty-state card carries the CTA. */
assert(js.includes('${S.connected?`<div class="heading-actions"><button class="btn" data-action="new-group">＋ 新建分组</button>'));
assert.equal((js.match(/\$\{S\.connected\?`<div class="heading-actions"><button class="btn btn-primary" data-action="new-library">/g)||[]).length,2);
assert(js.includes("'settings',S.connected?'上传第一张图片':'连接我的仓库'"));
assert(js.includes("'new-library','连接我的仓库'" )||js.includes("S.connected?'新建 JSON 库':'连接我的仓库'"));
console.log('PASS repo gate: no group/library/upload action without a connected repository');
