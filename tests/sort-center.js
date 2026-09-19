// Run in ui-refresh-fixture.html; mocked fetch only, no credentials or API writes.
window.auditSortCenter=async()=>{
 await fixtureReady;await document.fonts.ready;
 const wait=()=>new Promise(r=>setTimeout(r,220)),rows=[];
 const assert=(v,m)=>{if(!v)throw Error(m);};
 for(const theme of ['light','dark']){
  localStorage.setItem('gh-image-theme',theme);
  for(const view of ['assets','library-detail'])for(const value of ['newest','oldest','name-asc','name-desc']){
   S.auth={login:'fixture-user'};S.view=view;S.assetSort=S.iconSort=value;renderC();applyAppearance();await wait();
   const b=document.querySelector('.sort-trigger'),holder=b.querySelector('b'),svg=holder.querySelector('svg'),path=svg.querySelector('path');
   assert(!holder.textContent.trim(),'glyph fallback');
   const box=path.getBBox();assert(box.x+box.width/2===12&&box.y+box.height/2===12,'path center');
   const measure=()=>{const br=b.getBoundingClientRect(),hr=holder.getBoundingClientRect(),sr=svg.getBoundingClientRect();const range=document.createRange();range.selectNodeContents(b.firstChild);const label=range.getBoundingClientRect();return {error:Math.abs(hr.top+hr.height/2-br.top-br.height/2),svgError:Math.abs(sr.top+sr.height/2-br.top-br.height/2),cy:hr.top+hr.height/2,gap:hr.left-label.right,width:hr.width,height:hr.height,transform:getComputedStyle(holder).transform};};
   const down=measure();b.click();await wait();const up=measure();
   assert(b.getAttribute('aria-expanded')==='true'&&b.closest('.sort-control').classList.contains('open'),'open state');
   assert(document.querySelector('body>.sort-menu'),'Floating UI portal');
   b.click();await wait();const closed=measure();assert(b.getAttribute('aria-expanded')==='false','close state');
   assert(down.transform==='matrix(1, 0, 0, 1, 0, 0)'&&up.transform==='matrix(-1, 0, 0, -1, 0, 0)','direction');
   for(const m of [down,up,closed])assert(m.error<.05&&m.svgError<.05&&m.gap>=6.9&&m.width===14&&m.height===14,'center/label overlap');
   assert(Math.abs(up.cy-down.cy)<.05&&Math.abs(closed.cy-down.cy)<.05,'vertical movement');
   rows.push({theme,view,value,down,up,closed});
  }
  S.auth=null;renderC();applyAppearance();await wait();const guide=document.querySelector('.token-guide-button');
  assert(guide&&!guide.querySelector('svg,.token-guide-arrow')&&!guide.textContent.includes('⌄'),'login tutorial arrow');
  guide.click();await wait();assert(document.querySelector('#modalRoot .modal'),'tutorial modal');closeC();
 }
 return {width:innerWidth,cases:rows.length,loginChecks:2,maxCenterError:Math.max(...rows.flatMap(r=>[r.down.error,r.up.error,r.closed.error,r.up.svgError])),maxVerticalMovement:Math.max(...rows.map(r=>Math.abs(r.up.cy-r.down.cy))),minLabelGap:Math.min(...rows.map(r=>r.down.gap)),rows};
};
