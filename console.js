const S = {
  auth:null, csrf:'', oauthEnabled:false, tokenLoginEnabled:false, adminConfigured:false, isAdmin:false, policyConfigured:false, allowAll:true, allowedUsers:[], restoreRepo:'', connectionError:'', view:'overview', connected:false, loading:false, loginBusy:false,
  repo: JSON.parse(localStorage.getItem('gh-image-repo') || 'null') || { owner:'', repo:'', branch:'main', assetsPath:'assets' },
  groups:[], assets:[], libraries:[], repos:[], selected:new Set(), group:'全部', assetQuery:'', libraryQuery:'', iconQuery:'', activity:[]
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
  const meta={overview:['资源工作台','总览'],libraries:['内容管理','JSON 库'],assets:['内容管理','图片资源'],'library-detail':['JSON 库',S.libraries.find(x=>x.id===S.selectedLibrary)?.name||'图标库'],activity:['内容管理','同步记录'],settings:['系统设置','仓库设置'],admin:['系统设置','管理后台']};
  const [eyebrow,title]=meta[S.view]||meta.overview;
  $c('#pageEyebrow').textContent=eyebrow; $c('#pageTitle').textContent=title;
  $c('#repoName').textContent=S.repo.repo||'未选择仓库'; $c('#repoOwner').textContent=S.repo.owner?`${S.repo.owner} / ${S.repo.branch}`:'请先配置仓库';
  $c('#libraryCount').textContent=S.connected?S.libraries.length:'0'; $c('#assetCount').textContent=S.connected?S.assets.length:'0';
  const storageState=S.loading?'正在读取':(S.connected?'已连接':'未连接');
  $c('#storageStatus').textContent=storageState;
  $c('#storageBranch').textContent=S.loading?'正在从 GitHub 读取数据…':(S.connected?`${S.repo.owner}/${S.repo.repo} · ${S.repo.branch}`:'请打开“仓库设置”连接 GitHub');
  $c('#storageProgress').style.width=S.loading?'38%':(S.connected?'100%':'8%');
  $c('#storageDot').style.background=S.loading?'#ffb45f':(S.connected?'#4dd59d':'#a8b2c3');
  document.querySelectorAll('.nav-item[data-view]').forEach(n=>n.classList.toggle('active', n.dataset.view===(S.view==='library-detail'?'libraries':S.view)));
  const name=S.auth?.login||'GitHub 用户'; document.querySelectorAll('[data-account-name]').forEach(n=>n.textContent=name); document.querySelectorAll('[data-account-avatar]').forEach(n=>{ n.textContent=name.slice(0,1).toUpperCase(); });
}
function loginView() {
  const problem=new URLSearchParams(location.search).get('auth_error');
  const errors={ forbidden:'这个 GitHub 账号目前没有被允许使用此网站。', oauth_not_configured:'服务器尚未配置 GitHub OAuth App。', oauth_state:'登录校验已过期或无效，请重新登录。', oauth_denied:'你取消了 GitHub 授权。', oauth_exchange:'GitHub 授权码交换失败，请检查 OAuth App 配置。', oauth_user:'无法读取 GitHub 账号信息，请重新登录。' };
  const message=problem?(errors[problem]||'GitHub 登录失败，请重试。'):'使用 GitHub 授权管理自己的图片和 JSON，访问令牌只保存在服务器内存会话。';
  const oauthButton=S.oauthEnabled?'<a class="btn btn-github" href="/api/auth/github"><span class="github-logo">●</span> 使用 GitHub 登录</a>':'<button type="button" class="btn btn-github disabled-link" data-action="oauth-help"><span class="github-logo">●</span> GitHub 登录尚未配置</button>';
  const tokenFallback=S.tokenLoginEnabled?'<button type="button" class="token-login-link" data-action="token-login">使用 Token 临时测试</button>':'';
  return `<div class="auth-page"><div class="auth-grid"></div><div class="auth-card"><div class="auth-brand"><div class="brand-mark"><span>✦</span></div><div><strong>GITHUB 图床</strong><small>RESOURCE CONSOLE</small></div></div><span class="auth-kicker">GITHUB ACCESS</span><h2>登录图床控制台</h2><p>${escC(message)}</p>${oauthButton}${tokenFallback}<div class="first-use-guide"><strong>首次使用</strong><p>无需提前创建密钥，直接点击“使用 GitHub 登录”并授权即可。</p><details><summary>使用经典 Token 测试时怎么勾选？</summary><ol><li>GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)。</li><li>点击 Generate new token (classic)，设置有效期。</li><li>权限列表只勾选 <b>repo → public_repo</b>（访问公开仓库）。</li><li>其他权限全部不要勾选，生成后复制 Token 使用。</li></ol></details></div><a class="project-link" href="https://github.com/beiwang02/github-assets" target="_blank" rel="noreferrer"><span>●</span> 查看项目源码</a><small class="auth-note">授权后的访问令牌不会写入浏览器、本地文件或数据库。生产环境必须启用 HTTPS，并在 GitHub OAuth App 填写本网站回调地址。</small></div></div>`;
}

