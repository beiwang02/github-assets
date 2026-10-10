const S = {
  auth:null, csrf:'', oauthEnabled:false,  adminConfigured:false, isAdmin:false, policyConfigured:false, allowAll:true, allowedUsers:[], connectionError:'', view:'overview', connected:false, loading:false, loginBusy:false,
  repo: JSON.parse(localStorage.getItem('gh-image-repo') || 'null') || { owner:'', repo:'', branch:'main', assetsPath:'assets' },
  groups:[], assets:[], libraries:[], repos:[], selected:new Set(), selectedIcons:new Set(), group:'', assetQuery:'', libraryQuery:'', iconQuery:'', librarySort:localStorage.getItem('gh-libraries-sort')||'updated-desc', activity:[], uploadDraft:null, modalConfirm:null
};
const $c = s => document.querySelector(s);
const escC = v => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const rawLibrary = lib => `https://raw.githubusercontent.com/${encodeURIComponent(S.repo.owner)}/${encodeURIComponent(S.repo.repo)}/${encodeURIComponent(S.repo.branch)}/${lib.file.split('/').map(encodeURIComponent).join('/')}`;
let repositoryClient=null, repositoryKey='', repositoryEpoch=0;
const currentClient = () => {
  const key=JSON.stringify([S.repo.owner,S.repo.repo,S.repo.branch,S.repo.assetsPath,S.csrf]);
  if(key!==repositoryKey){repositoryKey=key;repositoryEpoch++;repositoryClient=new window.GitHubClient(S.repo,S.csrf);}
  return repositoryClient;
};
function notify(message, type='success') { const n=document.createElement('div'); n.className=`toast ${type}`; n.textContent=message; $c('#toastRoot').appendChild(n); setTimeout(()=>n.remove(),3600); }
async function copyC(text, message='直链已复制') { try { await navigator.clipboard.writeText(text); } catch { const a=document.createElement('textarea'); a.value=text; document.body.appendChild(a); try { a.select(); if(!document.execCommand('copy'))throw new Error('复制失败，请手动复制直链。'); } finally { a.remove(); } } notify(message); }
function statC(icon,label,value,trend,foot) { return `<div class="stat-card"><div class="stat-card-top"><span>${label}</span><i class="stat-icon">${icon}</i></div><strong>${value}<span class="trend">${trend}</span></strong><div class="stat-foot">${foot}</div></div>`; }
function emptyC(icon,title,desc,action='',label='') { return `<div class="empty-state"><div class="empty-icon">${icon}</div><h3>${title}</h3><p>${desc}</p>${action?`<button class="btn btn-primary" data-action="${action}">${label}</button>`:''}</div>`; }
function setMetaC() {
  const meta={overview:['资源工作台','总览'],libraries:['内容管理','JSON 库'],assets:['内容管理','图片资源'],'library-detail':['JSON 库',S.libraries.find(x=>x.id===S.selectedLibrary)?.name||'JSON 库'],activity:['内容管理','同步记录'],settings:['系统设置','仓库设置'],admin:['系统设置','管理后台']};
  const [eyebrow,title]=meta[S.view]||meta.overview;
  $c('#pageEyebrow').textContent=eyebrow; $c('#pageTitle').textContent=title;
  const repoName=$c('#repoName');
  if(repoName){ const dot=$c('#storageDot'); repoName.querySelector('.repo-name-text').textContent=S.repo.repo||'未选择仓库'; if(dot) repoName.appendChild(dot); }
  $c('#repoOwner').textContent=S.repo.owner?`${S.repo.owner} / ${S.repo.branch}`:'请先配置仓库';
  const repoAvatar=$c('#repoAvatar');
  if(repoAvatar){ const initial=(S.repo.repo||'').trim().slice(0,1); repoAvatar.textContent=initial||'G'; repoAvatar.title=S.repo.repo?`仓库 ${S.repo.repo} 首字母`:'尚未选择仓库'; }
  $c('#libraryCount').textContent=S.connected?S.libraries.length:'0'; $c('#assetCount').textContent=S.connected?S.assets.length:'0';
  const storageState=S.loading?'正在读取':(S.connected?'已连接':'未连接');
  const storageDot=$c('#storageDot');
  storageDot.classList.toggle('connected',S.connected);
  storageDot.style.background='';
  storageDot.title=S.connected?(S.syncError||'已连接'):'未连接';
  storageDot.setAttribute('aria-label',storageDot.title);
  document.querySelectorAll('.nav-item[data-view]').forEach(n=>n.classList.toggle('active', n.dataset.view===(S.view==='library-detail'?'libraries':S.view)));
  const login=S.auth?.login||''; const name=S.auth?.name||login||'GitHub 用户'; const avatar=S.auth?.avatar_url||''; document.querySelectorAll('[data-account-name]').forEach(n=>n.innerHTML=`${escC(name)}<small class="account-login">@${escC(login)}</small>`); document.querySelectorAll('[data-account-avatar]').forEach(n=>{ if(avatar)n.innerHTML=`<img src="${escC(avatar)}" alt="${escC(name)}">`; else n.textContent=(name||'G').slice(0,1).toUpperCase(); });
}
function clearLegacyCredentialC(){ try { localStorage.removeItem('gh-image-remembered-token'); } catch {} }
clearLegacyCredentialC();
function finePointerC(){ try { return window.matchMedia('(pointer:fine)').matches; } catch { return false; } }
function hoverlessC(){ try { return !window.matchMedia('(hover:hover)').matches; } catch { return false; } }
async function recoverSession(){ return false; }
window.recoverSession=recoverSession;
window.liveCsrf=()=>S.csrf;
function loginView() {
  const problem=new URLSearchParams(location.search).get('auth_error');
  const message=problem==='logged_out'?'已退出登录。':(problem==='forbidden'?'当前 GitHub 账号暂无访问权限，请联系管理员添加到允许名单。':(problem==='oauth_denied'?'已取消 GitHub 授权，请重新点击 GitHub 登录。':(problem==='oauth_state'?'授权已过期或校验失败，请重新点击 GitHub 授权登录。':(problem?'登录失败，请重新点击 GitHub 登录。':'使用 GitHub 登录'))));
  return `<div class="auth-page"><div class="auth-card"><div class="auth-brand"><div><strong>GitHub Assets</strong></div><div class="auth-head-actions"><button class="top-icon appearance-button auth-theme-button" data-action="toggle-theme" title="跟随系统（点击切换）" aria-label="跟随系统（点击切换）">◐</button><a class="project-link" href="https://github.com/beiwang02/github-assets" title="查看项目源码" aria-label="查看项目源码"><svg class="project-github-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.3a9.7 9.7 0 0 0-3.07 18.9c.49.09.67-.21.67-.47v-1.66c-2.73.59-3.31-1.16-3.31-1.16-.44-1.13-1.08-1.43-1.08-1.43-.89-.61.07-.6.07-.6.98.07 1.5 1.01 1.5 1.01.87 1.5 2.28 1.07 2.84.82.09-.63.34-1.07.62-1.32-2.18-.25-4.47-1.09-4.47-4.85 0-1.07.38-1.94 1.01-2.62-.1-.25-.44-1.25.1-2.59 0 0 .82-.26 2.67 1a9.3 9.3 0 0 1 4.86 0c1.85-1.26 2.67-1 2.67-1 .54 1.34.2 2.34.1 2.59.63.68 1.01 1.55 1.01 2.62 0 3.77-2.3 4.59-4.48 4.84.35.3.66.9.66 1.81v2.68c0 .26.18.57.68.47A9.7 9.7 0 0 0 12 2.3Z"/></svg></a></div></div><p>${escC(message)}</p>${S.oauthEnabled?'<a class="btn btn-github" href="/api/auth/github" data-action="oauth-login">使用 GitHub 登录</a>':'<button class="btn btn-github" type="button" disabled>使用 GitHub 登录</button>'}<small class="auth-note">${S.oauthEnabled?'public_repo 权限涵盖账号可访问的公开仓库，并非只授权单个仓库；授权令牌仅保存在服务器内存，服务重启后需重新授权。':'部署者需配置 GitHub OAuth 后才能登录。<a href="https://github.com/settings/applications/new" target="_blank" rel="noopener noreferrer">创建 OAuth App</a>'}</small></div></div>`;
}

const collatorC=new Intl.Collator(undefined,{numeric:true,sensitivity:'base'});
function timeC(value){const n=Date.parse(value||'');return Number.isFinite(n)?n:null;}
function compareTimedC(a,b,field,direction){const read=o=>field==='assetLatest'?(timeC(o.updatedAt)??timeC(o.createdAt)):field==='latest'?(timeC(o.updatedAt)??timeC(o.addedAt)??timeC(o.createdAt)):timeC(o[field]);const x=read(a),y=read(b);if(x===null&&y===null)return 0;if(x===null)return 1;if(y===null)return -1;return x===y?0:direction*(x-y);}
function stableCreationC(a,b){return compareTimedC(a,b,'createdAt',-1)||collatorC.compare(a.orderKey||a.path||a.file||'',b.orderKey||b.path||b.file||'');}
function sortedAssetsC(items){return [...items].sort(stableCreationC);}
function sortedLibrariesC(items){return [...items].sort(stableCreationC);}
// Reverse a copy only: source indexes remain bound to edits/deletes, even duplicates.
function sortedIconsC(lib,items){return [...items].reverse();}
function closeSortMenus(restoreFocus=false){window.AnchoredMenu.close(restoreFocus);}
function sortSelectC(kind,value,options){const current=options.find(([v])=>v===value)?.[1]||options[0]?.[1]||'';return `<div class="sort-control" data-sort-menu="${kind}"><span>排序</span><button type="button" class="sort-trigger" data-action="toggle-sort" aria-haspopup="menu" aria-expanded="false">${escC(current)} <b aria-hidden="true">${uiIconC('chevron')}</b></button><div class="sort-menu" role="menu">${options.map(([v,l])=>`<button type="button" role="menuitemradio" aria-checked="${value===v}" class="sort-option ${value===v?'active':''}" data-action="choose-sort" data-sort-kind="${kind}" data-sort-value="${v}">${value===v?'<span aria-hidden="true">✓</span>':'<span aria-hidden="true"></span>'}${escC(l)}</button>`).join('')}</div></div>`;}
/* Field picker: same sort-menu visuals, but a native select stays in the form,
   visually hidden, so existing validation and submission code is untouched. */
