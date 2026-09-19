// Offline fixture only: never sends repository requests.
window.auditCopyOutline=async()=>{
 await fixtureReady;const out=[],pause=()=>new Promise(r=>setTimeout(r,40));
 const style=b=>{const c=getComputedStyle(b),r=b.getBoundingClientRect();return {size:[r.width,r.height],color:c.color,bg:c.backgroundColor,border:c.borderColor,radius:c.borderRadius,svg:b.querySelector('svg')?.getBoundingClientRect().width}};
 for(const theme of ['light','dark']){
 localStorage.setItem('gh-image-theme',theme);S.auth={login:'fixture-user'};S.iconQuery='';S.selectedLibrary='lib0';
 for(const view of ['overview','assets','libraries','asset-detail','icon-detail','legacy-detail']){
 document.querySelector('#modalRoot').innerHTML='';S.view=view.includes('detail')?'libraries':view;renderC();applyAppearance();
 if(view==='asset-detail')assetModal(S.assets[0]);
 if(view==='icon-detail')iconModal({...S.libraries[0].icons[0],index:0});
 if(view==='legacy-detail')document.querySelector('#app').innerHTML=detailView();
 await pause();enhanceControlsC();await pause();
 const buttons=[...document.querySelectorAll(view==='asset-detail'||view==='icon-detail'?'.modal [data-action=copy]':'#app [data-action=copy]')];
 for(const b of buttons){
 const s=style(b),icon=b.classList.contains('copy-control-icon'),row=b.closest('.json-reference-actions'),x=row?.querySelector('[data-action=delete-icon]');
 const result={width:innerWidth,theme,view,icon,...s,x:x?style(x):undefined,overflow:document.documentElement.scrollWidth>innerWidth};
 if(view==='assets'){const select=b.closest('.asset-card').querySelector('.asset-select');result.selectLeft=select.getBoundingClientRect().right<=b.getBoundingClientRect().left;select.click();result.selection=select.getAttribute('aria-pressed')==='true';select.click();}
 let calls=0,release;Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>{calls++;return new Promise(r=>release=r)}}});
 const modalBefore=document.querySelector('.modal');b.click();b.click();await pause();result.busy=b.disabled&&b.getAttribute('aria-busy')==='true';result.busyOverflow=b.scrollWidth>b.clientWidth;result.single=calls===1;release();await pause();result.restored=!b.disabled;result.noBubble=document.querySelector('.modal')===modalBefore;
 const exec=document.execCommand;Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(new Error('fixture denied'))}});document.execCommand=()=>false;b.click();await pause();result.errorRestored=!b.disabled&&b.getAttribute('aria-busy')!=='true';result.errorToast=document.querySelector('#toastRoot').textContent.includes('复制失败');document.execCommand=exec;
 result.pass=!result.overflow&&!result.busyOverflow&&result.busy&&result.single&&result.restored&&result.noBubble&&result.errorRestored&&result.errorToast&&s.bg===(theme==='light'?'rgb(255, 255, 255)':'rgb(23, 36, 58)')&&(!icon||(s.size.every(n=>n===34)&&s.radius==='9px'&&s.svg===18))&&(!x||JSON.stringify(s.size)===JSON.stringify(result.x.size)&&s.radius===result.x.radius);
 out.push(result);
 }
 }
 }
 document.querySelector('#modalRoot').innerHTML='';return out;
};