function coverStack(lib) { const list=(lib.icons||[]).slice(0,4); return `<div class="cover-stack">${list.map((x,i)=>`<img src="${escC(x.url)}" alt="">`).join('')}</div>`; }
function activityView(limit=20) { return S.activity.length?S.activity.slice(0,limit).map(a=>`<div class="activity-item"><div class="activity-line"><i class="activity-dot"></i></div><div class="activity-copy"><b>${escC(a.title)}</b><small>${escC(a.detail)} · ${a.time}</small></div></div>`).join(''):emptyC('◷','暂无同步记录','读取仓库或提交操作后会显示在这里。'); }
function overviewView() {
  const refs=S.libraries.reduce((n,x)=>n+(x.count||0),0);
  return `<div class="hero"><div class="hero-content"><span class="mini-label">GITHUB RESOURCE HUB</span><h2>把每一张图片，变成可复用的资源。</h2><p>集中管理 GitHub 图床、图片分组与 JSON 库，复制一条直链，就能在任何项目里使用。</p><div class="hero-actions"><button class="btn btn-primary" data-action="upload">＋ 上传图片</button><button class="btn" data-action="new-library">▦ 新建 JSON 库</button><button class="btn" data-action="create-repo">＋ 创建我的图床仓库</button></div></div></div><div class="stat-grid">${statC('▦','JSON 库',S.connected?String(S.libraries.length).padStart(2,'0'):'0',S.connected?'已读取':'未连接',S.connected?`共 ${refs} 个图标引用`:'连接仓库后显示真实数据')}${statC('▧','图片资源',S.connected?S.assets.length:'0',S.connected?'已读取':'未连接',S.connected?`分布在 ${S.groups.length} 个分组`:'连接仓库后显示真实数据')}${statC('↗','本次同步',S.connected?'已读取':'0',S.connected?'正常':'未连接',S.connected?'数据来自 GitHub':'连接仓库后显示同步记录')}${statC('✓','仓库状态',S.connected?'正常':'未连接',S.connected?'在线':'等待连接',S.connected?'最后读取：刚刚':'请先连接 GitHub')}</div><div class="dashboard-columns"><section><div class="section-row"><h3>JSON 库</h3><button class="text-link" data-view="libraries">查看全部 →</button></div><div class="card library-card"><div class="library-card-header"><div class="library-title"><div class="library-logo" style="background:linear-gradient(135deg,#6672ff,#8d64e8)">▦</div><div><b>我的 JSON 库</b><small>GitHub 上的 JSON 引用集合</small></div></div></div>${S.libraries.length?S.libraries.slice(0,5).map(lib=>`<div class="library-list-row" data-action="library-detail" data-id="${escC(lib.id)}">${coverStack(lib)}<div class="list-info"><b>${escC(lib.name)}</b><small>${escC(lib.description||lib.file)}</small></div><div class="list-meta"><strong>${lib.count} 个</strong><span>已读取</span></div><span class="tile-arrow">›</span></div>`).join(''):emptyC('▦','尚未读取图标库',S.connectionError||'登录后创建你自己的图床仓库。',S.isAdmin?'settings':'create-repo',S.isAdmin?'打开仓库设置':'创建我的图床仓库')}</div></section><section><div class="section-row"><h3>最近动态</h3><button class="text-link" data-view="activity">全部记录 →</button></div><div class="card activity-card">${activityView(4)}</div></section></div>`;
}
function librariesView() {
  const q=S.libraryQuery.trim().toLowerCase(), list=S.libraries.filter(x=>!q||x.name.toLowerCase().includes(q)||x.file.toLowerCase().includes(q));
  return `<div class="page-heading"><div><h2>JSON 库</h2><p>管理你的 JSON 库文件，修改会以一次提交同步到 GitHub。</p></div><div class="heading-actions"><button class="btn" data-action="copy-all">↗ 导出索引</button><button class="btn btn-primary" data-action="new-library">＋ 新建图标库</button></div></div><div class="toolbar"><label class="inner-search"><span>⌕</span><input data-bind="library-search" value="${escC(S.libraryQuery)}" placeholder="搜索图标库名称或文件…"></label><span class="toolbar-spacer"></span><button class="btn btn-sm" data-action="refresh">↻ 刷新数据</button></div><div class="library-grid">${list.length?list.map(lib=>`<div class="card library-tile" data-action="library-detail" data-id="${escC(lib.id)}"><div class="tile-top"><div class="library-logo" style="background:${lib.gradient||'linear-gradient(135deg,#6672ff,#7b8af1)'}">${escC(lib.name.slice(0,1))}</div><span class="tile-arrow">↗</span></div><h3>${escC(lib.name)}</h3><p>${escC(lib.description||'')}</p><div class="tile-footer"><span>${escC(lib.file)}</span><strong>${lib.count} 个图标</strong></div><div class="tile-actions"><button class="btn btn-sm" data-action="edit-library" data-id="${escC(lib.id)}">编辑</button><button class="btn btn-sm btn-danger" data-action="delete-library" data-id="${escC(lib.id)}">删除文件</button></div></div>`).join(''):emptyC('▦',S.connected?'没有找到图标库':'尚未连接 GitHub',S.connected?'换个关键词试试。':'进入仓库设置后读取真实数据。')}</div>`;
}
function groupView() { const groups=[{name:'全部',count:S.assets.length},...S.groups]; return groups.map(g=>`<button class="group-pill ${S.group===g.name?'active':''}" data-action="group" data-group="${escC(g.name)}"><b>${g.name==='全部'?'◈':'●'}</b>${escC(g.name||'根目录')}<span>${g.count}</span></button>`).join(''); }
function assetView(item) { const picked=S.selected.has(item.id); return `<div class="card asset-card ${picked?'selected':''}" data-action="asset-open" data-id="${escC(item.id)}"><div class="asset-preview"><img src="${escC(item.url)}" alt="${escC(item.name)}" loading="lazy"><button class="asset-select" aria-label="选择 ${escC(item.name)}" data-action="asset-select" data-id="${escC(item.id)}">${picked?'✓':''}</button></div><div class="asset-details"><b>${escC(item.name)}</b><small title="${escC(item.url)}">${escC(item.url)}</small><span class="asset-badge">${escC(item.ext)}</span><button class="asset-copy" data-action="copy" data-copy="${escC(item.url)}">⧉ 复制直链</button></div></div>`; }
function assetsView() {
  const q=S.assetQuery.trim().toLowerCase(), list=S.assets.filter(x=>(S.group==='全部'||x.group===S.group)&&(!q||x.name.toLowerCase().includes(q)||x.url.toLowerCase().includes(q))), selected=S.selected.size;
  return `<div class="page-heading"><div><h2>图片资源</h2><p>按图片分组管理 GitHub 资源；点击图片可查看直链、改名或删除。</p></div><div class="heading-actions"><button class="btn" data-action="new-group">＋ 新建分组</button>${S.group!=='全部'?'<button class="btn" data-action="manage-group">⚙ 管理分组</button>':''}<button class="btn btn-primary" data-action="upload">↑ 上传图片</button></div></div><div class="asset-groups">${groupView()}</div><div class="toolbar"><label class="inner-search"><span>⌕</span><input data-bind="asset-search" value="${escC(S.assetQuery)}" placeholder="搜索图片名称或直链…"></label><button class="btn btn-sm" data-action="select-all">${list.length&&list.every(x=>S.selected.has(x.id))?'取消全选':'全选'}</button><span class="toolbar-spacer"></span>${selected?`<span class="select-counter">已选择 ${selected} 张</span><button class="btn btn-sm" data-action="bulk-library">加入 JSON</button><button class="btn btn-sm btn-danger" data-action="bulk-delete">批量删除</button>`:''}<button class="btn btn-sm" data-action="refresh">↻ 刷新</button></div>${list.length?`<div class="asset-grid">${list.map(assetView).join('')}</div>`:emptyC('▧',S.connected?'这个分组还没有图片':'尚未连接 GitHub',S.connected?'仓库中没有符合条件的图片。':'进入仓库设置后读取你的真实图片资源。',S.connected?'upload':'settings',S.connected?'上传第一张图片':'连接我的仓库')}`;
}
function detailView() {
  const lib=S.libraries.find(x=>x.id===S.selectedLibrary); if(!lib) return emptyC('▦','找不到图标库','请刷新仓库数据。','refresh','刷新');
  const q=S.iconQuery.trim().toLowerCase(), icons=(lib.icons||[]).map((x,i)=>({...x,index:i})).filter(x=>!q||x.name.toLowerCase().includes(q)||x.url.toLowerCase().includes(q));
  return `<div class="page-heading"><div><button class="text-link" data-view="libraries">← 返回图标库</button><h2 style="margin-top:10px">${escC(lib.name)}</h2><p>${escC(lib.description||'')} · ${escC(lib.file)}</p></div><div class="heading-actions"><button class="btn" data-action="copy" data-copy="${escC(rawLibrary(lib))}">⧉ 复制 JSON 直链</button><button class="btn" data-action="edit-library" data-id="${escC(lib.id)}">编辑库信息</button><button class="btn btn-primary" data-action="new-icon">＋ 添加图标</button></div></div><div class="card detail-header"><div class="library-logo" style="background:${lib.gradient||'linear-gradient(135deg,#6672ff,#7b8af1)'}">${escC(lib.name.slice(0,1))}</div><div><h2>${escC(lib.name)}</h2><p>文件：${escC(lib.file)} · ${lib.count} 个图标引用</p></div><div class="detail-actions"><button class="icon-btn" data-action="edit-library" data-id="${escC(lib.id)}">✎</button><button class="icon-btn" data-action="copy" data-copy="${escC(rawLibrary(lib))}">⧉</button></div></div><div class="toolbar"><label class="inner-search"><span>⌕</span><input data-bind="icon-search" value="${escC(S.iconQuery)}" placeholder="搜索名称或直链…"></label><span class="toolbar-spacer"></span><button class="btn btn-sm" data-action="refresh">↻ 刷新</button></div><div class="card table-card"><div class="table-head"><span></span><span>图标名称</span><span>图片直链</span><span>状态</span><span></span></div>${icons.length?icons.map(icon=>`<div class="table-row"><span class="table-icon"><img src="${escC(icon.url)}" alt=""></span><span class="table-name"><b>${escC(icon.name)}</b><small>JSON 引用</small></span><span class="table-url" title="${escC(icon.url)}">${escC(icon.url)}</span><span class="table-date"><span class="status-dot" style="display:inline-block;margin-right:5px"></span>已同步</span><span class="row-actions"><button class="icon-btn" data-action="copy" data-copy="${escC(icon.url)}">⧉</button><button class="icon-btn" data-action="edit-icon" data-index="${icon.index}">✎</button><button class="icon-btn" data-action="delete-icon" data-index="${icon.index}">×</button></span></div>`).join(''):emptyC('▦','这个 JSON 还没有图标引用','可以从图片资源中上传并加入，或添加一个已有 Raw 直链。')}</div>`;
}
function activityPage() { return `<div class="page-heading"><div><h2>同步记录</h2><p>当前会话内的读取与写入记录。</p></div></div><div class="card activity-card" style="padding:25px 28px">${activityView(50)}</div>`; }
function settingsPage() { return `<div class="page-heading"><div><h2>仓库设置</h2><p>登录账号负责授权，仓库配置只保存当前浏览器的选择。</p></div><div class="heading-actions"><span class="connection-badge"><i class="status-dot"></i>${S.connected?'已读取':'未读取'}</span></div></div><div class="settings-grid"><div class="card settings-card"><h3>GitHub 仓库</h3><p>登录后会自动读取你有权限访问的仓库；如果之前选择过仓库，会优先恢复那个仓库，也可以从这里切换或创建公开仓库。</p>${S.isAdmin&&S.repos.length?`<div class="repo-quick-list">${S.repos.slice(0,8).map(r=>`<button type="button" class="repo-quick ${S.repo.repo===r.name?'active':''}" data-action="use-repo" data-owner="${escC(r.owner.login)}" data-repo="${escC(r.name)}" data-branch="${escC(r.default_branch||'main')}">${escC(r.owner.login)}/${escC(r.name)}</button>`).join('')}</div>`:''}<button type="button" class="btn btn-sm" data-action="create-repo">＋ 在当前账号创建仓库</button>${S.repo.repo?'<button type="button" class="btn btn-sm" data-action="rename-repo">改名</button><button type="button" class="btn btn-sm btn-danger" data-action="delete-repo">删除仓库</button>':''}<form id="repoForm"><div class="form-grid"><div class="form-field"><label>仓库用户名</label><input name="owner" value="${escC(S.repo.owner||S.auth?.login||'')}" placeholder="GitHub 用户名" required></div><div class="form-field"><label>仓库名称</label><input name="repo" value="${escC(S.repo.repo)}" placeholder="仓库名称" required></div><div class="form-field"><label>分支名称</label><input name="branch" value="${escC(S.repo.branch||'main')}" placeholder="main"></div><div class="form-field"><label>图片目录</label><input name="assetsPath" value="${escC(S.repo.assetsPath||'assets')}" placeholder="assets"></div></div><div class="settings-actions"><button type="button" class="btn" data-action="logout">退出 GitHub</button><button type="submit" class="btn btn-primary">保存并读取仓库</button></div></form></div><div class="card settings-card"><h3>登录身份</h3><p>网站不会要求你复制或粘贴 GitHub Token。</p><div class="account-panel"><div class="user-avatar" data-account-avatar>${escC((S.auth?.login||'G').slice(0,1).toUpperCase())}</div><div><b data-account-name>${escC(S.auth?.login||'GitHub 用户')}</b><small>Token 内存会话</small></div></div><div class="info-list"><div class="info-row"><span>当前资源仓库</span><b>${escC(S.repo.owner&&S.repo.repo?`${S.repo.owner}/${S.repo.repo}`:'未配置')}</b></div>${S.repo.owner&&S.repo.repo?`<button type="button" class="btn btn-sm" data-action="open-repo">打开图片资源仓库 ↗</button>`:''}<div class="info-row"><span>分支</span><b>${escC(S.repo.branch||'main')}</b></div><div class="info-row"><span>图片目录</span><b>${escC(S.repo.assetsPath||'assets')}</b></div><div class="info-row"><span>授权方式</span><b style="color:#4aac7f">GitHub OAuth</b></div></div><div class="security-note">⌁ 访问密钥只在服务器会话中使用，前端不会保存 Token。请确保服务器启用了 HTTPS，并在 GitHub OAuth App 中填写正确回调地址。</div></div></div>`; }
async function loadAdminPolicy() { if (!S.isAdmin) return; try { const response=await fetch('/api/admin/policy',{credentials:'include'}); if(response.ok){ const data=await response.json(); S.allowAll=Boolean(data.allowAll); S.allowedUsers=Array.isArray(data.allowed)?data.allowed:[]; } } catch { /* policy panel can show defaults */ } }
async function saveAdminPolicy(form) { const data=new FormData(form), allowed=String(data.get('allowed')||'').split(',').map(value=>value.trim().toLowerCase()).filter(Boolean); const response=await fetch('/api/admin/policy',{method:'PUT',credentials:'include',headers:{'Content-Type':'application/json','X-CSRF-Token':S.csrf},body:JSON.stringify({allowAll:data.get('allowAll')==='on',allowed})}); const result=await response.json().catch(()=>({})); if(!response.ok) throw new Error(result.message||'访问策略保存失败'); S.allowAll=Boolean(result.allowAll); S.allowedUsers=result.allowed||[]; renderC(); notify('访问策略已保存'); }
function adminPage() {
  if (!S.adminConfigured) return `<div class="page-heading"><div><h2>管理后台</h2><p>用于控制 GitHub 用户访问权限。</p></div></div><div class="card settings-card"><h3>未设置管理员</h3><p>请在 VPS 环境变量中设置 ADMIN_GITHUB_LOGIN。</p><pre class="admin-code">ADMIN_GITHUB_LOGIN=beiwang02</pre></div>`;
  if (!S.isAdmin) return `<div class="page-heading"><div><h2>管理后台</h2><p>当前账号没有管理员权限。</p></div></div>${emptyC('♙','无权访问','只有管理员可以管理网站用户。')}`;
  return `<div class="page-heading"><div><h2>管理后台</h2><p>控制哪些 GitHub 用户可以使用网站。</p></div><div class="heading-actions"><span class="connection-badge"><i class="status-dot"></i>管理员</span></div></div><div class="card settings-card"><form id="adminPolicyForm"><h3>访问策略</h3><p>允许所有人时，任何 GitHub 登录用户都可以使用；关闭后只允许名单和管理员。</p><label class="policy-toggle"><input type="checkbox" name="allowAll" ${S.allowAll?'checked':''}> 允许所有 GitHub 用户</label><div class="modal-field" style="margin-top:18px"><label>允许名单（逗号分隔）</label><input name="allowed" value="${escC(S.allowedUsers.join(','))}" placeholder="friend1,friend2"></div><p class="field-help">从允许名单中移除用户，就等于不再允许他使用。管理员账号始终保留权限。</p><div class="settings-actions"><button type="submit" class="btn btn-primary">保存访问策略</button></div></form></div>`;
}

