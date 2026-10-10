const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const js=fs.readFileSync('console.js','utf8'),part=js.slice(js.indexOf('function loginView()'),js.indexOf('const collatorC'));
for(const enabled of [false,true])for(const error of ['', 'oauth_denied','oauth_state','oauth_exchange']){
 const c={S:{oauthEnabled:enabled},location:{search:error?'?auth_error='+error:''},URLSearchParams,escC:x=>x,rememberedToken:()=>'',tokenEyeC:()=>''};vm.createContext(c);vm.runInContext(part,c);const html=c.loginView();assert.equal(html.includes('href="/api/auth/github"'),enabled);assert(html.includes('rememberToken'));assert(html.includes('验证并登录'));if(enabled)assert(html.includes('并非只授权单个仓库'));if(error==='oauth_denied')assert(html.includes('已取消'));if(error==='oauth_state')assert(html.includes('过期'));assert(!part.includes('localStorage'));assert(!part.includes('location.href='));
}
console.log('PASS OAuth login enabled/disabled, token fallback preserved, cancellation/expired state messages; no client token persistence or redirect loop');
