/* Test-only CSSOM pseudo-state replay in WebKit, not physical iPhone input. */
window.auditActiveFeedback=async function(dark=false){
 await fixtureReady;
 if(!window.activeReplay){
  const walk=rules=>[...rules].map(r=>r.cssRules&&!r.selectorText?`${r.cssText.slice(0,r.cssText.indexOf('{'))}{${walk(r.cssRules)}}`:r.cssText.replace(/:focus-visible/g,'.test-focus-visible').replace(/:active/g,'.test-active').replace(/:hover/g,'.test-hover')).join('\n');
  const text=[...document.styleSheets].map(s=>walk(s.cssRules)).join('\n'),style=document.createElement('style');style.textContent=text;document.head.append(style);window.activeReplay=true;
 }
 const failures=[],counts={press:0,disabled:0,keyboard:0},check=(ok,label,detail)=>{if(!ok)failures.push({label,detail});};
 localStorage.setItem('gh-image-theme',dark?'dark':'light');S.auth={login:'fixture-user'};
 const settle=()=>new Promise(r=>setTimeout(r,30));
 const sample=e=>{const c=getComputedStyle(e);return {filter:c.filter,opacity:c.opacity,background:c.backgroundColor,shadow:c.boxShadow,outline:c.outlineStyle,outlineColor:c.outlineColor,border:c.borderColor,w:e.offsetWidth,h:e.offsetHeight,tap:c.webkitTapHighlightColor};};
 async function controls(scope,label){await settle();for(const e of document.querySelectorAll(scope)){
  if(!e.getClientRects().length)continue;
  const before=sample(e);e.classList.add('test-active');const press=sample(e);counts.press++;
  check(press.filter==='none'&&press.shadow==='none'&&press.opacity===before.opacity&&press.w===before.w&&press.h===before.h,label+' press '+(e.dataset.action||e.textContent.trim()),{before,press});
  if(e.matches('.btn-primary,[data-ui="danger"],.library-switch-delete'))check(press.background===before.background,label+' semantic background',{before,press});
  e.classList.add('test-hover');check(sample(e).filter==='none',label+' hover+press filter',sample(e));e.classList.remove('test-hover','test-active');
  e.classList.add('test-focus-visible');const keyboard=sample(e);counts.keyboard++;check(keyboard.outline==='solid'&&(e.matches('.copy-control')||keyboard.outlineColor==='rgb(207, 213, 253)'),label+' keyboard '+(e.dataset.action||e.textContent.trim()),keyboard);e.classList.remove('test-focus-visible');
  if(e.tagName==='BUTTON'){e.disabled=true;const disabled=sample(e);e.classList.add('test-active');const pressedDisabled=sample(e);counts.disabled++;check(pressedDisabled.filter==='none'&&pressedDisabled.opacity===disabled.opacity&&Number(disabled.opacity)<1,label+' disabled',{disabled,pressedDisabled});e.disabled=false;e.classList.remove('test-active');}
 }}
 for(const view of ['overview','assets','libraries','settings']){S.view=view;renderC();applyAppearance();await controls('.main-shell button,.sidebar button',view);const trigger=document.querySelector('[data-action="toggle-sort"]');if(trigger){trigger.click();await controls('.floating-menu button',view+' sort options');closeSortMenus();}}
 libraryPickerModal();await controls('.modal button','switch library');const scrim=getComputedStyle(document.querySelector('.modal-backdrop')).backgroundColor;check(scrim!=='rgba(0, 0, 0, 0)','scrim retained',scrim);closeC();
 libraryModal();await controls('.modal button','create library');closeC();
 libraryModal(true);await controls('.modal button','edit library');closeC();
 const inside=[...document.querySelectorAll('.top-actions .top-icon')].map(sample);
 S.auth=null;renderC();applyAppearance();await controls('.auth-head-actions>.ui-button','login icons');
 const login=[...document.querySelectorAll('.auth-head-actions>.ui-button')].map((e,i)=>{const c=sample(e),svg=e.querySelector('svg'),sc=getComputedStyle(svg);check(c.w===inside[i].w&&c.h===inside[i].h&&c.shadow==='none'&&sc.width==='18px'&&sc.height==='18px','login matches inside',{c,inside:inside[i],icon:sc.width});return c;});
 S.auth={login:'fixture-user'};return {pass:!failures.length,width:innerWidth,dark,counts,login,failures};
};
