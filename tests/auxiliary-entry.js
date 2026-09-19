// Fixture-only audit: no authentication or repository writes.
window.auditAuxiliaryEntry=async function(dark=false){
 await fixtureReady;const pause=()=>new Promise(r=>setTimeout(r,40));
 localStorage.setItem('gh-image-theme',dark?'dark':'light');
 const measure=(button,anchor)=>{const a=anchor.getBoundingClientRect(),r=document.createRange();r.selectNodeContents(button);const text=r.getBoundingClientRect();button.scrollIntoView({block:'center'});const b=button.getBoundingClientRect(),style=getComputedStyle(button);return {leftDelta:text.left-a.left,height:b.height,hit:document.elementFromPoint(b.left+10,b.top+Math.min(20,b.height/2))?.closest('button')===button,icons:button.querySelectorAll('svg').length,decoration:style.textDecorationLine,after:getComputedStyle(button,'::after').content};};
 S.auth=null;renderC();applyAppearance();await pause();
 const input=document.querySelector('#mainTokenInput');input.value='fixture-not-a-token';document.querySelector('[name=rememberToken]').checked=true;
 const login=measure(document.querySelector('.token-guide-button'),input);
 document.querySelector('.token-guide-button').click();await pause();login.opened=!!document.querySelector('.token-guide-body');document.querySelector('[data-action=close-modal]').click();await pause();login.state=input.value==='fixture-not-a-token'&&document.querySelector('[name=rememberToken]').checked;
 S.auth={login:'fixture-user'};S.view='libraries';S.selectedLibrary='lib0';S.iconQuery='Aurora';renderC();applyAppearance();await pause();
 const button=document.querySelector('.library-switch-trigger'),info=document.querySelector('.library-current-info');const json=measure(button,info);json.gap=button.getBoundingClientRect().top-info.getBoundingClientRect().bottom;
 button.click();await pause();json.opened=!!document.querySelector('.library-switch-list');document.querySelector('[data-action=select-library][data-id=lib1]').click();await pause();json.switched=S.selectedLibrary==='lib1';json.state=S.iconQuery==='';
 const copy=document.querySelector('.library-outside-actions [data-action=copy]'),edit=document.querySelector('.library-outside-actions [data-action=edit-library]');
 const colors=e=>{const c=getComputedStyle(e);return [c.color,c.backgroundColor,c.borderColor]};const copyStyle=colors(copy),editStyle=colors(edit);let release,calls=0;Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>{calls++;return new Promise(r=>release=r)}}});
 copy.click();copy.click();await pause();const busy=copy.disabled&&copy.getAttribute('aria-busy')==='true'&&getComputedStyle(copy).opacity==='0.5';release();await pause();const copyResult={copyStyle,editStyle,busy,single:calls===1,restored:!copy.disabled&&copy.textContent.includes('复制 JSON 直链')};copyResult.pass=JSON.stringify(copyStyle)===JSON.stringify(editStyle)&&busy&&copyResult.single&&copyResult.restored;
 const overflow=document.documentElement.scrollWidth>innerWidth;
 return {width:innerWidth,dark,login,json,copy:copyResult,overflow,pass:copyResult.pass&&[login,json].every(x=>Math.abs(x.leftDelta)<1&&x.height>=44&&x.hit&&x.opened&&x.state&&x.icons===0&&x.decoration==='none'&&(x.after==='none'||x.after==='normal'))&&json.switched&&json.gap>=7&&!overflow};
};