function fieldMenuC({name,id,value,options,placeholder='',required=false}){
  const list=options&&options.length?options:[{value:'',label:placeholder||'暂无选项'}];
  const current=list.find(o=>o.value===value)?.label||list[0]?.label||'';
  const items=list.map(o=>`<button type="button" role="menuitemradio" aria-checked="${o.value===value}" class="sort-option ${o.value===value?'active':''}" data-action="choose-field-menu" data-menu-name="${name}" data-value="${escC(o.value)}" data-label="${escC(o.label)}">${o.value===value?'<span aria-hidden="true">✓</span>':'<span aria-hidden="true"></span>'}${escC(o.label)}</button>`).join('');
  return `<div class="sort-control field-menu" data-field-menu="${name}"><button type="button" class="sort-trigger field-menu-trigger" data-action="toggle-field-menu" data-menu-name="${name}" aria-haspopup="menu" aria-expanded="false">${escC(current)} <b aria-hidden="true">${uiIconC('chevron')}</b></button><div class="sort-menu field-menu-popup" role="menu">${items}</div><select name="${name}" ${id?`id="${id}"`:''} class="field-menu-native" tabindex="-1" aria-hidden="true" ${required?'required':''}>${list.map(o=>`<option value="${escC(o.value)}" ${o.value===value?'selected':''}>${escC(o.label)}</option>`).join('')}</select></div>`;
}
function syncFieldMenuC(owner,value,label){
  if(!owner)return;
  const name=owner.dataset.fieldMenu;
  const native=owner.querySelector('select');if(native&&native.value!==value){native.value=value;}
  const text=owner.querySelector('.field-menu-trigger')?.firstChild;
  if(text&&text.nodeType===Node.TEXT_NODE)text.textContent=label;
  /* Menu is portaled to body by AnchoredMenu; query option buttons globally. */
  document.querySelectorAll(`.sort-option[data-menu-name="${CSS.escape(name)}"]`).forEach(btn=>{
    const on=btn.dataset.value===value;btn.classList.toggle('active',on);btn.setAttribute('aria-checked',String(on));
    const mark=btn.querySelector('span');if(mark){mark.textContent=on?'✓':'';}
  });
}
function imageURLC(item){const asset=item.sha?item:S.assets.find(a=>a.url===item.url);if(!asset?.sha)return item.url;try{const url=new URL(item.url);url.searchParams.set('v',asset.sha);return url.href;}catch{return item.url;}}
function coverStack(lib) { const initial=Array.from(String(lib.name ?? ''))[0]||''; return `<span class="library-row-icon" aria-hidden="true"><span class="library-initial${/^[a-z]$/.test(initial)?' library-initial-latin':''}">${escC(initial)}</span></span>`; }
function relativeTimeC(value){
  if(typeof value!=='number'||!Number.isFinite(value))return String(value??'');
  const diff=Date.now()-value;
  if(diff<60_000)return '刚刚';
  if(diff<3_600_000)return `${Math.floor(diff/60_000)} 分钟前`;
  if(diff<86_400_000)return `${Math.floor(diff/3_600_000)} 小时前`;
  const parts=time=>Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(time).map(p=>[p.type,p.value]));
  const then=parts(value),now=parts(Date.now()),yesterday=parts(Date.now()-86_400_000);
  const clock=`${then.hour}:${then.minute}`;
  if(['year','month','day'].every(k=>then[k]===yesterday[k]))return `昨天 ${clock}`;
  return then.year===now.year?`${then.month}-${then.day} ${clock}`:`${then.year}-${then.month}-${then.day}`;
}
function updateActivityTimesC(){
  document.querySelectorAll('[data-activity-time]').forEach(node=>{
    const value=Number(node.dataset.activityTime);
    if(Number.isFinite(value))node.textContent=relativeTimeC(value);
  });
}
function activityView(limit=20) { return S.activity.length?S.activity.slice(0,limit).map(a=>`<div class="activity-item"><div class="activity-line"><i class="activity-dot"></i></div><div class="activity-copy"><b>${escC(a.title)}</b><small>${escC(a.detail)} · <time${typeof a.time==='number'&&Number.isFinite(a.time)?` data-activity-time="${a.time}" datetime="${new Date(a.time).toISOString()}" title="${escC(new Date(a.time).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hourCycle:'h23'}))}（北京时间）"`:''}>${escC(relativeTimeC(a.time))}</time></small></div></div>`).join(''):emptyC('◷','暂无同步记录','读取仓库或提交操作后会显示在这里。'); }
function startActivityClockC(){
  if(window.__activityClockC)return;
  window.__activityClockC=setInterval(()=>{if(!document.hidden)updateActivityTimesC();},15_000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateActivityTimesC();});
}
startActivityClockC();
function overviewView() {
  const refs=S.libraries.reduce((n,x)=>n+(x.count||0),0);
  return `<section class="hero overview-hero" aria-labelledby="overview-hero-title"><div class="hero-content"><span class="mini-label">GITHUB RESOURCE HUB</span><h2 id="overview-hero-title">把每一张图片，变成可复用的资源。</h2><p>集中管理 GitHub 图床、图片分组与 JSON 库，复制一条直链，就能在任何项目里使用。</p><div class="hero-actions"><button type="button" class="btn btn-primary" data-action="upload"${S.connected?'':' title="请先连接仓库"'}>＋ 上传图片</button></div></div></section><div class="stat-grid">${statC('▧','图片资源',S.connected?S.assets.length:'0',S.connected?'已读取':'未连接',S.connected?`分布在 ${S.groups.length} 个分组`:'连接仓库后显示真实数据')}${statC('▦','JSON 库',S.connected?String(S.libraries.length):'0',S.connected?'已读取':'未连接',S.connected?`共 ${refs} 个图片引用`:'连接仓库后显示真实数据')}${statC('✓','仓库状态',S.connected?'正常':'未连接',S.connected?'在线':'等待连接',S.connected?'GitHub 仓库可用':'请先连接 GitHub')}${statC('↗','本次同步',S.connected?'已读取':'0',S.connected?'正常':'未连接',S.connected?'数据来自 GitHub':'连接仓库后显示同步记录')}</div><div class="dashboard-columns"><section><div class="section-row"><h3>JSON 库</h3><button class="text-link" data-view="libraries">查看全部 →</button></div><div class="card library-card">${S.libraries.length?sortedLibrariesC(S.libraries,'updated-desc').slice(0,5).map(lib=>`<div class="library-list-row" data-action="open-library" data-id="${escC(lib.id)}">${coverStack(lib)}<div class="list-info"><b>${escC(lib.name)}</b>${typeof lib.description==='string'&&lib.description.trim()?`<small>${escC(lib.description)}</small>`:''}</div><div class="list-meta"><strong>${lib.count} 个</strong><span>已读取</span></div></div>`).join(''):emptyC('▦',S.connected?'还没有 JSON 库':'尚未连接仓库',S.connected?'在当前仓库中新建 JSON 库，即可管理图片引用。':(S.connectionError||'前往仓库设置连接已有仓库；需要时也可在那里新建。'),S.connected?'new-library':'settings',S.connected?'新建 JSON 库':'前往仓库设置')}</div></section></div>`;
}
function librariesView() {
  const libraries=sortedLibrariesC(S.libraries);
  if (!S.selectedLibrary || !libraries.some(lib=>lib.id===S.selectedLibrary)) S.selectedLibrary=libraries[0]?.id||'';
  const lib=libraries.find(item=>item.id===S.selectedLibrary);
  if (!lib) return `<div class="page-heading"><div><h2>JSON 库</h2><p>在一个工作区内选择、维护 JSON 文件及其图片引用。</p></div>${S.connected?`<div class="heading-actions"><button class="btn btn-primary" data-action="new-library">＋ 新建 JSON 库</button></div>`:''}</div>${emptyC('▦',S.connected?'还没有 JSON 库':'尚未连接 GitHub',S.connected?'新建一个 JSON 库后，即可在这里管理图片引用。':'进入仓库设置后读取真实数据。',S.connected?'new-library':'settings',S.connected?'新建 JSON 库':'连接我的仓库')}`;
  const q=S.iconQuery.trim().toLowerCase(), icons=sortedIconsC(lib,(lib.icons||[]).map((item,index)=>({...item,index})).filter(item=>!q||item.name.toLowerCase().includes(q)||item.url.toLowerCase().includes(q)));
  return `<div class="page-heading json-workspace-heading"><div><p>选择当前库后，在同一工作区维护库信息与图片引用。</p></div></div><section class="card json-workspace"><div class="json-workspace-top"><div class="library-current-info"><span class="library-current-label" id="current-library-label">当前 JSON 库</span><button type="button" class="library-name-trigger library-switch-trigger" data-action="open-library-picker" aria-haspopup="dialog" aria-expanded="false" aria-label="${escC(lib.name)}，切换 JSON 库"><span class="library-logo" aria-hidden="true" style="background:${lib.gradient||'linear-gradient(135deg,#7580ff,#8c64e9)'}">${escC(Array.from(String(lib.name ?? ''))[0]||'')}</span><span class="library-current-copy"><b class="library-current-name" title="${escC(lib.name)}">${escC(lib.name)}</b>${typeof lib.description==='string'&&lib.description.trim()?`<small class="library-description">${escC(lib.description)}</small>`:''}<em title="${escC(String(lib.file ?? '').split('/').pop())}">${lib.count} 个图片引用 · ${escC(String(lib.file ?? '').split('/').pop())}</em></span><span class="library-name-chevron" aria-hidden="true">${uiIconC('chevron')}</span></button></div></div><div class="library-outside-actions"><div>${S.connected?`<button class="btn btn-primary json-workspace-create" data-action="new-library">＋ 新建 JSON 库</button>`:''}<button class="btn" data-action="edit-library" data-id="${escC(lib.id)}">编辑库信息</button><button class="btn" data-action="copy" data-copy="${escC(rawLibrary(lib))}" title="复制 JSON 直链">复制直链</button></div></div></section><div class="toolbar json-reference-toolbar"><label class="inner-search"><span>⌕</span><input data-bind="icon-search" value="${escC(S.iconQuery)}" placeholder="搜索当前库的图片名称或直链…"></label><div data-role="icons-selection-toolbar">${iconsSelectionMarkupC(icons)}</div></div><section class="json-references" aria-label="图片引用"><div class="json-reference-list">${icons.length?icons.map(icon=>`<article class="json-reference-row ${S.selectedIcons.has(icon.index)?'selected':''}" data-action="icon-open" data-index="${icon.index}"><span class="json-reference-thumb"><img src="${escC(imageURLC(icon))}" alt="${escC(icon.name)}" loading="lazy"></span><div class="json-reference-copy"><b title="${escC(icon.name)}">${escC(icon.name)}</b></div><div class="json-reference-actions"><button class="reference-select" data-action="select-icon" data-index="${icon.index}" aria-label="${S.selectedIcons.has(icon.index)?'取消选择':'选择'} ${escC(icon.name)}" title="${S.selectedIcons.has(icon.index)?'取消选择':'选择'} ${escC(icon.name)}" aria-pressed="${S.selectedIcons.has(icon.index)}">${S.selectedIcons.has(icon.index)?'✓':''}</button></div></article>`).join(''):(q?emptyC('⌕','没有匹配的图片引用','请修改或清空搜索条件。'):emptyC('▦','此JSON库暂无图片引用','选择图片资源后，可批量加入此库。')+'<div class="json-empty-navigation"><button type="button" class="btn btn-primary" data-view="assets">前往图片资源</button></div>')}</div></section>`;
}
function iconsSelectionMarkupC(icons) {
  const selected=S.selectedIcons.size, allSelected=Boolean(icons.length)&&icons.every(x=>S.selectedIcons.has(x.index));
  return `<button type="button" class="btn btn-sm" data-action="select-all-icons"${icons.length?'':' disabled'}>${allSelected?'取消全选':'全选'}</button><button type="button" class="btn btn-sm" data-action="refresh" aria-label="刷新图片引用" title="刷新图片引用">↻</button><span class="page-bulk-actions"><button type="button" class="btn btn-sm btn-danger" data-action="delete-selected-icons"${selected?'':' disabled aria-hidden="true"'} aria-label="移除已选择的 ${selected} 个引用（不会删除原图）">移除引用</button></span>`;
}
function groupView() { return S.groups.map(g=>`<button class="group-pill ${S.group===g.name?'active':''}" data-action="group" data-group="${escC(g.name)}"><b>●</b>${escC(g.name||'根目录')}<span>${g.count}</span></button>`).join(''); }
function assetView(item) { const picked=S.selected.has(item.id); return `<article class="card asset-card ${picked?'selected':''}" data-action="asset-open" data-id="${escC(item.id)}"><div class="asset-preview"><img src="${escC(imageURLC(item))}" alt="${escC(item.name)}" loading="lazy"></div><div class="asset-details"><div class="asset-name-row"><button class="asset-select" aria-label="${picked?'取消选择':'选择'} ${escC(item.name)}" title="${picked?'取消选择':'选择'} ${escC(item.name)}" aria-pressed="${picked}" data-action="asset-select" data-id="${escC(item.id)}">${picked?'✓':''}</button><b title="${escC(item.name)}" aria-label="${escC(item.name)}">${escC(item.name)}</b></div></div></article>`; }
function filteredAssets() { const q=S.assetQuery.trim().toLowerCase(); return sortedAssetsC(S.assets.filter(x=>(!S.group||x.group===S.group)&&(!q||x.name.toLowerCase().includes(q)||x.url.toLowerCase().includes(q)))); }
function renderAssetsToolbar() {
  const toolbar=$c('#app .assets-toolbar'); if(!toolbar)return;
  const list=filteredAssets(), selected=S.selected.size, allSelected=Boolean(list.length)&&list.every(x=>S.selected.has(x.id));
  toolbar.querySelector('[data-action="select-all"]')?.replaceChildren(document.createTextNode(allSelected?'取消全选':'全选'));
  const area=toolbar.querySelector('[data-role="asset-bulk-actions"]'); if(!area)return;
  area.replaceChildren();
  if(selected){ area.insertAdjacentHTML('beforeend',`<button type="button" class="btn btn-sm" data-action="bulk-move" title="移动分组" aria-label="移动已选择的 ${selected} 张图片到其他分组">移动分组</button><button class="btn btn-sm" data-action="bulk-library" aria-label="将已选择的 ${selected} 张图片加入 JSON 库">加入JSON库</button><button type="button" class="btn btn-sm btn-danger" data-action="bulk-delete">删除原图</button>`); }
}
function syncAssetSelectionUI(ids) {
  const scope=ids?new Set(ids):null;
  $c('#app')?.querySelectorAll('.asset-card').forEach(card=>{
    const id=card.dataset.id; if(scope&&!scope.has(id))return;
    const picked=S.selected.has(id), button=card.querySelector('.asset-select'), item=S.assets.find(x=>x.id===id);
    card.classList.toggle('selected',picked); if(!button)return;
    const label=`${picked?'取消选择':'选择'} ${item?.name||''}`.trim(); button.textContent=picked?'✓':''; button.setAttribute('aria-pressed',String(picked)); button.setAttribute('aria-label',label); button.title=label;
  });
  renderAssetsToolbar();
}
function visibleIcons() { const lib=S.libraries.find(x=>x.id===S.selectedLibrary), q=S.iconQuery.trim().toLowerCase(); return sortedIconsC(lib,(lib?.icons||[]).map((item,index)=>({...item,index})).filter(item=>!q||item.name.toLowerCase().includes(q)||item.url.toLowerCase().includes(q))); }
function renderIconsToolbar() {
  const area=$c('#app [data-role="icons-selection-toolbar"]'); if(!area)return;
  area.innerHTML=iconsSelectionMarkupC(visibleIcons());
}
function syncIconSelectionUI(indexes) {
  const scope=indexes?new Set(indexes.map(Number)):null;
  $c('#app')?.querySelectorAll('.json-reference-row').forEach(row=>{
    const button=row.querySelector('.reference-select'), index=Number(button?.dataset.index); if(!button||(scope&&!scope.has(index)))return;
    const picked=S.selectedIcons.has(index), name=row.querySelector('.json-reference-copy b')?.textContent||'';
    row.classList.toggle('selected',picked); button.textContent=picked?'✓':''; button.setAttribute('aria-pressed',String(picked)); button.setAttribute('aria-label',`${picked?'取消选择':'选择'} ${name}`); button.title=`${picked?'取消选择':'选择'} ${name}`;
  });
  renderIconsToolbar();
}
function assetsView() {
  const list=filteredAssets(), selected=S.selected.size;
  // Move-only mobile layout: full labels, existing 12px type / 14px padding / 44px hits.
  // Reserve a single mobile action row: toggling selection never shifts the image grid.
  return `<style data-role="move-toolbar-layout">@media(max-width:700px){body .assets-toolbar .asset-bulk-actions{grid-column:1/-1;grid-row:3;margin-left:0;justify-content:flex-start;gap:4px;height:44px;min-height:44px}body .assets-toolbar .asset-bulk-actions button{padding-inline:14px!important;flex:0 0 auto!important;min-height:44px}}</style><div class="page-heading"><div><p>按图片分组管理 GitHub 资源；点击图片可查看直链、改名或删除。</p></div>${S.connected?`<div class="heading-actions"><button class="btn" data-action="new-group">＋ 新建分组</button>${S.group?'<button class="btn" data-action="manage-group"><span class="action-icon">▣</span> 管理分组</button>':''}<button class="btn btn-primary" data-action="upload">↑ 上传图片</button></div>`:''}</div><div class="asset-groups">${groupView()}</div><div class="toolbar assets-toolbar"><label class="inner-search"><span>⌕</span><input data-bind="asset-search" value="${escC(S.assetQuery)}" placeholder="搜索图片名称或直链…"></label><button class="btn btn-sm" data-action="select-all">${list.length&&list.every(x=>S.selected.has(x.id))?'取消全选':'全选'}</button><span class="toolbar-spacer"></span><span class="asset-bulk-actions" data-role="asset-bulk-actions">${selected?`<button type="button" class="btn btn-sm" data-action="bulk-move" title="移动分组" aria-label="移动已选择的 ${selected} 张图片到其他分组">移动分组</button><button class="btn btn-sm" data-action="bulk-library" aria-label="将已选择的 ${selected} 张图片加入 JSON 库">加入JSON库</button><button type="button" class="btn btn-sm btn-danger" data-action="bulk-delete">删除原图</button>`:''}</span><button class="btn btn-sm" data-action="refresh" aria-label="刷新图片资源" title="刷新图片资源">↻</button></div>${list.length?`<div class="asset-grid">${list.map(assetView).join('')}</div>`:emptyC('▧',S.assetQuery.trim()?'没有匹配的图片':S.connected?'这个分组还没有图片':'尚未连接 GitHub',S.assetQuery.trim()?'请修改或清空搜索条件。':S.connected?'仓库中没有符合条件的图片。':'进入仓库设置后读取你的真实图片资源。',S.assetQuery.trim()?'':S.connected?'upload':'settings',S.connected?'上传第一张图片':'连接我的仓库')}`;
}
function detailView() {
  const lib=S.libraries.find(x=>x.id===S.selectedLibrary); if(!lib) return emptyC('▦','找不到 JSON 库','请刷新仓库数据。','refresh','刷新');
  const q=S.iconQuery.trim().toLowerCase(), icons=sortedIconsC(lib,(lib.icons||[]).map((x,i)=>({...x,index:i})).filter(x=>!q||x.name.toLowerCase().includes(q)||x.url.toLowerCase().includes(q)));
  return `<div class="page-heading"><div><h2 style="margin-top:10px">${escC(lib.name)}</h2><p>${escC(lib.description||'')} · ${escC(lib.file)}</p></div><div class="heading-actions"><button class="btn" data-action="copy" data-copy="${escC(rawLibrary(lib))}">⧉ 复制 JSON 直链</button><button class="btn btn-primary" data-action="new-icon">＋ 添加图片</button><button class="btn btn-danger" data-action="delete-library" data-id="${escC(lib.id)}">删除</button></div></div><div class="card detail-header"><div class="library-logo" style="background:${lib.gradient||'linear-gradient(135deg,#7580ff,#8c64e9)'}">${escC(Array.from(String(lib.name ?? ''))[0]||'')}</div><div><h2>${escC(lib.name)}</h2><p>文件：${escC(lib.file)} · ${lib.count} 个图片引用</p></div></div><div class="toolbar"><label class="inner-search"><span>⌕</span><input data-bind="icon-search" value="${escC(S.iconQuery)}" placeholder="搜索名称或直链…"></label><span class="toolbar-spacer"></span><button class="btn btn-sm" data-action="refresh">↻ 刷新</button></div><div class="card table-card"><div class="table-head"><span></span><span>图片名称</span><span>图片直链</span><span>状态</span><span></span></div>${icons.length?icons.map(icon=>`<div class="table-row"><span class="table-icon"><img src="${escC(imageURLC(icon))}" alt=""></span><span class="table-name"><b>${escC(icon.name)}</b><small>JSON 引用</small></span><span class="table-url" title="${escC(icon.url)}">${escC(icon.url)}</span><span class="table-date"></span><span class="row-actions"><button class="icon-btn" data-action="copy" data-copy="${escC(icon.url)}">⧉</button><button class="icon-btn" data-action="edit-icon" data-index="${icon.index}">✎</button><button class="icon-btn" data-action="delete-icon" data-index="${icon.index}">×</button></span></div>`).join(''):emptyC('▦','这个 JSON 还没有图片引用','可以从图片资源中上传并加入，或添加一个已有 Raw 直链。')}</div>`;
}
function activityPage() { return `<div class="page-heading"><div><h2>同步记录</h2><p>当前会话内的读取与写入记录。</p></div></div><div class="card activity-card" style="padding:25px 28px">${activityView(50)}</div>`; }
function compatibleRepos() { const ids=new Set((S.projectCandidates||[]).map(r=>`${r.owner}/${r.repo}`.toLowerCase())); const current=S.repo.owner&&S.repo.repo?`${S.repo.owner}/${S.repo.repo}`.toLowerCase():''; if(current)ids.add(current); const repos=S.repos.filter(r=>ids.has(`${r.owner.login}/${r.name}`.toLowerCase())); if(current&&!repos.some(r=>`${r.owner.login}/${r.name}`.toLowerCase()===current))repos.unshift({owner:{login:S.repo.owner},name:S.repo.repo,default_branch:S.repo.branch||'main'}); return repos; }
async function refreshRepositoryChoicesC() {
  const auth=S.auth, client=currentClient();
  try {
    const repos=await client.listRepos();
    const candidates=await client.findProjectRepositories(repos);
    if(S.auth!==auth)return;
    // Commit the discovery together; a failed scan keeps existing choices and connection.
    S.repos=repos; S.projectCandidates=candidates;
    if(S.view==='settings')renderC();
  } catch { /* Discovery is optional: preserve the current repository and cached choices. */ }
}
function settingsPage() { return `<div class="page-heading"><div><p>仓库选择仅保存在当前浏览器。</p></div><div class="heading-actions"><span class="connection-badge"><i class="status-dot"></i>${S.connected?'已读取':'未读取'}</span></div></div><div class="settings-grid"><div class="card settings-card"><h3>GitHub 仓库</h3><p>登录后会自动检测你有权限访问的图床仓库；你可以从这里选择已有仓库，也可以创建公开仓库。</p>${compatibleRepos().length?`<div class="repo-quick-list">${compatibleRepos().slice(0,8).map(r=>`<button type="button" class="repo-quick ${S.repo.repo===r.name?'active':''}" data-action="use-repo" data-owner="${escC(r.owner.login)}" data-repo="${escC(r.name)}" data-branch="${escC(r.default_branch||'main')}">${escC(r.owner.login)}/${escC(r.name)}</button>`).join('')}</div>`:''}<button type="button" class="btn btn-sm" data-action="create-repo">＋ 在当前账号创建仓库</button>${S.repo.repo?'<button type="button" class="btn btn-sm" data-action="rename-repo">改名</button><button type="button" class="btn btn-sm btn-danger" data-action="delete-repo">删除仓库</button>':''}<form id="repoForm"><div class="form-grid"><div class="form-field"><label>仓库用户名</label><input name="owner" value="${escC(S.repo.owner||S.auth?.login||'')}" placeholder="GitHub 用户名" required></div><div class="form-field"><label>仓库名称</label><input name="repo" value="${escC(S.repo.repo)}" placeholder="仓库名称" required></div><div class="form-field"><label>分支名称</label><input name="branch" value="${escC(S.repo.branch||'main')}" placeholder="main"></div><div class="form-field"><label>图片目录</label><input name="assetsPath" value="${escC(S.repo.assetsPath||'assets')}" placeholder="assets"></div></div><div class="settings-actions"><button type="button" class="btn" data-action="logout">退出 GitHub</button><button type="submit" class="btn btn-primary">保存并读取仓库</button></div></form></div><div class="card settings-card"><h3>登录身份</h3><p>当前 GitHub 身份与 Token 会话信息。</p><div class="account-panel"><div class="user-avatar" data-account-avatar>${escC((S.auth?.login||'G').slice(0,1).toUpperCase())}</div><div><b data-account-name>${escC(S.auth?.login||'GitHub 用户')}</b><small>Token 内存会话</small></div></div><div class="info-list"><div class="info-row"><span>当前资源仓库</span><b>${escC(S.repo.owner&&S.repo.repo?`${S.repo.owner}/${S.repo.repo}`:'未配置')}</b></div>${S.repo.owner&&S.repo.repo?`<button type="button" class="btn btn-sm" data-action="open-repo">打开图片资源仓库 ↗</button>`:''}<div class="info-row"><span>分支</span><b>${escC(S.repo.branch||'main')}</b></div><div class="info-row"><span>图片目录</span><b>${escC(S.repo.assetsPath||'assets')}</b></div><div class="info-row"><span>授权方式</span><b style="color:#4aac7f">经典 Token</b></div></div><div class="security-note">Token 只在服务器内存会话中使用；“记住此设备”仅保存在当前浏览器本地。</div></div></div>`; }
async function loadAdminPolicy() { if (!S.isAdmin) return; try { const response=await fetch('/api/admin/policy',{credentials:'include'}); if(response.ok){ const data=await response.json(); S.allowAll=Boolean(data.allowAll); S.allowedUsers=Array.isArray(data.allowed)?data.allowed:[]; } } catch { /* policy panel can show defaults */ } }
async function saveAdminPolicy(form) { const data=new FormData(form), allowed=String(data.get('allowed')||'').split(',').map(value=>value.trim().toLowerCase()).filter(Boolean); const response=await fetch('/api/admin/policy',{method:'PUT',credentials:'include',headers:{'Content-Type':'application/json','X-CSRF-Token':S.csrf},body:JSON.stringify({allowAll:data.get('allowAll')==='on',allowed})}); const result=await response.json().catch(()=>({})); if(!response.ok) throw new Error(result.message||'访问策略保存失败'); S.allowAll=Boolean(result.allowAll); S.allowedUsers=result.allowed||[]; renderC(); notify('访问策略已保存'); }
function adminPage() {
  if (!S.adminConfigured) return `<div class="page-heading"><div><p>用于控制 GitHub 用户访问权限。</p></div></div><div class="card settings-card"><h3>未设置管理员</h3><p>请在 VPS 环境变量中设置 ADMIN_GITHUB_LOGIN。</p><pre class="admin-code">ADMIN_GITHUB_LOGIN=your-github-login</pre></div>`;
  if (!S.isAdmin) return `<div class="page-heading"><div><p>当前账号没有管理员权限。</p></div></div>${emptyC('♙','无权访问','只有管理员可以管理网站用户。')}`;
  return `<div class="page-heading"><div><p>控制哪些 GitHub 用户可以使用网站。</p></div><div class="heading-actions"><span class="connection-badge"><i class="status-dot"></i>管理员</span></div></div><div class="card settings-card"><form id="adminPolicyForm"><h3>访问策略</h3><p>允许所有人时，任何 GitHub 登录用户都可以使用；关闭后只允许名单和管理员。</p><label class="policy-toggle"><input type="checkbox" name="allowAll" ${S.allowAll?'checked':''}> 允许所有 GitHub 用户</label><div class="modal-field" style="margin-top:18px"><label>允许名单（GitHub 用户名）</label><input name="allowed" value="${escC(S.allowedUsers.join(','))}" placeholder="例如：user1,user2"></div><p class="field-help">填写 GitHub 用户名（如 octocat），不是昵称、邮箱或 Token；多个用户名用英文逗号分隔。已有名单中的管理员仍会显示在名单中；管理员身份权限独立授予，移除名单不会取消管理员权限。</p><div class="settings-actions"><button type="submit" class="btn btn-primary">保存访问策略</button></div></form></div>`;
}

