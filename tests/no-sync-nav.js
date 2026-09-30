window.auditNoSyncNavC=async(dark)=>{
 await fixtureReady;
 const checks=[],check=(name,pass)=>checks.push({name,pass:!!pass});
 localStorage.setItem('gh-image-theme',dark?'dark':'light');
 S.auth={login:'fixture-user'};S.isAdmin=true;
 S.activity=[{title:'读取了 GitHub 仓库',detail:'fixture',time:Date.now()}];
 for(const connected of [false,true]){
  S.connected=connected;
  for(const view of ['overview','assets','libraries','settings','admin']){
   S.view='overview';renderC();
   if(innerWidth<=768)document.querySelector('[data-action="toggle-sidebar"]').click();
   const target=document.querySelector('.main-nav [data-view="'+view+'"]');
   check(view+' navigation exists',target);
   target.click();
   await new Promise(r=>setTimeout(r,30));
   check(view+' route selected '+connected,S.view===view);
   check(view+' populated '+connected,document.querySelector('#app').textContent.trim().length>0);
   check(view+' active '+connected,document.querySelector('.main-nav [data-view="'+view+'"].active'));
   check(view+' no retired entry '+connected,!document.querySelector('[data-view="activity"],.activity-card'));
   check(view+' no overflow '+connected,document.documentElement.scrollWidth<=innerWidth);
  }
 }
 S.view='activity';renderC();
 check('legacy direct view falls back',S.view==='overview'&&document.querySelector('.hero')&&document.querySelector('.nav-item[data-view="overview"].active'));
 const legacy=document.createElement('button');legacy.dataset.view='activity';document.body.append(legacy);legacy.click();legacy.remove();
 check('legacy entry falls back',S.view==='overview'&&document.querySelector('.hero'));
 window.dispatchEvent(new PopStateEvent('popstate',{state:{ghView:'activity',depth:2}}));
 check('legacy history falls back',S.view==='overview'&&document.querySelector('.hero')&&history.state.ghView==='overview');
 check('internal log retained',S.activity.length===1);
 check('sync summary retained',document.querySelector('#app').textContent.includes('本次同步'));
 check('theme applied',document.documentElement.classList.contains('dark')===dark);
 return {width:innerWidth,dark,pass:checks.every(x=>x.pass),checks};
};
