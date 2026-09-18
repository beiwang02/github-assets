const S = {
  auth:null, csrf:'', oauthEnabled:false, tokenLoginEnabled:false, adminConfigured:false, isAdmin:false, policyConfigured:false, allowAll:true, allowedUsers:[], connectionError:'', view:'overview', connected:false, loading:false, loginBusy:false,
  repo: JSON.parse(localStorage.getItem('gh-image-repo') || 'null') || { owner:'', repo:'', branch:'main', assetsPath:'assets' },
  groups:[], assets:[], libraries:[], repos:[], selected:new Set(), selectedIcons:new Set(), group:'', assetQuery:'', libraryQuery:'', iconQuery:'', activity:[], uploadDraft:null, modalConfirm:null
};
const previewMode = location.protocol === 'minis:' && new URLSearchParams(location.search).get('demo') === '1';
if (previewMode) S.auth = { login:'preview-user', name:'预览用户' };
const $c = s => document.querySelector(s);
const escC = v => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const rawLibrary = lib => `https://raw.githubusercontent.com/${encodeURIComponent(S.repo.owner)}/${encodeURIComponent(S.repo.repo)}/${encodeURIComponent(S.repo.branch)}/${lib.file.split('/').map(encodeURIComponent).join('/')}`;
const currentClient = () => new window.GitHubClient(S.repo, S.csrf);
function notify(message, type='success') { const n=document.createElement('div'); n.className=`toast ${type}`; n.textContent=message; $c('#toastRoot').appendChild(n); setTimeout(()=>n.remove(),3600); }
async function copyC(text, message='直链已复制') { try { await navigator.clipboard.writeText(text); } catch { const a=document.createElement('textarea'); a.value=text; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); } notify(message); }
function statC(icon,label,value,trend,foot) { return `<div class="stat-card"><div class="stat-card-top"><span>${label}</span><i class="stat-icon">${icon}</i></div><strong>${value}<span class="trend">${trend}</span></strong><div class="stat-foot">${foot}</div></div>`; }
function emptyC(icon,title,desc,action='',label='') { return `<div class="empty-state"><div class="empty-icon">${icon}</div><h3>${title}</h3><p>${desc}</p>${action?`<button class="btn btn-primary" data-action="${action}">${label}</button>`:''}</div>`; }
function setMetaC() {
  const meta={overview:['资源工作台','总览'],libraries:['内容管理','JSON 库'],assets:['内容管理','图片资源'],'library-detail':['JSON 库',S.libraries.find(x=>x.id===S.selectedLibrary)?.name||'JSON 库'],activity:['内容管理','同步记录'],settings:['系统设置','仓库设置'],admin:['系统设置','管理后台']};
  const [eyebrow,title]=meta[S.view]||meta.overview;
  $c('#pageEyebrow').textContent=eyebrow; $c('#pageTitle').textContent=title;
  const repoName=$c('#repoName');
  if(repoName){ const dot=$c('#storageDot'); repoName.childNodes[0].textContent=`${S.repo.repo||'未选择仓库'} `; if(dot) repoName.appendChild(dot); }
  $c('#repoOwner').textContent=S.repo.owner?`${S.repo.owner} / ${S.repo.branch}`:'请先配置仓库';
  $c('#libraryCount').textContent=S.connected?S.libraries.length:'0'; $c('#assetCount').textContent=S.connected?S.assets.length:'0';
  const storageState=S.loading?'正在读取':(S.connected?'已连接':'未连接');
  const storageDot=$c('#storageDot');
  storageDot.classList.toggle('connected',S.connected);
  storageDot.style.background='';
  storageDot.title=S.connected?'已连接':'未连接';
  document.querySelectorAll('.nav-item[data-view]').forEach(n=>n.classList.toggle('active', n.dataset.view===(S.view==='library-detail'?'libraries':S.view)));
  const login=S.auth?.login||''; const name=S.auth?.name||login||'GitHub 用户'; const avatar=S.auth?.avatar_url||''; document.querySelectorAll('[data-account-name]').forEach(n=>n.innerHTML=`${escC(name)}<small class="account-login">@${escC(login)}</small>`); document.querySelectorAll('[data-account-avatar]').forEach(n=>{ if(avatar)n.innerHTML=`<img src="${escC(avatar)}" alt="${escC(name)}">`; else n.textContent=(name||'G').slice(0,1).toUpperCase(); });
}
function loginView() {
  const problem=new URLSearchParams(location.search).get('auth_error');
  const message=problem==='logged_out'?'已退出登录。':(problem==='forbidden'?'这个 GitHub 账号目前没有被允许使用此网站。':(problem?'登录失败，请重试。':'使用 GitHub Personal Access Token 登录'));
  return `<div class="auth-page"><div class="auth-card"><div class="auth-brand"><div><strong>GitHub Assets</strong><small>RESOURCE CONSOLE</small></div><div class="auth-head-actions"><button class="top-icon appearance-button auth-theme-button" data-action="toggle-theme" title="跟随系统（点击切换）" aria-label="跟随系统（点击切换）">◐</button><a class="project-link" href="https://github.com/beiwang02/github-assets" title="查看项目源码" aria-label="查看项目源码"><svg class="project-github-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.3a9.7 9.7 0 0 0-3.07 18.9c.49.09.67-.21.67-.47v-1.66c-2.73.59-3.31-1.16-3.31-1.16-.44-1.13-1.08-1.43-1.08-1.43-.89-.61.07-.6.07-.6.98.07 1.5 1.01 1.5 1.01.87 1.5 2.28 1.07 2.84.82.09-.63.34-1.07.62-1.32-2.18-.25-4.47-1.09-4.47-4.85 0-1.07.38-1.94 1.01-2.62-.1-.25-.44-1.25.1-2.59 0 0 .82-.26 2.67 1a9.3 9.3 0 0 1 4.86 0c1.85-1.26 2.67-1 2.67-1 .54 1.34.2 2.34.1 2.59.63.68 1.01 1.55 1.01 2.62 0 3.77-2.3 4.59-4.48 4.84.35.3.66.9.66 1.81v2.68c0 .26.18.57.68.47A9.7 9.7 0 0 0 12 2.3Z"/></svg></a></div></div><span class="auth-kicker">GITHUB ACCESS</span><p>${escC(message)}</p><form id="tokenLoginForm"><div class="modal-field"><label>GitHub Token</label><div class="token-input-wrap"><input name="token" id="mainTokenInput" type="password" autocomplete="off" placeholder="ghp_... 或 github_pat_..." required><button type="button" class="token-eye" data-action="toggle-token" aria-label="显示或隐藏 Token">◉</button></div></div><label class="remember-token"><input type="checkbox" name="rememberToken"> 记住此设备</label><small class="auth-note">Token 仅临时保存在服务器内存中；勾选“记住此设备”后，才会额外保存在当前浏览器本地，不会写入数据库或 GitHub。</small><button type="button" class="token-guide-button" data-action="token-guide">经典 Token 创建教程 <span class="token-guide-arrow" aria-hidden="true">⌄</span></button><button type="submit" class="btn btn-github"><span class="github-logo">●</span> 验证并登录</button></form></div></div>`;
}

