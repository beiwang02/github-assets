/* Production DOM/CSS audit with synthetic libraries; not a physical iPhone test. */
window.libraryAlignmentAudit=async(dark=false)=>{
 const checks=[];const check=(ok,label)=>{checks.push({label,ok:!!ok});if(!ok)throw Error(label)};
 for(const shape of ['empty','mixed','long']){
  libraryDisplayFixture(shape==='empty'?0:7,dark);
  if(shape!=='empty'){
   S.libraries.forEach((lib,i)=>{const n=i%4;lib.count=n;lib.icons=Array.from({length:n},(_,j)=>({name:'图片'+j,url:S.assets[0].url}));if(shape==='long'){lib.name='很长的真实库名'.repeat(30)+i;lib.description='说明'.repeat(80);}});renderC();
  }
  await new Promise(resolve=>setTimeout(resolve,0));
  const rows=[...document.querySelectorAll('.library-card .library-list-row')];
  check(rows.length===(shape==='empty'?0:5),'five-row cap '+shape);
  check(!document.querySelector('.library-card-header'),'header remains absent');
  check(document.documentElement.scrollWidth<=innerWidth,'page overflow '+shape);
  if(!rows.length){check(!!document.querySelector('.library-card .empty-state'),'emptyC preserved');continue;}
  const positions=()=>rows.map(r=>({name:r.querySelector('.list-info b').getBoundingClientRect().left,description:r.querySelector('small').getBoundingClientRect().left,meta:r.querySelector('.list-meta').getBoundingClientRect().right,preview:r.querySelector('.library-preview-strip').getBoundingClientRect().width}));
  const before=positions();
  for(const [i,r] of rows.entries()){
   check(r.scrollWidth<=r.clientWidth,'row overflow '+shape+i);
   check(r.querySelectorAll('img').length===i%4,'preview count '+i);
   check(r.querySelector('b').textContent===S.libraries.find(l=>l.id===r.dataset.id).name,'real library name');
   check(Math.abs(before[i].name-before[0].name)<.1&&Math.abs(before[i].description-before[0].name)<.1,'text origin aligned '+i);
   check(Math.abs(before[i].meta-before[0].meta)<.1,'right meta aligned '+i);
   check(before[i].preview===(innerWidth<=700?96:168),'fixed preview '+i);
   check(r.tabIndex===0&&r.getAttribute('role')==='button','keyboard row semantics '+i);
  }
  const empty=rows[0];check(empty.querySelector('small').textContent==='暂无图片引用'&&empty.querySelector('strong').textContent==='0 个'&&empty.querySelector('.list-meta span').textContent==='已读取','empty text and status');
  check(getComputedStyle(empty.querySelector('.library-row-icon')).backgroundImage==='none','placeholder not purple');
  rows.forEach(r=>r.querySelectorAll('img').forEach(img=>img.dispatchEvent(new Event('error'))));
  const after=positions();check(JSON.stringify(before)===JSON.stringify(after),'broken image keeps geometry');
  empty.focus();empty.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));
  check(S.view==='libraries'&&S.selectedLibrary===empty.dataset.id,'keyboard opens empty library');
  check(getComputedStyle(document.querySelector('.library-logo')).backgroundImage.includes('117, 128, 255'),'workspace purple preserved');
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
  const border=getComputedStyle(copy).borderTopColor,expected=dark?'rgb(83, 102, 129)':'rgb(196, 204, 222)';if(border!==expected)throw Error('copy outline '+view+' '+border);
  if(select){const chosen=select.classList.contains('asset-select')?getComputedStyle(select,'::before').borderTopColor:getComputedStyle(select).borderTopColor;if(chosen!==border)throw Error('selection outline mismatch');}
  results.push({view,border,matched:!!select});
 }
 return {width:innerWidth,dark,passed:true,results};
};
