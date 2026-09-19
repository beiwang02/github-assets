window.auditLayout=async()=>{
 await fixtureReady;const wait=()=>new Promise(r=>setTimeout(r,100)),rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}},checks=[];
 const check=(name,ok,detail)=>checks.push({name,ok,detail});
 const sample=S.assets[0];S.assets=Array.from({length:6},(_,i)=>({...sample,id:'audit'+i,name:i?'Aurora '+i:'超长图片名称用于截断测试Aurora',ext:'svg'}));
 const restoration=await auditRestoration();check('system/header/login/hero',restoration.every(r=>r.singleRow&&!r.multiline&&!r.overflow&&r.iconFilled&&r.sameIcon),restoration);
 for(const theme of ['light','dark']){
 localStorage.setItem('gh-image-theme',theme);applyAppearance();
 for(const view of ['overview','assets']){
 S.view=view;renderC();await wait();const grid=document.querySelector(view==='assets'?'.asset-grid':'.quick-assets-grid'),plates=[...grid.querySelectorAll('.asset-preview,.quick-asset-image')];
 check(theme+'/'+view+'/columns',getComputedStyle(grid).gridTemplateColumns.split(' ').length===(innerWidth<=700?3:6),getComputedStyle(grid).gridTemplateColumns);
 check(theme+'/'+view+'/square',plates.length===6&&plates.every(e=>Math.abs(rect(e).width-rect(e).height)<1),plates.map(rect));
 check(theme+'/'+view+'/contain',plates.every(e=>getComputedStyle(e).borderRadius!=='0px'&&getComputedStyle(e.querySelector('img')).objectFit==='contain'&&rect(e.querySelector('img')).width<=rect(e).width),null);
 const cards=[...grid.children];check(theme+'/'+view+'/overflow',document.documentElement.scrollWidth<=innerWidth&&cards.every(e=>e.scrollWidth<=e.clientWidth)&&!auditUI().multiline.length,{page:document.documentElement.scrollWidth,multiline:auditUI().multiline,cards:cards.map(e=>[e.clientWidth,e.scrollWidth])});
 if(view==='assets'){
 check(theme+'/copy-accessible', [...grid.querySelectorAll('.asset-copy')].every(e=>e.getAttribute('aria-label')&&getComputedStyle(e).whiteSpace==='nowrap'),null);
 for(const value of ['newest','oldest','name-asc','name-desc']){
 S.assetSort=value;renderC();await wait();const trigger=document.querySelector('.sort-trigger'),ref=document.querySelector('.btn[data-action="new-group"]'),cs=getComputedStyle(trigger),rs=getComputedStyle(ref),range=document.createRange();range.selectNode(trigger.firstChild);const text=range.getBoundingClientRect(),arrow=trigger.querySelector('b').getBoundingClientRect();
 check(theme+'/sort/'+value,cs.color===rs.color&&cs.fontWeight===rs.fontWeight&&text.right<=arrow.left&&trigger.scrollWidth<=trigger.clientWidth,{color:cs.color,reference:rs.color,weight:cs.fontWeight,textRight:text.right,arrowLeft:arrow.left});
 trigger.click();await wait();const popup=document.querySelector('.sort-menu'),r=rect(popup);check(theme+'/popup/'+value,r.width>0&&r.x>=0&&r.right<=innerWidth&&r.y>=0&&r.bottom<=innerHeight,r);closeSortMenus();
 }
 }
 }
 document.querySelector('#toastRoot').replaceChildren();notify('验收提示：底部居中','success');notify('验收失败提示','error');await wait();const root=rect(document.querySelector('#toastRoot'));check(theme+'/toast',Math.abs(root.x+root.width/2-innerWidth/2)<1&&innerHeight-root.bottom>=23&&innerHeight-root.bottom<60,root);document.querySelector('#toastRoot').replaceChildren();
 }
 return {width:innerWidth,height:innerHeight,passed:checks.every(c=>c.ok),checks};
};

