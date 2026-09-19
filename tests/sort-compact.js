// Run in ui-refresh-fixture.html. Its mocked fetch/storage prevent API writes.
window.auditSortCompact=async()=>{
 await fixtureReady;await document.fonts.ready;
 const wait=()=>new Promise(r=>setTimeout(r,180)),out=[];
 const assert=(v,m)=>{if(!v)throw Error(m);};
 for(const theme of ['light','dark'])for(const view of ['assets','library-detail']){
  localStorage.setItem('gh-image-theme',theme);S.auth={login:'fixture-user'};S.view=view;renderC();applyAppearance();await wait();
  let trigger=document.querySelector('.sort-trigger');trigger.click();await wait();
  const menu=document.querySelector('body>.sort-menu.floating-menu'),mr=menu.getBoundingClientRect(),ms={padding:getComputedStyle(menu).padding,gap:getComputedStyle(menu).gap};
  const rows=[...menu.querySelectorAll('.sort-option')].map(b=>{
   const r=b.getBoundingClientRect(),cs=getComputedStyle(b),slot=b.querySelector('span'),sr=slot.getBoundingClientRect();
   const text=[...b.childNodes].find(n=>n.nodeType===3&&n.textContent.trim()),range=document.createRange();range.selectNodeContents(text);const tr=range.getBoundingClientRect();
   assert(r.height===40&&cs.display==='grid'&&cs.textAlign==='left'&&cs.fontSize==='12px'&&cs.fontWeight===(b.classList.contains('active')?'600':'400'),'row styles');
   assert(sr.width===14&&range.getClientRects().length===1&&tr.right<=r.right-8&&b.scrollWidth===b.clientWidth,'label fit');
   const svg=slot.querySelector('svg');if(svg)assert(svg.getBoundingClientRect().width===14,'check SVG');
   return {label:text.textContent.trim(),height:r.height,labelX:tr.left-mr.left,slot:sr.width};
  });
  assert(mr.width===134&&ms.padding==='5px'&&ms.gap==='2px','panel sizing');
  assert(new Set(rows.map(r=>r.labelX)).size===1,'label alignment');
  assert(mr.left>=0&&mr.right<=innerWidth&&document.documentElement.scrollWidth===innerWidth&&menu.scrollWidth===menu.clientWidth,'overflow');
  menu.querySelector('[data-sort-value="name-desc"]').click();await wait();
  assert(S[view==='assets'?'assetSort':'iconSort']==='name-desc'&&!document.querySelector('.floating-menu'),'selection close');
  trigger=document.querySelector('.sort-trigger');trigger.click();await wait();document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  assert(!document.querySelector('.floating-menu')&&document.activeElement===trigger,'Escape focus');
  trigger.click();await wait();document.querySelector('#pageTitle').click();assert(!document.querySelector('.floating-menu'),'outside close');
  out.push({viewport:innerWidth,theme,view,width:mr.width,height:mr.height,padding:ms.padding,gap:ms.gap,rows,overflow:0,selectionAndClose:'PASS'});
 }
 return out;
};