function renderC() {
  document.body.classList.toggle('auth-screen', !S.auth);
  if (!S.auth) { $c('#app').innerHTML=loginView(); return; }
  const views={overview:overviewView,libraries:librariesView,assets:assetsView,'library-detail':detailView,activity:activityPage,settings:settingsPage,admin:adminPage};
  $c('#app').innerHTML=(views[S.view]||overviewView)(); setMetaC();
  applyAppearance();
}
function openC(html) { $c('#modalRoot').innerHTML=`<div class="modal-backdrop" data-action="modal-backdrop"><div class="modal">${html}</div></div>`; }
function tokenLoginModal() { openC(`<div class="modal-head"><div><h2>使用 GitHub Token 登录</h2><p>适合你自己临时测试，Token 只在当前服务器内存会话中使用。</p></div><button class="modal-close" data-action="close-modal">×</button></div><form id="tokenLoginForm"><div class="modal-body"><div class="modal-field"><label>GitHub Token</label><input name="token" type="password" autocomplete="off" placeholder="ghp_... 或 github_pat_..." required></div><p class="field-help" style="line-height:1.7">公开仓库建议使用 classic Token 的 <b>public_repo</b> 权限。不要在 HTTP 公网地址输入 Token；正式使用请启用 HTTPS。</p></div><div class="modal-actions"><button type="button" class="btn" data-action="close-modal">取消</button><button type="submit" class="btn btn-primary">验证并登录</button></div></form>`); }