function renderC() {
  // Retired navigation: stale history or legacy entries return to the overview.
  if(S.view==='activity') S.view='overview';
  closeSortMenus();
  document.body.classList.toggle('auth-screen', !S.auth);
  if (!S.auth) { $c('#app').innerHTML=loginView(); applyAppearance(); return; }
  if(S.view==='library-detail') S.view='libraries';
  const views={overview:overviewView,libraries:librariesView,assets:assetsView,settings:settingsPage,admin:adminPage};
  $c('#app').innerHTML=(views[S.view]||overviewView)(); setMetaC();
  applyAppearance();
  restoreSubmissionC();
}
function openC(html) { resetLibraryPickerC(false); disposeImageSaveC(); closeSortMenus(); $c('#modalRoot').innerHTML=`<div class="modal-backdrop" data-action="modal-backdrop"><div class="modal">${html}</div></div>`; }
function closeC() { resetLibraryPickerC(true); disposeImageSaveC(); closeSortMenus(); S.modalConfirm=null; if($c('#groupCreateForm')&&S.uploadDraft){const draft=S.uploadDraft;S.uploadDraft=null;uploadModal(draft);return;} S.uploadDraft=null; $c('#modalRoot').innerHTML=''; }
function confirmC(title,message,run,label='永久删除') { S.modalConfirm=run; openC(`<div class="modal-head"><div><h2>${escC(title)}</h2><p>${escC(message)}</p></div><button class="modal-close" data-action="close-modal">×</button></div><div class="modal-body"><p class="field-help">此操作不可恢复，请确认后继续。</p></div><div class="modal-actions"><button type="button" class="btn" data-action="close-modal">取消</button><button type="button" class="btn btn-danger" data-action="confirm-exec">${escC(label)}</button></div>`); }
function confirmRepositoryDeletion() {
  const fullName=`${S.repo.owner}/${S.repo.repo}`, client=currentClient();
  confirmC('永久删除仓库',`此操作将删除 ${fullName} 及其中全部内容。`,async()=>{
    if($c('#repo-delete-confirm')?.value!==fullName) return;
    if(`${S.repo.owner}/${S.repo.repo}`!==fullName) throw new Error('当前仓库已改变，请重新确认。');
    await client.deleteRepository(); S.connected=false; S.groups=[]; S.assets=[]; S.libraries=[];
    S.repo={owner:S.auth?.login||'',repo:'',branch:'main',assetsPath:'assets'};
    localStorage.removeItem('gh-image-repo'); S.view='overview'; closeC(); renderC(); notify('仓库已删除');
  },'永久删除仓库');
  const body=$c('#modalRoot .modal-body'), button=$c('#modalRoot [data-action="confirm-exec"]');
  body.insertAdjacentHTML('beforeend',`<div class="modal-field"><label for="repo-delete-confirm">请输入 <strong>${escC(fullName)}</strong> 以确认删除</label><input id="repo-delete-confirm" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" aria-label="输入完整仓库名确认删除"></div>`);
  const input=$c('#repo-delete-confirm'); button.disabled=true;
  input.addEventListener('input',()=>{button.disabled=input.value!==fullName||!S.modalConfirm;});
}
function nameModal(kind,title,value,description) { openC(`<div class="modal-head"><div><h2>${escC(title)}</h2><p>${escC(description)}</p></div><button class="modal-close" data-action="close-modal">×</button></div><form id="${kind}Form"><div class="modal-body"><div class="modal-field"><label>名称</label><input name="name" value="${escC(value)}" placeholder="new-group" required${finePointerC()?' autofocus':''}></div></div><div class="modal-actions"><button type="button" class="btn" data-action="close-modal">取消</button><button type="submit" class="btn btn-primary">保存</button></div></form>`); if(finePointerC()) setTimeout(()=>$c(`#${kind}Form input`)?.select(),0); }
function groupModal(fromUpload=false) { const draft=fromUpload?captureUploadDraft():null; nameModal('groupCreate','新建图片分组','','分组会作为目录创建在 GitHub 图床仓库中。'); S.uploadDraft=draft; }
function manageGroupModal() { if(!S.group)return; openC(`<div class="modal-head"><div><h2>管理分组</h2><p>重命名会同步移动该分组内的图片。</p></div><button class="modal-close" data-action="close-modal">×</button></div><form id="groupManageForm"><div class="modal-body"><div class="modal-field group-name-field"><div class="group-name-label"><label for="group-name-input">分组名称</label><button type="button" class="text-link group-delete-link" data-action="confirm-delete-group" data-group="${escC(S.group)}">删除分组</button></div><input id="group-name-input" name="name" value="${escC(S.group)}" required${finePointerC()?' autofocus':''}></div></div><div class="modal-actions"><button type="button" class="btn" data-action="close-modal">取消</button><button type="submit" class="btn btn-primary">保存改名</button></div></form>`); }
function captureUploadDraft() { const f=$c('#uploadForm'); if(!f)return S.uploadDraft; return {file:f.uploadFile||f.elements.file.files[0]||null,name:f.elements.name.value,group:f.elements.group.value,library:f.elements.library.value}; }

