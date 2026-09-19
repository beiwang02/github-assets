window.auditPickerInsets=async()=>{
 await fixtureReady;const results=[],wait=()=>new Promise(r=>setTimeout(r,120)),assert=(x,m)=>{if(!x)throw Error(m)};let deletes=0;
 window.fetch=()=>{throw Error('Network forbidden')};window.GitHubClient=class{deleteLibrary(){deletes++;throw Error('Delete forbidden')}};
 for(const theme of ['light','dark'])for(const count of [1,3]){
 localStorage.setItem('gh-image-theme',theme);applyAppearance();S.auth={login:'fixture'};S.view='libraries';S.selectedLibrary='lib0';S.libraries=Array.from({length:count},(_,i)=>({id:'lib'+i,name:i===2?'较长的库名称用于检查文字换行布局':'测试库'+i,file:i===2?'libraries/'+ 'long-path-'.repeat(10)+'.json':'library-'+i+'.json',count:i,icons:[]}));renderC();await wait();
 const open=async()=>{document.querySelector('.library-switch-trigger').click();await wait();return document.querySelector('.modal .library-switch-modal-body')};
 let panel=await open(),pr=panel.getBoundingClientRect(),xs=[];
 assert(pr.left>=0&&pr.right<=innerWidth&&pr.bottom<=innerHeight,'panel viewport');assert(document.documentElement.scrollWidth===innerWidth&&panel.scrollWidth<=panel.clientWidth,'root/panel overflow');
 for(const row of panel.querySelectorAll('.library-switch-row')){
 const option=row.querySelector('.library-switch-option'),mark=row.querySelector('.library-switch-check'),copy=row.querySelector('.library-switch-copy'),del=row.querySelector('.library-switch-delete'),m=mark.getBoundingClientRect(),c=copy.getBoundingClientRect(),d=del.getBoundingClientRect(),o=option.getBoundingClientRect();xs.push(c.left);
 assert(option.firstElementChild===mark&&m.width===14&&m.right<c.left,'left fixed slot');assert(!mark.matches('button,input,[tabindex],[data-action]'),'noninteractive mark');assert(mark.textContent===(option.dataset.id==='lib0'?'✓':''),'current mark');assert(c.right<=o.right-11&&o.right<=d.left&&m.left>=o.left+11,'text insets/overlap');assert(pr.right-d.right>=12&&d.height>=44&&d.width>=44,'delete edge/target');assert(del.parentElement===option.parentElement&&del.textContent==='删除','sibling delete');
 const lib=S.libraries.find(x=>x.id===option.dataset.id);assert(copy.querySelector('b').textContent===lib.name&&copy.querySelector('small').textContent===lib.count+' 个图片引用 · '+lib.file,'preserved text');
 }
 assert(xs.every(x=>Math.abs(x-xs[0])<.5),'name alignment');assert(panel.lastElementChild.dataset.action==='new-library','new bottom');
 for(let i=0;i<count;i++){if(i)panel=await open();panel.querySelector('[data-action="delete-library"][data-id="lib'+i+'"]').click();await wait();assert(S.selectedLibrary==='lib0'&&S.libraries.length===count&&deletes===0,'delete mutated');assert(document.querySelector('.modal').textContent.includes('永久删除 '+S.libraries[i].name)&&document.querySelector('[data-action="confirm-exec"]'),'target confirm');closeC();}
 panel=await open();panel.querySelector('[data-action="select-library"][data-id="lib'+(count-1)+'"]').click();await wait();assert(S.selectedLibrary==='lib'+(count-1),'select failed');results.push({width:innerWidth,theme,libraries:count,panelWidth:pr.width,aligned:true,insets:true,noOverflow:true,select:true,correctConfirmOnly:true,deletes});
 }return results;
};
