window.auditCopyControls=async()=>{
await fixtureReady;const results=[];const wait=()=>new Promise(r=>setTimeout(r,40));
for(const theme of ['light','dark'])for(const view of ['overview','assets','libraries']){
 localStorage.setItem('gh-image-theme',theme);applyAppearance();S.view=view;renderC();await wait();
 const selector=view==='overview'?'.quick-copy':view==='assets'?'.asset-copy':'.json-reference-actions [data-action="copy"]';
 const b=document.querySelector(selector),r=b.getBoundingClientRect(),c=getComputedStyle(b),card=b.closest('.asset-card,.quick-asset,.json-reference-row');
 const result={width:innerWidth,theme,view,icon:!!b.querySelector('svg'),size:[r.width,r.height],style:[c.color,c.backgroundColor,c.borderColor,c.borderRadius],overflow:document.documentElement.scrollWidth>innerWidth,cardOverflow:card.scrollWidth>card.clientWidth};
 if(view==='assets'){const select=card.querySelector('.asset-select');result.selectLeft=select.getBoundingClientRect().right<=r.left;select.click();result.selection=select.getAttribute('aria-pressed')==='true'&&!document.querySelector('.modal');select.click();}
 let calls=0,release;Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>{calls++;return new Promise(resolve=>release=resolve)}}});
 b.click();b.click();await wait();result.busy=b.disabled&&b.getAttribute('aria-busy')==='true'&&b.textContent.includes('正在复制');result.busyOverflow=b.scrollWidth>b.clientWidth;result.single=calls===1;release();await wait();result.restored=!b.disabled&&!!b.querySelector('svg');result.noModal=!document.querySelector('.modal');results.push(result);
}
return results;
};
