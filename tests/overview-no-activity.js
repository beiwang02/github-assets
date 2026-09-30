// Retired overview test now exercises real resources and legacy recovery, never a visible overview.
window.auditOverviewNoActivityC=async(dark=false)=>{
 await fixtureReady;const checks=[];const check=(name,pass)=>checks.push({name,pass:!!pass});
 localStorage.setItem('gh-image-theme',dark?'dark':'light');S.auth={login:'fixture-user'};S.activity=[{title:'fixture retained',time:Date.now()}];
 for(const connected of [false,true])for(const old of ['overview','activity']){S.connected=connected;S.view=old;renderC();check('retired '+old+connected,S.view==='assets'&&document.querySelector('.primary-nav [data-view="assets"].active'));check('no overview/statistics/activity',!document.querySelector('.hero,.stat-grid,.activity-card'));check('no overflow',document.documentElement.scrollWidth<=innerWidth);check('logs retained',S.activity.length===1);}
 return {pass:checks.every(x=>x.pass),width:innerWidth,dark,checks};
};