function closeC() { $c('#modalRoot').innerHTML=''; }
function uploadModal() { const uploadGroups=[...new Set([...S.groups.map(g=>g.name),...S.assets.map(a=>a.group).filter(Boolean)])].sort(); const defaultGroup=S.group!=='全部'&&uploadGroups.includes(S.group)?S.group:(uploadGroups[0]||'__new'); openC(`<div class="modal-head"><div><h2>上传图片资源</h2><p>上传会作为一次 Git 提交写入当前仓库，可同时加入 JSON。</p></div><button class="modal-close" data-action="close-modal">×</button></div><form id="uploadForm"><div class="modal-body"><label class="drop-zone" id="dropZone"><div class="drop-icon">⇧</div><strong>点击选择或拖入图片</strong><small>PNG、JPG、WEBP、GIF、SVG，单张最大 10 MB</small><input name="file" id="fileInput" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" hidden></label><div class="preview-file" id="filePreview"><img id="fileThumb" alt=""><span id="fileName"></span></div><div class="modal-field"><label>图片名称</label><input name="name" id="uploadName" placeholder="例如：netflix" required></div><div class="modal-field"><label>图片分组</label><div class="group-control"><select name="group" id="uploadGroup">${uploadGroups.map(g=>`<option value="${escC(g)}" ${defaultGroup===g?'selected':''}>${escC(g)}</option>`).join('')}</select><button type="button" class="btn btn-sm" id="createGroupButton">＋ 新建分组</button></div></div><div class="modal-field new-group-field" id="newGroupField" style="display:none"><label>新分组名称</label><input name="newGroup" id="newGroupName" placeholder="例如：app" pattern="[A-Za-z0-9_-]+"></div><div class="modal-field"><label>上传后加入 JSON（可选）</label><select name="library"><option value="">暂不加入</option>${S.libraries.map(l=>`<option value="${escC(l.file)}">${escC(l.name)}</option>`).join('')}</select></div></div><div class="modal-actions"><button type="button" class="btn" data-action="close-modal">取消</button><button class="btn btn-primary" type="submit">上传并提交</button></div></form>`); const input=$c('#fileInput'), zone=$c('#dropZone'); const show=file=>{if(!file)return; $c('#fileName').textContent=file.name; $c('#filePreview').classList.add('show'); if(file.type.startsWith('image/'))$c('#fileThumb').src=URL.createObjectURL(file); if(!$c('#uploadName').value)$c('#uploadName').value=file.name.replace(/\.[^.]+$/,'').replace(/[^\w-]+/g,'-').toLowerCase();}; zone.addEventListener('click',e=>{if(e.target!==input)input.click();}); input.addEventListener('change',()=>show(input.files[0])); const groupSelect=$c('#uploadGroup'); groupSelect?.addEventListener('change',()=>{const isNew=groupSelect.value==='__new'; $c('#newGroupField').style.display=isNew?'grid':'none'; if(!isNew)$c('#newGroupName').value=''; if(isNew)$c('#newGroupName').focus();}); ['dragenter','dragover'].forEach(t=>zone.addEventListener(t,e=>{e.preventDefault();zone.classList.add('dragging');})); ['dragleave','drop'].forEach(t=>zone.addEventListener(t,e=>{e.preventDefault();zone.classList.remove('dragging');})); zone.addEventListener('drop',e=>{if(e.dataTransfer.files[0]){input.files=e.dataTransfer.files;show(input.files[0]);}}); }
function libraryModal(edit=false) { S.editingLibrary=edit?S.selectedLibrary:null; const lib=edit?S.libraries.find(x=>x.id===S.selectedLibrary):null; openC(`<div class="modal-head"><div><h2>${edit?'编辑 JSON 库':'新建 JSON 库'}</h2><p>${edit?'修改名称、说明或移动 JSON 文件。':'会在仓库中创建一个带 icons 数组的 JSON 文件。'}</p></div><button class="modal-close" data-action="close-modal">×</button></div><form id="libraryForm"><div class="modal-body"><div class="modal-field"><label>图标库名称</label><input name="name" value="${escC(lib?.name||'')}" placeholder="例如：Emby 图标库" required></div><div class="modal-field"><label>图标库说明</label><input name="description" value="${escC(lib?.description||'')}" placeholder="可选说明"></div><div class="modal-field"><label>JSON 文件路径</label><input name="path" value="${escC(lib?.file||'json/library.json')}" placeholder="json/library.json" required></div></div><div class="modal-actions"><button type="button" class="btn" data-action="close-modal">取消</button><button type="submit" class="btn btn-primary">${edit?'保存修改':'创建图标库'}</button></div></form>`); }
function createRepoModal() { openC(`<div class="modal-head"><div><h2>创建 GitHub 仓库</h2><p>将在当前 GitHub 账号下创建一个公开仓库。</p></div><button class="modal-close" data-action="close-modal">×</button></div><form id="createRepoForm"><div class="modal-body"><div class="modal-field"><label>仓库名称</label><input name="name" placeholder="例如：my-image-host" required></div><div class="modal-field"><label>仓库说明</label><input name="description" placeholder="可选"></div><p class="field-help">创建后网站会自动把它设为当前图床仓库，并读取真实内容。</p></div><div class="modal-actions"><button type="button" class="btn" data-action="close-modal">取消</button><button type="submit" class="btn btn-primary">创建并使用</button></div></form>`); }
function iconModal(index) { const lib=S.libraries.find(x=>x.id===S.selectedLibrary), icon=lib?.icons?.[index]; if(!lib||!icon)return; openC(`<div class="modal-head"><div><h2>编辑图标引用</h2><p>修改会更新 ${escC(lib.file)}，不会删除图片文件。</p></div><button class="modal-close" data-action="close-modal">×</button></div><form id="iconForm"><input type="hidden" name="index" value="${index}"><div class="modal-body"><div class="modal-field"><label>图标名称</label><input name="name" value="${escC(icon.name)}" required></div><div class="modal-field"><label>GitHub Raw 图片直链</label><input name="url" value="${escC(icon.url)}" required></div></div><div class="modal-actions"><button type="button" class="btn" data-action="close-modal">取消</button><button class="btn btn-primary" type="submit">保存引用</button></div></form>`); }
function assetModal(item) { openC(`<div class="modal-head"><div><button class="text-link modal-back-link" data-action="close-modal">← 返回图片资源</button><h2 style="margin-top:10px">${escC(item.name)}</h2><p>${escC(item.group||'根目录')} 分组 · ${escC(item.ext)} 图片资源</p></div><button class="modal-close" data-action="close-modal">×</button></div><div class="modal-body"><div class="asset-detail-preview"><img src="${escC(item.url)}" alt="${escC(item.name)}"></div><div class="modal-field"><label>GitHub Raw 直链</label><input value="${escC(item.url)}" readonly></div><div class="modal-field"><label>仓库路径</label><input value="${escC(item.path)}" readonly></div></div><div class="modal-actions"><button class="btn btn-danger" data-action="delete-asset" data-id="${escC(item.id)}">删除图片</button><button class="btn" data-action="rename-asset" data-id="${escC(item.id)}">改名并同步引用</button><button class="btn" data-action="copy" data-copy="${escC(item.url)}">⧉ 复制直链</button><button class="btn btn-primary" data-action="close-modal">完成</button></div>`); }
function bulkModal() { openC(`<div class="modal-head"><div><h2>批量加入 JSON</h2><p>所选图片会去重后追加到目标图标库。</p></div><button class="modal-close" data-action="close-modal">×</button></div><form id="bulkForm"><div class="modal-body"><div class="modal-field"><label>目标 JSON 库</label><select name="library" required>${S.libraries.map(l=>`<option value="${escC(l.file)}">${escC(l.name)} · ${l.count} 个</option>`).join('')}</select></div><p class="field-help">已选择 ${S.selected.size} 张图片，图片文件不会被移动或删除。</p></div><div class="modal-actions"><button type="button" class="btn" data-action="close-modal">取消</button><button type="submit" class="btn btn-primary">加入并提交</button></div></form>`); }
async function readRepo(form) { const data = form instanceof HTMLFormElement ? new FormData(form) : { get:key => form.elements[key]?.value ?? '' }; S.repo={owner:String(data.get('owner')).trim(),repo:String(data.get('repo')).trim(),branch:String(data.get('branch')).trim()||'main',assetsPath:String(data.get('assetsPath')).trim().replace(/^\/+|\/+$/g,'')||'assets'}; if(!S.repo.owner||!S.repo.repo)return notify('请填写仓库用户名和名称','error'); localStorage.setItem('gh-image-repo',JSON.stringify(S.repo)); S.loading=true;renderC();notify('正在读取 GitHub 仓库…'); try { const data=await currentClient().load(); S.connected=true; S.repo.assetsPath=data.root; localStorage.setItem('gh-image-repo',JSON.stringify(S.repo)); S.groups=data.groups;S.assets=data.assets;S.libraries=data.libraries.map((x,i)=>({...x,gradient:['linear-gradient(135deg,#7580ff,#8c64e9)','linear-gradient(135deg,#ffb26d,#eb7574)','linear-gradient(135deg,#43cec4,#5aa7e8)'][i%3]})); S.selected.clear();S.activity.unshift({title:'读取了 GitHub 仓库',detail:`${S.repo.owner}/${S.repo.repo} · ${S.libraries.length} 个 JSON、${S.assets.length} 张图片`,time:'刚刚'}); S.view='overview';notify(`读取完成：${S.libraries.length} 个 JSON、${S.assets.length} 张图片`); } catch(e){S.connected=false;notify(e.message||'读取失败','error');} finally{S.loading=false;renderC();} }
async function refreshRepo() { if(!S.connected)return notify('请先连接你的仓库','error'); const oldView=S.view; const data=await currentClient().load(); S.repo.assetsPath=data.root; localStorage.setItem('gh-image-repo',JSON.stringify(S.repo)); S.groups=data.groups;S.assets=data.assets;S.libraries=data.libraries.map((x,i)=>({...x,gradient:['linear-gradient(135deg,#7580ff,#8c64e9)','linear-gradient(135deg,#ffb26d,#eb7574)','linear-gradient(135deg,#43cec4,#5aa7e8)'][i%3]})); S.view=oldView; S.selected.clear(); renderC(); }
async function formSubmit(e) {
  e.preventDefault(); const form=e.target;
  try {
    if(form.id==='adminPolicyForm') return await saveAdminPolicy(form);
    if(form.id==='tokenLoginForm') { const data=new FormData(form), token=String(data.get('token')||'').trim(); if(data.get('rememberToken')==='on') localStorage.setItem('gh-image-remembered-token',token); else localStorage.removeItem('gh-image-remembered-token'); const response=await fetch('/api/auth/token',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})}); const result=await response.json().catch(()=>({})); if(!response.ok) throw new Error(result.message||`Token 登录失败（HTTP ${response.status}）`); closeC(); location.reload(); return; }
    if(form.id==='createRepoForm') return await createRepositoryFromModal(form);
    if(form.id==='repoForm') return await readRepo(form);
    if(form.id==='uploadForm') { let group=String(form.elements.group.value||'').trim(); if(group==='__new') { group=String(form.elements.newGroup?.value||'').trim(); if(!group)return notify('请填写新分组名称','error'); await currentClient().createGroup(group); } if(!group||group==='__new')return notify('请选择有效的图片分组','error'); const result=await currentClient().upload(form.elements.file.files[0],form.elements.name.value,group,form.elements.library.value); closeC(); await refreshRepo(); notify(`已上传“${result.name}”，并提交到 GitHub`); return; }
    if(form.id==='libraryForm') { const data=new FormData(form), name=String(data.get('name')).trim(), description=String(data.get('description')).trim(), path=String(data.get('path')).trim(); if(!name)return notify('请填写图标库名称','error'); const old=S.libraries.find(x=>x.id===S.editingLibrary); if(old) await currentClient().saveLibrary(old.file,path,name,description); else await currentClient().createLibrary(path,name,description); closeC(); await refreshRepo(); notify('JSON 库已提交'); return; }
    if(form.id==='iconForm') { const data=new FormData(form), lib=S.libraries.find(x=>x.id===S.selectedLibrary); await currentClient().saveIcon(lib.file,Number(data.get('index')),String(data.get('name')),String(data.get('url')),lib.sha); closeC(); await refreshRepo(); S.view='library-detail'; renderC(); notify('图标引用已更新'); return; }
    if(form.id==='bulkForm') { const data=new FormData(form); const items=S.assets.filter(x=>S.selected.has(x.id)); await currentClient().appendToLibrary(String(data.get('library')),items); S.selected.clear(); closeC(); await refreshRepo(); notify(`已将 ${items.length} 张图片加入 JSON`); return; }
  } catch(error) { notify(error.message||'操作失败','error'); }
}
async function logoutC() { try { await fetch('/api/auth/logout',{method:'POST',credentials:'include',headers:{'X-CSRF-Token':S.csrf}}); } finally { localStorage.removeItem('gh-image-remembered-token'); location.href='/'; } }
async function autoSelectRepository() {
  if (!S.auth) return;
  try {
    S.repos = await currentClient().listRepos();
    const restoreName = S.restoreRepo && S.isAdmin ? S.restoreRepo.toLowerCase() : '';
    const wanted = S.repo.owner && S.repo.repo ? `${S.repo.owner}/${S.repo.repo}`.toLowerCase() : '';
    let found = (restoreName && S.repos.find(r => r.name.toLowerCase() === restoreName))
      || S.repos.find(r => `${r.owner.login}/${r.name}`.toLowerCase() === wanted)
      || (S.repos.length === 1 ? S.repos[0] : null);
    let candidates = [];
    if (!found) {
      candidates = await currentClient().findProjectRepositories(S.repos);
      if (candidates.length === 1 || (candidates[0] && candidates[0].score >= 8 && candidates[0].score > (candidates[1]?.score || 0) + 3)) {
        found = S.repos.find(r => `${r.owner.login}/${r.name}`.toLowerCase() === `${candidates[0].owner}/${candidates[0].repo}`.toLowerCase());
      }
    }
    if (!found) { S.connectionError = candidates.length ? `发现 ${candidates.length} 个符合脚本结构的仓库，请选择或创建新仓库。` : '没有自动选择仓库，请创建你自己的图床仓库。'; renderC(); return; }
    S.repo = { owner:found.owner.login, repo:found.name, branch:found.default_branch || 'main', assetsPath:S.repo.assetsPath || candidates[0]?.assetRoot || 'assets' };
    localStorage.setItem('gh-image-repo', JSON.stringify(S.repo));
    const data = await currentClient().load();
    S.connected = true; S.repo.assetsPath = data.root; S.groups=data.groups; S.assets=data.assets; S.libraries=data.libraries.map((x,i)=>({...x,gradient:['linear-gradient(135deg,#7580ff,#8c64e9)','linear-gradient(135deg,#ffb26d,#eb7574)','linear-gradient(135deg,#43cec4,#5aa8e8)'][i%3]}));
    S.activity.unshift({title:'登录后自动恢复项目仓库',detail:`${S.repo.owner}/${S.repo.repo} · ${S.libraries.length} 个 JSON、${S.assets.length} 张图片`,time:'刚刚'});
    renderC(); notify(`已恢复项目仓库：${S.repo.owner}/${S.repo.repo}`);
  } catch (error) { S.connectionError = error?.message || '自动识别仓库失败'; console.warn('自动识别仓库失败', error); renderC(); }
}
async function createRepositoryFromModal(form) {
  const data=new FormData(form), name=String(data.get('name')||'').trim(), description=String(data.get('description')||'').trim();
  if(!/^[A-Za-z0-9._-]+$/.test(name)) throw new Error('仓库名称只能使用字母、数字、横线、下划线和小数点。');
  const repo=await currentClient().createRepository(name,description); S.repo={owner:repo.owner.login,repo:repo.name,branch:repo.default_branch||'main',assetsPath:'assets'}; localStorage.setItem('gh-image-repo',JSON.stringify(S.repo)); closeC(); await readRepo({elements:{owner:{value:S.repo.owner},repo:{value:S.repo.repo},branch:{value:S.repo.branch},assetsPath:{value:S.repo.assetsPath}}});
}