function uploadModal(draft=S.uploadDraft) { const uploadGroups=[...new Set([...S.groups.map(g=>g.name),...S.assets.map(a=>a.group).filter(Boolean)])].sort(); const defaultGroup=draft?.group&&uploadGroups.includes(draft.group)?draft.group:(S.group&&uploadGroups.includes(S.group)?S.group:(uploadGroups[0]||'')); openC(`<div class="modal-head"><div><h2>上传图片资源</h2><p>上传会作为一次 Git 提交写入当前仓库，可同时加入 JSON 库。</p></div><button class="modal-close" data-action="close-modal">×</button></div><form id="uploadForm"><div class="modal-body"><label class="drop-zone" id="dropZone"><div class="drop-icon">⇧</div><strong>点击选择或拖入图片</strong><small>支持 PNG、JPG、WEBP、GIF、SVG 等图片格式</small><input name="file" id="fileInput" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" hidden></label><div class="preview-file" id="filePreview"><span class="upload-preview-plate"><img id="fileThumb" alt=""></span><span id="fileName"></span><button type="button" class="preview-clear" data-action="clear-upload-file" aria-label="清除已选择的图片">×</button></div><div class="modal-field"><label>图片名称</label><input name="name" id="uploadName" value="${escC(draft?.name||'')}" placeholder="例如：netflix" required></div><div class="modal-field"><label>图片分组</label>${fieldMenuC({name:'group',id:'uploadGroup',value:defaultGroup,options:uploadGroups.map(g=>({value:g,label:g})),placeholder:'暂无分组，请先到图片资源页面新建'})}</div><div class="modal-field"><label>上传后加入 JSON 库（可选）</label>${fieldMenuC({name:'library',value:draft?.library||'',options:[{value:'',label:'暂不加入'},...S.libraries.map(l=>({value:l.file,label:l.name}))]})}</div></div><div class="modal-actions"><button type="button" class="btn" data-action="close-modal">取消</button><button class="btn btn-primary" type="submit">上传并提交</button></div></form>`); const input=$c('#fileInput'), zone=$c('#dropZone'); let previewVersion=0; const show=file=>{if(!file)return; const version=++previewVersion, label=$c('#fileName'), thumb=$c('#fileThumb'); const info=`${file.name} · ${(file.size/1024).toFixed(1)} KB`; label.textContent=`已选择：${info}`; $c('#filePreview').classList.add('show'); thumb.removeAttribute('src'); thumb.hidden=true; const imageType=file.type.startsWith('image/')||/\.(png|jpe?g|webp|gif|svg)$/i.test(file.name); if(imageType){ const reader=new FileReader(); reader.onload=()=>{if(version!==previewVersion)return; thumb.onload=()=>{thumb.hidden=false;}; thumb.onerror=()=>{thumb.hidden=true;label.textContent=`已选择：${info}（预览失败，请更换图片）`;}; thumb.src=String(reader.result);}; reader.onerror=()=>{if(version===previewVersion)label.textContent=`已选择：${info}（文件读取失败）`;}; reader.readAsDataURL(file); } else label.textContent=`已选择：${info}（暂不支持此格式）`; if(!$c('#uploadName').value)$c('#uploadName').value=file.name.replace(/\.[^.]+$/,'').replace(/[^\w-]+/g,'-').toLowerCase();}; input.addEventListener('change',()=>show(input.files[0])); $c('#filePreview').addEventListener('click',e=>{if(!e.target.closest('[data-action="clear-upload-file"]'))return; previewVersion++; input.value=''; const preview=$c('#filePreview'), thumb=$c('#fileThumb'), label=$c('#fileName'); thumb.removeAttribute('src'); thumb.hidden=true; label.textContent=''; preview.classList.remove('show');}); ['dragenter','dragover'].forEach(t=>zone.addEventListener(t,e=>{e.preventDefault();zone.classList.add('dragging');})); ['dragleave','drop'].forEach(t=>zone.addEventListener(t,e=>{e.preventDefault();zone.classList.remove('dragging');})); zone.addEventListener('drop',e=>{if(e.dataTransfer.files[0]){input.files=e.dataTransfer.files;show(input.files[0]);}}); if(draft?.file){try{const dt=new DataTransfer();dt.items.add(draft.file);input.files=dt.files;show(draft.file);}catch{notify('已保留图片名称和设置，请重新选择图片文件。','error');}} }
let libraryPickerTriggerC=null;
function resetLibraryPickerC(restoreFocus) {
 const trigger=libraryPickerTriggerC; libraryPickerTriggerC=null;
 if(!trigger)return;
 trigger.setAttribute('aria-expanded','false'); trigger.removeAttribute('aria-controls');
 if(restoreFocus&&trigger.isConnected)trigger.focus({preventScroll:true});
}
function libraryPickerModal() {
 openC(`<div class="modal-head"><div><h2>切换 JSON 库</h2></div><button type="button" class="modal-close" data-action="close-modal" aria-label="关闭切换库">×</button></div><div class="modal-body library-switch-modal-body"><div class="library-switch-list">${sortedLibrariesC(S.libraries).map(lib=>`<div class="library-switch-row"><button type="button" class="library-switch-option" data-action="select-library" data-id="${escC(lib.id)}" aria-checked="${lib.id===S.selectedLibrary}"><span class="library-switch-check" ${lib.id===S.selectedLibrary?'role="img" aria-label="当前库"':'aria-hidden="true"'}>${lib.id===S.selectedLibrary?'✓':''}</span><span class="library-switch-copy"><b>${escC(lib.name)}</b>${typeof lib.description==='string'&&lib.description.trim()?`<small class="library-description">${escC(lib.description)}</small>`:''}<small class="library-switch-meta">${lib.count} 个图片引用 · ${escC(String(lib.file ?? '').split('/').pop())}</small></span></button><button type="button" class="library-switch-delete ui-button" data-ui="secondary" data-action="delete-library" data-id="${escC(lib.id)}" aria-label="删除JSON库${escC(lib.name)}">删除</button></div>`).join('')}</div><button type="button" class="library-picker-create" data-action="new-library">＋ 新建 JSON 库</button></div>`);
 const trigger=$c('.library-name-trigger'), modal=$c('#modalRoot .modal');
 if(trigger&&modal){
  libraryPickerTriggerC=trigger; trigger.setAttribute('aria-expanded','true');trigger.setAttribute('aria-controls','library-picker-dialog');
  modal.id='library-picker-dialog';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','切换 JSON 库');
  (modal.querySelector('[aria-checked="true"]')||modal.querySelector('button'))?.focus({preventScroll:true});
  modal.addEventListener('keydown',e=>{
   if(e.key!=='Tab')return;
   const items=[...modal.querySelectorAll('button:not(:disabled)')],first=items[0],last=items[items.length-1];
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
  });
 }
}
function libraryModal(edit=false) { S.editingLibrary=edit?S.selectedLibrary:null; const lib=edit?S.libraries.find(x=>x.id===S.selectedLibrary):null; openC(`<div class="modal-head"><div><h2>${edit?'编辑 JSON 库':'新建 JSON 库'}</h2><p>${edit?'修改名称、说明或移动 JSON 文件。':'会在仓库中创建一个带 icons 数组的 JSON 文件。'}</p></div><button class="modal-close" data-action="close-modal">×</button></div><form id="libraryForm"><div class="modal-body"><div class="modal-field"><label>JSON 库名称</label><input name="name" value="${escC(lib?.name||'')}" placeholder="例如：emby图标库" required></div><div class="modal-field"><label>JSON 库说明</label><input name="description" value="${escC(lib?.description||'')}" placeholder="可选，填写这个库的用途"></div><div class="modal-field"><label>JSON 文件名</label><input name="path" value="${escC(edit?lib?.file?.split('/').pop()?.replace(/\.json$/i,'')||'':'')}" placeholder="例如：emby-icon" required><small class="field-help">文件名不需要填写 .json 后缀，系统会自动补全。</small></div></div><div class="modal-actions"><button type="button" class="btn" data-action="close-modal">取消</button><button type="submit" class="btn btn-primary">${edit?'保存修改':'创建 JSON 库'}</button></div></form>`); }
function createRepoModal() { openC(`<div class="modal-head"><div><h2>创建 GitHub 仓库</h2><p>将在当前 GitHub 账号下创建一个公开仓库。</p></div><button class="modal-close" data-action="close-modal">×</button></div><form id="createRepoForm"><div class="modal-body"><div class="modal-field"><label>仓库名称</label><input name="name" placeholder="例如：my-image-host" required></div><div class="modal-field"><label>仓库说明</label><input name="description" placeholder="可选"></div><p class="field-help">创建后网站会自动把它设为当前图床仓库，并读取真实内容。</p></div><div class="modal-actions"><button type="button" class="btn" data-action="close-modal">取消</button><button type="submit" class="btn btn-primary">创建并使用</button></div></form>`); }
function editIconModal(index) { const lib=S.libraries.find(x=>x.id===S.selectedLibrary), icon=lib?.icons?.[index]; if(!lib||!icon)return; openC(`<div class="modal-head"><div><h2>编辑图片引用</h2><p>修改会更新 ${escC(lib.file)}，不会删除图片文件。</p></div><button class="modal-close" data-action="close-modal">×</button></div><form id="iconForm"><input type="hidden" name="index" value="${index}"><div class="modal-body"><div class="modal-field"><label>图片名称</label><input name="name" value="${escC(icon.name)}" required></div><div class="modal-field"><label>GitHub Raw 图片直链</label><input name="url" value="${escC(icon.url)}" required></div></div><div class="modal-actions"><button type="button" class="btn" data-action="close-modal">取消</button><button class="btn btn-primary" type="submit">保存引用</button></div></form>`); }
// Detail-only original-file saving. Never route downloads through the API or a canvas.
let imageSaveC=null;
const IMAGE_SAVE_LIMIT_C=32*1024*1024;
function safeImageURLC(value) {
  try { const u=new URL(value); return /^https?:$/.test(u.protocol)&&!u.username&&!u.password?u.href:''; } catch { return ''; }
}
function detailLinkC(url,label=url) {
  const safe=safeImageURLC(url);
  return safe?`<a class="detail-link" href="${escC(safe)}" target="_blank" rel="noopener noreferrer">${escC(label)}</a>`:escC(label);
}
function detailRepositoryC(item) {
  // A JSON label/path is not proof of ownership: match the URL against loaded assets.
  const url=safeImageURLC(item.url), {owner,repo,branch}=S.repo;
  if(!url||!owner||!repo||!branch)return '';
  const encode=v=>encodeURIComponent(v);
  const asset=S.assets.find(a=>{
    if(!a.path||a.path.split('/').some(p=>!p||p==='.'||p==='..'))return false;
    const raw=`https://raw.githubusercontent.com/${encode(owner)}/${encode(repo)}/${encode(branch)}/${a.path.split('/').map(encode).join('/')}`;
    return safeImageURLC(raw)===url;
  });
  if(!asset)return '';
  const href=`https://github.com/${encode(owner)}/${encode(repo)}/blob/${encode(branch)}/${asset.path.split('/').map(encode).join('/')}`;
  return `<div class="detail-readonly"><b>仓库路径</b><p>${detailLinkC(href,asset.path)}</p></div>`;
}
function imageSaveMarkupC() {
  return `<div class="detail-readonly image-save-note" hidden><p data-image-save-status role="status" aria-live="polite"></p></div>`;
}
function imageSaveStatusC(state,text) {
  if(imageSaveC!==state)return;
  const note=$c('#modalRoot .image-save-note'),status=$c('#modalRoot [data-image-save-status]');
  if(note)note.hidden=!text;
  if(status)status.textContent=text;
}
function disposeImageSaveC() {
  const state=imageSaveC;if(!state)return;
  imageSaveC=null;state.controller.abort();clearTimeout(state.timer);
  if(state.objectURL)URL.revokeObjectURL(state.objectURL);
  clearTimeout(state.revokeTimer);state.blob=null;state.file=null;
}
function originalFileC(blob,item) {
  const types={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp',svg:'image/svg+xml',avif:'image/avif',apng:'image/apng',ico:'image/x-icon',bmp:'image/bmp',tif:'image/tiff',tiff:'image/tiff',heic:'image/heic',heif:'image/heif'};
  let leaf='';try{leaf=decodeURIComponent(new URL(item.url).pathname.split('/').pop());}catch{}
  const ext=leaf.match(/\.([a-z0-9]+)$/i)?.[1].toLowerCase();
  const mime=blob.type.split(';')[0].trim().toLowerCase();
  // Generic Raw responses may use an extension; never mislabel an HTML/error response as an image.
  const type=mime.startsWith('image/')?mime:(!mime||mime==='application/octet-stream'||mime==='text/plain')?types[ext]:'';
  if(!type)throw new Error('原图响应不是可识别的图片文件');
  let name=leaf||String(item.name||'image');
  name=name.replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069/\\:*?"<>|]/g,'_').replace(/^\.+|[. ]+$/g,'')||'image';
  // Bound UTF-8 filename bytes, not UTF-16 units (Chinese/emoji can exceed filesystem limits).
  const suffix=name.match(/\.[a-z0-9]{1,10}$/i)?.[0]||'';
  const stem=suffix?name.slice(0,-suffix.length):name;
  let bounded='';for(const char of stem){if(new Blob([bounded+char]).size>180)break;bounded+=char;}
  name=(bounded||'image')+suffix;
  if(/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name))name='_'+name;
  const preferred=Object.keys(types).find(e=>types[e]===type);
  const current=name.match(/\.([a-z0-9]+)$/i)?.[1].toLowerCase();
  if(preferred&&types[current]!==type)name=name.replace(/\.[a-z0-9]{1,10}$/i,'')+'.'+preferred;
  const exact=blob.slice(0,blob.size,type);
  return {blob:exact,name,file:typeof File==='function'?new File([exact],name,{type}):null};
}
async function readOriginalC(response,signal) {
  if(!response.ok)throw new Error(`原图请求失败（HTTP ${response.status}）`);
  if(Number(response.headers.get('content-length'))>IMAGE_SAVE_LIMIT_C)throw new Error('原图超过 32 MB，请打开原图保存');
  // Streaming enforces the limit even when Content-Length is absent or inaccurate.
  if(!response.body?.getReader)throw new Error('浏览器不支持限量读取，请打开原图保存');
  const reader=response.body.getReader(), chunks=[];let size=0;
  try {
    while(true){
      if(signal.aborted)throw new DOMException('Aborted','AbortError');
      const {done,value}=await reader.read();if(done)break;
      size+=value.byteLength;if(size>IMAGE_SAVE_LIMIT_C)throw new Error('原图超过 32 MB，请打开原图保存');
      chunks.push(value);
    }
    if(!size)throw new Error('原图响应为空');
    return new Blob(chunks,{type:response.headers.get('content-type')||''});
  } finally { try{await reader.cancel();}catch{} reader.releaseLock(); }
}
function prepareImageSaveC(item) {
  disposeImageSaveC();
  const state=imageSaveC={url:safeImageURLC(item.url),controller:new AbortController(),phase:'loading',busy:false};
  if(!state.url){state.phase='failed';imageSaveStatusC(state,'链接不是安全的 HTTP(S) 地址，无法保存。');return;}
  if(new URL(state.url).origin!=='https://raw.githubusercontent.com'){state.phase='failed';imageSaveStatusC(state,'此外部来源不支持直接读取原图，请使用“打开原图”保存。');return;}
  state.timer=setTimeout(()=>{state.timedOut=true;state.controller.abort();},20000);
  state.ready=(async()=>{
    try {
      const response=await fetch(state.url,{mode:'cors',credentials:'omit',referrerPolicy:'no-referrer',signal:state.controller.signal});
      const blob=await readOriginalC(response,state.controller.signal);
      if(imageSaveC!==state)return;
      Object.assign(state,originalFileC(blob,item));state.phase='ready';
      imageSaveStatusC(state,'');
    } catch(error) {
      if(imageSaveC!==state)return;
      state.controller.abort();state.phase='failed';
      if(error.name==='AbortError'&&!state.timedOut){imageSaveStatusC(state,'');return;}
      imageSaveStatusC(state,state.timedOut?'原图读取超时，请打开原图保存。':`无法读取原图（网络、跨域限制或文件响应异常）：${error.message||'请求失败'}。请打开原图保存。`);
    } finally {clearTimeout(state.timer);}
  })();
}
function downloadOriginalC(state) {
  if(imageSaveC!==state||!state.blob)return;
  if(state.objectURL)URL.revokeObjectURL(state.objectURL);clearTimeout(state.revokeTimer);
  state.objectURL=URL.createObjectURL(state.blob);
  const link=document.createElement('a');link.href=state.objectURL;link.download=state.name;link.hidden=true;
  document.body.appendChild(link);try{link.click();}finally{link.remove();}
  state.revokeTimer=setTimeout(()=>{if(state.objectURL)URL.revokeObjectURL(state.objectURL);state.objectURL='';},60000);
  imageSaveStatusC(state,'已发起原图下载；是否保存成功请查看浏览器下载记录。');
}
async function saveOriginalC(button) {
  const state=imageSaveC;if(!state||state.busy)return;
  if(state.phase==='loading'){imageSaveStatusC(state,'原图仍在准备中，就绪后请再次点击“保存图片”。');return;}
  if(state.phase!=='ready')return;
  state.busy=true;button.disabled=true;button.dataset.busy='1';button.setAttribute('aria-busy','true');
  try {
    let share=false;try{share=!!(state.file&&navigator.share&&navigator.canShare?.({files:[state.file]}));}catch{}
    if(share&&!state.downloadOnly){
      // No await before share: this call stays within the current button activation.
      try {await navigator.share({files:[state.file]});imageSaveStatusC(state,'系统分享已结束；请在目标应用或下载记录中确认保存结果。');}
      catch(error){
        if(error.name==='AbortError')return;
        state.downloadOnly=true;
        imageSaveStatusC(state,'系统未能分享此文件。请再次点击“保存图片”发起原图下载，或打开原图保存。');
      }
    } else downloadOriginalC(state);
  } catch {imageSaveStatusC(state,'未能发起原图下载，请打开原图保存。');}
  finally {state.busy=false;button.disabled=false;delete button.dataset.busy;button.removeAttribute('aria-busy');}
}
// End detail-only saving helpers.
function assetModal(item) { openC(`<div class="modal-head"><div><h2>${escC(item.name)}</h2><p>${escC(item.group||'根目录')} 分组 · ${escC(item.ext)} 图片资源</p></div><button class="modal-close" data-action="close-modal">×</button></div><div class="modal-body"><div class="asset-detail-preview"><img src="${escC(imageURLC(item))}" alt="${escC(item.name)}"></div><div class="detail-readonly"><b>GitHub Raw 直链</b><p class="detail-url">${detailLinkC(item.url)}</p></div>${detailRepositoryC(item)}${imageSaveMarkupC(item)}</div><div class="modal-actions asset-detail-actions"><button class="btn" data-action="copy" data-copy="${escC(item.url)}">⧉ 复制直链</button><button type="button" class="btn" data-action="save-original">保存图片</button><button class="btn btn-primary" data-action="asset-library" data-id="${escC(item.id)}">加入 JSON 库</button><button class="btn" data-action="move-asset" data-id="${escC(item.id)}">移动分组</button><button class="btn" data-action="rename-asset" data-id="${escC(item.id)}">改名并同步引用</button><button class="btn btn-danger" data-action="delete-asset" data-id="${escC(item.id)}">删除图片</button></div>`); prepareImageSaveC(item); }
function iconModal(icon) { openC(`<div class="modal-head"><div><h2>${escC(icon.name)}</h2><p>JSON 图片引用详情</p></div><button class="modal-close" data-action="close-modal">×</button></div><div class="modal-body"><div class="json-icon-detail-preview"><img src="${escC(imageURLC(icon))}" alt="${escC(icon.name)}"></div><div class="detail-readonly"><b>GitHub Raw 直链</b><p class="detail-url">${detailLinkC(icon.url)}</p></div>${detailRepositoryC(icon)}${imageSaveMarkupC(icon)}</div><div class="modal-actions icon-detail-actions"><button class="btn" data-action="copy" data-copy="${escC(icon.url)}">⧉ 复制直链</button><button type="button" class="btn" data-action="save-original">保存图片</button><button class="btn btn-danger" data-action="delete-icon" data-index="${icon.index}">删除引用</button></div>`); prepareImageSaveC(icon); }
// Begin image-group move UI (no JSON-page entry).
function moveModal(item=null) {
  if(!S.auth||!S.connected)return notify('请先登录并连接仓库','error');
  const items=item?[item]:S.assets.filter(x=>S.selected.has(x.id));
  if(!items.length)return notify('请先选择图片','error');
  const groups=S.groups.filter(g=>g.name);
  const initial=groups.find(g=>items.some(i=>i.group!==g.name))?.name||groups[0]?.name||'';
  openC(`<div class="modal-head"><div><h2>移动分组</h2><p>已选择 ${items.length} 张图片</p></div><button class="modal-close" data-action="close-modal" aria-label="关闭移动分组">×</button></div><form id="moveForm"><div class="modal-body">${groups.length?`<div class="modal-field"><label id="moveGroupLabel">目标分组</label>${fieldMenuC({name:'moveGroup',value:initial,options:groups.map(g=>({value:g.name,label:g.name})),required:true})}</div>`:'<p class="field-help">暂无可用分组，请先在图片资源页面新建分组。</p>'}<p class="field-help" data-role="move-confirmation"></p><p class="field-help">图片直链会改变，本站 JSON 库引用将同步更新。外部使用旧直链的地方需手动更新。</p><p class="field-help">已在目标分组的图片会跳过；同名文件不会覆盖。</p></div><div class="modal-actions"><button type="button" class="btn" data-action="close-modal">取消</button><button type="submit" class="btn btn-primary" ${groups.length?'':'disabled'}>移动分组</button></div></form>`);
  const form=$c('#moveForm');form.moveItems=items.map(i=>({...i}));
  form.singleAsset=!!item;form.moveClient=currentClient();
  const trigger=form.querySelector('.field-menu-trigger');if(trigger)trigger.setAttribute('aria-labelledby','moveGroupLabel');
  const update=()=>{const target=form.elements.moveGroup?.value||'';form.querySelector('[data-role="move-confirmation"]').textContent=target?`移动 ${items.length} 张图片到 ${target} 分组？`:'请选择已有图片分组。';};
  form.elements.moveGroup?.addEventListener('change',update);update();
}
async function submitMoveC(form) {
  if(!S.auth||!S.connected||form.moveClient!==currentClient())throw new Error('仓库连接已变化，请重新打开移动分组。');
  if(form.moveOutcomeUnknown)throw new Error('提交结果待确认，请先关闭弹窗并刷新仓库核查，不要直接重试。');
  const group=String(new FormData(form).get('moveGroup')||'');
  if(!group||!S.groups.some(g=>g.name===group))throw new Error('请选择已有图片分组。');
  const items=form.moveItems||[];if(!items.length)throw new Error('请先选择图片。');
  let result;
  try { result=await form.moveClient.moveSelected(items,group); }
  catch(error){if(error.requiresRefresh||error.code==='COMMIT_OUTCOME_UNKNOWN')form.moveOutcomeUnknown=true;throw error;}
  const previous=form.singleAsset?new Set(S.selected):null;
  closeC();
  if(!previous)S.selected.clear();
  try { if(result.changed)await refreshCommittedC(); }
  finally {
    if(previous)S.selected=new Set([...previous].filter(id=>S.assets.some(i=>i.id===id)));
    renderC();
  }
  notify(result.moved?`已移动 ${result.moved} 张图片，JSON 引用已同步${result.skipped?`，跳过同组 ${result.skipped} 张`:''}`:`没有需要移动的图片，已跳过同组 ${result.skipped} 张`);
}
// End image-group move UI.
function bulkModal(item=null) {
  const items=item?[item]:S.assets.filter(x=>S.selected.has(x.id));
  if(!items.length)return notify('请先选择图片','error');
  openC(`<div class="modal-head"><div><h2>加入 JSON 库</h2><p>所选图片会去重后追加到目标 JSON 库。</p></div><button class="modal-close" data-action="close-modal">×</button></div><form id="bulkForm"><div class="modal-body">${S.libraries.length?`<div class="modal-field"><label>目标 JSON 库</label>${fieldMenuC({name:'library',value:S.libraries[0]?.file||'',options:S.libraries.map(l=>({value:l.file,label:`${l.name} · ${l.count} 个`})),required:true})}</div>`:'<p class="field-help">暂无 JSON 库，请先新建 JSON 库后再加入图片。</p><button type="button" class="btn" data-action="new-library">＋ 新建 JSON 库</button>'}<p class="field-help">已选择 ${items.length} 张图片，图片文件不会被移动或删除。</p></div><div class="modal-actions"><button type="button" class="btn" data-action="close-modal">取消</button><button type="submit" class="btn btn-primary" ${S.libraries.length?'':'disabled'}>加入 JSON 库</button></div></form>`);
  const form=$c('#bulkForm'); form.libraryItems=items; form.singleAsset=!!item;
}
async function readRepo(form) { const data = form instanceof HTMLFormElement ? new FormData(form) : { get:key => form.elements[key]?.value ?? '' }; const assetsPath=String(data.get('assetsPath')||'assets'); if(assetsPath.split('/').some(p=>!p||p==='.'||p==='..'||/[\\\x00-\x1f\x7f-\x9f]/.test(p)))throw new Error('资源目录不能包含空路径段、点路径段、反斜线或控制字符。'); S.repo={owner:String(data.get('owner')).trim(),repo:String(data.get('repo')).trim(),branch:String(data.get('branch')).trim()||'main',assetsPath:String(data.get('assetsPath')||'assets')}; if(!S.repo.owner||!S.repo.repo)return notify('请填写仓库用户名和名称','error'); localStorage.setItem('gh-image-repo',JSON.stringify(S.repo)); S.loading=true;renderC(); const client=currentClient(), epoch=repositoryEpoch; try { const data=await client.load(); if(currentClient()!==client||epoch!==repositoryEpoch)return; S.connected=true; syncStatusC(data.historyWarnings?.length?'资源已同步，部分时间不可用。'+data.historyWarnings[0].message:''); scheduleRepositorySyncC(); S.repo.assetsPath=data.root; localStorage.setItem('gh-image-repo',JSON.stringify(S.repo)); S.groups=data.groups;S.group=S.group&&data.groups.some(g=>g.name===S.group)?S.group:(data.groups[0]?.name||'');S.assets=data.assets;S.libraries=data.libraries.map(x=>({...x,gradient:'linear-gradient(135deg,#7580ff,#8c64e9)'})); S.selected.clear();S.activity.unshift({title:'读取了 GitHub 仓库',detail:`${S.repo.owner}/${S.repo.repo} · ${S.libraries.length} 个 JSON、${S.assets.length} 张图片`,time:Date.now()}); S.view='overview';notify(S.syncError||`读取完成：${S.libraries.length} 个 JSON、${S.assets.length} 张图片`); } catch(e){if(currentClient()===client&&epoch===repositoryEpoch){S.connected=false;notify(e.message||'读取失败','error');}} finally{S.loading=false;if(currentClient()===client&&epoch===repositoryEpoch)renderC();} }
let refreshFlight=null, refreshTimer=null, refreshDebounce=null, syncDisposed=false;
function syncBusyC() { return GitHubClient.writing || pendingSubmission || !!$c('#modalRoot')?.firstElementChild || S.loading || S.view==='settings'; }
function syncStatusC(message='') { S.syncError=message; const dot=$c('#storageDot'); if(dot){dot.title=message||'已连接';dot.setAttribute('aria-label',message||'已连接');} }
async function refreshRepo(background=false) {
  if(!S.connected)return;
  if(GitHubClient.writing || (background&&syncBusyC()))return;
  const client=currentClient(), epoch=repositoryEpoch;
  if(refreshFlight?.client===client){try{return await refreshFlight.promise;}catch(e){if(!background)throw e;return;}}
  const flight={client};
  flight.promise=(async()=>{
    const previous=client.cached;
    const data=await client.load();
    if(currentClient()!==client || repositoryEpoch!==epoch || !S.connected || syncDisposed)return;
    if(background&&syncBusyC()){if(client.cached===data)client.cached=previous;return;}
    syncStatusC(data.historyWarnings?.length?'资源已同步，部分时间不可用。'+data.historyWarnings[0].message:'');
    if(data===previous)return;
    const oldLibrary=S.libraries.find(x=>x.id===S.selectedLibrary);
    S.repo.assetsPath=data.root;
    localStorage.setItem('gh-image-repo',JSON.stringify(S.repo));
    S.groups=data.groups;S.group=S.group&&data.groups.some(g=>g.name===S.group)?S.group:(data.groups[0]?.name||'');
    S.assets=data.assets;
    S.selected=new Set([...S.selected].filter(id=>data.assets.some(a=>a.id===id)));
    S.libraries=data.libraries.map(x=>({...x,gradient:'linear-gradient(135deg,#7580ff,#8c64e9)'}));
    const library=S.libraries.find(x=>x.id===S.selectedLibrary);
    // Index selections cannot safely survive JSON reorder/duplicate edits.
    if(!library || library.sha!==oldLibrary?.sha)S.selectedIcons.clear();
    if(!library&&S.selectedLibrary){S.selectedLibrary=S.libraries[0]?.id||'';if(S.view==='library-detail')S.view='libraries';}
    renderC();
  })();
  refreshFlight=flight;
  try { await flight.promise; } catch(e) { if(currentClient()!==client||repositoryEpoch!==epoch||syncDisposed)return;if(background){if(currentClient()===client&&repositoryEpoch===epoch&&S.connected&&!syncDisposed){const message=`同步暂缓：${e.message}`;if(S.syncError!==message)notify(message,'error');syncStatusC(message);}}else throw e; }
  finally { if(refreshFlight===flight)refreshFlight=null; }
}
function scheduleRepositorySyncC() {
  clearTimeout(refreshTimer);clearTimeout(refreshDebounce);
  if(syncDisposed||document.hidden||!S.auth||!S.connected)return;
  refreshDebounce=setTimeout(async()=>{await refreshRepo(true); if(!syncDisposed&&!document.hidden&&S.auth&&S.connected){clearTimeout(refreshTimer);refreshTimer=setTimeout(scheduleRepositorySyncC,60000);}},250);
}
function disposeRepositorySyncC() { syncDisposed=true;repositoryEpoch++;clearTimeout(refreshTimer);clearTimeout(refreshDebounce); }
document.addEventListener('visibilitychange',scheduleRepositorySyncC);
window.addEventListener('focus',scheduleRepositorySyncC);
window.addEventListener('pagehide',disposeRepositorySyncC);
window.addEventListener('pageshow',()=>{syncDisposed=false;scheduleRepositorySyncC();});
async function refreshCommittedC() {
  try { await refreshRepo(); }
  catch(error) { throw new Error(`GitHub 操作已完成，但刷新失败，请点击刷新，不要重复提交：${error.message}`); }
}
// One UI operation owns the repository context until its refresh completes.
let pendingSubmission = false;
let submissionStateC = null;
function bindSubmissionC(scope,state) {
  if(!scope || state.scopes.some(entry=>entry.scope===scope))return;
  const previousBusy=scope.getAttribute('aria-busy');
  scope.dataset.busy='1'; scope.setAttribute('aria-busy','true');
  const scopedButtons=scope.matches('button')?[scope]:[...scope.querySelectorAll('button')];
  // Match the existing close-event lock visually, including X outside the form
  // and Cancel beside a standalone confirmation button. Snapshot each only once.
  const modal=scope.closest?.('.modal');
  const closeButtons=modal?[...modal.querySelectorAll('button[data-action="close-modal"]')]:[];
  const buttons=[...new Set([...scopedButtons,...closeButtons])];
  const snapshots=buttons.map(button=>({button,disabled:button.disabled,html:button.innerHTML}));
  state.scopes.push({scope,previousBusy,snapshots});
  buttons.forEach(button=>{button.disabled=true;if(scopedButtons.includes(button)&&(button===scope || button.type==='submit'))button.textContent=state.label;});
}
function restoreSubmissionC() {
  if(!submissionStateC)return;
  const {id,action}=submissionStateC;
  const scope=id?document.getElementById(id):action?document.querySelector(`[data-action="${action}"]`):null;
  bindSubmissionC(scope,submissionStateC);
}
function beginSubmission(scope, label='正在保存…') {
  if(pendingSubmission || scope.dataset.busy==='1') return null;
  pendingSubmission=true;
  const state={id:scope.id,action:scope.dataset.action,label,scopes:[]};
  submissionStateC=state;bindSubmissionC(scope,state);
  return ()=>{
    state.scopes.forEach(({scope,previousBusy,snapshots})=>{
      snapshots.forEach(({button,disabled,html})=>{button.disabled=disabled;button.innerHTML=html;});
      delete scope.dataset.busy;
      if(previousBusy===null)scope.removeAttribute('aria-busy');else scope.setAttribute('aria-busy',previousBusy);
    });
    submissionStateC=null;pendingSubmission=false;
  };
}
async function runSubmission(scope,label,run) {
  const finish=beginSubmission(scope,label); if(!finish)return;
  try { await run(); } catch(error) { notify(error.requiresRefresh||error.code==='COMMIT_OUTCOME_UNKNOWN'?'提交结果待确认，请先刷新仓库核查，不要直接重试。':error.message||'操作失败','error'); } finally { finish(); }
}
async function formSubmit(e) {
  e.preventDefault(); const form=e.target;
  const labels={createRepoForm:'正在创建…',repoForm:'正在读取仓库…',uploadForm:'正在上传并提交…'};
  const finish=beginSubmission(form,labels[form.id]||'正在保存…'); if(!finish)return;
  try {
    if(form.id==='adminPolicyForm') return await saveAdminPolicy(form);
    if(form.id==='createRepoForm') return await createRepositoryFromModal(form);
    if(form.id==='repoForm') return await readRepo(form);
    if(form.id==='uploadForm') { const group=String(form.elements.group.value||'').trim(); if(!group)return notify('当前没有图片分组，请先到图片资源页面新建分组。','error'); const result=await currentClient().upload(form.elements.file.files[0],form.elements.name.value,group,form.elements.library.value); closeC(); await refreshCommittedC(); notify(`已上传“${result.name}”，并提交到 GitHub`); return; }
    if(form.id==='groupCreateForm') { const name=String(new FormData(form).get('name')||'').trim(); if(!name)return; const draft=S.uploadDraft; await currentClient().createGroup(name); S.uploadDraft=null; closeC(); await refreshCommittedC(); S.group=name; S.uploadDraft=null; if(draft){draft.group=name; uploadModal(draft);} else {closeC();} notify('图片分组已创建'); return; }
    if(form.id==='groupManageForm') { const name=String(new FormData(form).get('name')||'').trim(); if(!name||name===S.group){closeC();return;} await currentClient().renameGroup(S.group,name); S.group=name; closeC(); await refreshCommittedC(); notify('分组已重命名'); return; }
    if(form.id==='repoRenameForm') { const name=String(new FormData(form).get('name')||'').trim(); if(!name||name===S.repo.repo){closeC();return;} await currentClient().renameRepository(name); S.repo.repo=name; localStorage.setItem('gh-image-repo',JSON.stringify(S.repo)); closeC(); renderC(); notify('仓库已改名'); return; }
    if(form.id==='assetRenameForm') { const item=S.assets.find(x=>x.id===form.dataset.id), name=String(new FormData(form).get('name')||'').trim(); if(!item||!name||name===item.name){closeC();return;} await currentClient().renameAsset(item,name); closeC(); await refreshCommittedC(); notify('图片已改名，JSON 引用已同步'); return; }
    if(form.id==='libraryForm') { const data=new FormData(form), name=String(data.get('name')).trim(), description=String(data.get('description')).trim(), inputPath=String(data.get('path')).trim(), path=inputPath.replace(/\.json$/i,'')+'.json'; if(!name)return notify('请填写 JSON 库名称','error'); if(!inputPath)return notify('请填写 JSON 文件名','error'); const old=S.libraries.find(x=>x.id===S.editingLibrary); if(old) await currentClient().saveLibrary(old.file,path,name,description); else await currentClient().createLibrary(path,name,description); closeC(); await refreshCommittedC(); notify('JSON 库已提交'); return; }
    if(form.id==='iconForm') { const data=new FormData(form), lib=S.libraries.find(x=>x.id===S.selectedLibrary); await currentClient().saveIcon(lib.file,Number(data.get('index')),String(data.get('name')),String(data.get('url')),lib.sha); closeC(); await refreshCommittedC(); S.view='libraries'; renderC(); notify('图片引用已更新'); return; }
    if(form.id==='moveForm') return await submitMoveC(form);
    if(form.id==='bulkForm') {
      const path=String(new FormData(form).get('library')||'');
      if(!path||!S.libraries.some(l=>l.file===path))throw new Error('请先选择目标 JSON 库。');
      const items=form.libraryItems||[]; if(!items.length)throw new Error('请先选择图片。');
      const result=await currentClient().appendToLibrary(path,items);
      const selection=form.singleAsset?new Set(S.selected):null;
      closeC();
      try { if(result.changed)await refreshRepo(); }
      catch(error) { notify(`加入 JSON 库操作已完成，但刷新失败：${error.message}`,'error'); }
      finally { if(selection){S.selected.clear();for(const id of selection)S.selected.add(id);}else S.selected.clear(); renderC(); }
      notify(result.added?`已加入 JSON 库：新增 ${result.added} 张，跳过重复 ${result.skipped} 张`:`全部重复，无需重复加入 JSON 库（跳过 ${result.skipped} 张）`); return;
    }
  } catch(error) { notify(error.requiresRefresh||error.code==='COMMIT_OUTCOME_UNKNOWN'?'提交结果待确认，请先刷新仓库核查，不要直接重试。':error.message||'操作失败','error'); } finally { finish(); }
}
async function logoutC() { const response=await fetch('/api/auth/logout',{method:'POST',credentials:'include',headers:{'X-CSRF-Token':S.csrf}}); if(!response.ok)throw new Error('退出失败，请重试。'); disposeRepositorySyncC(); S.connected=false; localStorage.removeItem('gh-image-remembered-token'); location.replace('/?logged_out=1'); }
async function autoSelectRepository() {
  if (!S.auth) return;
  try {
    S.repos = await currentClient().listRepos();
    const candidates = await currentClient().findProjectRepositories(S.repos); S.projectCandidates=candidates;
    if(candidates.length) S.connectionError='';
    else if(S.repo.owner&&S.repo.repo) S.connectionError='暂未检测到图床结构，已保留当前填写的仓库；点击“保存并读取仓库”验证。';
    else S.connectionError='没有检测到符合图床结构的仓库，请到仓库设置手动选择或创建。';
    renderC();
  } catch (error) { S.connectionError = error?.message || '自动检测仓库失败'; console.warn('自动检测仓库失败', error); renderC(); }
}
async function createRepositoryFromModal(form) {
  const data=new FormData(form), name=String(data.get('name')||'').trim(), description=String(data.get('description')||'').trim();
  if(!/^[A-Za-z0-9._-]+$/.test(name)) throw new Error('仓库名称只能使用字母、数字、横线、下划线和小数点。');
  const repo=await currentClient().createRepository(name,description); S.repo={owner:repo.owner.login,repo:repo.name,branch:repo.default_branch||'main',assetsPath:'assets'}; localStorage.setItem('gh-image-repo',JSON.stringify(S.repo)); closeC(); await readRepo({elements:{owner:{value:S.repo.owner},repo:{value:S.repo.repo},branch:{value:S.repo.branch},assetsPath:{value:S.repo.assetsPath}}});
}

