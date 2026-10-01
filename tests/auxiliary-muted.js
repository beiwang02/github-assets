/* Safe fixture; CSSOM pseudo replay, not a physical iPhone interaction. */
window.auditAuxiliaryMuted=async function(dark){
 await auditRestoredFeedback(dark);
 const failures=[],evidence=[],check=(ok,label,data)=>{if(!ok)failures.push({label,data});};
 S.auth={login:'fixture-user'};S.connected=true;S.view='assets';S.selected.clear();renderC();applyAppearance();await new Promise(r=>setTimeout(r,100));
 const ink=dark?'rgb(156, 168, 187)':'rgb(125, 137, 157)',feedback=dark?'rgb(178, 187, 239)':'rgb(89, 101, 242)',line=dark?'rgb(119, 133, 200)':'rgb(207, 213, 253)';
 const sample=e=>{const c=getComputedStyle(e);return {ink:c.color,bg:c.backgroundColor,border:c.borderTopColor,weight:c.fontWeight,size:c.fontSize,w:e.offsetWidth,h:e.offsetHeight,opacity:c.opacity,filter:c.filter,icons:[...e.querySelectorAll('svg,b')].map(x=>getComputedStyle(x).color)};};
 const buttons=[...document.querySelectorAll('.assets-toolbar :is([data-action="select-all"],.sort-trigger,[data-action="refresh"])')];check(buttons.length===3,'exact three',buttons.length);
 for(const e of buttons){const base=sample(e);check(base.ink===ink,'rest muted',base);check(base.icons.every(x=>x===ink),'currentColor rest',base);
 for(const states of [['test-hover'],['test-active'],['test-hover','test-active']]){e.classList.add(...states);const s=sample(e);check(s.ink===feedback&&s.border===line&&(states.length===1&&states[0]==='test-hover'||s.filter==='none'),'feedback '+states,s);check(s.icons.every(x=>x===feedback),'currentColor feedback',s);check(s.w===base.w&&s.h===base.h&&s.weight===base.weight&&s.size===base.size,'geometry stable',s);e.classList.remove(...states);}
 check(sample(e).ink===ink,'release muted',sample(e));e.disabled=true;const disabled=sample(e);e.classList.add('test-hover','test-active');check(sample(e).ink===(e.matches('.sort-trigger')?ink:(dark?'rgb(237, 241, 251)':'rgb(22, 32, 51)'))&&Number(disabled.opacity)===.5&&sample(e).border===disabled.border,'disabled stable',sample(e));e.classList.remove('test-hover','test-active');e.disabled=false;evidence.push({text:e.textContent,base,disabled});}
 const trigger=document.querySelector('.assets-toolbar .sort-trigger'),wait=()=>new Promise(r=>setTimeout(r,40));
 async function open(){trigger.click();await wait();check(trigger.getAttribute('aria-expanded')==='true'&&sample(trigger).ink===feedback&&sample(trigger).border===line,'menu stays highlighted',sample(trigger));check(sample(trigger).icons.every(x=>x===feedback),'open icon follows',sample(trigger));const opt=document.querySelector('.floating-menu .sort-option.active');check(!!opt&&sample(opt).ink===feedback,'selected option preserved',opt&&sample(opt));}
 async function closed(label){await wait();check(trigger.getAttribute('aria-expanded')==='false'&&sample(trigger).ink===ink,label+' returns muted',sample(trigger));}
 await open();trigger.click();await closed('toggle');await open();document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await closed('Escape');await open();document.body.click();await closed('outside');
 await open();document.querySelector('.floating-menu .sort-option.active').click();await wait();check(document.querySelector('.assets-toolbar .sort-trigger').getAttribute('aria-expanded')==='false'&&sample(document.querySelector('.assets-toolbar .sort-trigger')).ink===ink,'choose closes and resets',sample(document.querySelector('.assets-toolbar .sort-trigger')));
 check(getComputedStyle(document.querySelector('[data-action="upload"]')).color==='rgb(255, 255, 255)','primary unchanged');check(document.documentElement.scrollWidth<=innerWidth,'no horizontal overflow');
 return {pass:!failures.length,width:innerWidth,dark,failures,evidence};
};