function coverStack(lib) { const list=(lib.icons||[]).slice(0,3); return `<div class="library-preview-strip" aria-hidden="true">${list.length?list.map(x=>`<span class="library-preview-tile"><img src="${escC(x.url)}" alt="" onerror="this.closest('.library-preview-tile').classList.add('broken');this.remove()"></span>`).join(''):'<span class="library-row-icon">▦</span>'}</div>`; }
function activityView(limit=20) { return S.activity.length?S.activity.slice(0,limit).map(a=>`<div class="activity-item"><div class="activity-line"><i class="activity-dot"></i></div><div class="activity-copy"><b>${escC(a.title)}</b><small>${escC(a.detail)} · ${a.time}</small></div></div>`).join(''):emptyC('◷','暂无同步记录','读取仓库或提交操作后会显示在这里。'); }
function overviewView() {
  const refs=S.libraries.reduce((n,x)=>n+(x.count||0),0);
  return `<div class="hero"><div class="hero-content"><span class="mini-label">GITHUB RESOURCE HUB</span><h2>把每一张图片，变成可复用的资源。</h2><p>集中管理 GitHub 图床、图片分组与 JSON 库，复制一条直链，就能在任何项目里使用。</p><div class="hero-actions"><button class="btn btn-primary" data-action="upload">＋ 上传图片</button><button class="btn" data-action="new-library">▦ 新建 JSON 库</button><button class="btn" data-action="create-repo">＋ 创建我的图床仓库</button></div></div></div><div class="stat-grid">${statC('▧','图片资源',S.connected?S.assets.length:'0',S.connected?'已读取':'未连接',S.connected?`分布在 ${S.groups.length} 个分组`:'连接仓库后显示真实数据')}${statC('▦','JSON 库',S.connected?String(S.libraries.length).padStart(2,'0'):'0',S.connected?'已读取':'未连接',S.connected?`共 ${refs} 个图片引用`:'连接仓库后显示真实数据')}${statC('✓','仓库状态',S.connected?'正常':'未连接',S.connected?'在线':'等待连接',S.connected?'最后读取：刚刚':'请先连接 GitHub')}${statC('↗','本次同步',S.connected?'已读取':'0',S.connected?'正常':'未连接',S.connected?'数据来自 GitHub':'连接仓库后显示同步记录')}</div><div class="dashboard-columns"><section><div class="section-row"><h3>JSON 库</h3><button class="text-link" data-view="libraries">查看全部 →</button></div><div class="card library-card"><div class="library-card-header"><div class="library-title"><div class="library-logo" style="background:linear-gradient(135deg,#6672ff,#8d64e8)">▦</div><div><b>我的 JSON 库</b><small>GitHub 上的 JSON 引用集合</small></div></div></div>${S.libraries.length?S.libraries.slice(0,5).map(lib=>lib.count?`<div class="library-list-row" data-action="library-detail" data-id="${escC(lib.id)}">${coverStack(lib)}<div class="list-info"><b>${escC(lib.name)}</b><small>${escC(lib.description||lib.file)}</small></div><div class="list-meta"><strong>${lib.count} 个</strong><span>已读取</span></div><span class="tile-arrow">›</span></div>`:`<div class="library-empty-row" data-action="library-detail" data-id="${escC(lib.id)}"><div class="empty-icon">▦</div><div><b>暂无图片引用</b><small>${escC(lib.name)} · 进入库内添加图片</small></div><span class="tile-arrow">›</span></div>`).join(''):emptyC('▦','尚未读取 JSON 库',S.connectionError||'登录后创建你自己的图床仓库。',S.isAdmin?'settings':'create-repo',S.isAdmin?'打开仓库设置':'创建我的图床仓库')}</div></section><section><div class="section-row"><h3>最近动态</h3><button class="text-link" data-view="activity">全部记录 →</button></div><div class="card activity-card">${activityView(4)}</div></section></div>`;
}
function librariesView() {
  const libraries=S.libraries;
  if (!S.selectedLibrary || !libraries.some(lib=>lib.id===S.selectedLibrary)) S.selectedLibrary=libraries[0]?.id||'';
  const lib=libraries.find(item=>item.id===S.selectedLibrary);
  if (!lib) return `<div class="page-heading"><div><h2>JSON 库</h2><p>在一个工作区内选择、维护 JSON 文件及其图片引用。</p></div><div class="heading-actions"><button class="btn btn-primary" data-action="new-library">＋ 新建 JSON 库</button></div></div>${emptyC('▦',S.connected?'还没有 JSON 库':'尚未连接 GitHub',S.connected?'新建一个 JSON 库后，即可在这里管理图片引用。':'进入仓库设置后读取真实数据。',S.connected?'new-library':'settings',S.connected?'新建 JSON 库':'连接我的仓库')}`;
  const q=S.iconQuery.trim().toLowerCase(), icons=(lib.icons||[]).map((item,index)=>({...item,index})).filter(item=>!q||item.name.toLowerCase().includes(q)||item.url.toLowerCase().includes(q));
  return `<div class="page-heading json-workspace-heading"><div><p>选择当前库后，在同一工作区维护库信息与图片引用。</p></div><div class="heading-actions"><button class="btn btn-primary" data-action="new-library">＋ 新建 JSON 库</button></div></div><section class="card json-workspace"><div class="json-workspace-top"><button class="library-picker" data-action="open-library-picker" aria-haspopup="dialog" aria-label="切换当前 JSON 库"><span class="library-logo" style="background:${lib.gradient||'linear-gradient(135deg,#6672ff,#7b8af1)'}">${escC(lib.name.slice(0,1))}</span><span class="library-picker-copy"><small>当前 JSON 库</small><b>${escC(lib.name)}</b><em>${lib.count} 个图片引用 · ${escC(lib.file)}</em></span><span class="library-picker-arrow">⌄</span></button><div class="json-workspace-actions"><button class="btn btn-sm" data-action="edit-library" data-id="${escC(lib.id)}">编辑</button><button class="btn btn-sm" data-action="copy" data-copy="${escC(rawLibrary(lib))}">⧉ 复制直链</button><button class="btn btn-sm btn-danger" data-action="delete-library" data-id="${escC(lib.id)}">删除</button></div></div>${lib.description?`<div class="json-library-summary"><div><p>${escC(lib.description)}</p></div></div>`:''}</section><div class="toolbar json-reference-toolbar"><label class="inner-search"><span>⌕</span><input data-bind="icon-search" value="${escC(S.iconQuery)}" placeholder="搜索当前库的图片名称或直链…"></label><span class="toolbar-spacer"></span><button class="btn btn-sm" data-action="refresh">↻ 刷新</button></div><section class="json-references"><div class="section-row"><h3>图片引用</h3><div class="section-actions" data-role="icons-selection-toolbar">${S.selectedIcons.size?`<span class="select-counter">已选择 ${S.selectedIcons.size} 张</span>`:''}<button class="btn btn-sm" data-action="select-all-icons">全选</button>${S.selectedIcons.size?`<button class="btn btn-sm btn-danger" data-action="delete-selected-icons">删除</button>`:''}</div></div><div class="json-reference-list">${icons.length?icons.map(icon=>`<article class="json-reference-row ${S.selectedIcons.has(icon.index)?'selected':''}" data-action="icon-open" data-index="${icon.index}"><button class="reference-select" data-action="select-icon" data-index="${icon.index}" aria-label="${S.selectedIcons.has(icon.index)?'取消选择':'选择'} ${escC(icon.name)}" title="${S.selectedIcons.has(icon.index)?'取消选择':'选择'} ${escC(icon.name)}" aria-pressed="${S.selectedIcons.has(icon.index)}">${S.selectedIcons.has(icon.index)?'✓':''}</button><span class="json-reference-thumb"><img src="${escC(icon.url)}" alt="${escC(icon.name)}" loading="lazy"></span><div class="json-reference-copy"><b>${escC(icon.name)}</b></div><span class="json-reference-status"><i class="status-dot"></i>已同步</span><div class="json-reference-actions"><button class="icon-btn" aria-label="复制 ${escC(icon.name)} 直链" title="复制直链" data-action="copy" data-copy="${escC(icon.url)}">⧉</button><button class="icon-btn" aria-label="删除 ${escC(icon.name)} 引用" title="删除引用" data-action="delete-icon" data-index="${icon.index}">×</button></div></article>`).join(''):emptyC('▦','这个 JSON 还没有图片引用','可以添加已有 Raw 直链，或上传图片后加入 JSON 库。','new-icon','＋ 添加图片')}</div></section>`;
}
function groupView() { return S.groups.map(g=>`<button class="group-pill ${S.group===g.name?'active':''}" data-action="group" data-group="${escC(g.name)}"><b>●</b>${escC(g.name||'根目录')}<span>${g.count}</span></button>`).join(''); }
function assetView(item) { const picked=S.selected.has(item.id); return `<article class="card asset-card ${picked?'selected':''}" data-action="asset-open" data-id="${escC(item.id)}"><div class="asset-preview"><img src="${escC(item.url)}" alt="${escC(item.name)}" loading="lazy"></div><div class="asset-details"><div class="asset-name-row"><b title="${escC(item.name)}" aria-label="${escC(item.name)}">${escC(item.name)}</b></div><div class="asset-meta"><span class="asset-badge">${escC(item.ext)}</span><button class="asset-copy" data-action="copy" data-copy="${escC(item.url)}" title="复制直链">⧉ 复制直链</button><button class="asset-select" aria-label="${picked?'取消选择':'选择'} ${escC(item.name)}" title="${picked?'取消选择':'选择'} ${escC(item.name)}" aria-pressed="${picked}" data-action="asset-select" data-id="${escC(item.id)}">${picked?'✓':''}</button></div></div></article>`; }
function filteredAssets() { const q=S.assetQuery.trim().toLowerCase(); return S.assets.filter(x=>(!S.group||x.group===S.group)&&(!q||x.name.toLowerCase().includes(q)||x.url.toLowerCase().includes(q))); }
function renderAssetsToolbar() {
  const toolbar=$c('#app .assets-toolbar'); if(!toolbar)return;
  const list=filteredAssets(), selected=S.selected.size, allSelected=Boolean(list.length)&&list.every(x=>S.selected.has(x.id));
  toolbar.querySelector('[data-action="select-all"]')?.replaceChildren(document.createTextNode(allSelected?'取消全选':'全选'));
  const area=toolbar.querySelector('[data-role="asset-bulk-actions"]'); if(!area)return;
  area.replaceChildren();
  if(selected){ area.insertAdjacentHTML('beforeend',`<span class="select-counter">已选择 ${selected} 张</span><button class="btn btn-sm" data-action="bulk-library">加入 JSON 库</button><button type="button" class="btn btn-sm btn-danger" data-action="bulk-delete">删除</button>`); }
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
function visibleIcons() { const lib=S.libraries.find(x=>x.id===S.selectedLibrary), q=S.iconQuery.trim().toLowerCase(); return (lib?.icons||[]).map((item,index)=>({...item,index})).filter(item=>!q||item.name.toLowerCase().includes(q)||item.url.toLowerCase().includes(q)); }
function renderIconsToolbar() {
  const area=$c('#app [data-role="icons-selection-toolbar"]'); if(!area)return;
  const icons=visibleIcons(), allSelected=Boolean(icons.length)&&icons.every(x=>S.selectedIcons.has(x.index));
  area.innerHTML=`${S.selectedIcons.size?`<span class="select-counter">已选择 ${S.selectedIcons.size} 张</span>`:''}<button class="btn btn-sm" data-action="select-all-icons">${allSelected?'取消全选':'全选'}</button>${S.selectedIcons.size?'<button class="btn btn-sm btn-danger" data-action="delete-selected-icons">删除</button>':''}`;
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
  return `<div class="page-heading"><div><p>按图片分组管理 GitHub 资源；点击图片可查看直链、改名或删除。</p></div><div class="heading-actions"><button class="btn" data-action="new-group">＋ 新建分组</button>${S.group?'<button class="btn" data-action="manage-group"><span class="action-icon">▣</span> 管理分组</button>':''}<button class="btn btn-primary" data-action="upload">↑ 上传图片</button></div></div><div class="asset-groups">${groupView()}</div><div class="toolbar assets-toolbar"><label class="inner-search"><span>⌕</span><input data-bind="asset-search" value="${escC(S.assetQuery)}" placeholder="搜索图片名称或直链…"></label><button class="btn btn-sm" data-action="select-all">${list.length&&list.every(x=>S.selected.has(x.id))?'取消全选':'全选'}</button><span class="toolbar-spacer"></span><span class="asset-bulk-actions" data-role="asset-bulk-actions">${selected?`<span class="select-counter">已选择 ${selected} 张</span><button class="btn btn-sm" data-action="bulk-library">加入 JSON 库</button><button type="button" class="btn btn-sm btn-danger" data-action="bulk-delete">删除</button>`:''}</span><button class="btn btn-sm" data-action="refresh">↻ 刷新</button></div>${list.length?`<div class="asset-grid">${list.map(assetView).join('')}</div>`:emptyC('▧',S.connected?'这个分组还没有图片':'尚未连接 GitHub',S.connected?'仓库中没有符合条件的图片。':'进入仓库设置后读取你的真实图片资源。',S.connected?'upload':'settings',S.connected?'上传第一张图片':'连接我的仓库')}`;
}
function detailView() {
  const lib=S.libraries.find(x=>x.id===S.selectedLibrary); if(!lib) return emptyC('▦','找不到 JSON 库','请刷新仓库数据。','refresh','刷新');
  const q=S.iconQuery.trim().toLowerCase(), icons=(lib.icons||[]).map((x,i)=>({...x,index:i})).filter(x=>!q||x.name.toLowerCase().includes(q)||x.url.toLowerCase().includes(q));
  return `<div class="page-heading"><div><button class="text-link" data-view="libraries">← 返回 JSON 库</button><h2 style="margin-top:10px">${escC(lib.name)}</h2><p>${escC(lib.description||'')} · ${escC(lib.file)}</p></div><div class="heading-actions"><button class="btn" data-action="copy" data-copy="${escC(rawLibrary(lib))}">⧉ 复制 JSON 直链</button><button class="btn btn-primary" data-action="new-icon">＋ 添加图片</button><button class="btn btn-danger" data-action="delete-library" data-id="${escC(lib.id)}">删除</button></div></div><div class="card detail-header"><div class="library-logo" style="background:${lib.gradient||'linear-gradient(135deg,#6672ff,#7b8af1)'}">${escC(lib.name.slice(0,1))}</div><div><h2>${escC(lib.name)}</h2><p>文件：${escC(lib.file)} · ${lib.count} 个图片引用</p></div><div class="detail-actions"><button class="icon-btn" data-action="copy" data-copy="${escC(rawLibrary(lib))}" title="复制 JSON 直链">⧉</button><button class="icon-btn" data-action="delete-library" data-id="${escC(lib.id)}" title="删除 JSON 库">×</button></div></div><div class="toolbar"><label class="inner-search"><span>⌕</span><input data-bind="icon-search" value="${escC(S.iconQuery)}" placeholder="搜索名称或直链…"></label><span class="toolbar-spacer"></span><button class="btn btn-sm" data-action="refresh">↻ 刷新</button></div><div class="card table-card"><div class="table-head"><span></span><span>图片名称</span><span>图片直链</span><span>状态</span><span></span></div>${icons.length?icons.map(icon=>`<div class="table-row"><span class="table-icon"><img src="${escC(icon.url)}" alt=""></span><span class="table-name"><b>${escC(icon.name)}</b><small>JSON 引用</small></span><span class="table-url" title="${escC(icon.url)}">${escC(icon.url)}</span><span class="table-date"><span class="status-dot" style="display:inline-block;margin-right:5px"></span>已同步</span><span class="row-actions"><button class="icon-btn" data-action="copy" data-copy="${escC(icon.url)}">⧉</button><button class="icon-btn" data-action="edit-icon" data-index="${icon.index}">✎</button><button class="icon-btn" data-action="delete-icon" data-index="${icon.index}">×</button></span></div>`).join(''):emptyC('▦','这个 JSON 还没有图片引用','可以从图片资源中上传并加入，或添加一个已有 Raw 直链。')}</div>`;
}
function activityPage() { return `<div class="page-heading"><div><h2>同步记录</h2><p>当前会话内的读取与写入记录。</p></div></div><div class="card activity-card" style="padding:25px 28px">${activityView(50)}</div>`; }
function compatibleRepos() { const ids=new Set((S.projectCandidates||[]).map(r=>`${r.owner}/${r.repo}`.toLowerCase())); if(S.repo.owner&&S.repo.repo)ids.add(`${S.repo.owner}/${S.repo.repo}`.toLowerCase()); return S.repos.filter(r=>ids.has(`${r.owner.login}/${r.name}`.toLowerCase())); }
function settingsPage() { return `<div class="page-heading"><div><h2>仓库设置</h2><p>使用 GitHub Token 登录，仓库配置只保存当前浏览器的选择。</p></div><div class="heading-actions"><span class="connection-badge"><i class="status-dot"></i>${S.connected?'已读取':'未读取'}</span></div></div><div class="settings-grid"><div class="card settings-card"><h3>GitHub 仓库</h3><p>登录后会自动检测你有权限访问的图床仓库；你可以从这里选择已有仓库，也可以创建公开仓库。</p>${compatibleRepos().length?`<div class="repo-quick-list">${compatibleRepos().slice(0,8).map(r=>`<button type="button" class="repo-quick ${S.repo.repo===r.name?'active':''}" data-action="use-repo" data-owner="${escC(r.owner.login)}" data-repo="${escC(r.name)}" data-branch="${escC(r.default_branch||'main')}">${escC(r.owner.login)}/${escC(r.name)}</button>`).join('')}</div>`:''}<button type="button" class="btn btn-sm" data-action="create-repo">＋ 在当前账号创建仓库</button>${S.repo.repo?'<button type="button" class="btn btn-sm" data-action="rename-repo">改名</button><button type="button" class="btn btn-sm btn-danger" data-action="delete-repo">删除仓库</button>':''}<form id="repoForm"><div class="form-grid"><div class="form-field"><label>仓库用户名</label><input name="owner" value="${escC(S.repo.owner||S.auth?.login||'')}" placeholder="GitHub 用户名" required></div><div class="form-field"><label>仓库名称</label><input name="repo" value="${escC(S.repo.repo)}" placeholder="仓库名称" required></div><div class="form-field"><label>分支名称</label><input name="branch" value="${escC(S.repo.branch||'main')}" placeholder="main"></div><div class="form-field"><label>图片目录</label><input name="assetsPath" value="${escC(S.repo.assetsPath||'assets')}" placeholder="assets"></div></div><div class="settings-actions"><button type="button" class="btn" data-action="logout">退出 GitHub</button><button type="submit" class="btn btn-primary">保存并读取仓库</button></div></form></div><div class="card settings-card"><h3>登录身份</h3><p>网站不会要求你复制或粘贴 GitHub Token。</p><div class="account-panel"><div class="user-avatar" data-account-avatar>${escC((S.auth?.login||'G').slice(0,1).toUpperCase())}</div><div><b data-account-name>${escC(S.auth?.login||'GitHub 用户')}</b><small>Token 内存会话</small></div></div><div class="info-list"><div class="info-row"><span>当前资源仓库</span><b>${escC(S.repo.owner&&S.repo.repo?`${S.repo.owner}/${S.repo.repo}`:'未配置')}</b></div>${S.repo.owner&&S.repo.repo?`<button type="button" class="btn btn-sm" data-action="open-repo">打开图片资源仓库 ↗</button>`:''}<div class="info-row"><span>分支</span><b>${escC(S.repo.branch||'main')}</b></div><div class="info-row"><span>图片目录</span><b>${escC(S.repo.assetsPath||'assets')}</b></div><div class="info-row"><span>授权方式</span><b style="color:#4aac7f">经典 Token</b></div></div><div class="security-note">Token 只在服务器内存会话中使用；“记住此设备”仅保存在当前浏览器本地。正式使用请启用 HTTPS。</div></div></div>`; }
async function loadAdminPolicy() { if (!S.isAdmin) return; try { const response=await fetch('/api/admin/policy',{credentials:'include'}); if(response.ok){ const data=await response.json(); S.allowAll=Boolean(data.allowAll); S.allowedUsers=Array.isArray(data.allowed)?data.allowed:[]; } } catch { /* policy panel can show defaults */ } }
async function saveAdminPolicy(form) { const data=new FormData(form), allowed=String(data.get('allowed')||'').split(',').map(value=>value.trim().toLowerCase()).filter(Boolean); const response=await fetch('/api/admin/policy',{method:'PUT',credentials:'include',headers:{'Content-Type':'application/json','X-CSRF-Token':S.csrf},body:JSON.stringify({allowAll:data.get('allowAll')==='on',allowed})}); const result=await response.json().catch(()=>({})); if(!response.ok) throw new Error(result.message||'访问策略保存失败'); S.allowAll=Boolean(result.allowAll); S.allowedUsers=result.allowed||[]; renderC(); notify('访问策略已保存'); }
function adminPage() {
  if (!S.adminConfigured) return `<div class="page-heading"><div><h2>管理后台</h2><p>用于控制 GitHub 用户访问权限。</p></div></div><div class="card settings-card"><h3>未设置管理员</h3><p>请在 VPS 环境变量中设置 ADMIN_GITHUB_LOGIN。</p><pre class="admin-code">ADMIN_GITHUB_LOGIN=beiwang02</pre></div>`;
  if (!S.isAdmin) return `<div class="page-heading"><div><h2>管理后台</h2><p>当前账号没有管理员权限。</p></div></div>${emptyC('♙','无权访问','只有管理员可以管理网站用户。')}`;
  return `<div class="page-heading"><div><h2>管理后台</h2><p>控制哪些 GitHub 用户可以使用网站。</p></div><div class="heading-actions"><span class="connection-badge"><i class="status-dot"></i>管理员</span></div></div><div class="card settings-card"><form id="adminPolicyForm"><h3>访问策略</h3><p>允许所有人时，任何 GitHub 登录用户都可以使用；关闭后只允许名单和管理员。</p><label class="policy-toggle"><input type="checkbox" name="allowAll" ${S.allowAll?'checked':''}> 允许所有 GitHub 用户</label><div class="modal-field" style="margin-top:18px"><label>允许名单（逗号分隔）</label><input name="allowed" value="${escC(S.allowedUsers.join(','))}" placeholder="friend1,friend2"></div><p class="field-help">从允许名单中移除用户，就等于不再允许他使用。管理员账号始终保留权限。</p><div class="settings-actions"><button type="submit" class="btn btn-primary">保存访问策略</button></div></form></div>`;
}

function renderC() {
  document.body.classList.toggle('auth-screen', !S.auth);
  if (!S.auth) { $c('#app').innerHTML=loginView(); applyAppearance(); return; }
  if(S.view==='library-detail') S.view='libraries';
  const views={overview:overviewView,libraries:librariesView,assets:assetsView,activity:activityPage,settings:settingsPage,admin:adminPage};
  $c('#app').innerHTML=(views[S.view]||overviewView)(); setMetaC();
  applyAppearance();
}
function openC(html) { $c('#modalRoot').innerHTML=`<div class="modal-backdrop" data-action="modal-backdrop"><div class="modal">${html}</div></div>`; }
function tokenGuideModal() { openC(`<div class="modal-head"><div><h2>经典 Token 创建教程</h2></div><button class="modal-close" data-action="close-modal">×</button></div><div class="modal-body token-guide-body"><ol><li>打开 GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)。</li><li>点击 Generate new token (classic)，设置有效期。</li><li>权限列表只勾选 <b>repo → public_repo</b>。</li><li>其他权限不要勾选，生成后复制 Token 粘贴到登录框。</li></ol></div>`); }
function closeC() { S.modalConfirm=null; if($c('#groupCreateForm')&&S.uploadDraft){const draft=S.uploadDraft;S.uploadDraft=null;uploadModal(draft);return;} S.uploadDraft=null; $c('#modalRoot').innerHTML=''; }
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
function nameModal(kind,title,value,description) { openC(`<div class="modal-head"><div><h2>${escC(title)}</h2><p>${escC(description)}</p></div><button class="modal-close" data-action="close-modal">×</button></div><form id="${kind}Form"><div class="modal-body"><div class="modal-field"><label>名称</label><input name="name" value="${escC(value)}" placeholder="new-group" required autofocus></div></div><div class="modal-actions"><button type="button" class="btn" data-action="close-modal">取消</button><button type="submit" class="btn btn-primary">保存</button></div></form>`); setTimeout(()=>$c(`#${kind}Form input`)?.select(),0); }
function groupModal(fromUpload=false) { const draft=fromUpload?captureUploadDraft():null; nameModal('groupCreate','新建图片分组','','分组会作为目录创建在 GitHub 图床仓库中。'); S.uploadDraft=draft; }
function manageGroupModal() { if(!S.group)return; openC(`<div class="modal-head"><div><h2>管理分组</h2><p>重命名会同步移动该分组内的图片。</p></div><button class="modal-close" data-action="close-modal">×</button></div><form id="groupManageForm"><div class="modal-body"><div class="modal-field group-name-field"><div class="group-name-label"><label for="group-name-input">分组名称</label><button type="button" class="text-link group-delete-link" data-action="confirm-delete-group" data-group="${escC(S.group)}">删除分组</button></div><input id="group-name-input" name="name" value="${escC(S.group)}" required autofocus></div></div><div class="modal-actions"><button type="button" class="btn" data-action="close-modal">取消</button><button type="submit" class="btn btn-primary">保存改名</button></div></form>`); }
function captureUploadDraft() { const f=$c('#uploadForm'); if(!f)return S.uploadDraft; return {file:f.elements.file.files[0]||null,name:f.elements.name.value,group:f.elements.group.value,library:f.elements.library.value}; }

function uploadModal(draft=S.uploadDraft) { const uploadGroups=[...new Set([...S.groups.map(g=>g.name),...S.assets.map(a=>a.group).filter(Boolean)])].sort(); const defaultGroup=draft?.group&&uploadGroups.includes(draft.group)?draft.group:(S.group&&uploadGroups.includes(S.group)?S.group:(uploadGroups[0]||'')); openC(`<div class="modal-head"><div><h2>上传图片资源</h2><p>上传会作为一次 Git 提交写入当前仓库，可同时加入 JSON 库。</p></div><button class="modal-close" data-action="close-modal">×</button></div><form id="uploadForm"><div class="modal-body"><label class="drop-zone" id="dropZone"><div class="drop-icon">⇧</div><strong>点击选择或拖入图片</strong><small>支持 PNG、JPG、WEBP、GIF、SVG 等图片格式</small><input name="file" id="fileInput" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" hidden></label><div class="preview-file" id="filePreview"><img id="fileThumb" alt=""><span id="fileName"></span><button type="button" class="preview-clear" data-action="clear-upload-file" aria-label="清除已选择的图片">×</button></div><div class="modal-field"><label>图片名称</label><input name="name" id="uploadName" value="${escC(draft?.name||'')}" placeholder="例如：netflix" required></div><div class="modal-field"><label>图片分组</label><select name="group" id="uploadGroup">${uploadGroups.length?uploadGroups.map(g=>`<option value="${escC(g)}" ${defaultGroup===g?'selected':''}>${escC(g)}</option>`).join(''):'<option value="">暂无分组，请先到图片资源页面新建</option>'}</select><button type="button" class="text-link modal-inline-create" data-action="new-group-from-upload">＋ 新建分组</button></div><div class="modal-field"><label>上传后加入 JSON 库（可选）</label><select name="library"><option value="">暂不加入</option>${S.libraries.map(l=>`<option value="${escC(l.file)}" ${draft?.library===l.file?'selected':''}>${escC(l.name)}</option>`).join('')}</select></div></div><div class="modal-actions"><button type="button" class="btn" data-action="close-modal">取消</button><button class="btn btn-primary" type="submit">上传并提交</button></div></form>`); const input=$c('#fileInput'), zone=$c('#dropZone'); let previewVersion=0; const show=file=>{if(!file)return; const version=++previewVersion, label=$c('#fileName'), thumb=$c('#fileThumb'); const info=`${file.name} · ${(file.size/1024).toFixed(1)} KB`; label.textContent=`已选择：${info}`; $c('#filePreview').classList.add('show'); thumb.removeAttribute('src'); thumb.hidden=true; const imageType=file.type.startsWith('image/')||/\.(png|jpe?g|webp|gif|svg)$/i.test(file.name); if(imageType){ const reader=new FileReader(); reader.onload=()=>{if(version!==previewVersion)return; thumb.onload=()=>{thumb.hidden=false;}; thumb.onerror=()=>{thumb.hidden=true;label.textContent=`已选择：${info}（预览失败，请更换图片）`;}; thumb.src=String(reader.result);}; reader.onerror=()=>{if(version===previewVersion)label.textContent=`已选择：${info}（文件读取失败）`;}; reader.readAsDataURL(file); } else label.textContent=`已选择：${info}（暂不支持此格式）`; if(!$c('#uploadName').value)$c('#uploadName').value=file.name.replace(/\.[^.]+$/,'').replace(/[^\w-]+/g,'-').toLowerCase();}; input.addEventListener('change',()=>show(input.files[0])); $c('#filePreview').addEventListener('click',e=>{if(!e.target.closest('[data-action="clear-upload-file"]'))return; previewVersion++; input.value=''; const preview=$c('#filePreview'), thumb=$c('#fileThumb'), label=$c('#fileName'); thumb.removeAttribute('src'); thumb.hidden=true; label.textContent=''; preview.classList.remove('show');}); ['dragenter','dragover'].forEach(t=>zone.addEventListener(t,e=>{e.preventDefault();zone.classList.add('dragging');})); ['dragleave','drop'].forEach(t=>zone.addEventListener(t,e=>{e.preventDefault();zone.classList.remove('dragging');})); zone.addEventListener('drop',e=>{if(e.dataTransfer.files[0]){input.files=e.dataTransfer.files;show(input.files[0]);}}); if(draft?.file){try{const dt=new DataTransfer();dt.items.add(draft.file);input.files=dt.files;show(draft.file);}catch{notify('已保留图片名称和设置，请重新选择图片文件。','error');}} }
function libraryPickerModal() { const current=S.libraries.find(x=>x.id===S.selectedLibrary); openC(`<div class="modal-head"><div><h2>选择 JSON 库</h2><p>切换后会显示该库的图片引用。</p></div><button class="modal-close" data-action="close-modal">×</button></div><div class="modal-body library-picker-modal"><div class="library-picker-list">${S.libraries.map(lib=>lib.id===current?.id?`<div class="library-picker-row selected"><button class="library-picker-option selected" data-action="select-library" data-id="${escC(lib.id)}"><span class="library-logo" style="background:${lib.gradient||'linear-gradient(135deg,#6672ff,#7b8af1)'}">${escC(lib.name.slice(0,1))}</span><span><b>${escC(lib.name)}</b><small>${lib.count} 个图片引用 · ${escC(lib.file)}</small></span><em>当前</em></button><button class="icon-btn library-picker-delete" data-action="delete-library" data-id="${escC(lib.id)}" aria-label="删除 ${escC(lib.name)}" title="删除 JSON 文件">删除</button></div>`:`<button class="library-picker-option" data-action="select-library" data-id="${escC(lib.id)}"><span class="library-logo" style="background:${lib.gradient||'linear-gradient(135deg,#6672ff,#7b8af1)'}">${escC(lib.name.slice(0,1))}</span><span><b>${escC(lib.name)}</b><small>${lib.count} 个图片引用 · ${escC(lib.file)}</small></span><i>›</i></button>`).join('')}</div><button class="library-picker-create" data-action="new-library">＋ 新建 JSON 库</button></div>`); }
function libraryModal(edit=false) { S.editingLibrary=edit?S.selectedLibrary:null; const lib=edit?S.libraries.find(x=>x.id===S.selectedLibrary):null; openC(`<div class="modal-head"><div><h2>${edit?'编辑 JSON 库':'新建 JSON 库'}</h2><p>${edit?'修改名称、说明或移动 JSON 文件。':'会在仓库中创建一个带 icons 数组的 JSON 文件。'}</p></div><button class="modal-close" data-action="close-modal">×</button></div><form id="libraryForm"><div class="modal-body"><div class="modal-field"><label>JSON 库名称</label><input name="name" value="${escC(lib?.name||'')}" placeholder="例如：emby图标库" required></div><div class="modal-field"><label>JSON 库说明</label><input name="description" value="${escC(lib?.description||'')}" placeholder="可选，填写这个库的用途"></div><div class="modal-field"><label>JSON 文件名</label><input name="path" value="${escC(edit?lib?.file?.split('/').pop()?.replace(/\.json$/i,'')||'':'')}" placeholder="例如：emby-icon" required><small class="field-help">文件名不需要填写 .json 后缀，系统会自动补全。</small></div></div><div class="modal-actions"><button type="button" class="btn" data-action="close-modal">取消</button><button type="submit" class="btn btn-primary">${edit?'保存修改':'创建 JSON 库'}</button></div></form>`); }
function createRepoModal() { openC(`<div class="modal-head"><div><h2>创建 GitHub 仓库</h2><p>将在当前 GitHub 账号下创建一个公开仓库。</p></div><button class="modal-close" data-action="close-modal">×</button></div><form id="createRepoForm"><div class="modal-body"><div class="modal-field"><label>仓库名称</label><input name="name" placeholder="例如：my-image-host" required></div><div class="modal-field"><label>仓库说明</label><input name="description" placeholder="可选"></div><p class="field-help">创建后网站会自动把它设为当前图床仓库，并读取真实内容。</p></div><div class="modal-actions"><button type="button" class="btn" data-action="close-modal">取消</button><button type="submit" class="btn btn-primary">创建并使用</button></div></form>`); }
function editIconModal(index) { const lib=S.libraries.find(x=>x.id===S.selectedLibrary), icon=lib?.icons?.[index]; if(!lib||!icon)return; openC(`<div class="modal-head"><div><h2>编辑图片引用</h2><p>修改会更新 ${escC(lib.file)}，不会删除图片文件。</p></div><button class="modal-close" data-action="close-modal">×</button></div><form id="iconForm"><input type="hidden" name="index" value="${index}"><div class="modal-body"><div class="modal-field"><label>图片名称</label><input name="name" value="${escC(icon.name)}" required></div><div class="modal-field"><label>GitHub Raw 图片直链</label><input name="url" value="${escC(icon.url)}" required></div></div><div class="modal-actions"><button type="button" class="btn" data-action="close-modal">取消</button><button class="btn btn-primary" type="submit">保存引用</button></div></form>`); }
function assetModal(item) { openC(`<div class="modal-head"><div><h2>${escC(item.name)}</h2><p>${escC(item.group||'根目录')} 分组 · ${escC(item.ext)} 图片资源</p></div><button class="modal-close" data-action="close-modal">×</button></div><div class="modal-body"><div class="asset-detail-preview"><img src="${escC(item.url)}" alt="${escC(item.name)}"></div><div class="detail-readonly"><b>GitHub Raw 直链</b><p>${escC(item.url)}</p></div><div class="detail-readonly"><b>仓库路径</b><p>${escC(item.path)}</p></div></div><div class="modal-actions asset-detail-actions"><button class="btn" data-action="copy" data-copy="${escC(item.url)}">⧉ 复制直链</button><button class="btn btn-primary" data-action="asset-library" data-id="${escC(item.id)}">加入 JSON 库</button><button class="btn" data-action="rename-asset" data-id="${escC(item.id)}">改名并同步引用</button><button class="btn btn-danger" data-action="delete-asset" data-id="${escC(item.id)}">删除图片</button></div>`); }
function iconModal(icon) { openC(`<div class="modal-head"><div><h2>${escC(icon.name)}</h2><p>JSON 图片引用详情</p></div><button class="modal-close" data-action="close-modal">×</button></div><div class="modal-body"><div class="json-icon-detail-preview"><img src="${escC(icon.url)}" alt="${escC(icon.name)}"></div><div class="detail-readonly"><b>GitHub Raw 直链</b><p>${escC(icon.url)}</p></div></div><div class="modal-actions icon-detail-actions"><button class="btn" data-action="copy" data-copy="${escC(icon.url)}">⧉ 复制直链</button><button class="btn btn-danger" data-action="delete-icon" data-index="${icon.index}">删除引用</button></div>`); }
function bulkModal(item=null) {
  const items=item?[item]:S.assets.filter(x=>S.selected.has(x.id));
  if(!items.length)return notify('请先选择图片','error');
  openC(`<div class="modal-head"><div><h2>加入 JSON 库</h2><p>所选图片会去重后追加到目标 JSON 库。</p></div><button class="modal-close" data-action="close-modal">×</button></div><form id="bulkForm"><div class="modal-body">${S.libraries.length?`<div class="modal-field"><label>目标 JSON 库</label><select name="library" required>${S.libraries.map(l=>`<option value="${escC(l.file)}">${escC(l.name)} · ${l.count} 个</option>`).join('')}</select></div>`:'<p class="field-help">暂无 JSON 库，请先新建 JSON 库后再加入图片。</p><button type="button" class="btn" data-action="new-library">＋ 新建 JSON 库</button>'}<p class="field-help">已选择 ${items.length} 张图片，图片文件不会被移动或删除。</p></div><div class="modal-actions"><button type="button" class="btn" data-action="close-modal">取消</button><button type="submit" class="btn btn-primary" ${S.libraries.length?'':'disabled'}>加入 JSON 库</button></div></form>`);
  const form=$c('#bulkForm'); form.libraryItems=items; form.singleAsset=!!item;
}
async function readRepo(form) { const data = form instanceof HTMLFormElement ? new FormData(form) : { get:key => form.elements[key]?.value ?? '' }; S.repo={owner:String(data.get('owner')).trim(),repo:String(data.get('repo')).trim(),branch:String(data.get('branch')).trim()||'main',assetsPath:String(data.get('assetsPath')).trim().replace(/^\/+|\/+$/g,'')||'assets'}; if(!S.repo.owner||!S.repo.repo)return notify('请填写仓库用户名和名称','error'); localStorage.setItem('gh-image-repo',JSON.stringify(S.repo)); S.loading=true;renderC();notify('正在读取 GitHub 仓库…'); try { await currentClient().ensureRootDirectories(); const data=await currentClient().load(); S.connected=true; S.repo.assetsPath=data.root; localStorage.setItem('gh-image-repo',JSON.stringify(S.repo)); S.groups=data.groups;S.group=S.group&&data.groups.some(g=>g.name===S.group)?S.group:(data.groups[0]?.name||'');S.assets=data.assets;S.libraries=data.libraries.map((x,i)=>({...x,gradient:['linear-gradient(135deg,#7580ff,#8c64e9)','linear-gradient(135deg,#ffb26d,#eb7574)','linear-gradient(135deg,#43cec4,#5aa7e8)'][i%3]})); S.selected.clear();S.activity.unshift({title:'读取了 GitHub 仓库',detail:`${S.repo.owner}/${S.repo.repo} · ${S.libraries.length} 个 JSON、${S.assets.length} 张图片`,time:'刚刚'}); S.view='overview';notify(`读取完成：${S.libraries.length} 个 JSON、${S.assets.length} 张图片`); } catch(e){S.connected=false;notify(e.message||'读取失败','error');} finally{S.loading=false;renderC();} }
async function refreshRepo() { if(!S.connected)return notify('请先连接你的仓库','error'); const oldView=S.view; const data=await currentClient().load(); S.repo.assetsPath=data.root; localStorage.setItem('gh-image-repo',JSON.stringify(S.repo)); S.groups=data.groups;S.group=S.group&&data.groups.some(g=>g.name===S.group)?S.group:(data.groups[0]?.name||'');S.assets=data.assets;S.libraries=data.libraries.map((x,i)=>({...x,gradient:['linear-gradient(135deg,#7580ff,#8c64e9)','linear-gradient(135deg,#ffb26d,#eb7574)','linear-gradient(135deg,#43cec4,#5aa7e8)'][i%3]})); S.view=oldView; S.selected.clear(); renderC(); }
// One UI operation owns the repository context until its refresh completes.
let pendingSubmission = false;
function beginSubmission(scope, label='正在保存…') {
  if(pendingSubmission || scope.dataset.busy==='1') return null;
  pendingSubmission=true;
  const previousBusy=scope.getAttribute('aria-busy');
  scope.dataset.busy='1'; scope.setAttribute('aria-busy','true');
  const buttons=scope.matches('button')?[scope]:[...scope.querySelectorAll('button')];
  const snapshots=buttons.map(button=>({button,disabled:button.disabled,html:button.innerHTML}));
  buttons.forEach(button=>{button.disabled=true;if(button===scope || button.type==='submit')button.textContent=label;});
  return ()=>{
    snapshots.forEach(({button,disabled,html})=>{button.disabled=disabled;button.innerHTML=html;});
    delete scope.dataset.busy;
    if(previousBusy===null)scope.removeAttribute('aria-busy');else scope.setAttribute('aria-busy',previousBusy);
    pendingSubmission=false;
  };
}
async function runSubmission(scope,label,run) {
  const finish=beginSubmission(scope,label); if(!finish)return;
  try { await run(); } catch(error) { notify(error.message||'操作失败','error'); } finally { finish(); }
}
async function formSubmit(e) {
  e.preventDefault(); const form=e.target;
  const labels={tokenLoginForm:'正在验证…',createRepoForm:'正在创建…',repoForm:'正在读取…',uploadForm:'正在上传并提交…'};
  const finish=beginSubmission(form,labels[form.id]||'正在保存…'); if(!finish)return;
  try {
    if(form.id==='adminPolicyForm') return await saveAdminPolicy(form);
    if(form.id==='tokenLoginForm') { const data=new FormData(form), token=String(data.get('token')||'').trim(); if(!token) throw new Error('请先输入 GitHub Token。'); const submit=form.querySelector('[type="submit"]'); if(submit){submit.disabled=true;submit.textContent='正在验证…';} if(data.get('rememberToken')==='on') localStorage.setItem('gh-image-remembered-token',token); else localStorage.removeItem('gh-image-remembered-token'); const response=await fetch('/api/auth/token',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})}); const result=await response.json().catch(()=>({})); if(!response.ok) throw new Error(result.message||`Token 登录失败（HTTP ${response.status}）`); sessionStorage.setItem('gh-login-success','1'); location.reload(); return; }
    if(form.id==='createRepoForm') return await createRepositoryFromModal(form);
    if(form.id==='repoForm') return await readRepo(form);
    if(form.id==='uploadForm') { const group=String(form.elements.group.value||'').trim(); if(!group)return notify('当前没有图片分组，请先到图片资源页面新建分组。','error'); const result=await currentClient().upload(form.elements.file.files[0],form.elements.name.value,group,form.elements.library.value); closeC(); await refreshRepo(); notify(`已上传“${result.name}”，并提交到 GitHub`); return; }
    if(form.id==='groupCreateForm') { const name=String(new FormData(form).get('name')||'').trim(); if(!name)return; const draft=S.uploadDraft; await currentClient().createGroup(name); await refreshRepo(); S.group=name; S.uploadDraft=null; if(draft){draft.group=name; uploadModal(draft);} else {closeC();} notify('图片分组已创建'); return; }
    if(form.id==='groupManageForm') { const name=String(new FormData(form).get('name')||'').trim(); if(!name||name===S.group){closeC();return;} await currentClient().renameGroup(S.group,name); S.group=name; closeC(); await refreshRepo(); notify('分组已重命名'); return; }
    if(form.id==='repoRenameForm') { const name=String(new FormData(form).get('name')||'').trim(); if(!name||name===S.repo.repo){closeC();return;} await currentClient().renameRepository(name); S.repo.repo=name; localStorage.setItem('gh-image-repo',JSON.stringify(S.repo)); closeC(); renderC(); notify('仓库已改名'); return; }
    if(form.id==='assetRenameForm') { const item=S.assets.find(x=>x.id===form.dataset.id), name=String(new FormData(form).get('name')||'').trim(); if(!item||!name||name===item.name){closeC();return;} await currentClient().renameAsset(item,name); closeC(); await refreshRepo(); notify('图片已改名，JSON 引用已同步'); return; }
    if(form.id==='libraryForm') { const data=new FormData(form), name=String(data.get('name')).trim(), description=String(data.get('description')).trim(), inputPath=String(data.get('path')).trim(), path=inputPath.replace(/\.json$/i,'')+'.json'; if(!name)return notify('请填写 JSON 库名称','error'); if(!inputPath)return notify('请填写 JSON 文件名','error'); const old=S.libraries.find(x=>x.id===S.editingLibrary); if(old) await currentClient().saveLibrary(old.file,path,name,description); else await currentClient().createLibrary(path,name,description); closeC(); await refreshRepo(); notify('JSON 库已提交'); return; }
    if(form.id==='iconForm') { const data=new FormData(form), lib=S.libraries.find(x=>x.id===S.selectedLibrary); await currentClient().saveIcon(lib.file,Number(data.get('index')),String(data.get('name')),String(data.get('url')),lib.sha); closeC(); await refreshRepo(); S.view='libraries'; renderC(); notify('图片引用已更新'); return; }
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
  } catch(error) { notify(error.message||'操作失败','error'); } finally { finish(); }
}
async function logoutC() { try { await fetch('/api/auth/logout',{method:'POST',credentials:'include',headers:{'X-CSRF-Token':S.csrf}}); } finally { localStorage.removeItem('gh-image-remembered-token'); location.replace('/?logged_out=1'); } }
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

