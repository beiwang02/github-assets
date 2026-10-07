const fs=require('node:fs'),cp=require('node:child_process'),vm=require('node:vm'),assert=require('node:assert/strict');
const css=fs.readFileSync('ui-refresh.css','utf8'),js=fs.readFileSync('console.js','utf8');
const allowed=['console.js','index.html','ui-refresh.css','tests/button-state-audit.cjs','tests/hero-disabled-state.cjs','tests/overview-hero.cjs','tests/overview-no-hero.cjs','tests/repo-gate.cjs','tests/clean-site.cjs','tests/soft-color-contract.cjs'].sort();
const changed=cp.execFileSync('git',['diff','--name-only','a329ce8','--'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
const untracked=cp.execFileSync('git',['ls-files','--others','--exclude-standard'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
assert.deepEqual([...new Set([...changed,...untracked])].sort(),allowed,'Fixed release baseline and closed ten-file authorization remain valid after commit');
const before=cp.execFileSync('git',['show','a329ce8:ui-refresh.css'],{encoding:'utf8'});
const starDecoration=/\/\* Decorative sparkles:[^]*?body\.dark \.overview-hero::after\{opacity:\.22\}\n/;
assert(starDecoration.test(css),'Authorized decorative star exists');
const normalizeAuthorized=s=>s.replace('linear-gradient(160deg,#202b63,#363f99 62%,#4b75c7)','linear-gradient(122deg,#202b63,#363f99 62%,#4b75c7)').replace('linear-gradient(160deg,#182044,#262f68 62%,#34528b)','linear-gradient(122deg,#182044,#262f68 62%,#34528b)').replace('border-radius:22px;color:#fff;background:radial-gradient(circle at 84% 8%,rgba(117,139,255,.65)','border-radius:16px;color:#fff;background:radial-gradient(circle at 84% 8%,rgba(117,139,255,.65)');
assert.equal(normalizeAuthorized(css.replace(starDecoration,'')),before.replace('body .overview-hero .btn:disabled{opacity:.65}\n',''),'Only obsolete hero disabled opacity removed, scoped decorative star added and authorized gradient-spread/radius polish; normal palettes frozen');
const beforeJs=cp.execFileSync('git',['show','a329ce8:console.js'],{encoding:'utf8'});
assert.equal(js,beforeJs.replace(' disabled title="请先在仓库设置中连接 GitHub"',' title="请先连接仓库"').replace("notify('请先连接你的仓库','error');uploadModal();return;}","notify('请先连接仓库','error');uploadModal();return;}"),'Only hero attribute and upload guard message authorized');
const overview=js.slice(js.indexOf('function overviewView()'),js.indexOf('function librariesView()'));
const guard=js.match(/if\(action==='upload'\)\{[^\n]+\}/)[0];
for(const connected of [false,true]){
 const notifications=[];let modals=0;
 const ctx={S:{connected,libraries:[],assets:[],groups:[]},statC:()=>'',emptyC:()=>'',notify:(...args)=>notifications.push(args),uploadModal:()=>{modals++}};
 const markup=vm.runInNewContext(overview+';overviewView()',ctx).match(/<section class="hero overview-hero"[^]*?<\/section>/)[0];
 const button=markup.match(/<button[^]*?<\/button>/)[0];assert(!/\bdisabled\b|aria-disabled/.test(button));assert(button.includes('data-action="upload"'));assert.equal((markup.match(/<button /g)||[]).length,1);
 vm.runInNewContext('(function(){const action="upload";'+guard+'})()',ctx);
 assert.equal(modals,connected?1:0,'Disconnected click never opens upload modal');assert.deepEqual(notifications,connected?[]:[['请先连接仓库','error']]);
}
assert(css.includes('.ui-button:disabled{cursor:not-allowed;opacity:.5;transform:none}'),'Other controls retain disabled semantics');
console.log('PASS hero-connection-guard: enabled button in both states, exact normal palettes, disconnected click notifies without modal, connected click opens original modal, narrow CSS/JS freeze');
