'use strict';
const METADATA_PATH = '.github-assets-meta.json';
const METADATA_VERSION = 1;
class GitHubClient {
  constructor(config, csrf) { this.config = { ...config }; this.csrf = csrf; }
  get base() { return `/repos/${encodeURIComponent(this.config.owner)}/${encodeURIComponent(this.config.repo)}`; }
  async request(path, method = 'GET', body) {
    const response = await fetch(`/api/github?url=${encodeURIComponent('https://api.github.com' + path)}`, {
      method, credentials:'same-origin', headers:{ 'Content-Type':'application/json', 'X-CSRF-Token':this.csrf || '' },
      ...(body === undefined ? {} : { body:JSON.stringify(body) })
    });
    const text = await response.text(); let data;
    try { data = text ? JSON.parse(text) : null; } catch { throw new Error('服务器返回无效响应，请使用 Node 服务打开网站。'); }
    if (!response.ok) { const e = new Error(data?.message || `GitHub API ${response.status}`); e.status = response.status; throw e; }
    return data;
  }
  async listRepos() { return this.request('/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member'); }
  async createRepository(name, description = '') { return this.request('/user/repos', 'POST', { name:name.trim(), description:description.trim() || 'GitHub 图片资源和 JSON 库', private:false, auto_init:true }); }
  async renameRepository(name) { return this.request(`/repos/${encodeURIComponent(this.config.owner)}/${encodeURIComponent(this.config.repo)}`, 'PATCH', { name:name.trim() }); }
  async deleteRepository() { return this.request(`/repos/${encodeURIComponent(this.config.owner)}/${encodeURIComponent(this.config.repo)}`, 'DELETE'); }
  async projectSignature(repo) {
    const owner = repo.owner?.login || repo.owner || this.config.owner;
    const branch = repo.default_branch || this.config.branch || 'main';
    const base = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo.name)}`;
    const ref = await this.request(`${base}/git/ref/heads/${encodeURIComponent(branch)}`);
    const commit = await this.request(`${base}/git/commits/${ref.object.sha}`);
    const tree = await this.request(`${base}/git/trees/${commit.tree.sha}?recursive=1`);
    if (tree.truncated) return { score:0, owner, repo:repo.name, branch, reason:'仓库目录过大，无法安全识别' };
    const entries = Array.isArray(tree.tree) ? tree.tree.filter(item => item.type === 'blob') : [];
    const dirs = new Set((Array.isArray(tree.tree) ? tree.tree : []).filter(item => item.type === 'tree').map(item => item.path));
    const jsonEntries = entries.filter(item => /\.json$/i.test(item.path));
    let libraryCount = 0, iconCount = 0, rawReferenceCount = 0;
    for (const entry of jsonEntries.slice(0, 20)) {
      try {
        const blob = await this.request(`${base}/git/blobs/${entry.sha}`);
        const value = JSON.parse(GitHubClient.decode(blob.content));
        if (!value || !Array.isArray(value.icons)) continue;
        const validIcons = value.icons.filter(item => item && typeof item.name === 'string' && typeof item.url === 'string');
        if (!validIcons.length && value.icons.length) continue;
        libraryCount += 1; iconCount += validIcons.length;
        rawReferenceCount += validIcons.filter(item => {
          try { const url = new URL(item.url); return url.hostname === 'raw.githubusercontent.com' && url.pathname.toLowerCase().includes(`/${String(owner).toLowerCase()}/${String(repo.name).toLowerCase()}/`); } catch { return false; }
        }).length;
      } catch { /* unrelated or malformed JSON is not a project signature */ }
    }
    const imageEntries = entries.filter(item => item.path.startsWith('assets/') || item.path.startsWith('icons/')).filter(item => /\.(png|jpe?g|webp|gif|svg)$/i.test(item.path));
    const assetRoot = dirs.has('assets') ? 'assets' : (dirs.has('icons') ? 'icons' : '');
    const groupCount = [...dirs].filter(path => assetRoot && path.startsWith(`${assetRoot}/`) && !path.slice(assetRoot.length + 1).includes('/')).length;
    const score = libraryCount * 5 + (imageEntries.length ? 3 : 0) + (groupCount ? 2 : 0) + Math.min(rawReferenceCount, 3) * 2 + (dirs.has('json') ? 1 : 0);
    return { score, owner, repo:repo.name, branch, libraryCount, iconCount, assetCount:imageEntries.length, groupCount, rawReferenceCount, assetRoot:assetRoot || 'assets' };
  }
  async findProjectRepositories(repos) {
    const candidates = [];
    const pool = (repos || []).filter(repo => !repo.archived && !repo.disabled && !repo.empty).slice(0, 50);
    for (let index = 0; index < pool.length; index += 4) {
      const batch = await Promise.all(pool.slice(index, index + 4).map(async repo => {
        try { return await this.projectSignature(repo); } catch { return null; }
      }));
      candidates.push(...batch.filter(item => item && item.libraryCount > 0 && (item.assetCount > 0 || item.rawReferenceCount > 0)));
    }
    return candidates.sort((a, b) => b.score - a.score);
  }

  raw(path) { return `https://raw.githubusercontent.com/${encodeURIComponent(this.config.owner)}/${encodeURIComponent(this.config.repo)}/${encodeURIComponent(this.config.branch)}/${path.split('/').map(encodeURIComponent).join('/')}`; }

  ownedPath(url) {
    try {
      const u = new URL(url);
      if (u.protocol !== 'https:' || u.hostname !== 'raw.githubusercontent.com') return '';
      const parts = decodeURIComponent(u.pathname).slice(1).split('/');
      if (parts.length < 4) return '';
      const owner = String(parts.shift()).toLowerCase();
      const repo = String(parts.shift()).toLowerCase();
      if (owner !== String(this.config.owner).toLowerCase() || repo !== String(this.config.repo).toLowerCase()) return '';
      const rest=parts.join('/'), prefix=String(this.config.branch)+'/';
      return rest.startsWith(prefix)?rest.slice(prefix.length):'';
    } catch { /* external or invalid URL */ }
    return '';
  }
  static decode(value) { return new TextDecoder().decode(Uint8Array.from(atob(value.replace(/\s/g, '')), c => c.charCodeAt(0))); }
  static encode(buffer) {
    const b = new Uint8Array(buffer); let s = '';
    for (let i = 0; i < b.length; i += 32768) s += String.fromCharCode(...b.subarray(i, i + 32768));
    return btoa(s);
  }
  static name(value) { const v = value.trim(); if (!v || /[^A-Za-z0-9._ -]/.test(v)) throw new Error('图片名称只支持字母、数字、空格、横线、下划线和小数点。'); return v; }
  static group(value) { const v = value.trim(); if (!/^[A-Za-z0-9_-]+$/.test(v)) throw new Error('分组只支持英文字母、数字、横线和下划线。'); return v; }
  static filename(name, ext) { const stem = this.name(name).replace(/\s+/g, '-').replace(/^[-.]+|[-.]+$/g, '').slice(0, 80); if (!stem) throw new Error('图片文件名不能为空。'); return `${stem}.${ext.toLowerCase()}`; }
  static jsonPath(value) {
    let p = value.trim().replace(/^\/+/, ''); if (!p.endsWith('.json')) p += '.json'; if (!p.includes('/')) p = 'json/' + p;
    if (p.split('/').some(x => !/^[A-Za-z0-9._-]+$/.test(x) || x === '.' || x === '..')) throw new Error('JSON 路径只支持字母、数字、横线、下划线和小数点。');
    return p;
  }
  emptyMetadata() { return { version:METADATA_VERSION, assets:{}, libraries:{} }; }
  metadataFromSnapshot(snap) {
    if(snap.resolvedMetadata)return structuredClone(snap.resolvedMetadata);
    const entry=(snap.entries||[]).find(e=>e.path===METADATA_PATH);
    if(!entry)return this.emptyMetadata();
    try {
      const value=JSON.parse(GitHubClient.decode(entry.content || ''));
      if(!value||typeof value!=='object'||Array.isArray(value)||!value.assets||typeof value.assets!=='object'||Array.isArray(value.assets)||!value.libraries||typeof value.libraries!=='object'||Array.isArray(value.libraries))throw new Error('Invalid metadata');
      return { version:METADATA_VERSION, assets:value?.assets&&typeof value.assets==='object'?value.assets:{}, libraries:value?.libraries&&typeof value.libraries==='object'?value.libraries:{} };
    } catch { throw new Error('资源时间元数据损坏，已停止写入以保护历史记录。'); }
  }
  metadataChange(value) { return { path:METADATA_PATH, mode:'100644', type:'blob', content:JSON.stringify(value,null,2)+'\n' }; }
  async pathHistory(path, head=this.config.branch) {
    const rows=[];
    try {
      for(let page=1;page<=3;page++) {
        const batch=await this.request(`${this.base}/commits?path=${encodeURIComponent(path)}&sha=${encodeURIComponent(head)}&per_page=100&page=${page}`);
        if(!Array.isArray(batch))throw new Error('Invalid commit history');
        rows.push(...batch);
        if(batch.length<100)return { rows, complete:true, createdAt:rows.at(-1)?.commit?.committer?.date||null, updatedAt:rows[0]?.commit?.committer?.date||null, source:'git-history' };
      }
      return { rows, complete:false, createdAt:null, updatedAt:rows[0]?.commit?.committer?.date||null, source:'git-history-limited' };
    } catch (error) { return { rows:[], complete:false, createdAt:null, updatedAt:null, source:'unknown', retryable:![404,410].includes(error.status) }; }
  }
  // Pair exact duplicates by occurrence first. Only unambiguous URL/name edits
  // inherit identity; ambiguous replacements are new references, never another's age.
  reconcileReferences(previous, icons, date=null, source='unknown') {
    const pool=(previous||[]).map(x=>({...x})), result=icons.map(()=>null), used=new Set();
    icons.forEach((icon,i)=>{const n=pool.findIndex((x,j)=>!used.has(j)&&x.name===icon.name&&x.url===icon.url);if(n>=0){used.add(n);result[i]={...pool[n],name:icon.name,url:icon.url};}});
    icons.forEach((icon,i)=>{
      if(result[i])return;
      const candidates=pool.map((x,j)=>({x,j})).filter(({x,j})=>!used.has(j)&&(x.url===icon.url||x.name===icon.name));
      const match=candidates.length===1?candidates[0]:null;
      const unique=match&&icons.filter((x,k)=>!result[k]&&(x.url===match.x.url||x.name===match.x.name)).length===1;
      if(unique){used.add(match.j);result[i]={...match.x,name:icon.name,url:icon.url,updatedAt:date,source};}
      else result[i]={name:icon.name,url:icon.url,addedAt:date,updatedAt:date,source};
    });
    return result;
  }
  async referenceHistory(doc, history, previous, recordedBaseline) {
    if(!history.rows.length)return this.reconcileReferences(previous?.references,doc.value.icons);
    const stop=previous?.historySha;
    const index=stop?history.rows.findIndex(row=>row.sha===stop):-1;
    const pending=index>=0?history.rows.slice(0,index):history.rows;
    // Limit content lookups too. Incomplete reference ancestry is explicitly unknown.
    if(pending.length>30)return this.reconcileReferences(previous?.references,doc.value.icons);
    let refs=index>=0?(previous.references||[]):[];
    let known=index>=0||history.complete;
    try {
      for(const row of [...pending].reverse()) {
        const file=await this.request(`${this.base}/contents/${doc.path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(row.sha)}`);
        const value=JSON.parse(GitHubClient.decode(file.content||''));
        if(!Array.isArray(value?.icons)){refs=[];known=true;continue;}
        const baseline=[previous,recordedBaseline].find(b=>b?.blobSha&&file.sha===b.blobSha);
        if(baseline){refs=this.referenceMetadata(baseline,value.icons);known=true;}
        else refs=this.reconcileReferences(refs,value.icons,known?row.commit?.committer?.date||null:null,known?'git-history':'unknown');
        known=true;
      }
      return this.reconcileReferences(refs,doc.value.icons);
    } catch (error) { history.retryable=![404,410].includes(error.status); return this.reconcileReferences(previous?.references,doc.value.icons); }
  }
  async syncMetadata(snap, images, previous) {
    // Optional on-disk metadata is validated but read-only during synchronization.
    // SHA-bound session state, not that optional index, decides external changes.
    const disk=this.metadataFromSnapshot(snap);
    const metadata=this.emptyMetadata();
    const before=new Map((previous?.snapshot?.entries||[]).map(e=>[e.path,e]));
    for(const entry of [...images,...snap.docs]) {
      const asset=!entry.value, key=asset?'assets':'libraries';
      const recorded=disk[key]?.[entry.path], cached=previous?.metadata?.[key]?.[entry.path];
      // Only an exact blob binding permits disk to supersede session history.
      const bound=recorded?.blobSha===entry.sha;
      const prior=bound?recorded:cached;
      if(prior&&!prior.retryable&&(bound||before.get(entry.path)?.sha===entry.sha)){metadata[key][entry.path]=structuredClone(prior);continue;}
      const history=await this.pathHistory(entry.path,snap.head);
      const time={createdAt:prior?.createdAt||history.createdAt,updatedAt:history.updatedAt||prior?.updatedAt||null,source:history.source,historySha:history.rows[0]?.sha||null,blobSha:entry.sha};
      if(!asset)time.references=await this.referenceHistory(entry,history,prior?.retryable?undefined:prior,recorded);
      time.retryable=!!history.retryable;
      metadata[key][entry.path]=time;
    }
    for(const doc of snap.docs) {
      const lib=metadata.libraries[doc.path];
      lib.references=lib.references.map(ref=>{
        const path=this.ownedPath(ref.url), image=metadata.assets[path];
        if(!image?.updatedAt)return ref;
        if(!ref.updatedAt||Date.parse(image.updatedAt)>Date.parse(ref.updatedAt))return {...ref,updatedAt:image.updatedAt};
        return ref;
      });
    }
    return metadata;
  }
  touchLibrary(metadata, doc, now, createdAt=null) {
    const previous=metadata.libraries[doc.path]||{};
    const library={...previous,createdAt:previous.createdAt||createdAt||null,updatedAt:now,references:this.referenceMetadata(previous,doc.value.icons)};
    metadata.libraries[doc.path]=library; return library;
  }
  referenceMetadata(library, icons) {
    const pool=(library?.references||[]).map(x=>({...x}));
    return icons.map(icon=>{const index=pool.findIndex(x=>x.url===icon.url&&x.name===icon.name);return index<0?{name:icon.name,url:icon.url,addedAt:null,source:'unknown'}:pool.splice(index,1)[0];});
  }
  async snapshot(head=null, previous=null) {
    const ref = head ? {object:{sha:head}} : await this.request(`${this.base}/git/ref/heads/${encodeURIComponent(this.config.branch)}`);
    const commit = await this.request(`${this.base}/git/commits/${ref.object.sha}`);
    const result = await this.request(`${this.base}/git/trees/${commit.tree.sha}?recursive=1`);
    if (result.truncated) throw new Error('仓库文件过多，GitHub 返回了不完整目录。已停止，避免遗漏 JSON 引用。');
    const entries = result.tree.filter(e => e.type === 'blob'); const docs = [];
    for (const entry of entries.filter(e => /\.json$/i.test(e.path))) {
      const cached=previous?.entries.find(e=>e.path===entry.path&&e.sha===entry.sha&&e.content!==undefined);
      const blob = cached || await this.request(`${this.base}/git/blobs/${entry.sha}`); entry.content=blob.content; let value;
      try { value = JSON.parse(GitHubClient.decode(blob.content)); }
      catch { if (entry.path===METADATA_PATH || entry.path.startsWith('json/') || previous?.docs.some(d=>d.path===entry.path)) throw new Error(`JSON 格式错误：${entry.path}，已停止操作。`); continue; }
      if (!value || !Array.isArray(value.icons)) continue;
      if (value.icons.some(i => !i || typeof i.name !== 'string' || typeof i.url !== 'string')) throw new Error(`图片记录格式异常：${entry.path}，请修复后重试。`);
      docs.push({ path:entry.path, sha:entry.sha, value });
    }
    return { head:ref.object.sha, tree:commit.tree.sha, entries, docs, directories:result.tree.filter(e => e.type === 'tree').map(e => e.path) };
  }
  async load() {
    if(this.loading)return this.loading;
    this.loading=this.loadIncremental();
    try { return await this.loading; } finally { this.loading=null; }
  }
  async loadIncremental() {
    const previous=this.cached;
    const repo = previous?.repo || await this.request(this.base);
    if (!this.config.branch) this.config.branch = repo.default_branch;
    let ref;
    try { ref=await this.request(`${this.base}/git/ref/heads/${encodeURIComponent(this.config.branch)}`); }
    catch(error) {
      if(![404,409].includes(error.status))throw error;
      const fresh=await this.request(this.base);
      if(fresh.size!==0 || previous?.snapshot)throw error;
      return this.cached={repo:fresh,root:this.config.assetsPath||'assets',assets:[],groups:[],libraries:[],metadata:this.emptyMetadata(),snapshot:null};
    }
    if(previous?.snapshot?.head===ref.object.sha&&!previous.historyWarnings?.some(w=>w.code==='HISTORY_RETRYABLE'))return previous;
    const snap = await this.snapshot(ref.object.sha,previous?.snapshot);
    const roots = [...new Set([this.config.assetsPath || 'assets', 'assets', 'icons'])];
    const root = roots.find(p => snap.directories.includes(p) || snap.entries.some(e => e.path.startsWith(p + '/'))) || roots[0];
    const images = snap.entries.filter(e => e.path.startsWith(root + '/') && /\.(png|jpe?g|webp|gif|svg)$/i.test(e.path));
    const metadata=await this.syncMetadata(snap,images,previous);
    const assets = images.map(e => {
      const rel = e.path.slice(root.length + 1), parts = rel.split('/'), time=metadata.assets[e.path]||{};
      return { ...e, id:e.path, group:parts.length > 1 ? parts[0] : '', name:parts.at(-1).replace(/\.[^.]+$/, ''), ext:parts.at(-1).split('.').at(-1).toUpperCase(), url:this.raw(e.path), createdAt:time.createdAt||null, updatedAt:time.updatedAt||null, timeSource:time.source||'unknown' };
    });
    const names = new Set(snap.directories.filter(p => p.startsWith(root + '/') && !p.slice(root.length + 1).includes('/')).map(p => p.slice(root.length + 1)));
    assets.forEach(a => names.add(a.group));
    const libraries=snap.docs.map(d=>{const time=metadata.libraries[d.path]||{}, refs=this.referenceMetadata(time,d.value.icons);return { id:d.path, file:d.path, ...d, name:typeof d.value.name==='string'&&d.value.name?d.value.name:d.path.split('/').at(-1), description:typeof d.value.description==='string'?d.value.description:'', icons:d.value.icons.map((icon,index)=>({...icon,addedAt:refs[index]?.addedAt||null,updatedAt:refs[index]?.updatedAt||null,timeSource:refs[index]?.source||'unknown'})), count:d.value.icons.length, createdAt:time.createdAt||null, updatedAt:time.updatedAt||null, timeSource:time.source||'unknown' };});
    const historyWarnings=Object.entries({...metadata.assets,...metadata.libraries}).filter(([,time])=>time.retryable||time.source==='unknown'||time.source==='git-history-limited'||!time.createdAt||time.references?.some(r=>!r.addedAt||r.source==='unknown')).map(([path,time])=>({path,code:time.retryable?'HISTORY_RETRYABLE':time.source==='git-history-limited'?'HISTORY_LIMITED':'HISTORY_UNKNOWN',message:time.retryable?'时间历史暂时不可用，下次刷新会重试。':'历史记录不完整，部分时间不可用。'}));
    return this.cached={ repo, snapshot:snap, metadata, historyWarnings, root, assets, groups:[...names].sort().map(name => ({ name, count:assets.filter(a => a.group === name).length })), libraries };
  }
  jsonChange(doc, value) { return { path:doc.path, mode:'100644', type:'blob', content:JSON.stringify(value, null, 2) + '\n' }; }
  async atomic(message, build) {
    if (GitHubClient.writing) throw new Error('上一项操作尚未完成，请稍候。');
    GitHubClient.writing = true;
    try { if(this.loading)await this.loading.catch(()=>{}); return await this.commitAtomic(message, build); }
    finally { GitHubClient.writing = false; }
  }
  async commitAtomic(message, build) {
    for (let attempt = 0; attempt < 3; attempt++) {
      let snap;
      try { snap=await this.snapshot(); }
      catch(error) {
        if(![404,409].includes(error.status) || (await this.request(this.base)).size!==0)throw error;
        // Only an explicit mutation initializes a truly blank repository.
        try { await this.request(`${this.base}/contents/${(this.config.assetsPath||'assets').split('/').map(encodeURIComponent).join('/')}/.gitkeep`, 'PUT', {message:'初始化资源仓库',content:btoa('\n'),branch:this.config.branch}); }
        catch(initError) { if(![409,422].includes(initError.status))throw initError; }
        snap=await this.snapshot();
      }
      if(snap.entries){
        const images=snap.entries.filter(e=>e.path.startsWith((this.config.assetsPath||'assets')+'/')&&/\.(png|jpe?g|webp|gif|svg)$/i.test(e.path));
        snap.resolvedMetadata=await this.syncMetadata(snap,images,this.cached);
        if(Object.values({...snap.resolvedMetadata.assets,...snap.resolvedMetadata.libraries}).some(time=>time.retryable))throw new Error('时间历史暂时不可用，请刷新恢复后再修改，避免丢失原始时间。');
      }
      const changes = await build(snap);
      if (!changes.length) return { changed:false };
      const metaChange=changes.find(e=>e.path===METADATA_PATH);
      if(metaChange){
        const metadata=JSON.parse(metaChange.content), entries=new Map((snap.entries||[]).map(e=>[e.path,e]));
        for(const change of changes){
          if(change===metaChange)continue;
          if(change.content!==undefined){const blob=await this.request(`${this.base}/git/blobs`,'POST',{content:change.content,encoding:'utf-8'});change.sha=blob.sha;delete change.content;}
          if(change.sha===null)entries.delete(change.path);else entries.set(change.path,change);
        }
        for(const key of ['assets','libraries'])for(const [path,time] of Object.entries(metadata[key])){const entry=entries.get(path);if(entry)time.blobSha=entry.sha;else delete metadata[key][path];}
        metaChange.content=this.metadataChange(metadata).content;
      }
      const tree = await this.request(`${this.base}/git/trees`, 'POST', { base_tree:snap.tree, tree:changes });
      const commit = await this.request(`${this.base}/git/commits`, 'POST', { message, tree:tree.sha, parents:[snap.head] });
      try {
        await this.request(`${this.base}/git/refs/heads/${encodeURIComponent(this.config.branch)}`, 'PATCH', { sha:commit.sha, force:false });
        return { changed:true, commit:commit.sha };
      } catch (error) {
        let latest;
        try {
          latest=await this.request(`${this.base}/git/ref/heads/${encodeURIComponent(this.config.branch)}`);
          if(latest.object.sha===commit.sha)return {changed:true,commit:commit.sha,recovered:true};
          if(latest.object.sha!==snap.head){
            const comparison=await this.request(`${this.base}/compare/${encodeURIComponent(commit.sha)}...${encodeURIComponent(latest.object.sha)}`);
            if(['ahead','identical'].includes(comparison.status))return {changed:true,commit:commit.sha,recovered:true};
          }
        } catch { /* An unreadable branch cannot establish whether PATCH landed. */ }
        if(![409,422].includes(error.status)||!latest){
          const uncertain=new Error('提交结果待确认，请先刷新仓库核查，不要直接重试。');
          uncertain.code='COMMIT_OUTCOME_UNKNOWN';uncertain.commit=commit.sha;uncertain.requiresRefresh=true;throw uncertain;
        }
        if(latest.object.sha===snap.head||attempt===2)throw error;
      }
    }
  }
  async upload(file, name, group, libraryPath = '') {
    const ext = (file.name.split('.').pop() || 'png').toLowerCase();
    if (!['png','jpg','jpeg','webp','gif','svg'].includes(ext)) throw new Error('暂不支持这个图片格式。');
    const cleanGroup = GitHubClient.group(group), cleanName = GitHubClient.name(name);
    const path = `${this.config.assetsPath}/${cleanGroup}/${GitHubClient.filename(cleanName, ext)}`;
    const buffer = await file.arrayBuffer(), now=new Date().toISOString();
    const content = GitHubClient.encode(buffer), url = this.raw(path);
    await this.atomic(`上传图片：${cleanName}`, async snap => {
      if (snap.entries.some(e => e.path === path)) throw new Error(`同名图片已存在：${path.split('/').at(-1)}`);
      const changes = [{ path, mode:'100644', type:'blob', sha:(await this.request(`${this.base}/git/blobs`, 'POST', { content, encoding:'base64' })).sha }];
      const metadata=this.metadataFromSnapshot(snap); metadata.assets[path]={createdAt:now,updatedAt:now,source:'recorded'};
      if (libraryPath) {
        const doc = snap.docs.find(d => d.path === libraryPath); if (!doc) throw new Error('找不到目标 JSON 库。');
        const value = structuredClone(doc.value), library=this.touchLibrary(metadata,doc,now); if (!value.icons.some(i => i.url === url)){ value.icons.push({ name:cleanName, url }); library.references.push({name:cleanName,url,addedAt:now,updatedAt:now,source:'recorded'}); }
        changes.push(this.jsonChange(doc, value));
      }
      changes.push(this.metadataChange(metadata)); return changes;
    });
    return { path, url, name:cleanName, group:cleanGroup, ext:ext.toUpperCase() };
  }
  async renameAsset(item, nextName) {
    const cleanName = GitHubClient.name(nextName), ext = item.path.split('.').at(-1), parent = item.path.split('/').slice(0,-1).join('/'), nextPath = `${parent}/${GitHubClient.filename(cleanName, ext)}`;
    if (nextPath === item.path) return;
    await this.atomic(`图片改名：${item.name} → ${cleanName}`, async snap => {
      const source = snap.entries.find(e => e.path === item.path); if (!source) throw new Error('原图片已经不存在，请刷新。');
      if (snap.entries.some(e => e.path === nextPath)) throw new Error(`同名图片已存在：${nextPath.split('/').at(-1)}`);
      const changes = [{ path:nextPath, mode:'100644', type:'blob', sha:source.sha }, { path:item.path, mode:'100644', type:'blob', sha:null }];
      const nextUrl = this.raw(nextPath);
      const metadata=this.metadataFromSnapshot(snap),now=new Date().toISOString(); metadata.assets[nextPath]={...metadata.assets[item.path],createdAt:metadata.assets[item.path]?.createdAt||null,updatedAt:now,source:'recorded'};delete metadata.assets[item.path];
      for (const doc of snap.docs) if (doc.value.icons.some(i => this.ownedPath(i.url) === item.path)) {
        const value = structuredClone(doc.value), library=this.touchLibrary(metadata,doc,now); value.icons = value.icons.map(i => this.ownedPath(i.url) === item.path ? { ...i, name:cleanName, url:nextUrl } : i); library.references=library.references.map(i=>this.ownedPath(i.url)===item.path?{...i,name:cleanName,url:nextUrl,updatedAt:now}:i); changes.push(this.jsonChange(doc, value));
      }
      changes.push(this.metadataChange(metadata)); return changes;
    });
  }
  async deleteAsset(item) {
    return this.atomic(`删除图片：${item.name}`, async snap => {
      const source = snap.entries.find(e => e.path === item.path); if (!source) throw new Error('图片已经不存在，请刷新。');
      const changes = [{ path:item.path, mode:'100644', type:'blob', sha:null }], metadata=this.metadataFromSnapshot(snap); delete metadata.assets[item.path];
      for (const doc of snap.docs) if (doc.value.icons.some(i => this.ownedPath(i.url) === item.path)) { const value = structuredClone(doc.value), library=this.touchLibrary(metadata,doc,new Date().toISOString()); value.icons = value.icons.filter(i => this.ownedPath(i.url) !== item.path); library.references=library.references.filter(i=>this.ownedPath(i.url)!==item.path); changes.push(this.jsonChange(doc, value)); }
      changes.push(this.metadataChange(metadata)); return changes;
    });
  }
  async deleteSelected(items) {
    if (!items.length) return;
    return this.atomic(`批量删除图片：${items.length} 张`, async snap => {
      const paths = new Set(items.map(i => i.path)); const changes = [], metadata=this.metadataFromSnapshot(snap); paths.forEach(path=>delete metadata.assets[path]);
      for (const item of items) { if (snap.entries.some(e => e.path === item.path)) changes.push({ path:item.path, mode:'100644', type:'blob', sha:null }); }
      for (const doc of snap.docs) if (doc.value.icons.some(i => paths.has(this.ownedPath(i.url)))) { const value = structuredClone(doc.value), library=this.touchLibrary(metadata,doc,new Date().toISOString()); value.icons = value.icons.filter(i => !paths.has(this.ownedPath(i.url))); library.references=library.references.filter(i=>!paths.has(this.ownedPath(i.url))); changes.push(this.jsonChange(doc, value)); }
      if(!changes.length)return [];changes.push(this.metadataChange(metadata)); return changes;
    });
  }
  async renameGroup(group, nextGroup) {
    const oldName=GitHubClient.group(group),nextName=GitHubClient.group(nextGroup);if(oldName===nextName)return;
    const oldRoot=`${this.config.assetsPath}/${oldName}/`,nextRoot=`${this.config.assetsPath}/${nextName}/`;
    await this.atomic(`分组改名：${oldName} → ${nextName}`,async snap=>{
      if(snap.entries.some(e=>e.path===nextRoot||e.path.startsWith(nextRoot)))throw new Error(`目标分组已存在：${nextName}`);
      const files=snap.entries.filter(e=>e.path.startsWith(oldRoot));if(!files.length)throw new Error('当前分组没有文件。');
      const changes=files.map(e=>({path:nextRoot+e.path.slice(oldRoot.length),mode:e.mode||'100644',type:'blob',sha:e.sha})).concat(files.map(e=>({path:e.path,mode:e.mode||'100644',type:'blob',sha:null}))),metadata=this.metadataFromSnapshot(snap),now=new Date().toISOString();
      files.forEach(e=>{if(metadata.assets[e.path]||/\.(png|jpe?g|webp|gif|svg)$/i.test(e.path)){metadata.assets[nextRoot+e.path.slice(oldRoot.length)]={...metadata.assets[e.path],createdAt:metadata.assets[e.path]?.createdAt||null,updatedAt:now,source:'recorded'};delete metadata.assets[e.path];}});
      for(const doc of snap.docs){let touched=false;const value=structuredClone(doc.value);value.icons=value.icons.map(i=>{const path=this.ownedPath(i.url);if(!path.startsWith(oldRoot))return i;touched=true;return {...i,url:this.raw(nextRoot+path.slice(oldRoot.length))};});if(touched){const library=this.touchLibrary(metadata,doc,now);library.references=library.references.map(i=>{const path=this.ownedPath(i.url);return path.startsWith(oldRoot)?{...i,url:this.raw(nextRoot+path.slice(oldRoot.length)),updatedAt:now}:i;});changes.push(this.jsonChange(doc,value));}}
      changes.push(this.metadataChange(metadata));return changes;
    });
  }
  async deleteGroup(group) {
    const root=`${this.config.assetsPath}/${GitHubClient.group(group)}/`;
    return this.atomic(`删除图片分组：${group}`,async snap=>{const files=snap.entries.filter(e=>e.path.startsWith(root)),paths=new Set(files.map(e=>e.path)),changes=files.map(e=>({path:e.path,mode:e.mode||'100644',type:'blob',sha:null})),metadata=this.metadataFromSnapshot(snap),now=new Date().toISOString();paths.forEach(path=>delete metadata.assets[path]);for(const doc of snap.docs)if(doc.value.icons.some(i=>paths.has(this.ownedPath(i.url)))){const value=structuredClone(doc.value),library=this.touchLibrary(metadata,doc,now);value.icons=value.icons.filter(i=>!paths.has(this.ownedPath(i.url)));library.references=library.references.filter(i=>!paths.has(this.ownedPath(i.url)));changes.push(this.jsonChange(doc,value));}if(!changes.length)return [];changes.push(this.metadataChange(metadata));return changes;});
  }
  async createGroup(group) {
    const name = GitHubClient.group(group), root = `${this.config.assetsPath}/${name}`, path = `${root}/.gitkeep`;
    return this.atomic(`新建图片分组：${name}`, async snap => { if (snap.entries.some(e => e.path === root || e.path.startsWith(root+'/')) || (snap.directories||[]).includes(root)) throw new Error('分组已经存在。'); return [{ path, mode:'100644', type:'blob', content:'\n' }]; });
  }
  async appendToLibrary(path, items) {
    let added = 0, skipped = 0; const now=new Date().toISOString();
    const result = await this.atomic(`加入 JSON 库：${items.length} 张`, async snap => {
      const doc = snap.docs.find(d => d.path === path); if (!doc) throw new Error('找不到 JSON 库。');
      const value = structuredClone(doc.value), urls = new Set(value.icons.map(i => i.url)), metadata=this.metadataFromSnapshot(snap), library=this.touchLibrary(metadata,doc,now);
      added = 0; skipped = 0;
      for (const item of items) { if (urls.has(item.url)) { skipped++; continue; } value.icons.push({ name:item.name, url:item.url }); library.references.push({name:item.name,url:item.url,addedAt:now,updatedAt:now,source:'recorded'}); urls.add(item.url); added++; }
      return added ? [this.jsonChange(doc, value),this.metadataChange(metadata)] : [];
    });
    return { ...result, added, skipped };
  }
  async saveIcon(path,index,name,url,expectedSha) {
    const cleanName=GitHubClient.name(name),parsed=new URL(url);if(parsed.protocol!=='https:'||parsed.hostname!=='raw.githubusercontent.com')throw new Error('这里只允许使用 GitHub Raw HTTPS 图片直链。');
    return this.atomic(`修改图片：${cleanName}`,async snap=>{const doc=snap.docs.find(d=>d.path===path);if(!doc)throw new Error('找不到 JSON 库。');if(!expectedSha||doc.sha!==expectedSha)throw new Error('JSON 已被其他客户端修改，请刷新后重试。');const value=structuredClone(doc.value);if(index<0||!value.icons[index])throw new Error('图片已经不存在，请刷新。');if(value.icons[index].name===cleanName&&value.icons[index].url===url.trim())return [];const now=new Date().toISOString(),metadata=this.metadataFromSnapshot(snap),library=this.touchLibrary(metadata,doc,now),previous=library.references[index]||{};value.icons[index]={...value.icons[index],name:cleanName,url:url.trim()};library.references[index]={...previous,name:cleanName,url:url.trim(),updatedAt:now,source:'recorded'};return [this.jsonChange(doc,value),this.metadataChange(metadata)];});
  }
  async removeIcons(path,indexes,expectedSha) {
    const wanted=new Set(indexes.map(Number));return this.atomic(`从 JSON 移除图片：${wanted.size} 项`,async snap=>{const doc=snap.docs.find(d=>d.path===path);if(!doc)throw new Error('找不到 JSON 库。');if(!expectedSha||doc.sha!==expectedSha)throw new Error('JSON 已被其他客户端修改，请刷新后重试。');if(!doc.value.icons.some((_,i)=>wanted.has(i)))return [];const value=structuredClone(doc.value),metadata=this.metadataFromSnapshot(snap),library=this.touchLibrary(metadata,doc,new Date().toISOString());value.icons=value.icons.filter((_,i)=>!wanted.has(i));library.references=library.references.filter((_,i)=>!wanted.has(i));return [this.jsonChange(doc,value),this.metadataChange(metadata)];});
  }
  async createLibrary(path,name,description) { const file=GitHubClient.jsonPath(path),now=new Date().toISOString();return this.atomic(`创建 JSON 库：${name}`,async snap=>{if(snap.entries.some(e=>e.path===file))throw new Error('仓库中已经存在同名 JSON 文件。');const metadata=this.metadataFromSnapshot(snap);metadata.libraries[file]={createdAt:now,updatedAt:now,references:[],source:'recorded'};return [{path:file,mode:'100644',type:'blob',content:JSON.stringify({name:name.trim(),description:description.trim(),icons:[]},null,2)+'\n'},this.metadataChange(metadata)];}); }
  async saveLibrary(path,nextPath,name,description) { const target=GitHubClient.jsonPath(nextPath),now=new Date().toISOString();return this.atomic(`修改 JSON 库：${name}`,async snap=>{const doc=snap.docs.find(d=>d.path===path);if(!doc)throw new Error('找不到原 JSON 文件，请刷新。');if(target!==path&&snap.entries.some(e=>e.path===target))throw new Error('目标 JSON 文件已经存在。');if(target===path&&doc.value.name===name.trim()&&doc.value.description===description.trim())return [];const value=structuredClone(doc.value),metadata=this.metadataFromSnapshot(snap),library=this.touchLibrary(metadata,doc,now);value.name=name.trim();value.description=description.trim();if(target!==path){metadata.libraries[target]=library;delete metadata.libraries[path];}const changes=[this.jsonChange({...doc,path:target},value),this.metadataChange(metadata)];if(target!==path)changes.push({path,mode:'100644',type:'blob',sha:null});return changes;}); }
  async deleteLibrary(path) { return this.atomic(`删除 JSON 库：${path}`,async snap=>{const doc=snap.docs.find(d=>d.path===path);if(!doc)throw new Error('文件已经不存在，请刷新。');const metadata=this.metadataFromSnapshot(snap);delete metadata.libraries[path];return [{path,mode:'100644',type:'blob',sha:null},this.metadataChange(metadata)];}); }

}
window.GitHubClient = GitHubClient;
