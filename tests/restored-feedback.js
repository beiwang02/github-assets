/* Safe fixture, actual production templates/enhancer/CSSOM. Pseudo replay is not a physical tap. */
window.auditRestoredFeedback=async function(dark){
 await fixtureReady;
 if(!window.restoredReplay){
  const walk=rules=>[...rules].map(r=>{
   if(r.cssRules&&!r.selectorText){let head=r.cssText.slice(0,r.cssText.indexOf('{'));if(r.conditionText&&/hover:\s*hover/.test(r.conditionText))head='@media all';return `${head}{${walk(r.cssRules)}}`;}
   return r.cssText.replace(/:focus-visible/g,'.test-focus-visible').replace(/:active/g,'.test-active').replace(/:hover/g,'.test-hover');
  }).join('\n');
  const style=document.createElement('style');style.textContent=[...document.styleSheets].map(s=>walk(s.cssRules)).join('\n');document.head.append(style);window.restoredReplay=true;
 }
 const failures=[],evidence=[],counts={active:0,hover:0,hoverActive:0,focus:0,disabled:0,busy:0,selected:0};
 const check=(ok,label,data)=>{if(!ok)failures.push({label,data});};
 const sample=e=>{const c=getComputedStyle(e);return {bg:c.backgroundColor,image:c.backgroundImage,border:c.borderTopColor,ink:c.color,filter:c.filter,shadow:c.boxShadow,outline:c.outlineStyle,outlineColor:c.outlineColor,opacity:c.opacity,w:e.offsetWidth,h:e.offsetHeight};};
 const line='rgb(207, 213, 253)',blue='linear-gradient(135deg, rgb(102, 113, 252), rgb(88, 96, 223))';
 localStorage.setItem('gh-image-theme',dark?'dark':'light');S.auth={login:'fixture-user'};
 const settle=()=>new Promise(r=>setTimeout(r,25));
 async function controls(selector,label){await settle();for(const e of document.querySelectorAll(selector)){
  if(!e.getClientRects().length||e.disabled)continue;const before=sample(e),id=label+':'+(e.dataset.action||e.textContent.trim());
  const feedback=e.dataset.feedback,selected=e.matches('.repo-quick.active');
  if(feedback==='primary')check(before.image===blue&&before.ink==='rgb(255, 255, 255)',id+' primary baseline',before);
  if(selected){counts.selected++;check(before.border===line&&before.filter==='none',id+' persistent selection',before);}
  e.classList.add('test-hover');const hover=sample(e);counts.hover++;if((feedback==='control'&&!e.matches('.active,.selected,[aria-checked="true"],[aria-pressed="true"]'))||feedback==='primary'||selected)check(hover.border===line,id+' hover border',hover);
  if(selected)check(hover.bg===before.bg&&hover.ink===before.ink&&hover.filter==='none',id+' selected hover palette stable',hover);
  e.classList.add('test-active');const both=sample(e);counts.hoverActive++;check(both.filter==='none'&&both.shadow==='none',id+' hover+active no dim',both);
  if(feedback==='primary')check(both.image===before.image&&both.ink===before.ink,id+' primary hover+active semantics',both);
  e.classList.remove('test-hover');const press=sample(e);counts.active++;
  if(feedback==='primary'||(feedback==='control'&&!e.matches('.active,.selected,[aria-checked="true"],[aria-pressed="true"]'))||selected)check(press.border===line,id+' active border',press);
  check(press.filter==='none'&&press.shadow==='none'&&press.w===before.w&&press.h===before.h,id+' no overlay or resize',press);
  if(feedback==='primary')check(press.image===before.image&&press.ink===before.ink,id+' primary active semantics',press);
  e.classList.remove('test-active');check(sample(e).border===before.border,id+' release restores border',sample(e));
  e.classList.add('test-focus-visible');counts.focus++;check(sample(e).outline==='solid'&&sample(e).outlineColor===line,id+' keyboard ring',sample(e));e.classList.remove('test-focus-visible');
  if(e.tagName==='BUTTON'){e.disabled=true;const disabled=sample(e);e.classList.add('test-hover','test-active');const dp=sample(e);counts.disabled++;check(Number(dp.opacity)<1&&dp.border===disabled.border&&dp.filter==='none',id+' disabled excludes feedback',dp);e.disabled=false;e.classList.remove('test-hover','test-active');
   e.setAttribute('aria-busy','true');const busy=sample(e);e.classList.add('test-hover','test-active');counts.busy++;if(feedback==='primary'||feedback==='control')check(sample(e).border===busy.border,id+' busy excludes feedback',sample(e));e.removeAttribute('aria-busy');e.classList.remove('test-hover','test-active');}
  if(feedback==='primary'||selected||e.matches('.top-icon,.sort-trigger,[data-action="select-all"],[data-action="refresh"]'))evidence.push({id,feedback,before,press,both});
 }}
 for(const connected of [false,true]){S.connected=connected;S.view='overview';const libs=S.libraries;if(!connected)S.libraries=[];renderC();applyAppearance();await controls('.hero-actions button,.empty-state button,.top-actions .top-icon','overview '+connected);const p=document.querySelector('.hero-actions .btn-primary'),s=document.querySelector('.hero-actions .btn:not(.btn-primary)');check(sample(p).image!==sample(s).image,'hero primary differs from secondary',{p:sample(p),s:sample(s)});S.libraries=libs;}
 S.connected=true;
 S.repos=[{name:'assets',owner:{login:'fixture-user'},default_branch:'main'},{name:'other-assets',owner:{login:'fixture-user'},default_branch:'main'}];S.projectCandidates=[{owner:'fixture-user',repo:'other-assets'}];
 S.view='settings';renderC();applyAppearance();await controls('#repoForm button,.repo-quick','settings');const div=document.querySelector('.settings-actions');const probe=document.createElement('i');probe.style.color='var(--line)';document.body.append(probe);check(getComputedStyle(div).borderTopColor===getComputedStyle(probe).color,'theme divider',getComputedStyle(div).borderTopColor);probe.remove();
 S.view='assets';renderC();applyAppearance();await controls('.heading-actions button,.assets-toolbar :is([data-action="select-all"],.sort-trigger,[data-action="refresh"])','assets');const toolbar=[...document.querySelectorAll('.assets-toolbar :is([data-action="select-all"],.sort-trigger,[data-action="refresh"])')].map(sample);check(toolbar.length===3&&toolbar.every(t=>t.bg===toolbar[0].bg&&t.border===toolbar[0].border&&t.ink===toolbar[0].ink),'three toolbar palettes equal',toolbar);evidence.push({toolbar});
 libraryModal();await controls('#libraryForm .modal-actions button','JSON create');closeC();
 uploadModal();await controls('#uploadForm .modal-actions button','upload submit');closeC();
 S.auth=null;renderC();applyAppearance();await controls('.auth-head-actions>.ui-button','login icons');for(const e of document.querySelectorAll('.auth-head-actions>.ui-button'))check(e.offsetWidth===34&&e.offsetHeight===34&&getComputedStyle(e).boxShadow==='none'&&getComputedStyle(e.querySelector('svg')).width==='18px','login 34/18 no shadow',sample(e));
 const mode=dark?'dark':'light',color=dark?'#0b1629':'#f6f8fc';check(document.querySelector('meta[name="theme-color"]').content===color&&getComputedStyle(document.documentElement).colorScheme===mode,'theme chrome synchronized',{meta:document.querySelector('meta[name="theme-color"]').content,scheme:getComputedStyle(document.documentElement).colorScheme});
 S.auth={login:'fixture-user'};return {pass:!failures.length,width:innerWidth,dark,counts,failures,evidence};
};