async function bootAuth(retried=false) { if(location.protocol!=='http:'&&location.protocol!=='https:'){ renderC(); return; } try { const r=await fetch('/api/auth/me',{credentials:'include'}); if(!r.ok)throw new Error('会话检查暂时失败'); const data=await r.json(); S.auth=data.user||null; S.csrf=data.csrf||''; S.oauthEnabled=Boolean(data.oauthEnabled); S.adminConfigured=Boolean(data.adminConfigured); S.isAdmin=Boolean(data.isAdmin); S.policyConfigured=Boolean(data.policyConfigured); if(S.auth) { await loadAdminPolicy(); renderC(); if(sessionStorage.getItem('gh-login-success')==='1'){ sessionStorage.removeItem('gh-login-success'); notify('已登录'); } if(S.repo.owner&&S.repo.repo) {
      void refreshRepositoryChoicesC();
      await readRepo({elements:Object.fromEntries(Object.entries(S.repo).map(([key,value])=>[key,{value}]))});
    } else await autoSelectRepository();
  } } catch { /* Transient failures must not erase an existing identity or saved preferences. */ } renderC(); }
window.addEventListener('online',()=>{void bootAuth();});

document.addEventListener('click', async e => {
  const target=e.target.closest('[data-action],[data-view]'); if(!target)return;
  if(pendingSubmission){e.preventDefault();return;}
  const view=target.dataset.view;
  if(view) { S.view=view; S.selected.clear(); $c('#sidebar').classList.remove('open'); renderC(); return; }
  const action=target.dataset.action;
  if(action==='modal-backdrop'){if(e.target===target)closeC();return;}
  if(action==='close-modal'){closeC();return;}
  if(action==='toggle-sidebar'){ $c('#sidebar').classList.toggle('open'); return; }
  if(action==='open-project'){ window.open('https://github.com/beiwang02/github-assets','_blank'); return; }
  if(action==='open-repo'){ if(S.repo.owner&&S.repo.repo) window.open(`https://github.com/${encodeURIComponent(S.repo.owner)}/${encodeURIComponent(S.repo.repo)}`,'_blank'); else notify('当前还没有连接仓库','error'); return; }
  if(action==='toggle-field-menu'){const owner=target.closest('[data-field-menu]');if(!owner)return;const menu=owner.querySelector('.sort-menu')||document.querySelector('.floating-menu');menu.style.minWidth=`${Math.round(target.getBoundingClientRect().width)}px`;window.AnchoredMenu.open(target,menu,{placement:'bottom-start'});return;}
  if(action==='choose-field-menu'){const owner=document.querySelector(`[data-field-menu="${CSS.escape(target.dataset.menuName)}"]`);if(!owner)return;const native=owner.querySelector('select');if(native&&native.value!==target.dataset.value){native.value=target.dataset.value;native.dispatchEvent(new Event('change',{bubbles:true}));}syncFieldMenuC(owner,target.dataset.value,target.dataset.label);closeSortMenus(true);return;}
  if(action==='toggle-sort'){const owner=target.closest('[data-sort-menu]');if(!owner)return;window.AnchoredMenu.open(target,owner.querySelector('.sort-menu')||document.querySelector('.floating-menu'),{placement:owner.dataset.sortMenu==='assets'?'bottom-end':'bottom-start'});return;}
  if(action==='toggle-theme'){cycleAppearance();target.blur();return;}
  if(action==='choose-sort'){const kind=target.dataset.sortKind,value=target.dataset.sortValue;const map={assets:['assetSort','gh-assets-sort'],libraries:['librarySort','gh-libraries-sort'],icons:['iconSort','gh-icons-sort']},pair=map[kind];if(!pair)return;S[pair[0]]=value;localStorage.setItem(pair[1],value);closeSortMenus();if(kind==='libraries')libraryPickerModal();else renderC();document.querySelector(`[data-sort-menu="${kind}"] .sort-trigger`)?.focus({preventScroll:true});return;}
  if(action==='account-menu'){accountMenu();return;}
  if(action==='page-back'){if(history.state?.ghView&&history.state.depth>0)history.back();else{S.view='overview';renderC();}return;}
  if(action==='logout'){await runSubmission(target,'正在退出…',logoutC);return;}
  if(action==='create-repo'){if(!S.auth)return notify('请先登录 GitHub','error');createRepoModal();return;}
  if(action==='use-repo'){S.repo={owner:target.dataset.owner,repo:target.dataset.repo,branch:target.dataset.branch||'main',assetsPath:target.dataset.assetsPath||'assets'};renderC();return;}
  if(action==='settings'){closeC();S.view='settings';renderC();return;}
  if(action==='refresh'){await runSubmission(target,'正在刷新…',async()=>{const client=currentClient(),epoch=repositoryEpoch;if(!S.connected||GitHubClient.writing)return;await refreshRepo();if(currentClient()===client&&epoch===repositoryEpoch&&!syncDisposed)notify(S.syncError||'仓库已刷新');});return;}
  if(action==='upload'){if(!S.connected)return notify('请先连接仓库','error');uploadModal();return;}
  if(action==='new-library'){if(!S.connected)return notify('请先连接你的仓库','error');libraryModal(false);return;}
  if(action==='new-icon'){if(!S.connected)return notify('请先连接你的仓库','error');uploadModal();return;}
  if(action==='open-library'){S.selectedLibrary=target.dataset.id;S.view='libraries';S.iconQuery='';S.selectedIcons.clear();closeC();renderC();return;}
  if(action==='open-library-picker'){libraryPickerModal();return;}
  if(action==='select-library'){S.selectedLibrary=target.dataset.id||target.value;S.selectedIcons.clear();S.iconQuery='';closeC();renderC();$c('.library-name-trigger')?.focus({preventScroll:true});return;}
  if(action==='group'){S.group=target.dataset.group;S.selected.clear();renderC();return;}
  if(action==='select-all'){const list=filteredAssets(); if(list.length&&list.every(x=>S.selected.has(x.id)))list.forEach(x=>S.selected.delete(x.id));else list.forEach(x=>S.selected.add(x.id));syncAssetSelectionUI(list.map(x=>x.id));target.blur();return;}
  if(action==='select-icon'){e.stopPropagation();const index=Number(target.dataset.index);S.selectedIcons.has(index)?S.selectedIcons.delete(index):S.selectedIcons.add(index);syncIconSelectionUI([index]);target.blur();return;}
  if(action==='select-all-icons'){const icons=visibleIcons();if(icons.length&&icons.every(x=>S.selectedIcons.has(x.index)))icons.forEach(x=>S.selectedIcons.delete(x.index));else icons.forEach(x=>S.selectedIcons.add(x.index));syncIconSelectionUI();target.blur();return;}
  if(action==='delete-selected-icons'){const lib=S.libraries.find(x=>x.id===S.selectedLibrary), indexes=[...S.selectedIcons];if(!lib||!indexes.length)return;confirmC('移除图片引用',`从 ${lib.name} 中移除选中的 ${indexes.length} 条图片引用？图片文件不会删除。`,async()=>{await currentClient().removeIcons(lib.file,indexes,lib.sha);S.selectedIcons.clear();closeC();await refreshCommittedC();notify('图片引用已移除');},'移除引用');return;}
  if(action==='asset-select'){e.preventDefault();e.stopImmediatePropagation();const id=target.dataset.id;S.selected.has(id)?S.selected.delete(id):S.selected.add(id);syncAssetSelectionUI([id]);target.blur();return;}
  if(action==='save-original'){saveOriginalC(target);return;}
  if(action==='asset-open'){e.preventDefault();e.stopImmediatePropagation();const item=S.assets.find(x=>x.id===target.dataset.id);if(item){target.blur();assetModal(item);}return;}
  if(action==='icon-open'){const lib=S.libraries.find(x=>x.id===S.selectedLibrary),index=Number(target.dataset.index),icon=lib?.icons?.[index];if(icon)iconModal({...icon,index});return;}
  if(action==='copy'){e.preventDefault();e.stopImmediatePropagation();target.blur();await runSubmission(target,'正在复制…',()=>copyC(target.dataset.copy||''));return;}
  if(action==='library-detail'){S.selectedIcons.clear();S.selectedLibrary=target.dataset.id;S.iconQuery='';S.view='libraries';renderC();return;}
  if(action==='edit-library'){e.stopPropagation();S.selectedLibrary=target.dataset.id||S.selectedLibrary;libraryModal(true);return;}
  if(action==='edit-icon'){editIconModal(Number(target.dataset.index));return;}
  if(action==='asset-library'){const item=S.assets.find(x=>x.id===target.dataset.id);if(item)bulkModal(item);return;}
  if(action==='bulk-move'){moveModal();return;}
  if(action==='move-asset'){const item=S.assets.find(x=>x.id===target.dataset.id);if(item)moveModal(item);return;}
  if(action==='bulk-library'){if(!S.selected.size)return;bulkModal();return;}
  if(action==='confirm-exec'){const run=S.modalConfirm;if(run)await runSubmission(target,'正在删除…',async()=>{await run();if(S.modalConfirm===run)S.modalConfirm=null;});return;}
  if(action==='rename-repo'){if(S.repo.repo)nameModal('repoRename','重命名 GitHub 仓库',S.repo.repo,'仓库名称会同步更新到 GitHub。');return;}
  if(action==='delete-repo'){if(S.repo.owner&&S.repo.repo)confirmRepositoryDeletion();return;}
  if(action==='delete-library'){e.stopPropagation();const lib=S.libraries.find(x=>x.id===target.dataset.id);if(!lib)return;confirmC('永久删除 JSON 文件',`永久删除 ${lib.name}？
文件：${lib.file}`,async()=>{await currentClient().deleteLibrary(lib.file);closeC();await refreshCommittedC();notify('JSON 文件已删除');},'永久删除');return;}
  if(action==='delete-icon'){const lib=S.libraries.find(x=>x.id===S.selectedLibrary),index=Number(target.dataset.index);if(!lib)return;confirmC('移除图片引用',`从 ${lib.name} 中移除这个图片引用？图片文件不会删除。`,async()=>{await currentClient().removeIcons(lib.file,[index],lib.sha);closeC();await refreshCommittedC();S.view='library-detail';renderC();notify('图片引用已移除');},'移除引用');return;}
  if(action==='rename-asset'){const item=S.assets.find(x=>x.id===target.dataset.id);if(item){openC(`<div class="modal-head"><div><h2>重命名图片</h2><p>图片文件和相关 JSON 引用会同步更新。</p></div><button class="modal-close" data-action="close-modal">×</button></div><form id="assetRenameForm" data-id="${escC(item.id)}"><div class="modal-body"><div class="modal-field"><label>图片名称</label><input name="name" value="${escC(item.name)}" required${finePointerC()?' autofocus':''}></div></div><div class="modal-actions"><button type="button" class="btn" data-action="close-modal">取消</button><button class="btn btn-primary" type="submit">保存</button></div></form>`);}return;}
  if(action==='delete-asset'){const item=S.assets.find(x=>x.id===target.dataset.id);if(!item)return;confirmC('永久删除图片',`永久删除 ${item.name}？相关 JSON 引用会同步移除。`,async()=>{await currentClient().deleteAsset(item);closeC();await refreshCommittedC();notify('图片和相关引用已删除');});return;}
  if(action==='bulk-delete'){const items=S.assets.filter(x=>S.selected.has(x.id));if(!items.length)return;confirmC('永久删除选中图片',`永久删除选中的 ${items.length} 张图片？`,async()=>{await currentClient().deleteSelected(items);S.selected.clear();closeC();await refreshCommittedC();notify(`已删除 ${items.length} 张图片并同步引用`);});return;}
  if(action==='new-group'){if(!S.connected)return notify('请先连接你的仓库','error');groupModal(false);return;}
  if(action==='manage-group'){if(!S.connected)return notify('请先连接你的仓库','error');manageGroupModal();return;}
  if(action==='confirm-delete-group'){const group=target.dataset.group;if(!group)return;confirmC('永久删除分组',`永久删除分组 ${group} 及其中图片？`,async()=>{await currentClient().deleteGroup(group);S.group='';closeC();await refreshCommittedC();notify('分组已删除');});return;}
});
document.addEventListener('click',e=>{ const sidebar=$c('#sidebar'); if(sidebar?.classList.contains('open')&&!e.target.closest('#sidebar')&&!e.target.closest('.mobile-menu')){ sidebar.classList.remove('open'); e.preventDefault(); e.stopImmediatePropagation(); } },true);
document.addEventListener('submit',formSubmit);
/* Only recent cards track pointer-origin focus; keyboard navigation restores
   their accessible focus-visible ring without changing other cards. */
