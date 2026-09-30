const fs=require('node:fs'),assert=require('node:assert/strict');
const js=fs.readFileSync('console.js','utf8'),css=fs.readFileSync('ui-refresh.css','utf8');
assert(js.includes('<div class="page-heading json-workspace-heading"><div><p>选择当前库后，在同一工作区维护库信息与图片引用。</p></div></div>'),'intro retained without standalone create');
assert(js.includes('<div class="library-outside-actions"><div>${S.connected?`<button class="btn btn-primary json-workspace-create" data-action="new-library">＋ 新建 JSON 库</button>`:\'\'}<button class="btn" data-action="edit-library"'),'normal primary create is first within current-library actions');
assert(js.includes('<div class="page-heading"><div><h2>JSON 库</h2>'),'empty-library view preserved');
assert(css.includes('.json-workspace .library-outside-actions>div{flex-wrap:wrap}')&&css.includes('.json-workspace .library-outside-actions .btn{flex:0 0 auto;width:auto;font-size:12px}'),'actions wrap at normal content width');
console.log('PASS JSON workspace primary first create action');
