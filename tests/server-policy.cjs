const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../server.mjs'),'utf8').replace(/^import .*;\n/gm,'').replace('import.meta.url',JSON.stringify('file:///fixture/server.mjs'));
async function boot({stored,readError,fail=false}={}){
 let handler,saved=stored,temporary,upstream=0,serial=0;
 const context={URL,URLSearchParams,Buffer,AbortSignal,console:{log(){}},process:{env:{ADMIN_GITHUB_LOGIN:'admin',POLICY_FILE:'/fixture/policy.json'}},dirname:path.dirname,readFile:async()=>{if(readError)throw readError;if(saved===undefined)throw Object.assign(Error(),{code:'ENOENT'});return saved},mkdir:async()=>{},writeFile:async(p,v)=>{if(fail)throw Error('disk full');temporary=v},rename:async()=>{saved=temporary},unlink:async()=>{},randomBytes:()=>({toString:()=>String(++serial).padStart(64,'0')}),timingSafeEqual:require('node:crypto').timingSafeEqual,setInterval:()=>({unref(){}}),http:{createServer:fn=>{handler=fn;return{listen(){}}}},fetch:async()=>{upstream++;throw Error('External requests forbidden in test')}};
 vm.createContext(context);await vm.runInContext('(async()=>{'+source+';return {sessions,createSession,accessFor,allowedAPI,equal};})()',context).then(api=>Object.assign(context,api));
 async function request(route,method='GET',sid='',body={},headers={}){let status,data;const req={url:route,method,headers:{host:'127.0.0.1:8765',cookie:sid?'gh_session='+sid:'',...headers},async *[Symbol.asyncIterator](){yield Buffer.from(JSON.stringify(body))}};const res={headersSent:false,setHeader(){},writeHead(s){status=s;this.headersSent=true},end(v){data=v?JSON.parse(String(v)):null}};await handler(req,res);return{status,data};}
 return{...context,request,get saved(){return saved},get upstream(){return upstream}};
}
(async()=>{
 for(const stored of ['{',JSON.stringify({allowAll:'false',allowed:[]}),JSON.stringify({allowAll:false,allowed:[7]})])await assert.rejects(boot({stored}),/无法安全加载/);
 await assert.rejects(boot({readError:Object.assign(Error(),{code:'EACCES'})}),/无法安全加载/);
 const b=await boot(),admin=b.createSession('fake',{login:'admin'}),user=b.createSession('fake',{login:'member'}),csrf=b.sessions.get(admin).csrf;
 for(const method of ['GET','PUT']){assert.equal((await b.request('/api/admin/policy',method)).status,401);assert.equal((await b.request('/api/admin/policy',method,user)).status,403);}
 const policy={allowAll:false,allowed:[' ADMIN ']};
 assert.equal((await b.request('/api/admin/policy','PUT',admin,policy)).status,403);
 assert.equal((await b.request('/api/admin/policy','PUT',admin,policy,{'x-csrf-token':csrf,origin:'https://evil.test'})).status,403);
 assert.equal(b.equal('é','aa'),false);assert.equal(b.equal('é','é'),true);
 assert.equal((await b.request('/api/admin/policy','PUT',admin,{allowAll:'false',allowed:[]},{'x-csrf-token':csrf})).status,400);
 assert.equal((await b.request('/api/admin/policy','PUT',admin,policy,{'x-csrf-token':csrf})).status,200);
 assert.equal(b.sessions.has(user),false);assert.equal(b.sessions.has(admin),true);assert.equal((await b.request('/api/github','GET',user)).status,401);
 assert.equal((await boot({stored:b.saved})).accessFor('member').allowed,false);
 const failed=await boot({fail:true}),a=failed.createSession('fake',{login:'admin'}),u=failed.createSession('fake',{login:'member'});
 assert.equal((await failed.request('/api/admin/policy','PUT',a,policy,{'x-csrf-token':failed.sessions.get(a).csrf})).status,502);assert.equal(failed.accessFor('member').allowed,true);assert(failed.sessions.has(u));assert.equal(failed.saved,undefined);
 for(const p of ['assets','a-b/c_d','A123','a.b','a%20b','%E5%9B%BE'])assert(b.allowedAPI(new URL('https://api.github.com/repos/o/r/contents/'+p+'/.gitkeep'),'PUT'));
 for(const p of ['a//b','a%2Fb','a%5Cb','%00','%7f','%C2%85','%252f','%25252f','%252e%252e','%ZZ'])assert(!b.allowedAPI(new URL('https://api.github.com/repos/o/r/contents/'+p+'/.gitkeep'),'PUT'),p);
 for(const p of ['.','..','%2e%2e'])assert(!b.allowedAPI({origin:'https://api.github.com',pathname:'/repos/o/r/contents/'+p+'/.gitkeep'},'PUT'),p);
 assert(b.allowedAPI(new URL('https://api.github.com/repos/o/r/compare/abc...def'),'GET'));
 for(const suffix of ['.gitkeep.bak','.gitkeep/file','file.json','%252egitkeep'])assert(!b.allowedAPI(new URL('https://api.github.com/repos/o/r/contents/assets/'+suffix),'PUT'));
 assert(!b.allowedAPI(new URL('https://api.github.com/repos/o/r/contents/assets/file.json'),'PUT'));assert.equal(b.upstream+failed.upstream,0);
 console.log('PASS server-policy: fail-closed startup, 401/403/CSRF, schema, UTF8, atomic persistence/restart, failed write no effect, session revocation, PUT path boundaries; zero upstream requests');
})().catch(e=>{console.error(e);process.exitCode=1});
