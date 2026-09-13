import http from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { randomBytes, timingSafeEqual } from 'node:crypto';

const PORT = Number(process.env.PORT || 8765);
const HOST = process.env.HOST || '127.0.0.1';
const BASE = new URL(process.env.PUBLIC_BASE_URL || `http://127.0.0.1:${PORT}`);
const DELETE_REPO = process.env.ENABLE_REPO_DELETE === 'true';
const OAUTH_CLIENT_ID = String(process.env.GITHUB_CLIENT_ID || '').trim();
const OAUTH_CLIENT_SECRET = String(process.env.GITHUB_CLIENT_SECRET || '').trim();
const OAUTH_SCOPE = String(process.env.GITHUB_OAUTH_SCOPE || 'public_repo').trim() || 'public_repo';
const OAUTH_REDIRECT_URI = String(process.env.GITHUB_OAUTH_REDIRECT_URI || new URL('/api/auth/github/callback', BASE)).trim();
const OAUTH_ENABLED = Boolean(OAUTH_CLIENT_ID && OAUTH_CLIENT_SECRET);
const TOKEN_LOGIN_ENABLED = process.env.ENABLE_TOKEN_LOGIN === 'true';
const ADMIN_GITHUB_LOGIN = String(process.env.ADMIN_GITHUB_LOGIN || '').trim().toLowerCase();
const ADMIN_RESTORE_REPO = String(process.env.ADMIN_RESTORE_REPO || '').trim();
const ALLOWED_GITHUB_LOGINS = new Set(String(process.env.ALLOWED_GITHUB_LOGINS || '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean));
let accessPolicy = { allowAll: ALLOWED_GITHUB_LOGINS.size === 0, allowed: [...ALLOWED_GITHUB_LOGINS] };
const POLICY_FILE = process.env.POLICY_FILE || '/app/data/access-policy.json';
try {
  const stored = JSON.parse(await readFile(POLICY_FILE, 'utf8'));
  if (stored && Array.isArray(stored.allowed)) accessPolicy = { allowAll:Boolean(stored.allowAll), allowed:[...new Set(stored.allowed.map(value => String(value).toLowerCase()).filter(Boolean))] };
} catch { /* first run or read-only filesystem: use environment defaults */ }
const SECURE = BASE.protocol === 'https:';
const sessions = new Map();
const oauthStates = new Map();
const random = () => randomBytes(32).toString('hex');
const redirect = (res, location) => { res.writeHead(302, { Location:location, 'Cache-Control':'no-store' }); res.end(); };
function oauthError(code) { const target = new URL('/', BASE); target.searchParams.set('auth_error', code); return target.toString(); }
function oauthAuthorizeUrl(state) {
  const target = new URL('https://github.com/login/oauth/authorize');
  target.search = new URLSearchParams({ client_id:OAUTH_CLIENT_ID, redirect_uri:OAUTH_REDIRECT_URI, scope:OAUTH_SCOPE, state }).toString();
  return target.toString();
}
function clearOAuthCookie() { return cookie('gh_oauth_state', '', 0); }
const equal = (a, b) => typeof a === 'string' && typeof b === 'string' && a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const ROOT = new URL('./', import.meta.url);
const assets = new Map([
  ['/','index.html'], ['/index.html','index.html'], ['/styles.css','styles.css'],
  ['/console.css','console.css'], ['/console.js','console.js'], ['/github.js','github.js'],
  ['/source/index.html','index.html'], ['/source/styles.css','styles.css'], ['/source/console.css','console.css'],
  ['/source/console.js','console.js'], ['/source/github.js','github.js'], ['/source/server.mjs','server.mjs'],
  ['/source/Dockerfile','Dockerfile'], ['/source/compose.yaml','compose.yaml'], ['/source/.env.example','.env.example'],
  ['/source/install.sh','install.sh']
]);
const mime = { html:'text/html; charset=utf-8', css:'text/css; charset=utf-8', js:'text/javascript; charset=utf-8' };
function cookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').map(s => s.trim().split('=')).filter(p => p.length === 2));
}
function cookie(name, value, age) { return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${SECURE ? '; Secure' : ''}`; }
function json(res, code, value) { res.writeHead(code, { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' }); res.end(JSON.stringify(value)); }
function session(req) {
  const id = cookies(req).gh_session, value = sessions.get(id);
  if (!value || value.expires < Date.now()) { if (id) sessions.delete(id); return null; }
  return value;
}
function accessFor(login) {
  const value = String(login || '').trim().toLowerCase();
  const isAdmin = Boolean(ADMIN_GITHUB_LOGIN && value === ADMIN_GITHUB_LOGIN);
  const allowed = isAdmin || accessPolicy.allowAll || accessPolicy.allowed.includes(value);
  return { allowed, isAdmin, adminConfigured:Boolean(ADMIN_GITHUB_LOGIN), policyConfigured:Boolean(!accessPolicy.allowAll) };
}
function safeUser(user) { return { login:user.login, name:user.name, avatar_url:user.avatar_url }; }
function createSession(token, user) {
  const sid = random();
  sessions.set(sid, { token, csrf:random(), expires:Date.now() + 8 * 60 * 60 * 1000, user:safeUser(user) });
  return sid;
}
function requireCSRF(req, res, auth) {
  if ((req.headers.origin && req.headers.origin !== BASE.origin) || !equal(req.headers['x-csrf-token'], auth.csrf)) {
    json(res, 403, { message:'会话校验失败，请刷新页面后重试。' }); return false;
  }
  return true;
}
async function readBody(req) {
  const chunks = []; let size = 0;
  for await (const chunk of req) { size += chunk.length; if (size > 16 * 1024 * 1024) { const e = new Error('请求过大'); e.status = 413; throw e; } chunks.push(chunk); }
  return Buffer.concat(chunks);
}
function allowedAPI(url, method) {
  if (url.origin !== 'https://api.github.com' || url.username || url.password || url.hash) return false;
  const p = url.pathname;
  if (method === 'GET') return p === '/user' || p === '/user/repos' || /^\/repos\/[^/]+\/[^/]+(?:\/git\/(?:ref|refs|commits|trees|blobs)\/.*|\/contents(?:\/.*)?)?$/.test(p);
  if (method === 'POST') return p === '/user/repos' || /^\/repos\/[^/]+\/[^/]+\/git\/(?:trees|commits|blobs)$/.test(p);
  if (method === 'PATCH') return /^\/repos\/[^/]+\/[^/]+\/git\/refs\/heads\/.+/.test(p) || /^\/repos\/[^/]+\/[^/]+$/.test(p);
  if (method === 'DELETE') return DELETE_REPO && (/^\/repos\/[^/]+\/[^/]+$/.test(p) || /^\/repos\/[^/]+\/[^/]+\/contents(?:\/.*)?$/.test(p));
  return false;
}
async function github(url, init = {}) { return fetch(url, { ...init, redirect:'error', signal:AbortSignal.timeout(45000) }); }

const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data: blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  try {
    const url = new URL(req.url, BASE);
    if (url.pathname === '/api/auth/me' && req.method === 'GET') {
      const auth = session(req);
      const permission = accessFor(auth?.user?.login);
      return json(res, 200, { user:auth?.user || null, csrf:auth?.csrf || null, oauthEnabled:OAUTH_ENABLED, tokenLoginEnabled:TOKEN_LOGIN_ENABLED, repoDelete:DELETE_REPO, adminConfigured:permission.adminConfigured, isAdmin:Boolean(auth && permission.isAdmin), policyConfigured:permission.policyConfigured, restoreRepo:(auth && permission.isAdmin) ? ADMIN_RESTORE_REPO : '' });
    }
    if (url.pathname === '/api/auth/github' && req.method === 'GET') {
      if (!OAUTH_ENABLED) return redirect(res, oauthError('oauth_not_configured'));
      const state = random();
      oauthStates.set(state, { expires:Date.now() + 10 * 60 * 1000 });
      res.setHeader('Set-Cookie', cookie('gh_oauth_state', state, 600));
      return redirect(res, oauthAuthorizeUrl(state));
    }
    if (url.pathname === '/api/auth/github/callback' && req.method === 'GET') {
      const state = url.searchParams.get('state') || '';
      const stored = oauthStates.get(state);
      oauthStates.delete(state);
      const stateCookie = cookies(req).gh_oauth_state;
      res.setHeader('Set-Cookie', clearOAuthCookie());
      if (!OAUTH_ENABLED) return redirect(res, oauthError('oauth_not_configured'));
      if (!state || !stored || stored.expires < Date.now() || !equal(state, stateCookie)) return redirect(res, oauthError('oauth_state'));
      if (url.searchParams.get('error')) return redirect(res, oauthError('oauth_denied'));
      const code = url.searchParams.get('code') || '';
      if (!code || code.length > 400) return redirect(res, oauthError('oauth_code'));
      const tokenResponse = await github('https://github.com/login/oauth/access_token', { method:'POST', headers:{ Accept:'application/json', 'Content-Type':'application/json', 'User-Agent':'github-image-host-web' }, body:JSON.stringify({ client_id:OAUTH_CLIENT_ID, client_secret:OAUTH_CLIENT_SECRET, code, redirect_uri:OAUTH_REDIRECT_URI }) });
      const tokenData = await tokenResponse.json().catch(() => ({}));
      if (!tokenResponse.ok || !tokenData.access_token) return redirect(res, oauthError('oauth_exchange'));
      const userResponse = await github('https://api.github.com/user', { headers:{ Authorization:`Bearer ${tokenData.access_token}`, Accept:'application/vnd.github+json', 'X-GitHub-Api-Version':'2022-11-28', 'User-Agent':'github-image-host-web' } });
      if (!userResponse.ok) return redirect(res, oauthError('oauth_user'));
      const user = await userResponse.json();
      const permission = accessFor(user.login);
      if (!permission.allowed) return redirect(res, oauthError('forbidden'));
      const sid = createSession(tokenData.access_token, user);
      res.setHeader('Set-Cookie', [clearOAuthCookie(), cookie('gh_session', sid, 8 * 60 * 60)]);
      return redirect(res, new URL('/', BASE).toString());
    }
    if (url.pathname === '/api/admin/policy' && req.method === 'GET') {
      const auth = session(req), permission = accessFor(auth?.user?.login);
      if (!auth || !permission.isAdmin) return json(res, 403, { message:'只有管理员可以查看访问策略。' });
      return json(res, 200, { allowAll:accessPolicy.allowAll, allowed:[...accessPolicy.allowed] });
    }
    if (url.pathname === '/api/admin/policy' && req.method === 'PUT') {
      const auth = session(req), permission = accessFor(auth?.user?.login);
      if (!auth || !permission.isAdmin || !requireCSRF(req, res, auth)) return;
      const raw = await readBody(req); let input;
      try { input = JSON.parse(raw.toString('utf8')); } catch { return json(res, 400, { message:'请求格式错误。' }); }
      const allowed = [...new Set((Array.isArray(input?.allowed) ? input.allowed : []).map(value => String(value).trim().toLowerCase()).filter(value => /^[a-z0-9-]+$/.test(value)))];
      accessPolicy = { allowAll:Boolean(input?.allowAll), allowed:Array.from(new Set([ADMIN_GITHUB_LOGIN, ...allowed].filter(Boolean))) };
      try { await mkdir('/app/data', { recursive:true }); await writeFile(POLICY_FILE, JSON.stringify(accessPolicy, null, 2), { mode:0o600 }); } catch { /* policy remains active in memory for this process */ }
      return json(res, 200, { allowAll:accessPolicy.allowAll, allowed:[...accessPolicy.allowed] });
    }
    if (url.pathname === '/api/auth/token' && req.method === 'POST') {
      if (req.headers.origin) {
        const forwardedProto = String(req.headers['x-forwarded-proto'] || (SECURE ? 'https' : 'http')).split(',')[0].trim();
        const requestOrigin = `${forwardedProto}://${req.headers.host}`;
        if (req.headers.origin !== requestOrigin) return json(res, 403, { message:'来源验证失败，请从当前网站页面重新提交。' });
      }
      const raw = await readBody(req);
      let input;
      try { input = JSON.parse(raw.toString('utf8')); } catch { return json(res, 400, { message:'请求格式错误。' }); }
      if (!TOKEN_LOGIN_ENABLED) return json(res, 404, { message:'Token 登录已关闭，请使用 GitHub 登录。' });
      const token = typeof input?.token === 'string' ? input.token.trim() : '';
      if (token.length < 20 || token.length > 500) return json(res, 400, { message:'GitHub Token 格式不正确。' });
      const userResponse = await github('https://api.github.com/user', { headers:{ Authorization:`Bearer ${token}`, Accept:'application/vnd.github+json', 'User-Agent':'github-image-host-web' } });
      if (!userResponse.ok) return json(res, 401, { message:'GitHub Token 无效，或 Token 没有访问权限。' });
      const user = await userResponse.json();
      const permission = accessFor(user.login);
      if (!permission.allowed) return json(res, 403, { message:'这个 GitHub 账号目前没有被允许使用此网站。' });
      const sid = createSession(token, user);
      res.setHeader('Set-Cookie', cookie('gh_session', sid, 8 * 60 * 60));
      return json(res, 200, { ok:true, user:{ login:user.login, name:user.name, avatar_url:user.avatar_url } });
    }
    if (url.pathname === '/api/auth/logout' && req.method === 'POST') {
      const auth = session(req);
      if (auth && !requireCSRF(req, res, auth)) return;
      sessions.delete(cookies(req).gh_session);
      res.setHeader('Set-Cookie', cookie('gh_session', '', 0));
      return json(res, 200, { ok:true });
    }
    if (url.pathname === '/api/github') {
      const auth = session(req);
      if (!auth) return json(res, 401, { message:'登录已过期，请重新使用 GitHub 登录。' });
      if (req.method !== 'GET' && !requireCSRF(req, res, auth)) return;
      let target; try { target = new URL(url.searchParams.get('url')); } catch { return json(res, 400, { message:'无效的 API 地址' }); }
      if (!allowedAPI(target, req.method)) return json(res, 403, { message:'此 API 操作未开放。' });
      const body = req.method === 'GET' ? undefined : await readBody(req);
      const upstream = await github(target, { method:req.method, headers:{ Authorization:`Bearer ${auth.token}`, Accept:'application/vnd.github+json', 'Content-Type':'application/json', 'X-GitHub-Api-Version':'2022-11-28', 'User-Agent':'github-image-host-web' }, body });
      if (upstream.status === 401) sessions.delete(cookies(req).gh_session);
      res.writeHead(upstream.status, { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' });
      res.end(Buffer.from(await upstream.arrayBuffer())); return;
    }
    if (req.method !== 'GET' || !assets.has(url.pathname)) return json(res, 404, { message:'Not found' });
    const file = assets.get(url.pathname);
    const headers = { 'Content-Type':mime[file.split('.').pop()] || 'text/plain; charset=utf-8', 'Cache-Control':'no-cache' };
    if (url.pathname.startsWith('/source/')) headers['Access-Control-Allow-Origin'] = 'https://github.com';
    res.writeHead(200, headers);
    res.end(await readFile(new URL(file, ROOT)));
  } catch (error) { if (!res.headersSent) json(res, error.status || 502, { message:'请求失败，请检查网络或服务配置后重试。' }); else res.end(); }
});
setInterval(() => {
  for (const [id, value] of sessions) if (value.expires < Date.now()) sessions.delete(id);
}, 60000).unref();
server.listen(PORT, HOST, () => console.log(`图床服务已启动：${BASE.origin} · Token 登录模式`));
