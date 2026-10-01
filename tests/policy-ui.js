/* Local-only production templates/CSSOM; no access-policy requests or submissions. */
window.auditPolicyUI=async function(dark){
 await fixtureReady;
 if(!window.policyReplay){
 const walk=rules=>[...rules].map(r=>{if(r.cssRules&&!r.selectorText){let h=r.cssText.slice(0,r.cssText.indexOf('{'));if(r.conditionText&&/hover:\s*hover/.test(r.conditionText))h='@media all';return `${h}{${walk(r.cssRules)}}`;}return r.cssText.replace(/:focus-visible/g,'.test-focus-visible').replace(/:active/g,'.test-active').replace(/:hover/g,'.test-hover');}).join('\n');
 const style=document.createElement('style');style.textContent=[...document.styleSheets].map(s=>walk(s.cssRules)).join('\n');document.head.append(style);window.policyReplay=true;
 }
 const failures=[],evidence=[];const check=(ok,label,data)=>{if(!ok)failures.push({label,data});};
 const sample=e=>{const c=getComputedStyle(e);return {appearance:c.appearance,border:c.borderTopColor,image:c.backgroundImage,ink:c.color,outline:c.outlineStyle,outlineColor:c.outlineColor,tap:c.webkitTapHighlightColor,transform:c.transform,width:c.width,height:c.height,filter:c.filter,shadow:c.boxShadow,opacity:c.opacity};};
 localStorage.setItem('gh-image-theme',dark?'dark':'light');S.auth={login:'fixture'};S.isAdmin=true;S.adminConfigured=true;S.allowedUsers=['fixture-one'];S.view='admin';
 for(const checked of [true,false]){
 S.allowAll=checked;renderC();enhanceControlsC();let form=document.querySelector('#adminPolicyForm'),label=form.querySelector('.policy-toggle'),input=label.querySelector('input');
 check(input.type==='checkbox'&&input.checked===checked,'native checked state');check(!label.hasAttribute('role')&&!label.classList.contains('ui-button')&&!label.dataset.feedback,'label not enhanced into button');
 check(sample(input).appearance==='auto'&&input.offsetWidth===17&&input.offsetHeight===17,'native checkbox visible',sample(input));check(sample(label).tap==='rgba(0, 0, 0, 0)','label no gray native flash',sample(label));
 check((new FormData(form).get('allowAll')==='on')===checked,'FormData initial');label.click();check(input.checked===!checked&&(new FormData(form).get('allowAll')==='on')===!checked,'whole label click toggles FormData');input.click();check(input.checked===checked,'checkbox direct click toggles once');
 input.classList.add('test-focus-visible');input.focus();check(document.activeElement===input&&sample(input).outline==='solid','keyboard focus visible',sample(input));input.classList.remove('test-focus-visible');input.blur();
 input.disabled=true;label.click();input.click();check(input.checked===checked&&new FormData(form).get('allowAll')===null,'disabled ignores click and excluded from FormData');check(Number(sample(label).opacity)<1,'disabled cue',sample(label));input.disabled=false;
 check(form.elements.allowed.value==='fixture-one','no default username or policy mutation');check(form.textContent.includes('不是昵称、邮箱或 Token')&&form.textContent.includes('英文逗号')&&form.textContent.includes('管理员始终保留权限'),'username help');evidence.push({checked,input:sample(input),label:sample(label)});
 }
 for(const view of ['settings','admin']){S.view=view;renderC();enhanceControlsC();const e=document.querySelector('.btn-primary'),before=sample(e);
 e.classList.add('test-active');const active=sample(e);check(active.border===before.border&&active.image===before.image&&active.ink===before.ink&&active.transform==='matrix(1, 0, 0, 1, 0, 1)','primary active blue and slight translation',active);
 e.classList.add('test-hover');const both=sample(e);check(both.border===before.border&&both.image===before.image&&both.filter==='none'&&both.shadow==='none','hover active no purple edge',both);e.classList.remove('test-active');const hover=sample(e);check(hover.border===getComputedStyle(document.documentElement).getPropertyValue('--ui-line-focus').trim()||hover.border===(dark?'rgb(119, 133, 200)':'rgb(207, 213, 253)'),'hover feedback preserved',hover);e.classList.remove('test-hover');
 e.classList.add('test-focus-visible');check(sample(e).outline==='solid','primary keyboard cue preserved',sample(e));e.classList.remove('test-focus-visible');e.focus();check(sample(e).border===before.border,'mouse focus blue border',sample(e));e.blur();e.disabled=true;const disabled=sample(e);e.classList.add('test-active','test-hover');check(sample(e).border===disabled.border&&sample(e).image===disabled.image,'disabled primary stable',sample(e));e.disabled=false;e.classList.remove('test-active','test-hover');evidence.push({view,before,active,both,hover});}
 return {pass:!failures.length,width:innerWidth,dark,failures,evidence};
};
