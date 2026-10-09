const fs=require('node:fs'),cp=require('node:child_process'),vm=require('node:vm'),assert=require('node:assert/strict');
const css=require('./action-spacing-normalize.cjs').normalizeActionSpacing(require('./release-127-normalize.cjs').normalize(fs.readFileSync('ui-refresh.css','utf8'),'ui-refresh.css')),js=require('./release-127-normalize.cjs').normalize(fs.readFileSync('console.js','utf8'),'console.js');
const allowed=['.env.example','console.js','console.css','index.html','ui-refresh.css','tests/button-state-audit.cjs','tests/hero-disabled-state.cjs','tests/overview-hero.cjs','tests/overview-no-hero.cjs','tests/repo-gate.cjs','tests/clean-site.cjs','tests/soft-color-contract.cjs','tests/compact-toolbar-empty-library.cjs','tests/json-reference-grid.cjs','tests/information-feedback.cjs','tests/round2-regressions.cjs','tests/library-row-audit.js','tests/popup-webkit.js','tests/soft-blue-feedback.js','tests/outline-text-feedback.js','tests/text-danger-feedback.cjs','tests/action-spacing-normalize.cjs','tests/action-spacing-contract.cjs','tests/horizontal-reference-strips.cjs','tests/library-create-secondary.cjs','tests/library-name-trigger.cjs','tests/settings-typography.cjs'].sort();
const changed=cp.execFileSync('git',['diff','--name-only','a329ce8','--'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
const untracked=cp.execFileSync('git',['ls-files','--others','--exclude-standard'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
const moveFiles=['github.js','tests/image-save.cjs','tests/move-groups-authorized.json','tests/move-groups-client-authorized.json','tests/move-groups-normalize.cjs','tests/move-groups.cjs'];
const releaseFiles=['tests/copy-controls.cjs','tests/policy-ui.cjs','tests/token-remember.cjs','tests/release-127.cjs','tests/session-reopen.cjs','tests/release-127-authorized.json','tests/release-127-normalize.cjs','tests/settings-local-refinement.cjs','responsive.css','tests/global-responsive.cjs','tests/settings-simplify-normalize.cjs','Dockerfile','server.mjs','tests/favicon-permission.cjs','tests/release-123.cjs','tests/release-123-index-authorized.json',...['favicon.svg','favicon-16.png','favicon-32.png','favicon-48.png','favicon-64.png','favicon.ico','apple-touch-icon.png','icon-192.png','icon-512.png','build_icons.py'].map(f=>'icons/'+f)];
assert.deepEqual([...new Set([...changed,...untracked])].sort(),[...allowed,...moveFiles,...releaseFiles].sort(),'Historic approved files plus exact cache123 move/favicon/access-message authorization only');
// Only this documentation path is authorized; configuration remains byte-frozen.
const envExample=fs.readFileSync('.env.example','utf8');
const envBaseline=cp.execFileSync('git',['show','cdf7269:.env.example'],{encoding:'utf8'});
const envConfig=s=>s.split(/(?<=\n)/).filter(line=>line.trim()&&!line.trimStart().startsWith('#'));
assert.deepEqual(envConfig(envExample),envConfig(envBaseline),'Every non-comment environment line stays byte-identical to cdf7269');
const envComments=envExample.split('\n').filter(line=>line.trimStart().startsWith('#'));
assert(envComments.length>0&&envComments.every(line=>/[\u4e00-\u9fff]/.test(line)),'Every template comment contains Chinese explanation');
assert(!envConfig(envExample).some(line=>/^(?:export\s+)?(?:GITHUB_CLIENT_ID|GITHUB_CLIENT_SECRET|GITHUB_OAUTH_SCOPE|GITHUB_OAUTH_REDIRECT_URI|\w*OAUTH\w*)\s*=/.test(line)),'No OAuth configuration keys added to the Token template');
const {unifyDangerEntries}=require('./soft-color-contract.cjs');
const before=cp.execFileSync('git',['show','a329ce8:ui-refresh.css'],{encoding:'utf8'});
// Sparkle decoration retired by user request; no ::after sparkle rule may remain.
assert(!css.includes('Decorative sparkles'),'Sparkle decoration removed');
assert(!/overview-hero::after/.test(css),'No hero sparkle layer remains');
// Exact-literal authorization whitelist for the final micro-polish (release 118).
// Each entry maps ONE approved current literal back to its a329ce8 baseline literal;
// everything else in the stylesheet stays byte-frozen. No blanket regex exemption.
const authorizedMicroPolish=[
 // A. Background canvas replaced by the approved four-stop blue ramp in both themes.
 ['linear-gradient(155deg,#1e2a5e 0%,#2f3c86 46%,#4a63ad 78%,#5b76c4 100%)','linear-gradient(122deg,#202b63,#363f99 62%,#4b75c7)','Light hero replaced with the approved four-stop blue canvas'],
 ['linear-gradient(155deg,#171f42 0%,#232c5e 46%,#2f3c74 78%,#3a4d88 100%)','linear-gradient(122deg,#182044,#262f68 62%,#34528b)','Dark hero replaced with the approved dim four-stop canvas, stays dim not black'],
 // B. Whitespace comfort only: +3px title->description and +3px description->button. Geometry untouched.
 ['body .overview-hero h2{margin:11px 0 12px;','body .overview-hero h2{margin:11px 0 9px;','Title-to-description gap 9px->12px'],
 ['body .overview-hero .hero-actions{margin-top:25px;','body .overview-hero .hero-actions{margin-top:22px;','Description-to-button gap 22px->25px'],
 // C. Whole background canvas replaced (user request): diagonal light band instead of circular blobs.
 ['radial-gradient(140% 110% at 6% 0%,rgba(129,140,248,.38),transparent 52%),radial-gradient(120% 120% at 96% 100%,rgba(96,165,250,.26),transparent 48%)','radial-gradient(circle at 84% 8%,rgba(117,139,255,.65),transparent 31%),radial-gradient(circle at 72% 120%,rgba(58,196,198,.34),transparent 35%)','Light hero glow replaced with one unified blue-purple light band'],
 ['radial-gradient(140% 110% at 6% 0%,rgba(114,128,226,.18),transparent 52%),radial-gradient(120% 120% at 96% 100%,rgba(78,140,220,.14),transparent 48%)','radial-gradient(circle at 84% 8%,rgba(100,119,219,.25),transparent 31%),radial-gradient(circle at 72% 120%,rgba(44,142,156,.12),transparent 35%)','Dark hero glow matched to the new light band'],
 ['body .overview-hero .hero-content{min-width:0;max-width:570px;position:relative;z-index:1}','body .overview-hero .hero-content{min-width:0;max-width:570px}','Hero content raised above the grid texture layer']];
const bulkBaseline=':is(.assets-toolbar,.json-reference-toolbar) :is(.asset-bulk-actions,.page-bulk-actions) button{flex:0 1 auto;min-width:44px;min-height:44px;font-size:12px;padding-inline:4px;white-space:nowrap;background:transparent;border-color:transparent}\n';
assert(css.includes(':is(.assets-toolbar,.json-reference-toolbar) :is(.asset-bulk-actions,.page-bulk-actions) [data-action="bulk-library"]{background:var(--surface)'),'bulk-library restored to a real button');
const normalizeAuthorized=s=>authorizedMicroPolish.reduce((v,[from,to])=>{
 assert(v.includes(from),'Authorized micro-polish literal must be present: '+from);
 return v.replace(from,to);},s.replace('--ui-danger-ink:#e5a0ad','--ui-danger-ink:#ff9cac'))
 .replace('border-radius:22px;color:#fff;background:radial-gradient(circle at 84% 8%,rgba(117,139,255,.65)','border-radius:16px;color:#fff;background:radial-gradient(circle at 84% 8%,rgba(117,139,255,.65)').replace('display:flex;justify-content:flex-end;gap:10px;align-items:center}','display:flex;justify-content:flex-end;gap:2px;align-items:center}');
// The authorized literals must be unique so normalization cannot hit unrelated rules.
for(const [from,,why] of authorizedMicroPolish)assert.equal(css.split(from).length-1,1,'Authorized literal must occur exactly once: '+why);
// Geometry the user froze against further change stays pinned here.
for(const pinned of ['min-height:206px','border-radius:22px','height:44px','min-height:44px','margin-bottom:24px','padding:30px 33px'])assert(css.includes(pinned),'Pinned hero geometry: '+pinned);
const gridPatch=/body \.overview-hero::before\{content:""[\s\S]*?body\.dark \.overview-hero::before,body\.dark \.overview-hero \.hero-content::after\{[^\n]*\}\n/;
assert(gridPatch.test(css),'Authorized right-strip grid patch and mobile corner patches exist');
assert(!css.includes('mask-image:radial-gradient'),'No WebKit mask dependency remains for the hero grid');
const retireCircle=/\/\* Sparkle decoration retired by user request; the circle motif carries the depth\. \*\/\n/;
assert(retireCircle.test(css),'Sparkle comment present in place of the retired circle rule');
const round2=/\n\/\* Round 2 \(release 120 preview\)[\s\S]*$/;
assert(round2.test(css),'Round-2 appended regressions block present');
assert.equal(unifyDangerEntries(normalizeAuthorized(css.replace(':is(.assets-toolbar,.json-reference-toolbar) :is(.asset-bulk-actions,.page-bulk-actions) button{flex:0 1 auto;min-width:44px;min-height:44px;font-size:12px;padding-inline:14px;white-space:nowrap}\n:is(.assets-toolbar,.json-reference-toolbar) :is(.asset-bulk-actions,.page-bulk-actions) [data-action="bulk-library"]{background:var(--surface);border:1px solid var(--line);border-radius:var(--ui-radius);color:var(--muted)}\n:is(.assets-toolbar,.json-reference-toolbar) :is(.asset-bulk-actions,.page-bulk-actions) [data-action="bulk-library"]:active:not(:disabled){border-color:var(--ui-line-focus)}\n',bulkBaseline).replace(retireCircle,'body.dark .overview-hero::before{opacity:.45}\n').replace(gridPatch,'').replace(round2,''))),before.replace('body .overview-hero .btn:disabled{opacity:.65}\n',''),'Only obsolete hero disabled opacity removed, sparkle layer dropped, approved right-strip grid patch, gradient/whitespace polish, round-2 regressions and unified danger-entry selectors applied; normal palettes frozen');
const beforeJs=cp.execFileSync('git',['show','a329ce8:console.js'],{encoding:'utf8'});
/* Round-2 authorized copy: unified danger terms map back to the frozen baseline text. */
const normalizeDangerCopy=s=>s
 .replace('title="删除 JSON 库：${escC(lib.name)}" aria-label="删除 JSON 库：${escC(lib.name)}">${uiIconC(\'close\')}</button>','aria-label="删除JSON库${escC(lib.name)}">删除</button>')
 .replace(/aria-label="将 \$\{escC\(icon\.name\)\} 移出此库" title="移出此库"/g,'aria-label="移除 ${escC(icon.name)} 引用" title="移除引用"')
 .replace(/aria-label="移出已选择的 \$\{selected\} 个引用（不影响原图）">移出此库/g,'aria-label="移除已选择的 ${selected} 个引用（不会删除原图）">移除引用')
 .replace(/data-action="bulk-delete">删除图片/g,'data-action="bulk-delete">删除原图')
 .replace(/data-index="\$\{icon\.index\}">移出此库<\/button>/g,'data-index="${icon.index}">删除引用</button>')
 .replace(/data-action="delete-library" data-id="\$\{escC\(lib\.id\)\}">删除库<\/button><\/div><\/div><div class="card detail-header">/g,'data-action="delete-library" data-id="${escC(lib.id)}">删除</button></div></div><div class="card detail-header">')
 .replace(/<p>文件：\$\{escC\(lib\.file\)\} · \$\{lib\.count\} 个图片引用<\/p><\/div><\/div><div class="toolbar"><label class="inner-search"><span>⌕<\/span><input data-bind="icon-search" value="\$\{escC\(S\.iconQuery\)\}" placeholder="搜索名称或直链…">/g,'<p>文件：${escC(lib.file)} · ${lib.count} 个图片引用</p></div><div class="detail-actions"><button class="icon-btn" data-action="copy" data-copy="${escC(rawLibrary(lib))}" title="复制 JSON 直链">⧉</button><button class="icon-btn" data-action="delete-library" data-id="${escC(lib.id)}" title="删除 JSON 库">×</button></div></div><div class="toolbar"><label class="inner-search"><span>⌕</span><input data-bind="icon-search" value="${escC(S.iconQuery)}" placeholder="搜索名称或直链…">')
 .replace(/aria-label="删除库\$\{escC\(lib\.name\)\}">删除库<\/button>/g,'aria-label="删除JSON库${escC(lib.name)}">删除</button>');
const stripDangerActions=s=>s.replace(/  if\(action==='(?:delete-selected-icons|delete-library|delete-icon|delete-asset|bulk-delete|confirm-delete-group)'\)\{[\s\S]*?;return;\}\n/g,'');
assert.equal(stripDangerActions(normalizeDangerCopy(require('./move-groups-normalize.cjs').normalizeMoveGroups(js))),stripDangerActions(beforeJs).replace(' disabled title="请先在仓库设置中连接 GitHub"',' title="请先连接仓库"').replace("notify('请先连接你的仓库','error');uploadModal();return;}","notify('请先连接仓库','error');uploadModal();return;}"),'Only hero attribute, upload guard message and unified danger copy authorized');
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