document.addEventListener('pointerdown',e=>{e.target.closest('.quick-asset')?.setAttribute('data-pointer-focus','');},true);
document.addEventListener('keydown',()=>{document.querySelectorAll('.quick-asset[data-pointer-focus]').forEach(card=>card.removeAttribute('data-pointer-focus'));},true);
// Clear Safari's sticky button focus after each touch release.
document.addEventListener('pointerup',e=>{const button=e.target.closest('button');if(button&&e.pointerType==='touch')button.blur();});
/* Native upload pickers: only switch from focus to :open after this exact control
   has actually reported an open menu. Parser support alone is not sufficient. */
function uploadPickerTargetC(t){return !!t?.matches?.('#uploadForm select[name="group"],#uploadForm select[name="library"]');}
document.addEventListener('pointerdown',e=>{
  const t=e.target;if(!uploadPickerTargetC(t))return;
  t.removeAttribute('data-picker-open-seen');
  if(e.pointerType==='touch')t.setAttribute('data-picker-touch','');
  else t.removeAttribute('data-picker-touch');
},true);
document.addEventListener('animationstart',e=>{
  const t=e.target;if(e.animationName!=='upload-native-picker-open'||!uploadPickerTargetC(t)||!t.hasAttribute('data-picker-touch'))return;
  if(t.matches(':open'))t.setAttribute('data-picker-open-seen','');
},true);
document.addEventListener('keydown',()=>{
  document.querySelectorAll('#uploadForm select[data-picker-touch]').forEach(t=>{t.removeAttribute('data-picker-touch');t.removeAttribute('data-picker-open-seen');});
},true);
/* Pick-once controls release focus as soon as the value is committed, so a hoverless device
   never keeps a field looking active; text fields keep their focus, exactly like any site. */
