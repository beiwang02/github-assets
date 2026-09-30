// Offline WebKit fixture; no physical iPhone test or GitHub writes.
window.auditJSONCreateLabel=async()=>{
 await fixtureReady;const results=[];
 const check=(ok,name)=>{if(!ok)throw Error(name);};
 for(const dark of [false,true]){
  closeC();S.view='libraries';localStorage.setItem('gh-image-theme',dark?'dark':'light');renderC();applyAppearance();
  await new Promise(r=>setTimeout(r,60));
  const buttons=[...document.querySelectorAll('.library-outside-actions button')],rects=buttons.map(b=>b.getBoundingClientRect());
  check(buttons.map(b=>b.dataset.action).join(',')==='new-library,edit-library,copy','first/action order');
  check(rects.every(r=>Math.abs(r.width-rects[0].width)<1&&r.height===40&&r.y===rects[0].y),'equal three-column geometry');
  check(buttons[0].classList.contains('btn-primary'),'blue primary');
  check(buttons[0].textContent.trim()==='新建 JSON 库'&&buttons[0].querySelector('.ui-icon path')?.getAttribute('d')==='M12 5v14M5 12h14','full label and enhanced plus icon');
  check(buttons.every(b=>b.scrollWidth<=b.clientWidth),'button overflow');
  for(const b of buttons){const walker=document.createTreeWalker(b,NodeFilter.SHOW_TEXT);while(walker.nextNode()){if(!walker.currentNode.textContent.trim())continue;const range=document.createRange();range.selectNodeContents(walker.currentNode);check([...range.getClientRects()].every(r=>r.left>=b.getBoundingClientRect().left&&r.right<=b.getBoundingClientRect().right),'text bounds');}}
  check(document.documentElement.scrollWidth<=innerWidth,'page overflow');
  const bg=getComputedStyle(buttons[0]).backgroundImage;check(bg.includes('gradient'),'primary blue gradient');
  buttons[0].click();await new Promise(r=>setTimeout(r,60));check(!!document.querySelector('#libraryForm'),'create modal');closeC();
  results.push({width:innerWidth,dark,label:'＋ 新建 JSON 库',buttonWidths:rects.map(r=>r.width),height:40,overflow:false,pass:true,bg});
 }
 return results;
};
