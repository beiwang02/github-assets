const fs=require('node:fs'),cp=require('node:child_process'),assert=require('node:assert/strict');
const js=fs.readFileSync('console.js','utf8'),base=cp.execFileSync('git',['show','6b29a313c3672faa963b8c3b62d8d859a4db1246:console.js'],{encoding:'utf8'});
const hero=/<section class="hero overview-hero"[^]*?<\/section>(?=<div class="stat-grid">)/;
assert(hero.test(js));const uploadGuard="if(action==='upload'){if(!S.connected)return notify('请先连接仓库','error');uploadModal();return;}";assert(js.includes(uploadGuard));assert.equal(js.replace(hero,'').replace(uploadGuard,uploadGuard.replace('请先连接仓库','请先连接你的仓库')),base,'Only authorized overview hero and exact upload notification text changed; all existing behavior retained');
const css=fs.readFileSync('ui-refresh.css','utf8'),baseCss=cp.execFileSync('git',['show','6b29a313c3672faa963b8c3b62d8d859a4db1246:ui-refresh.css'],{encoding:'utf8'});
const {normalizeAuthorizedColors}=require('./soft-color-contract.cjs');
const restoredFill='body .json-reference-actions [data-action="delete-icon"]::before{content:"";position:absolute;inset:5px;width:auto;height:auto;box-sizing:border-box;border:1px solid var(--remove-line);border-radius:9px;background:var(--ui-danger-bg);box-shadow:none;transform:none;pointer-events:none;z-index:0}';
assert(css.includes(restoredFill),'Exact authorized 34px removal theme paint');
const frozenCss=css.replace(restoredFill,restoredFill.replace('background:var(--ui-danger-bg)','background:transparent')).replace('Theme danger fill paints only the 34px frame; retain the transparent 44px hit area.','Reference colors only: retain transparent fill, 34px frame and 44px hit area.');
assert(normalizeAuthorizedColors(frozenCss).startsWith(normalizeAuthorizedColors(baseCss)),'Previous CSS remains frozen except fixed authorized danger literals and exact removal paint');
const added=css.slice(baseCss.length);
// A. Micro-polish A: right bright end pulled in by softening only the tail stop.
// Same blue/purple family, same angle, no new radial layer, dim dark variant stays approved.
assert(added.includes('linear-gradient(155deg,#1e2a5e 0%,#2f3c86 46%,#4a63ad 78%,#5b76c4 100%)'),'Light hero uses the approved four-stop blue canvas');
assert(added.includes('linear-gradient(155deg,#171f42 0%,#232c5e 46%,#2f3c74 78%,#3a4d88 100%)'),'Dark hero uses the approved dim four-stop canvas');
assert(!added.includes('#4b75c7')&&!added.includes('#34528b')&&!added.includes('#4870bd'),'Earlier tails fully retired');
assert(added.includes('linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px)')&&added.includes('background-size:34px 34px'),'Faint grid texture present');
// B. Micro-polish B: whitespace comfort only. Frozen geometry below stays byte-identical.
assert(added.includes('body .overview-hero h2{margin:11px 0 12px;'),'Title-to-description gap widened 9px->12px');
assert(added.includes('body .overview-hero .hero-actions{margin-top:25px;'),'Description-to-button gap widened 22px->25px');
assert(added.includes('border-radius:22px'));assert(added.includes('min-height:206px'));assert(added.includes('margin-bottom:24px'));assert(added.includes('padding:30px 33px'));assert(added.includes('flex:0 0 auto'));assert(added.includes('height:44px'));assert(!added.includes('quickbar'));
const markup=hero.exec(js)[0];assert(!markup.includes('activity'));assert(markup.includes('<span class="mini-label">GITHUB RESOURCE HUB</span>'));
assert(markup.includes('把每一张图片，变成可复用的资源。'));assert(markup.includes('集中管理 GitHub 图床、图片分组与 JSON 库，复制一条直链，就能在任何项目里使用。'));
assert(markup.includes('data-action="upload"'));assert(!markup.includes('data-action="new-library"'));assert.equal((markup.match(/<button /g)||[]).length,1);assert(markup.includes('＋ 上传图片'));assert(!/\bdisabled\b|aria-disabled/.test(markup));assert(markup.includes(' title="请先连接仓库"'));
assert(markup.includes('<div class="hero-actions">'));assert(markup.endsWith('</button></div></div></section>'),'Actions inside historic hero-content');
const historic=cp.execFileSync('git',['show','0395c4b:console.js'],{encoding:'utf8'});for(const text of ['GITHUB RESOURCE HUB','把每一张图片，变成可复用的资源。','集中管理 GitHub 图床、图片分组与 JSON 库，复制一条直链，就能在任何项目里使用。'])assert(historic.includes(text)&&markup.includes(text));
const originalStyles=cp.execFileSync('git',['show','0395c4b:styles.css'],{encoding:'utf8'}),styles=fs.readFileSync('styles.css','utf8');assert.equal(styles.match(/\.hero::before \{[^]*?\}/)[0],originalStyles.match(/\.hero::before \{[^]*?\}/)[0],'Original circular rings unchanged');
assert(js.slice(js.indexOf('function librariesView()'),js.indexOf('function groupView()')).includes('data-action="new-library"'));
const upload='body .overview-hero .hero-actions .btn.btn-primary[data-action="upload"]';
assert(added.includes(upload+'{color:#273172!important;background:var(--ui-hero-upload-bg)!important;border-color:var(--ui-hero-upload-bg)!important;--ui-feedback-ink:#273172}'));
assert(added.includes(upload+':active:not(:disabled){color:#273172!important;border-color:var(--ui-hero-upload-active)!important;background:var(--ui-hero-upload-active)!important}'));
assert(added.includes(upload+':not(:disabled):hover{color:#273172!important;border-color:var(--ui-hero-upload-hover)!important;background:var(--ui-hero-upload-hover)!important}'));
assert(!added.includes('.btn:disabled{'));assert(!added.includes('[data-action="upload"]:disabled{'));assert(added.includes('margin-bottom:24px'));
console.log('PASS overview hero: historic gradient, scoped styles, real original actions, no logs, all other JS unchanged');