document.addEventListener('change',e=>{const t=e.target;if(!t||!t.matches||!t.matches('select,input[type=file],input[type=checkbox],input[type=radio]')||!hoverlessC())return;t.blur();});
const composingSearchC=new WeakSet();
function updateSearchC(e){
 if(pendingSubmission)return;
 const input=e.target,b=input.dataset.bind;
 if(!['asset-search','library-search','icon-search'].includes(b))return;
 if(e.isComposing||composingSearchC.has(input))return;
 const key={'asset-search':'assetQuery','library-search':'libraryQuery','icon-search':'iconQuery'}[b];S[key]=input.value;
 const start=input.selectionStart,end=input.selectionEnd,direction=input.selectionDirection,focused=document.activeElement===input;
 renderC();
 // Keep the actual editing node (and its native input session), not a new value clone.
 const next=document.querySelector(`[data-bind="${b}"]`);
 if(next){next.replaceWith(input);if(focused){input.focus({preventScroll:true});input.setSelectionRange(start,end,direction);}}
}
document.addEventListener('compositionstart',e=>{if(['asset-search','icon-search'].includes(e.target.dataset.bind))composingSearchC.add(e.target);});
document.addEventListener('compositionend',e=>{if(composingSearchC.has(e.target)){composingSearchC.delete(e.target);updateSearchC(e);}});
document.addEventListener('input',updateSearchC);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!pendingSubmission)closeC();if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$c('#globalSearch')?.focus();}});
window.addEventListener('pagehide',disposeImageSaveC);
renderC(); void bootAuth();