async function bootAuth() { if(location.protocol!=='http:'&&location.protocol!=='https:'){ renderC(); return; } try { const r=await fetch('/api/auth/me',{credentials:'include'}), data=await r.json(); S.auth=data.user||null; S.csrf=data.csrf||''; S.oauthEnabled=Boolean(data.oauthEnabled); S.tokenLoginEnabled=Boolean(data.tokenLoginEnabled); S.adminConfigured=Boolean(data.adminConfigured); S.isAdmin=Boolean(data.isAdmin); S.policyConfigured=Boolean(data.policyConfigured); if(S.auth) { await loadAdminPolicy(); renderC(); if(sessionStorage.getItem('gh-login-success')==='1'){ sessionStorage.removeItem('gh-login-success'); notify('已登录'); } await autoSelectRepository(); } } catch { S.auth=null; } renderC(); }

document.addEventListener('click', async e => {
  const target=e.target.closest('[data-action],[data-view]'); if(!target)return;
  if(pendingSubmission){e.preventDefault();return;}
  const view=target.dataset.view;
  if(view) { S.view=view; S.selected.clear(); $c('#sidebar').classList.remove('open'); renderC(); return; }
  const action=target.dataset.action;
  if(action==='token-guide'){ tokenGuideModal(); return; }
  if(action==='toggle-token'){ const input=$c('#mainTokenInput'); if(input){input.type=input.type==='password'?'text':'password'; target.textContent=input.type==='password'?'◉':'◎';} return; }
  if(action==='modal-backdrop'){if(e.target===target)closeC();return;}
  if(action==='close-modal'){closeC();return;}
  if(action==='toggle-sidebar'){ $c('#sidebar').classList.toggle('open'); return; }
  if(action==='open-project'){ window.open('https://github.com/beiwang02/github-assets','_blank'); return; }
  if(action==='open-repo'){ if(S.repo.owner&&S.repo.repo) window.open(`https://github.com/${encodeURIComponent(S.repo.owner)}/${encodeURIComponent(S.repo.repo)}`,'_blank'); else notify('当前还没有连接仓库','error'); return; }
  if(action==='toggle-theme'){cycleAppearance();target.blur();return;}
  if(action==='account-menu'){accountMenu();return;}
  if(action==='forget-token'){localStorage.removeItem('gh-image-remembered-token');closeC();notify('已清除此设备记住的 Token，当前会话保留');return;}
  if(action==='page-back'){if(history.state?.ghView&&history.state.depth>0)history.back();else{S.view='overview';renderC();}return;}
  if(action==='logout'){await runSubmission(target,'正在退出…',logoutC);return;}
  if(action==='create-repo'){if(!S.auth)return notify('请先登录 GitHub','error');createRepoModal();return;}
  if(action==='use-repo'){S.repo={owner:target.dataset.owner,repo:target.dataset.repo,branch:target.dataset.branch||'main',assetsPath:target.dataset.assetsPath||'assets'};renderC();return;}
  if(action==='settings'){closeC();S.view='settings';renderC();return;}
  if(action==='refresh'){await runSubmission(target,'正在刷新…',refreshRepo);return;}
  if(action==='upload'){if(!S.connected)return notify('请先连接你的仓库','error');uploadModal();return;}
  if(action==='new-library'){if(!S.connected)return notify('请先连接你的仓库','error');libraryModal(false);return;}
  if(action==='new-icon'){if(!S.connected)return notify('请先连接你的仓库','error');uploadModal();return;}
  if(action==='open-library-picker'){libraryPickerModal();return;}
  if(action==='select-library'){S.selectedLibrary=target.dataset.id||target.value;S.iconQuery='';closeC();renderC();return;}
  if(action==='group'){S.group=target.dataset.group;S.selected.clear();renderC();return;}
  if(action==='select-all'){const list=filteredAssets(); if(list.length&&list.every(x=>S.selected.has(x.id)))list.forEach(x=>S.selected.delete(x.id));else list.forEach(x=>S.selected.add(x.id));syncAssetSelectionUI(list.map(x=>x.id));target.blur();return;}
  if(action==='select-icon'){e.stopPropagation();const index=Number(target.dataset.index);S.selectedIcons.has(index)?S.selectedIcons.delete(index):S.selectedIcons.add(index);syncIconSelectionUI([index]);target.blur();return;}
  if(action==='select-all-icons'){const lib=S.libraries.find(x=>x.id===S.selectedLibrary), count=lib?.icons?.length||0;if(S.selectedIcons.size===count)S.selectedIcons.clear();else S.selectedIcons=new Set(Array.from({length:count},(_,i)=>i));syncIconSelectionUI();target.blur();return;}
  if(action==='delete-selected-icons'){const lib=S.libraries.find(x=>x.id===S.selectedLibrary), indexes=[...S.selectedIcons];if(!lib||!indexes.length)return;confirmC('移除图片引用',`从 ${lib.name} 中移除选中的 ${indexes.length} 条图片引用？图片文件不会删除。`,async()=>{await currentClient().removeIcons(lib.file,indexes,lib.sha);S.selectedIcons.clear();closeC();await refreshRepo();notify('图片引用已移除');},'移除引用');return;}
  if(action==='asset-select'){e.preventDefault();e.stopImmediatePropagation();const id=target.dataset.id;S.selected.has(id)?S.selected.delete(id):S.selected.add(id);syncAssetSelectionUI([id]);target.blur();return;}
  if(action==='asset-open'){const item=S.assets.find(x=>x.id===target.dataset.id);if(item)assetModal(item);return;}
  if(action==='icon-open'){const lib=S.libraries.find(x=>x.id===S.selectedLibrary),index=Number(target.dataset.index),icon=lib?.icons?.[index];if(icon)iconModal({...icon,index});return;}
  if(action==='copy'){e.stopPropagation();target.blur();await copyC(target.dataset.copy||'');return;}
  if(action==='library-detail'){S.selectedLibrary=target.dataset.id;S.iconQuery='';S.view='libraries';renderC();return;}
  if(action==='edit-library'){e.stopPropagation();S.selectedLibrary=target.dataset.id||S.selectedLibrary;libraryModal(true);return;}
  if(action==='edit-icon'){editIconModal(Number(target.dataset.index));return;}
  if(action==='asset-library'){const item=S.assets.find(x=>x.id===target.dataset.id);if(item)bulkModal(item);return;}
  if(action==='bulk-library'){if(!S.selected.size)return;bulkModal();return;}
  if(action==='confirm-exec'){const run=S.modalConfirm;if(run)await runSubmission(target,'正在处理…',async()=>{await run();if(S.modalConfirm===run)S.modalConfirm=null;});return;}
  if(action==='rename-repo'){if(S.repo.repo)nameModal('repoRename','重命名 GitHub 仓库',S.repo.repo,'仓库名称会同步更新到 GitHub。');return;}
  if(action==='delete-repo'){if(S.repo.owner&&S.repo.repo)confirmRepositoryDeletion();return;}
  if(action==='delete-library'){e.stopPropagation();const lib=S.libraries.find(x=>x.id===target.dataset.id);if(!lib)return;confirmC('永久删除 JSON 文件',`永久删除 ${lib.name}？
文件：${lib.file}`,async()=>{await currentClient().deleteLibrary(lib.file);closeC();await refreshRepo();notify('JSON 文件已删除');});return;}
  if(action==='delete-icon'){const lib=S.libraries.find(x=>x.id===S.selectedLibrary),index=Number(target.dataset.index);if(!lib)return;confirmC('移除图片引用',`从 ${lib.name} 中移除这个图片引用？图片文件不会删除。`,async()=>{await currentClient().removeIcons(lib.file,[index],lib.sha);closeC();await refreshRepo();S.view='library-detail';renderC();notify('图片引用已移除');},'移除引用');return;}
  if(action==='rename-asset'){const item=S.assets.find(x=>x.id===target.dataset.id);if(item){openC(`<div class="modal-head"><div><h2>重命名图片</h2><p>图片文件和相关 JSON 引用会同步更新。</p></div><button class="modal-close" data-action="close-modal">×</button></div><form id="assetRenameForm" data-id="${escC(item.id)}"><div class="modal-body"><div class="modal-field"><label>图片名称</label><input name="name" value="${escC(item.name)}" required autofocus></div></div><div class="modal-actions"><button type="button" class="btn" data-action="close-modal">取消</button><button class="btn btn-primary" type="submit">保存</button></div></form>`);}return;}
  if(action==='delete-asset'){const item=S.assets.find(x=>x.id===target.dataset.id);if(!item)return;confirmC('永久删除图片',`永久删除 ${item.name}？相关 JSON 引用会同步移除。`,async()=>{await currentClient().deleteAsset(item);closeC();await refreshRepo();notify('图片和相关引用已删除');});return;}
  if(action==='bulk-delete'){const items=S.assets.filter(x=>S.selected.has(x.id));if(!items.length)return;confirmC('永久删除选中图片',`永久删除选中的 ${items.length} 张图片？`,async()=>{await currentClient().deleteSelected(items);S.selected.clear();closeC();await refreshRepo();notify(`已删除 ${items.length} 张图片并同步引用`);});return;}
  if(action==='new-group'){groupModal(false);return;}
  if(action==='new-group-from-upload'){groupModal(true);return;}
  if(action==='manage-group'){manageGroupModal();return;}
  if(action==='confirm-delete-group'){const group=target.dataset.group;if(!group)return;confirmC('永久删除分组',`永久删除分组 ${group} 及其中图片？`,async()=>{await currentClient().deleteGroup(group);S.group='';closeC();await refreshRepo();notify('分组已删除');});return;}
});
document.addEventListener('click',e=>{ const sidebar=$c('#sidebar'); if(sidebar?.classList.contains('open')&&!e.target.closest('#sidebar')&&!e.target.closest('.mobile-menu')){ sidebar.classList.remove('open'); e.preventDefault(); e.stopImmediatePropagation(); } },true);
document.addEventListener('submit',formSubmit);
// Clear Safari's sticky button focus after each touch release.
document.addEventListener('pointerup',e=>{const button=e.target.closest('button');if(button)button.blur();});
document.addEventListener('input',e=>{const b=e.target.dataset.bind;if(!b)return;if(b==='asset-search')S.assetQuery=e.target.value;if(b==='library-search')S.libraryQuery=e.target.value;if(b==='icon-search')S.iconQuery=e.target.value;const cursor=e.target.selectionStart;renderC();const next=document.querySelector(`[data-bind="${b}"]`);if(next){next.focus();next.setSelectionRange(cursor,cursor);}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!pendingSubmission)closeC();if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$c('#globalSearch')?.focus();}});
renderC(); void bootAuth();

