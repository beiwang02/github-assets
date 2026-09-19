window.auditAssetRow=async()=>{
await fixtureReady;
const results=[];
for(const theme of ['light','dark']){
localStorage.setItem('gh-image-theme',theme);applyAppearance();S.auth={login:'fixture-user'};S.assets=Array.from({length:6},(_,i)=>({...S.assets[0],id:'asset'+i,ext:i===0?'webp':'svg'}));S.selected.clear();S.view='assets';renderC();await new Promise(r=>setTimeout(r,60));
const rect=e=>e.getBoundingClientRect(),card=document.querySelector('.asset-card'),p=rect(card.querySelector('.asset-preview')),im=rect(card.querySelector('img')),els=['.asset-copy','.asset-select'].map(s=>card.querySelector(s)),rs=els.map(rect),range=document.createRange();range.selectNodeContents(els[0].querySelector('.asset-copy-label'));
const cs=getComputedStyle(els[0]);const geometry={noBadge:!card.querySelector(".asset-badge"),plainCopy:cs.borderTopWidth==="0px"&&cs.backgroundColor==="rgba(0, 0, 0, 0)",copyFont:cs.fontSize,width:innerWidth,theme,cols:getComputedStyle(document.querySelector('.asset-grid')).gridTemplateColumns.split(' ').length,square:Math.abs(p.width-p.height)<1,imageRatio:im.width/p.width,hit:[rs[1].width,rs[1].height],visible:rs[1].width-6,below:rs.every(r=>r.top>=p.bottom),sameRow:Math.max(...rs.map(r=>r.top+r.height/2))-Math.min(...rs.map(r=>r.top+r.height/2))<1,noOverlap:rs[0].right<=rs[1].left,noWrap:range.getClientRects().length===1,noOverflow:[...document.querySelectorAll('.asset-card,.asset-copy')].every(e=>e.scrollWidth<=e.clientWidth)&&document.documentElement.scrollWidth<=innerWidth};
let copied=[];Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async t=>copied.push(t)}});els[1].click();await new Promise(r=>setTimeout(r,30));geometry.toggle=S.selected.size===1&&S.selected.has('asset0')&&els[1].getAttribute('aria-pressed')==='true'&&!document.querySelector('.modal');els[0].click();await new Promise(r=>setTimeout(r,30));geometry.copy=copied.length===1&&copied[0]===S.assets[0].url&&S.selected.size===1&&!document.querySelector('.modal');els[1].click();geometry.untoggle=S.selected.size===0;
results.push(geometry);
}
return results;
};
