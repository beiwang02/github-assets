/* Safe fixture only: real menu events plus CSSOM pseudo-state replay. */
window.auditThemeMenu=async function(dark){
 await fixtureReady;const restored=await auditRestoredFeedback(dark);
 const failures=[...restored.failures],menus=[];
 const check=(ok,label,data)=>{if(!ok)failures.push({label,data});};
 const sample=e=>{const c=getComputedStyle(e);return {bg:c.backgroundColor,border:c.borderTopColor,ink:c.color,outline:c.outlineStyle,w:e.offsetWidth,h:e.offsetHeight};};
 const line=dark?'rgb(119, 133, 200)':'rgb(207, 213, 253)',tint=dark?'rgb(41, 52, 81)':'rgb(244, 245, 255)';
 S.auth={login:'fixture-user'};S.connected=true;S.group='';S.selected.clear();S.selectedIcons.clear();
 const settle=()=>new Promise(r=>setTimeout(r,70));
 async function audit(get,label){
  let e=get(),base=sample(e);
  for(const mode of ['toggle','outside','escape','choose','different']){
   e=get();base=sample(e);e.click();await settle();
   check(e.getAttribute('aria-expanded')==='true',label+' '+mode+' aria open');
   check(sample(e).bg===tint&&sample(e).border===line,label+' '+mode+' persistent open tint',sample(e));
   const menu=document.querySelector('.sort-menu.floating-menu');check(!!menu,label+' portaled menu');
   check(menu?.querySelector('[aria-checked="true"]')?.classList.contains('active'),label+' selected option kept');
   if(mode==='toggle')e.click();
   if(mode==='outside')document.querySelector('.page-heading,.modal-head').click();
   if(mode==='escape')document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
   if(mode==='choose')menu.querySelector('[aria-checked="true"]').click();
   if(mode==='different'){
    const option=menu.querySelector('[aria-checked="false"]')||menu.querySelector('[aria-checked="true"]');const value=option.dataset.sortValue??option.dataset.value;const kind=option.dataset.sortKind,name=option.dataset.menuName;option.click();
    if(kind)check(S[{assets:'assetSort',icons:'iconSort',libraries:'librarySort'}[kind]]===value,label+' different persists sort data');
    if(name)check(document.querySelector(`select[name="${name}"]`).value===value,label+' different preserves native form data');
   }
   await settle();e=get();check(e.getAttribute('aria-expanded')==='false',label+' '+mode+' aria closed');
   check(!document.querySelector('.sort-menu.floating-menu'),label+' '+mode+' removed portal');
   const after=sample(e);check(after.bg===base.bg&&after.border===base.border&&(mode==='different'||after.w===base.w)&&after.h===base.h,label+' '+mode+' restores normal',after); // A new field label may naturally change desktop auto-width.
  }
  e=get();e.disabled=true;e.setAttribute('aria-expanded','true');const disabled=sample(e);check(disabled.bg===base.bg&&disabled.border===base.border,label+' disabled no expanded tint',disabled);e.disabled=false;e.setAttribute('aria-expanded','false');
  e.classList.add('test-focus-visible');check(sample(e).outline==='solid',label+' keyboard focus retained');e.classList.remove('test-focus-visible');menus.push({label,base});
 }
 S.view='assets';renderC();applyAppearance();await settle();
 await audit(()=>document.querySelector('[data-sort-menu="assets"] .sort-trigger'),'images sort');
 S.view='libraries';renderC();applyAppearance();await settle();
 await audit(()=>document.querySelector('[data-sort-menu="icons"] .sort-trigger'),'JSON references sort');
 closeC(); // Current JSON library picker has no sorting trigger; do not invent one.
 uploadModal();await settle();for(const name of ['group','library'])await audit(()=>document.querySelector(`[data-field-menu="${name}"] .sort-trigger`),'field '+name);closeC();
 S.view='assets';S.group=S.assets[0].group;S.selected=new Set([S.assets[0].id]);renderC();applyAppearance();await settle();
 const group=document.querySelector('.group-pill.active'),card=document.querySelector('.asset-card.selected'),box=card.querySelector('.asset-select');
 check(sample(group).border===line&&sample(group).bg===tint,'group selected border and tint',sample(group));check(sample(card).border===line,'card selected frame',sample(card));
 for(const state of ['test-hover','test-active','test-focus-visible']){group.classList.add(state);check(sample(group).border===line,'selected group stable '+state,sample(group));group.classList.remove(state);}
 const before=getComputedStyle(box,'::before');check(box.offsetWidth===28&&box.offsetHeight===28&&before.left==='3px'&&before.right==='3px','28px hit target and 22px square unchanged');
 check(before.backgroundColor===(dark?'rgb(82, 96, 191)':'rgb(89, 101, 242)'),'theme check square',before.backgroundColor);
 S.selected.clear();renderC();applyAppearance();const un=document.querySelector('.asset-card');check(sample(un).outline==='none'&&sample(un).border!==line,'unselected no residual frame',sample(un));
 check(document.documentElement.scrollWidth<=innerWidth,'viewport no overflow');
 return {pass:!failures.length,width:innerWidth,dark,failures,counts:restored.counts,menus};
};
