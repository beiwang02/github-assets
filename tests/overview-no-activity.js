window.auditOverviewNoActivityC=async(dark=false)=>{
 await fixtureReady;closeC();localStorage.setItem('gh-image-theme',dark?'dark':'light');applyAppearance();
 const check=(ok,msg)=>{if(!ok)throw Error(msg);},saved={assets:S.assets,libraries:S.libraries,connected:S.connected,activity:S.activity};const results=[];
 try{for(const populated of [false,true])for(const connected of [false,true]){
 S.connected=connected;S.assets=populated?saved.assets:[];S.libraries=populated?saved.libraries:[];S.activity=[{title:'读取了 GitHub 仓库',detail:'fixture retained',time:Date.now()-60000}];S.view='overview';renderC();await new Promise(r=>setTimeout(r,40));
 const app=document.querySelector('#app'),grid=app.querySelector('.dashboard-columns'),section=grid.firstElementChild,b=grid.getBoundingClientRect(),s=section.getBoundingClientRect();
 check(!app.textContent.includes('最近动态')&&!app.querySelector('[data-view="activity"],.activity-card'),'overview activity leaked');
 check(grid.children.length===1&&grid===app.lastElementChild,'empty section/trailing region');check(getComputedStyle(grid).gridTemplateColumns.split(' ').length===1&&Math.abs(s.width-b.width)<1,'empty column');check(Math.abs(grid.getBoundingClientRect().bottom-section.getBoundingClientRect().bottom)<1,'trailing blank');
 check(app.querySelector('.overview-assets-section')&&app.querySelector('.library-card'),'other overview sections');check(document.querySelector('.sidebar [data-view="activity"]'),'sidebar retained');check(document.documentElement.scrollWidth<=innerWidth,'overflow');
 document.querySelector('.sidebar [data-view="activity"]').click();check(S.view==='activity'&&document.querySelector('[data-activity-time]')&&document.querySelector('#app').textContent.includes('fixture retained'),'independent activity access');check(S.activity.length===1,'internal log lost');results.push({populated,connected,columnWidth:s.width,noBlank:true});
 }}finally{Object.assign(S,saved);S.view='overview';renderC();}
 return {pass:true,width:innerWidth,dark,results};
};
