const fs=require('node:fs'),assert=require('node:assert/strict');
const js=fs.readFileSync('console.js','utf8'),css=fs.readFileSync('ui-refresh.css','utf8');
assert(js.includes('<div class="page-heading json-workspace-heading"><div><p>选择当前库后，在同一工作区维护库信息与图片引用。</p></div>${S.connected?`<div class="heading-actions"><button class="btn json-workspace-create" data-action="new-library">＋ 新建 JSON 库</button></div>`:\'\'}</div>'),'connected library creation is scoped to secondary action');
assert(js.includes('<div class="page-heading"><div><h2>JSON 库</h2>'),'empty-library view preserved');
assert(css.includes('.json-workspace-heading .heading-actions .json-workspace-create{flex:0 0 auto;width:auto;max-width:100%;padding:0 14px;color:var(--ink);border:1px solid var(--line);background:var(--surface);box-shadow:none}'),'secondary action remains content-width on mobile');
console.log('PASS JSON workspace secondary create action');
