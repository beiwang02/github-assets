const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),cp=require('node:child_process');
const js=fs.readFileSync('console.js','utf8'),html=fs.readFileSync('index.html','utf8');
const baseline=cp.execFileSync('git',['show','b963c8a:console.js'],{encoding:'utf8'});
assert.equal(js,baseline.replace('<button type="button" class="btn" data-action="retry-auth">重试自动登录</button>','').replace("  if(action==='retry-auth'){await runSubmission(target,'正在重试…',()=>bootAuth());return;}\n",''),'Exactly two business deletions; all recovery/remember/repo/UI code unchanged');
assert(!js.includes('retry-auth'));
const oldHtml=cp.execFileSync('git',['show','b963c8a:index.html'],{encoding:'utf8'});
assert.equal(require('./release-131-normalize.cjs').normalize(html,'index.html'),oldHtml.replace('console.js?v=https-initial-caption-103&amp;revision=clean-ui-release-129','console.js?v=https-initial-caption-103&amp;revision=clean-ui-release-130'));
for(const token of ['', 'fixture']){
 const c={URLSearchParams,location:{search:''},escC:String,rememberedToken:()=>token,tokenEyeC:()=>'<svg></svg>'};vm.createContext(c);
 vm.runInContext(js.slice(js.indexOf('function loginView()'),js.indexOf('const collatorC')),c);
 const view=c.loginView();assert(!view.includes('retry-auth'));assert(!view.includes('重试自动登录'));assert(view.includes('验证并登录'));assert(view.includes('rememberToken'));assert(view.includes('token-guide'));assert(view.includes('toggle-token'));
}
let online,boots=0;const c={window:{addEventListener:(event,fn)=>{assert.equal(event,'online');online=fn;}},bootAuth:()=>{boots++;return Promise.resolve();}};vm.createContext(c);
vm.runInContext(js.split('\n').find(l=>l.startsWith("window.addEventListener('online'")),c);online();assert.equal(boots,1);
cp.execFileSync(process.execPath,['tests/session-reopen.cjs'],{stdio:'inherit'});
console.log('PASS login-no-retry: no button/handler, exact minimal business diff, unchanged other UI/cache, online listener invokes bootAuth, automatic remembered-token/repo recovery preserved');
