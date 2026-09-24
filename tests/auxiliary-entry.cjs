const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');const css=read('ui-refresh.css'),js=read('console.js');
assert(css.includes('#tokenLoginForm .token-guide-button.ui-button,\n.json-workspace .library-switch-trigger.ui-button{justify-content:flex-start;text-align:left;padding:0;min-height:44px;border:0;background:transparent;font-size:12px;color:var(--primary);text-decoration:none}'));
assert(css.includes('.json-workspace .json-workspace-top{flex-direction:column;align-items:flex-start;gap:8px}'));
assert(css.includes('#uploadForm .modal-inline-create{justify-content:flex-start;align-items:flex-start;text-align:left;padding:0;min-height:40px;border:0;background:transparent;color:var(--primary);text-decoration:none;line-height:1;justify-self:start;width:max-content}'));
assert(js.includes('data-action="token-guide">经典 Token 创建教程</button>'));
assert(js.includes('data-action="open-library-picker" aria-haspopup="dialog" aria-expanded="false">切换库</button>'));
assert(read('index.html').includes('ui-refresh.css?v=tap-cleanup-50'));
console.log('PASS auxiliary-entry: scoped alignment, 44px touch targets, 8px gap, unchanged semantics and upload-only rule. Browser: tests/auxiliary-entry.js');

assert(css.includes('.copy-control.ui-button.btn:not(.copy-control-icon){--copy-bg:var(--surface);--copy-line:var(--line);--copy-ink:#5e6b80}'));
