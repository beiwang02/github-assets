// Offline fixture only; use real production DOM/CSS and no repository writes.
window.auditFinalActionsC=async(dark=false)=>{
 await fixtureReady;
 const check=(ok,msg)=>{if(!ok)throw Error(msg);};
 const settle=()=>new Promise(r=>setTimeout(r,60));
 closeC();S.view='libraries';localStorage.setItem('gh-image-theme',dark?'dark':'light');renderC();applyAppearance();await settle();
 const buttons=[...document.querySelectorAll('.library-outside-actions button')],rects=buttons.map(b=>b.getBoundingClientRect());
 check(buttons.map(b=>b.dataset.action).join(',')==='new-library,edit-library,copy','order');
 check(rects.every(r=>Math.abs(r.width-rects[0].width)<1&&r.height===40&&r.y===rects[0].y),'equal geometry');
 check(buttons.every(b=>b.scrollWidth<=b.clientWidth&&getComputedStyle(b).fontSize==='12px'),'text overflow/font');
 check(buttons[0].classList.contains('btn-primary'),'primary');
 buttons[0].click();await settle();check(!!document.querySelector('#libraryForm'),'create');closeC();
 S.view='assets';S.selected.clear();renderC();await settle();
 let card=document.querySelector('.asset-card');const grid=getComputedStyle(card.parentElement).gridTemplateColumns.split(' ').length;
 check(grid===(innerWidth<=700?3:6),'grid');
 card.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}));card.focus();card.click();await settle();check(!!document.querySelector('.modal'),'details open');closeC();await settle();
 card=document.querySelector('.asset-card');
 check(!card.classList.contains('selected'),'not selected');
 if(!card.matches(':focus-visible'))check(getComputedStyle(card).outlineStyle==='none','pointer ring persists');
 card.querySelector('[data-action="asset-select"]').click();await settle();card=document.querySelector('.asset-card');check(card.classList.contains('selected'),'selected');
 check(getComputedStyle(card).outlineStyle!=='none','selected ring');
 card.querySelector('[data-action="asset-select"]').click();await settle();card=document.querySelector('.asset-card');
 card.querySelector('[data-action="copy"]').focus();await settle();check(getComputedStyle(card).outlineStyle==='none','nested parent ring');
 const now=Date.now;let clock=now();Date.now=()=>clock;
 try{
 S.activity=[{title:'fixture event',detail:'真实事件时间',time:clock-59_000}];S.view='activity';renderC();await settle();
 const time=document.querySelector('[data-activity-time]'),app=document.querySelector('#app'),stamp=S.activity[0].time;
 check(time.textContent==='刚刚','initial');clock+=61_000;updateActivityTimesC();check(time.textContent==='2 分钟前','tick');
 document.dispatchEvent(new Event('visibilitychange'));check(document.querySelector('[data-activity-time]')===time&&document.querySelector('#app')===app&&S.activity[0].time===stamp,'identity/event preserved');
 check(time.title.includes('北京时间'),'absolute zone');
 }finally{Date.now=now;}
 check(document.documentElement.scrollWidth<=innerWidth,'page overflow');
 return {pass:true,width:innerWidth,dark,grid,buttonWidths:rects.map(r=>r.width)};
};
