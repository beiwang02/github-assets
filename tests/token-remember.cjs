const fs=require('node:fs'),assert=require('node:assert/strict');
const js=fs.readFileSync('console.js','utf8'),gh=fs.readFileSync('github.js','utf8'),html=fs.readFileSync('index.html','utf8');
/* Remembered token is read back, not just written. */
assert(js.includes("function rememberedToken(){ try { return localStorage.getItem('gh-image-remembered-token')||''; } catch { return ''; } }"));
assert(js.includes('value="${escC(rememberedToken())}"'));
assert(js.includes("name=\"rememberToken\" ${rememberedToken()?'checked':''}"));
/* Boot re-login when the server session is gone, once only. */
assert(js.includes('async function bootAuth(retried=false)'));
assert(js.includes('if(!S.auth&&!retried&&S.tokenLoginEnabled&&rememberedToken()&&await silentTokenLogin()) return bootAuth(true);'));
/* Invalid or revoked token is dropped instead of retried forever. */
assert(js.includes("if(response.status===401||response.status===403)localStorage.removeItem('gh-image-remembered-token')"));
/* Mid-session expiry heals transparently on the single API choke point. */
assert(gh.includes('async request(path, method = \'GET\', body, retried = false)'));
assert(gh.includes('response.status === 401 && !retried && typeof window.recoverSession === \'function\' && await window.recoverSession()'));
assert(gh.includes('this.csrf = window.liveCsrf() || this.csrf'));
assert(js.includes('window.recoverSession=recoverSession;') && js.includes('window.liveCsrf=()=>S.csrf;'));
/* Logout still forgets the device on purpose. */
assert(js.includes("localStorage.removeItem('gh-image-remembered-token'); location.replace('/?logged_out=1');"));
assert(html.includes('console.js?v=login-appearance-57') && html.includes('github.js?v=external-sync-3'));
console.log('PASS token remember: prefill + checked box, boot re-login, 401 self-heal with csrf refresh, logout still forgets');
