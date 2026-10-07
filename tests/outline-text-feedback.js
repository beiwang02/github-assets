/* Real safe templates + CSSOM pseudo replay, not physical iPhone taps. */
window.auditOutlineText=async function(dark){
 const menu=await auditThemeMenu(dark),failures=[...menu.failures],evidence=[];
 const check=(ok,label,data)=>{if(!ok)failures.push({label,data});};
 const sample=e=>{const s=getComputedStyle(e);return {bg:s.backgroundColor,image:s.backgroundImage,ink:s.color,border:s.borderTopColor,filter:s.filter,w:e.offsetWidth,h:e.offsetHeight};};
 const line=dark?'rgb(119, 133, 200)':'rgb(207, 213, 253)';
 function selected(e,state,label){if(!e){check(false,label+' exists');return;}e.classList.remove(state);if(state.startsWith('aria-'))e.setAttribute(state,'false');const before=sample(e);if(state.startsWith('aria-'))e.setAttribute(state,'true');else e.classList.add(state);const after=sample(e);if(label==='JSON library switch'){check(after.border===line&&after.bg===(dark?'rgb(41, 52, 81)':'rgb(244, 245, 255)'),label+' selection frame',{before,after});}else{check(after.bg===before.bg&&after.image===before.image,label+' selected background unchanged',{before,after});if(!e.matches('.json-reference-row'))check(after.border===line||after.ink!==before.ink,label+' selection visible',after);}for(const c of ['test-hover','test-active']){e.classList.add(c);const v=sample(e);check(v.bg===before.bg&&v.image===before.image,label+' selected '+c+' background unchanged',v);e.classList.remove(c);}evidence.push({label,before,after});}
 S.auth={login:'fixture-user'};S.view='assets';S.selected.clear();S.group='';renderC();applyAppearance();
 selected(document.querySelector('.group-pill'),'active','group');selected(document.querySelector('.asset-card'),'selected','image card');
 S.view='settings';renderC();applyAppearance();selected(document.querySelector('.repo-quick'),'active','repository');
 S.view='libraries';renderC();applyAppearance();selected(document.querySelector('.json-reference-row'),'selected','reference row');
 libraryPickerModal();selected(document.querySelector('.library-switch-option'),'aria-checked','JSON library switch');closeC();
 // Legacy picker uses its real component class, independently of current modal template.
 const picker=document.createElement('button');picker.className='library-picker-option ui-button';picker.textContent='Legacy library';document.body.append(picker);selected(picker,'selected','legacy library picker');picker.remove();
 S.view='assets';renderC();applyAppearance();for(const e of document.querySelectorAll('.group-pill,.sort-trigger,.assets-toolbar button'))for(const attr of ['disabled','aria-disabled','aria-busy']){if(e.matches('.asset-select,.reference-select'))continue;const original=e.getAttribute(attr);e.setAttribute(attr,attr==='disabled'?'':'true');const b=sample(e);e.classList.add('test-hover','test-active');const v=sample(e);check(v.bg===b.bg&&v.border===b.border&&v.ink===b.ink,'disabled/busy '+attr+' '+e.className,{b,v});e.classList.remove('test-hover','test-active');if(original===null)e.removeAttribute(attr);else e.setAttribute(attr,original);}
 return {pass:!failures.length,width:innerWidth,dark,failures,evidence,menus:menu.menus,counts:menu.counts};
};
