/* Production DOM/CSS audit with synthetic libraries; not a physical iPhone test. */
window.libraryAlignmentAudit=async(dark=false)=>{
 const checks=[];const check=(ok,label)=>{checks.push({label,ok:!!ok});if(!ok)throw Error(label)};
 for(const shape of ['empty','single','mixed','long']){
  libraryDisplayFixture(shape==='empty'?0:shape==='single'?1:7,dark);
  S.libraries.forEach((lib,i)=>{const n=i%4;lib.count=n;lib.icons=Array.from({length:n},(_,j)=>({name:'图片'+j,url:S.assets[0].url}));lib.description=i%3===0?'用户真实说明':i%3===1?'':'   ';if(shape==='long'){lib.name='很长的真实库名'.repeat(30)+i;if(i%2===0)lib.description='说明'.repeat(80);}});renderC();
  await new Promise(resolve=>setTimeout(resolve,0));
  const rows=[...document.querySelectorAll('.library-card .library-list-row')];
  check(rows.length===(shape==='empty'?0:shape==='single'?1:5),'five-row cap '+shape);
  check(!!document.querySelector('#sidebar .main-nav'),'original sidebar');
  check(!!document.querySelector('.section-row [data-view="libraries"]'),'outer all-libraries action');
  check(!document.querySelector('.library-card-header'),'header remains absent');
  check(document.documentElement.scrollWidth<=innerWidth,'page overflow '+shape);
  if(!rows.length){check(!!document.querySelector('.library-card .empty-state'),'emptyC preserved');continue;}
  const first=rows[0].querySelector('b').getBoundingClientRect().left;
  for(const [i,r] of rows.entries()){
   const lib=S.libraries.find(l=>l.id===r.dataset.id),icon=r.querySelector('.library-row-icon'),small=r.querySelector('small');
   check(r.scrollWidth<=r.clientWidth,'row overflow '+shape+i);
   check(!r.querySelector('img')&&!r.querySelector('.library-preview-strip'),'no previews '+i);
   check(icon.textContent===lib.name.slice(0,1),'real initial '+i);
   check(icon.getBoundingClientRect().width===36,'fixed compact icon '+i);
   check(getComputedStyle(icon).backgroundImage.includes('117, 128, 255')&&getComputedStyle(icon).backgroundImage.includes('140, 100, 233'),'fixed purple '+i);
   check(r.querySelector('b').textContent===lib.name,'real name '+i);
   check(!!small===!!lib.description.trim()&&(!small||small.textContent===lib.description),'real description only '+i);
   check(Math.abs(r.querySelector('b').getBoundingClientRect().left-first)<.1,'text alignment '+i);
   check(Math.abs(r.querySelector('b').getBoundingClientRect().left-icon.getBoundingClientRect().right-12)<.1,'natural icon text gap '+i);
   check(r.getBoundingClientRect().height===72,'compact row height '+i);
   check(r.querySelector('strong').textContent===lib.count+' 个'&&r.querySelector('.list-meta span').textContent==='已读取','count status '+i);
   check(getComputedStyle(r.querySelector('b')).textOverflow==='ellipsis','long name ellipsis '+i);
   check(r.tabIndex===0&&r.getAttribute('role')==='button','keyboard semantics '+i);
  }
  for(const key of ['Enter',' ']){const row=document.querySelector('.library-list-row');row.focus();row.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));check(S.view==='libraries'&&S.selectedLibrary===row.dataset.id,'keyboard opens '+key);check(getComputedStyle(document.querySelector('.library-logo')).backgroundImage.includes('117, 128, 255'),'workspace purple preserved');S.view='overview';renderC();}
 }
 return {width:innerWidth,dark,passed:true,checks:checks.length};
};

window.recentPointerAudit=async(dark=false)=>{
 libraryDisplayFixture(3,dark);await new Promise(r=>setTimeout(r,0));
 const card=document.querySelector('.quick-asset'),image=card.querySelector('img');
 image.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'touch'}));card.focus();
 const pointer=getComputedStyle(card).outlineStyle;
 if(pointer!=='none'||!card.hasAttribute('data-pointer-focus'))throw Error('touch-origin focus rectangle');
 // Synthetic held CSS state: exercise the actual generic surface :active rule.
 const rules=[...document.styleSheets].flatMap(s=>{try{return [...s.cssRules].filter(r=>r.selectorText?.includes('.quick-asset')&&r.selectorText.includes(':active')).map(r=>r.cssText.replaceAll(':active','.audit-held'));}catch{return[];}});const style=document.createElement('style');style.textContent=rules.join('\n');document.head.append(style);card.classList.add('audit-held');
 if(getComputedStyle(card).outlineStyle!=='none')throw Error('held pointer rectangle');card.classList.remove('audit-held');style.remove();
 card.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true}));card.blur();card.focus();
 if(card.hasAttribute('data-pointer-focus'))throw Error('keyboard modality not restored');
 // Untrusted key events cannot change WebKit focus-visible modality. Exercise
 // the real production keyboard selector via a temporary test class instead.
 const keyboard=document.createElement('style');keyboard.textContent=[...document.styleSheets].flatMap(s=>{try{return [...s.cssRules].filter(r=>r.selectorText?.startsWith('.quick-asset:focus-visible')).map(r=>r.cssText.replaceAll(':focus-visible','.audit-keyboard'));}catch{return[];}}).join('\n');document.head.append(keyboard);card.classList.add('audit-keyboard');if(getComputedStyle(card).outlineStyle==='none')throw Error('keyboard focus ring missing');card.classList.remove('audit-keyboard');keyboard.remove();
 card.dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true,cancelable:true}));if(!document.querySelector('.modal'))throw Error('keyboard detail');closeC();
 return {width:innerWidth,dark,passed:true,pointerOutline:pointer,keyboardRing:true,simulation:'synthetic pointer/focus and held-state CSS; not physical long press'};
};

window.smallActionAudit=async(dark=false)=>{
 libraryDisplayFixture(3,dark);localStorage.setItem('gh-image-theme',dark?'dark':'light');S.libraries[0].count=1;S.libraries[0].icons=[{name:'fixture',url:S.assets[0].url}];
 const results=[];for(const view of ['overview','assets','libraries']){
  S.view=view;S.selectedLibrary='lib0';renderC();await new Promise(r=>setTimeout(r,0));
  document.activeElement?.blur();
  const copy=document.querySelector('.copy-control-icon'),select=document.querySelector('.asset-select,.reference-select');
  const border=getComputedStyle(copy).borderTopColor,expected=dark?'rgb(40, 54, 77)':'rgb(232, 236, 243)';if(border!==expected)throw Error('copy outline '+view+' '+border);
  if(select){const chosen=select.classList.contains('asset-select')?getComputedStyle(select,'::before').borderTopColor:getComputedStyle(select).borderTopColor;if(chosen!==(dark?'rgb(83, 102, 129)':'rgb(196, 204, 222)'))throw Error('selection outline changed');}
  results.push({view,border,matched:!!select});
 }
 return {width:innerWidth,dark,passed:true,results};
};