window.auditScoped=async()=>{
 await fixtureReady;const checks=[],wait=()=>new Promise(r=>setTimeout(r,100));
 const check=(name,ok)=>checks.push({name,ok});
 for(const theme of ['light','dark']){
 localStorage.setItem('gh-image-theme',theme);applyAppearance();S.auth={login:'fixture-user'};S.view='libraries';S.selectedLibrary='lib0';renderC();await wait();
 document.querySelector('.library-picker').click();await wait();const p=document.querySelector('.library-switch-panel.floating-menu');
 check(theme+'/name-only',!p.querySelector('.library-logo,small')&&[...p.querySelectorAll('.library-switch-option')].every(e=>e.textContent.trim()===S.libraries.find(l=>l.id===e.dataset.id).name+(e.dataset.id===S.selectedLibrary?'✓':'')));
 p.querySelector('.library-switch-delete').click();await wait();check(theme+'/confirm-only',!!document.querySelector('.modal')&&S.libraries.length===2);closeC();
 S.view='assets';renderC();await wait();check(theme+'/copy-text',[...document.querySelectorAll('.asset-copy')].every(e=>{const l=e.querySelector('.asset-copy-label'),r=document.createRange();r.selectNodeContents(l);return getComputedStyle(l).display!=='none'&&r.getClientRects().length===1&&e.scrollWidth<=e.clientWidth&&e.textContent.includes('复制直链');}));
 S.repo.repo='very-long-repository-name-'.repeat(12);renderC();document.querySelector('#sidebar').classList.add('open');await new Promise(r=>setTimeout(r,400));const dot=document.querySelector('#storageDot'),d=dot.getBoundingClientRect();let fit=d.width===9;for(let e=dot.parentElement;e;e=e.parentElement){const s=getComputedStyle(e),r=e.getBoundingClientRect();if(/hidden|auto|scroll|clip/.test(s.overflowX+s.overflowY))fit=fit&&d.left>=r.left&&d.right<=r.right&&d.top>=r.top&&d.bottom<=r.bottom;}check(theme+'/dot',fit);document.querySelector('#sidebar').classList.remove('open');
 S.auth=null;renderC();await wait();const input=document.querySelector('#mainTokenInput'),b=document.querySelector('.token-eye');input.value='fixture-not-a-token';input.focus();const cs=getComputedStyle(input),card=document.querySelector('.auth-card');check(theme+'/input-focus',cs.boxShadow==='none'&&cs.outlineStyle==='none'&&cs.borderTopWidth==='1px'&&cs.borderTopColor===(theme==='dark'?'rgb(40, 54, 77)':'rgb(207, 213, 253)'));check(theme+'/login-mobile-fit',(innerWidth>700||parseFloat(cs.fontSize)>=16)&&cs.minWidth==='0px'&&document.documentElement.scrollWidth<=innerWidth&&card.scrollWidth<=card.clientWidth);const snapshots=[];
 for(let i=0;i<3;i++){if(i)b.click();await wait();snapshots.push({type:input.type,icon:b.querySelector('svg')?.dataset.icon,label:b.getAttribute('aria-label'),pressed:b.getAttribute('aria-pressed'),text:b.textContent,value:input.value,box:b.querySelector('svg')?.getBoundingClientRect().width});}
 check(theme+'/eye-twice',snapshots.every((s,i)=>s.type===(i===1?'text':'password')&&s.icon===undefined&&s.label===(i===1?'隐藏 Token':'显示 Token')&&s.pressed===String(i===1)&&s.text===(i===1?'◎':'◉')&&s.value==='fixture-not-a-token'&&s.box===snapshots[0].box));
 }
 S.auth={login:'fixture-user'};S.repo.repo='assets';renderC();return {width:innerWidth,passed:checks.every(c=>c.ok),checks};
};

window.auditLibrary=async()=>{
 await fixtureReady;const wait=()=>new Promise(r=>setTimeout(r,120)),results=[];
 for(const theme of ['light','dark']){
 localStorage.setItem('gh-image-theme',theme);applyAppearance();S.view='libraries';S.selectedLibrary='lib0';renderC();await wait();
 const before=S.libraries.map(l=>l.id).join(','),picker=document.querySelector('.library-picker'),area=picker.parentElement;
 picker.querySelector('.library-logo').click();await wait();let p=document.querySelector('.library-switch-panel.floating-menu'),r=p.getBoundingClientRect();
 const bounds=r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;
 const full=Math.abs(picker.getBoundingClientRect().width-area.getBoundingClientRect().width)<2;
 const separate=!document.querySelector('.library-outside-actions').closest('[data-action="open-library-picker"]');
 p.querySelector('.library-switch-delete').click();await wait();const safe=S.selectedLibrary==='lib0'&&!!document.querySelector('.modal')&&document.querySelector('.modal').textContent.includes('永久删除');closeC();
 document.querySelector('.library-picker-copy em').click();await wait();document.querySelector('.library-switch-panel.floating-menu [data-id="lib1"]').click();await wait();const switched=S.selectedLibrary==='lib1'&&before===S.libraries.map(l=>l.id).join(',');
 document.querySelector('.library-picker').click();await wait();document.querySelector('.library-switch-panel.floating-menu [data-action="new-library"]').click();await wait();const create=!!document.querySelector('#libraryForm');closeC();
 results.push({theme,width:innerWidth,bounds,full,separate,safe,switched,create});
 }
 return {passed:results.every(r=>r.bounds&&r.full&&r.separate&&r.safe&&r.switched&&r.create),results};
};

window.auditOverview=async()=>{
 await fixtureReady;const saved=S.libraries,checks=[];const wait=()=>new Promise(r=>setTimeout(r,100));
 for(const theme of ['light','dark'])for(const count of [1,3]){
 localStorage.setItem('gh-image-theme',theme);applyAppearance();S.libraries=Array.from({length:count},(_,i)=>({...saved[0],id:'overview'+i,name:'emby-'+i,count:i===2?0:1}));S.view='overview';renderC();await wait();
 const rows=[...document.querySelectorAll('.library-list-row,.library-empty-row')];const box=rows[0].parentElement.getBoundingClientRect();
 checks.push({name:theme+'/'+count+'/full-rows',ok:rows.length===count&&rows.every((e,i)=>{const r=e.getBoundingClientRect();return Math.abs(r.width-box.width)<3&&e.scrollWidth<=e.clientWidth&&(!i||r.top>=rows[i-1].getBoundingClientRect().bottom);})});
 for(const key of [null,'Enter',' ']){S.view='overview';renderC();await wait();const row=document.querySelectorAll('.library-list-row,.library-empty-row')[count-1];if(key)row.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true}));else row.click();await wait();checks.push({name:theme+'/'+count+'/direct/'+key,ok:S.view==='libraries'&&S.selectedLibrary==='overview'+(count-1)&&!document.querySelector('.floating-menu,.modal')});}
 document.querySelector('.library-picker').click();await wait();checks.push({name:theme+'/'+count+'/picker',ok:!!document.querySelector('.library-switch-panel.floating-menu')});closeC();
 }
 S.libraries=saved;S.selectedLibrary='lib0';S.view='overview';renderC();return {passed:checks.every(c=>c.ok),checks};
};