async function bootAuth() { if(location.protocol!=='http:'&&location.protocol!=='https:'){ renderC(); return; } try { const r=await fetch('/api/auth/me',{credentials:'include'}), data=await r.json(); S.auth=data.user||null; S.csrf=data.csrf||''; S.oauthEnabled=Boolean(data.oauthEnabled); S.tokenLoginEnabled=Boolean(data.tokenLoginEnabled); S.adminConfigured=Boolean(data.adminConfigured); S.isAdmin=Boolean(data.isAdmin); S.policyConfigured=Boolean(data.policyConfigured); S.restoreRepo=data.restoreRepo||''; if(S.auth) { await loadAdminPolicy(); renderC(); await autoSelectRepository(); } } catch { S.auth=null; } renderC(); }

document.addEventListener('click', async e => {
  const target=e.target.closest('[data-action],[data-view]'); if(!target)return;
  const view=target.dataset.view;
  if(view) { S.view=view; S.selected.clear(); $c('#sidebar').classList.remove('open'); renderC(); return; }
  const action=target.dataset.action;
  if(action==='oauth-help'){ notify('请先在服务器环境变量中配置 GITHUB_CLIENT_ID 和 GITHUB_CLIENT_SECRET','error'); return; }
  if(action==='token-login'){ tokenLoginModal(); return; }
  if(action==='toggle-token'){ const input=$c('#mainTokenInput'); if(input){input.type=input.type==='password'?'text':'password'; target.textContent=input.type==='password'?'◉':'◎';} return; }
  if(action==='modal-backdrop'){if(e.target===target)closeC();return;}
  if(action==='close-modal'){closeC();return;}
  if(action==='toggle-sidebar'){ $c('#sidebar').classList.toggle('open'); return; }
  if(action==='open-project'){ window.open('https://github.com/beiwang02/github-assets','_blank'); return; }
  if(action==='open-profile'){ if(S.auth?.login) window.open(`https://github.com/${encodeURIComponent(S.auth.login)}`,'_blank'); return; }
  if(action==='open-repo'){ if(S.repo.owner&&S.repo.repo) window.open(`https://github.com/${encodeURIComponent(S.repo.owner)}/${encodeURIComponent(S.repo.repo)}`,'_blank'); else notify('当前还没有连接仓库','error'); return; }
  if(action==='toggle-theme'){cycleAppearance();return;}
  if(action==='account-menu'){accountMenu();return;}
  if(action==='forget-token'){localStorage.removeItem('gh-image-remembered-token');closeC();notify('已清除此设备记住的 Token，当前会话保留');return;}
  if(action==='repo-menu'){S.view='settings';$c('#sidebar').classList.remove('open');renderC();return;}
  if(action==='page-back'){if(history.state?.ghView&&history.state.depth>0)history.back();else{S.view='overview';renderC();}return;}
  if(action==='logout'){await logoutC();return;}
  if(action==='create-repo'){if(!S.auth)return notify('请先登录 GitHub','error');createRepoModal();return;}
  if(action==='rename-repo'){if(!S.repo.repo)return;const name=prompt('输入新的 GitHub 仓库名称',S.repo.repo);if(!name||name.trim()===S.repo.repo)return;try{await currentClient().renameRepository(name);S.repo.repo=name.trim();localStorage.setItem('gh-image-repo',JSON.stringify(S.repo));renderC();notify('仓库已改名');}catch(err){notify(err.message||'仓库改名失败','error');}return;}
  if(action==='delete-repo'){if(!S.repo.repo||!confirm(`确定永久删除仓库 ${S.repo.owner}/${S.repo.repo} 吗？该操作不可恢复。`))return;try{await currentClient().deleteRepository();S.connected=false;S.groups=[];S.assets=[];S.libraries=[];S.repo={owner:S.auth?.login||'',repo:'',branch:'main',assetsPath:'assets'};localStorage.removeItem('gh-image-repo');S.view='overview';renderC();notify('仓库已删除');}catch(err){notify(err.message||'仓库删除失败','error');}return;}
  if(action==='use-repo'){S.repo={owner:target.dataset.owner,repo:target.dataset.repo,branch:target.dataset.branch||'main',assetsPath:'assets'};localStorage.setItem('gh-image-repo',JSON.stringify(S.repo));await readRepo({elements:{owner:{value:S.repo.owner},repo:{value:S.repo.repo},branch:{value:S.repo.branch},assetsPath:{value:S.repo.assetsPath}}});return;}
  if(action==='settings'){S.view='settings';renderC();return;}
  if(action==='refresh'){await refreshRepo();return;}
  if(action==='upload'){if(!S.connected)return notify('请先连接你的仓库','error');uploadModal();return;}
  if(action==='new-library'){if(!S.connected)return notify('请先连接你的仓库','error');libraryModal(false);return;}
  if(action==='new-icon'){if(!S.connected)return notify('请先连接你的仓库','error');uploadModal();return;}
  if(action==='group'){S.group=target.dataset.group;S.selected.clear();renderC();return;}
  if(action==='select-all'){const q=S.assetQuery.trim().toLowerCase(), list=S.assets.filter(x=>(S.group==='全部'||x.group===S.group)&&(!q||x.name.toLowerCase().includes(q)||x.url.toLowerCase().includes(q))); if(list.length&&list.every(x=>S.selected.has(x.id)))list.forEach(x=>S.selected.delete(x.id));else list.forEach(x=>S.selected.add(x.id));renderC();return;}
  if(action==='asset-select'){e.stopPropagation();const id=target.dataset.id;S.selected.has(id)?S.selected.delete(id):S.selected.add(id);renderC();return;}
  if(action==='asset-open'){const item=S.assets.find(x=>x.id===target.dataset.id);if(item)assetModal(item);return;}
  if(action==='copy'){e.stopPropagation();await copyC(target.dataset.copy||'');return;}
  if(action==='library-detail'){S.selectedLibrary=target.dataset.id;S.iconQuery='';S.view='library-detail';renderC();return;}
  if(action==='edit-library'){e.stopPropagation();S.selectedLibrary=target.dataset.id||S.selectedLibrary;libraryModal(true);return;}
  if(action==='delete-library'){e.stopPropagation();const lib=S.libraries.find(x=>x.id===target.dataset.id);if(!lib||!confirm(`永久删除 ${lib.name}？\n文件：${lib.file}`))return;try{await currentClient().deleteLibrary(lib.file);await refreshRepo();notify('JSON 文件已删除');}catch(err){notify(err.message,'error');}return;}
  if(action==='edit-icon'){iconModal(Number(target.dataset.index));return;}
  if(action==='delete-icon'){const lib=S.libraries.find(x=>x.id===S.selectedLibrary), index=Number(target.dataset.index);if(!lib||!confirm(`从 ${lib.name} 中移除这个图标？图片文件不会删除。`))return;try{await currentClient().removeIcons(lib.file,[index],lib.sha);await refreshRepo();S.view='library-detail';renderC();notify('图标引用已移除');}catch(err){notify(err.message,'error');}return;}
  if(action==='rename-asset'){const item=S.assets.find(x=>x.id===target.dataset.id);if(item) {const name=prompt('输入新的图片名称',item.name);if(name&&name.trim()!==item.name)try{await currentClient().renameAsset(item,name);closeC();await refreshRepo();notify('图片已改名，JSON 引用已同步');}catch(err){notify(err.message,'error');}}return;}
  if(action==='delete-asset'){const item=S.assets.find(x=>x.id===target.dataset.id);if(item&&confirm(`永久删除 ${item.name}？相关 JSON 引用会同步移除。`))try{await currentClient().deleteAsset(item);closeC();await refreshRepo();notify('图片和相关引用已删除');}catch(err){notify(err.message,'error');}return;}
  if(action==='bulk-library'){if(!S.selected.size)return;bulkModal();return;}
  if(action==='bulk-delete'){const items=S.assets.filter(x=>S.selected.has(x.id));if(items.length&&confirm(`永久删除选中的 ${items.length} 张图片？`))try{await currentClient().deleteSelected(items);S.selected.clear();await refreshRepo();notify(`已删除 ${items.length} 张图片并同步引用`);}catch(err){notify(err.message,'error');}return;}
  if(action==='new-group'){const name=prompt('请输入新分组名称','new-group');if(name)try{await currentClient().createGroup(name);await refreshRepo();notify('图片分组已创建');}catch(err){notify(err.message,'error');}return;}
  if(action==='manage-group'){if(S.group==='全部')return;const next=prompt(`输入“${S.group}”的新名称；输入 delete 删除整个分组`,S.group);if(!next)return;try{if(next.trim().toLowerCase()==='delete'){if(!confirm(`永久删除分组 ${S.group} 及其中图片？`))return;await currentClient().deleteGroup(S.group);}else await currentClient().renameGroup(S.group,next);await refreshRepo();notify('分组操作已提交');}catch(err){notify(err.message,'error');}return;}
  if(action==='copy-all'){await copyC(JSON.stringify({repository:S.repo,libraries:S.libraries.map(x=>({name:x.name,file:x.file,count:x.count}))},null,2),'仓库索引已复制');return;}
});
document.addEventListener('submit',formSubmit);
document.addEventListener('input',e=>{const b=e.target.dataset.bind;if(!b)return;if(b==='asset-search')S.assetQuery=e.target.value;if(b==='library-search')S.libraryQuery=e.target.value;if(b==='icon-search')S.iconQuery=e.target.value;const cursor=e.target.selectionStart;renderC();const next=document.querySelector(`[data-bind="${b}"]`);if(next){next.focus();next.setSelectionRange(cursor,cursor);}});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeC();if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$c('#globalSearch')?.focus();}});
renderC(); void bootAuth();