/* Overview quick asset panel */
function overviewQuickAssets() {
  if (!S.assets.length) return `<section class="overview-assets-section"><div class="section-row"><h3>最近图片资源</h3><button class="text-link" data-view="assets">查看全部 →</button></div><div class="card quick-empty">${emptyC('▧',S.connected?'暂无图片资源':'连接仓库后显示真实图片','图片资源会直接从你的 GitHub 仓库读取。',S.connected?'upload':'settings',S.connected?'上传图片':'连接仓库')}</div></section>`;
  return `<section class="overview-assets-section"><div class="section-row"><h3>最近图片资源</h3><button class="text-link" data-view="assets">查看全部 →</button></div><div class="card quick-assets-grid">${S.assets.slice(0,6).map(item=>`<div class="quick-asset" data-action="asset-open" data-id="${escC(item.id)}"><div class="quick-asset-image"><img src="${escC(item.url)}" alt="${escC(item.name)}" loading="lazy"></div><div class="quick-asset-name-row"><b title="${escC(item.name)}" aria-label="${escC(item.name)}">${escC(item.name)}</b><button class="quick-copy" data-action="copy" data-copy="${escC(item.url)}" title="复制直链" aria-label="复制 ${escC(item.name)} 直链">⧉</button></div><small>${escC(item.group||'根目录')}</small></div>`).join('')}</div></section>`;
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
  document.documentElement.style.backgroundColor=dark?'#0b1629':'#f6f8fc';
  document.body.style.backgroundColor=dark?'#0b1629':'#f6f8fc';
  const themeMeta=document.querySelector('meta[name="theme-color"]');
  if(themeMeta) themeMeta.content=dark?'#0b1629':'#f6f8fc';
  const labels={system:'跟随系统（点击切换）',dark:'黑夜模式（点击切换）',light:'白天模式（点击切换）'};
  const icons={
    system:'<span class="theme-glyph">◐</span>',
    dark:'<span class="theme-glyph">☾</span>',
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
  openC(`<div class="modal-head"><div class="account-modal-head">${avatar?`<img src="${escC(avatar)}" alt="">`:''}<div><h2>${escC(displayName)}</h2><p>@${escC(login)}</p></div></div><button class="modal-close" data-action="close-modal">×</button></div><div class="modal-body choice-menu">${S.tokenLoginEnabled?'<button class="btn" data-action="forget-token">清除此设备记住的 Token</button>':''}<button class="btn" data-action="logout">退出并返回登录页</button></div>`);
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
  if(S.view!=='overview')$c('#app').insertAdjacentHTML('afterbegin','<button class="btn page-back" data-action="page-back">← 返回上一页</button>');
};
window.addEventListener('popstate',e=>{closeC();if(e.state?.ghView){S.view=e.state.ghView;S.selectedLibrary=e.state.lib;lastRoute=S.view+'|'+(S.selectedLibrary||'');renderC();window.scrollTo(0,0);}});
renderC();