/* Overview quick asset panel */
function overviewQuickAssets() {
  if (!S.assets.length) return `<section class="overview-assets-section"><div class="section-row"><h3>最近图片资源</h3><button class="text-link" data-view="assets">查看全部 →</button></div><div class="card quick-empty">${emptyC('▧',S.connected?'暂无图片资源':'连接仓库后显示真实图片','图片资源会直接从你的 GitHub 仓库读取。',S.connected?'upload':'settings',S.connected?'上传图片':'连接仓库')}</div></section>`;
  return `<section class="overview-assets-section"><div class="section-row"><h3>最近图片资源</h3><button class="text-link" data-view="assets">查看全部 →</button></div><div class="card quick-assets-grid">${sortedAssetsC(S.assets,'updated-desc').slice(0,6).map(item=>`<div class="quick-asset" data-action="asset-open" data-id="${escC(item.id)}"><div class="quick-asset-image"><img src="${escC(imageURLC(item))}" alt="${escC(item.name)}" loading="lazy"></div><div class="quick-asset-name-row"><b title="${escC(item.name)}" aria-label="${escC(item.name)}">${escC(item.name)}</b><small title="${escC(item.group||'根目录')}" aria-label="${escC(item.group||'根目录')}">${escC(item.group||'根目录')}</small></div></div>`).join('')}</div></section>`;
}
const originalOverviewView = overviewView;
overviewView = function() {
  const base = originalOverviewView();
  const marker = '</div><div class="dashboard-columns">';
  const pos = base.indexOf(marker);
  return pos >= 0 ? `${base.slice(0,pos + 6)}${overviewQuickAssets()}${base.slice(pos + 6)}` : `${base}${overviewQuickAssets()}`;
};

renderC();

function applyAppearance() {
  const storedTheme=localStorage.getItem('gh-image-theme');
  const mode=['system','dark','light'].includes(storedTheme)?storedTheme:'system';
  const dark=mode==='dark'||(mode==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark',dark);
  document.body.classList.toggle('dark',dark);
  document.documentElement.style.colorScheme=dark?'dark':'light';
  document.documentElement.style.backgroundColor=dark?'#0b1629':'#f6f8fc';
  document.body.style.backgroundColor=dark?'#0b1629':'#f6f8fc';
  const themeMeta=document.querySelector('meta[name="theme-color"]');
  if(themeMeta) themeMeta.content=dark?'#0b1629':'#f6f8fc';
  const labels={system:'跟随系统（点击切换）',dark:'黑夜模式（点击切换）',light:'白天模式（点击切换）'};
  const icons={
    system:uiIconC('system'),
    dark:uiIconC('moon'),
    light:'<svg class="theme-icon theme-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>'
  };
  document.querySelectorAll('.appearance-button').forEach(button=>{
    button.innerHTML=icons[mode];
    button.title=labels[mode];
    button.setAttribute('aria-label',labels[mode]);
  });
}
function cycleAppearance() {
  const current=localStorage.getItem('gh-image-theme')||'system';
  const next=current==='system'?'light':(current==='light'?'dark':'system');
  localStorage.setItem('gh-image-theme',next);
  applyAppearance();
}
function accountMenu() {
  $c('#sidebar').classList.remove('open');
  const login=S.auth?.login||'当前账号';
  const displayName=S.auth?.name||login;
  const avatar=S.auth?.avatar_url||'';
  openC(`<div class="modal-head"><div class="account-modal-head">${avatar?`<img src="${escC(avatar)}" alt="">`:''}<div><h2>${escC(displayName)}</h2><p>@${escC(login)}</p></div></div><button class="modal-close" data-action="close-modal">×</button></div><div class="modal-body choice-menu"><button class="btn" data-action="logout">退出并返回登录页</button></div>`);
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',applyAppearance);
applyAppearance();
let lastRoute='';
const baseRenderC=renderC;
renderC=function(){
  baseRenderC();
  if(!S.auth)return;
  const route=S.view+'|'+(S.selectedLibrary||'');
  if(route!==lastRoute){
    const current=history.state;
    if(lastRoute) history.pushState({ghView:S.view,lib:S.selectedLibrary,depth:(current?.depth||0)+1},'');
    else history.replaceState({ghView:S.view,lib:S.selectedLibrary,depth:0},'');
    lastRoute=route;
    window.scrollTo(0,0);
  }
};
window.addEventListener('popstate',e=>{if(pendingSubmission)return;closeC();if(e.state?.ghView){S.view=e.state.ghView;S.selectedLibrary=e.state.lib;lastRoute=S.view+'|'+(S.selectedLibrary||'');renderC();window.scrollTo(0,0);}});
renderC();

// Native component adapter; existing business event delegation is unchanged.
function uiIconC(name){
  if(name==='system')return '<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3a9 9 0 0 0 0 18Z" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="9" fill="none"/></svg>';
  const paths={plus:'M12 5v14M5 12h14',close:'m6 6 12 12M18 6 6 18',copy:'M9 9h11v11H9zM15 9V4H4v11h5',arrow:'M5 12h14m-5-5 5 5-5 5',back:'M19 12H5m5-5-5 5 5 5',chevron:'m6 9 6 6 6-6',check:'m5 12 4 4L19 6',grid:'M4 4h16v16H4zM4 10h16M10 4v16',refresh:'M20 8a8 8 0 1 0 0 8M20 3v5h-5',menu:'M4 6h16M4 12h16M4 18h16',eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Zm7 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0',moon:'M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11',system:'M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18Zm0 0v18',more:'M5 12h1m5 0h1m5 0h1'};
  return `<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${paths[name]||paths.grid}"/></svg>`;
}
function feedbackKindC(el){
  if(el.matches('.drop-zone'))return '';
  if(el.matches('.btn-danger,.library-picker-delete,.library-switch-delete,.group-delete-link,[data-ui="danger"],[data-action^="delete-"],[data-action^="confirm-delete-"],[data-action="bulk-delete"]'))return '';
  if(el.matches('.btn-github,.asset-select,.reference-select,.sidebar-overlay'))return '';
  if(el.matches('.btn-primary'))return 'primary';
  if(el.dataset.action==='copy')return 'control';
  // Information triggers use frame feedback, never the action-button ink wash.
  if(el.matches('.library-switch-trigger,.library-switch-option,.library-picker-option,.repo-quick'))return 'surface';
  if(el.matches('.library-picker-create'))return 'control';
  if(el.matches('.library-list-row'))return el.closest('.library-card')?'':'surface';
  if(el.matches('.repo-switcher,.asset-card,.quick-asset,.json-reference-row,.library-empty-row'))return 'surface';
  return el.matches('button,.project-link,[role="button"]')?'control':'';
}
function enhanceControlsC(){
  const glyphs={'＋':'plus','×':'close','⧉':'copy','→':'arrow','←':'back','⌄':'chevron','✓':'check','▦':'grid','↻':'refresh','☰':'menu','◉':'eye','◐':'system','•••':'more'};
  document.querySelectorAll('button,.project-link,[role="button"]').forEach(el=>{
    // Composite surfaces keep their own layout across observer passes and rerenders.
    if(el.matches('.asset-card,.quick-asset,.json-reference-row,.library-list-row,.library-empty-row')){el.classList.remove('ui-button');delete el.dataset.ui;return;}
    const kind=el.matches('.btn-danger,.library-picker-delete')?'danger':el.matches('.btn-primary,.btn-github')?'primary':el.matches('.nav-item,.group-pill')?'nav':el.matches('.sort-trigger,.sort-option')?'sort':el.matches('.top-icon,.project-link,.icon-btn,.modal-close,.token-eye,.mobile-menu,.sidebar-close,.more,.asset-select,.reference-select')?'icon':el.matches('.text-link,.asset-copy,.token-guide-button')?'text':'secondary';
    el.classList.add('ui-button');if(el.dataset.action==='copy')el.classList.add('copy-control');if(el.dataset.action==='copy'&&kind==='icon')el.classList.add('copy-control-icon');el.dataset.ui=el.classList.contains('copy-control-icon')?'icon':kind;
    if(el.matches('button')&&!el.hasAttribute('type')&&!el.closest('form'))el.type='button';
    const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(n=>{if(n.parentElement!==el||n.parentElement.closest('svg,.library-picker-copy,.library-picker-option,.repo-meta,.group-pill')||el.matches('[role="button"],.token-eye'))return;const re=/^(?:＋|×|⧉|←|⌄|✓|▦|↻|☰|◉|◐|•••)(?=\s|$)|→$/g;if(!re.test(n.textContent))return;const box=document.createElement('span');box.innerHTML=n.textContent.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])).replace(re,g=>uiIconC(glyphs[g]));n.replaceWith(...box.childNodes);});
    if(el.matches('.mobile-menu'))el.setAttribute('aria-label','打开侧栏');
    if(el.matches('.modal-close'))el.setAttribute('aria-label','关闭弹窗');
  });
  document.querySelectorAll('.library-list-row[data-action],.library-empty-row[data-action],.json-reference-row[data-action],.asset-card[data-action],.quick-asset[data-action]').forEach(el=>{el.tabIndex=0;el.setAttribute('role','button');el.removeAttribute('aria-haspopup');});
  document.querySelectorAll('button,.project-link,[role="button"],.asset-card,.quick-asset,.json-reference-row,.drop-zone').forEach(el=>{
    const kind=feedbackKindC(el);
    if(kind){if(el.dataset.feedback!==kind)el.dataset.feedback=kind;}
    else if(el.hasAttribute('data-feedback'))el.removeAttribute('data-feedback');
  });
}
const uiObserverC=new MutationObserver(()=>{uiObserverC.disconnect();enhanceControlsC();uiObserverC.observe(document.body,{childList:true,subtree:true});});
enhanceControlsC();uiObserverC.observe(document.body,{childList:true,subtree:true});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('.library-list-row[data-action],.library-empty-row[data-action],.json-reference-row[data-action],.asset-card[data-action],.quick-asset[data-action]')){e.preventDefault();e.target.click();}});