/* Overview quick asset panel */
function overviewQuickAssets() {
  if (!S.assets.length) return `<section class="overview-assets-section"><div class="section-row"><h3>最近图片资源</h3><button class="text-link" data-view="assets">查看全部 →</button></div><div class="card quick-empty">${emptyC('▧',S.connected?'暂无图片资源':'连接仓库后显示真实图片','图片资源会直接从你的 GitHub 仓库读取。',S.connected?'upload':'settings',S.connected?'上传图片':'连接仓库')}</div></section>`;
  return `<section class="overview-assets-section"><div class="section-row"><h3>最近图片资源</h3><button class="text-link" data-view="assets">查看全部 →</button></div><div class="card quick-assets-grid">${S.assets.slice(0,6).map(item=>`<div class="quick-asset" data-action="asset-open" data-id="${escC(item.id)}"><div class="quick-asset-image"><img src="${escC(item.url)}" alt="${escC(item.name)}" loading="lazy"><button class="quick-copy" data-action="copy" data-copy="${escC(item.url)}" title="复制直链">⧉</button></div><b>${escC(item.name)}</b><small>${escC(item.group||'根目录')}</small></div>`).join('')}</div></section>`;
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
  const mode=localStorage.getItem('gh-image-theme')||'system';
  const dark=mode==='dark'||(mode==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);
  document.body.classList.toggle('dark',dark);
  const button=$c('.appearance-button');
  if(button){
    button.innerHTML=mode==='system'?'<span class="theme-system-icon">◐</span>':(mode==='dark'?'<span class="theme-moon-icon">☾</span>':'<span class="theme-sun-icon" aria-hidden="true"></span>');
    button.title=mode==='system'?'跟随系统（点击切换）':(mode==='dark'?'黑夜模式（点击切换）':'白天模式（点击切换）');
    button.setAttribute('aria-label',button.title);
  }
}
function cycleAppearance() {
  const current=localStorage.getItem('gh-image-theme')||'system';
  const next=current==='system'?'dark':(current==='dark'?'light':'system');
  localStorage.setItem('gh-image-theme',next);
  applyAppearance();
  notify(next==='system'?'已切换为跟随系统':(next==='dark'?'已切换为黑夜模式':'已切换为白天模式'));
}
function accountMenu() {
  $c('#sidebar').classList.remove('open');
  const login=S.auth?.login||'当前账号';
  const repoLabel=S.repo.owner&&S.repo.repo?`${S.repo.owner}/${S.repo.repo}`:'尚未连接仓库';
  openC(`<div class="modal-head"><div><h2>${escC(login)}</h2><p>GitHub 账号</p></div><button class="modal-close" data-action="close-modal">×</button></div><div class="modal-body choice-menu"><button class="btn" data-action="open-profile">打开 GitHub 主页 <span>↗</span></button><button class="btn" data-action="open-repo">打开当前仓库 <span>↗</span></button><div class="account-repo-path">${escC(repoLabel)}</div>${S.tokenLoginEnabled?'<button class="btn" data-action="forget-token">清除此设备记住的 Token</button>':''}<button class="btn btn-danger" data-action="logout">退出 GitHub 登录</button></div>`);
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
