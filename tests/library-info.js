window.auditLibraryInfo=async()=>{
 await fixtureReady;const out=[],wait=()=>new Promise(r=>setTimeout(r,120)),assert=(x,m)=>{if(!x)throw Error(m)};
 window.fetch=()=>{throw Error('Network forbidden')};window.GitHubClient=class{deleteLibrary(){throw Error('Delete forbidden')}};
 for(const theme of ['light','dark']){
 localStorage.setItem('gh-image-theme',theme);applyAppearance();S.auth={login:'fixture'};S.view='libraries';S.selectedLibrary='lib0';
 S.libraries=[{id:'lib0',name:'长库名'.repeat(45),file:'libraries/'+ 'longpath'.repeat(50)+'.json',description:('描述abcdefgh'.repeat(10)+'\n').repeat(5),icons:[],count:0},{id:'lib1',name:'目标库',file:'target.json',icons:[],count:0}];renderC();await wait();
 const info=document.querySelector('.library-current-info'),trigger=document.querySelector('.library-switch-trigger'),summary=document.querySelector('.json-library-summary'),css=getComputedStyle(summary);
 assert(!info.closest('button,[data-action]'),'info actionable');info.click();assert(!document.querySelector('.modal .library-switch-modal-body'),'info opened');
 assert(summary.textContent===S.libraries[0].description&&summary.scrollHeight<=summary.clientHeight+1&&css.whiteSpace==='pre-wrap'&&css.overflow==='visible','description clipped');assert(document.documentElement.scrollWidth===innerWidth,'page overflow');
 assert(getComputedStyle(trigger).backgroundColor==='rgba(0, 0, 0, 0)'&&getComputedStyle(trigger).borderTopWidth==='0px'&&trigger.getBoundingClientRect().height>=44,'text trigger');
 document.querySelector('[data-action="edit-library"]').click();assert(!document.querySelector('.modal .library-switch-modal-body')&&document.querySelector('#libraryForm'),'edit opens switch');closeC();
 window.copyC=async()=>{};document.querySelector('.library-outside-actions [data-action="copy"]').click();assert(!document.querySelector('.modal .library-switch-modal-body'),'copy opens switch');
 for(const id of ['lib0','lib1']){trigger.click();await wait();const panel=document.querySelector('.modal .library-switch-modal-body'),r=panel.getBoundingClientRect();assert(r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight,'popup bounds');assert(!panel.querySelector('button button'),'nested button');
 for(const row of panel.querySelectorAll('.library-switch-row')){assert(row.querySelector('small').textContent.includes(S.libraries.find(x=>x.id===row.querySelector('button').dataset.id).file),'option path');assert(row.querySelector('.library-switch-delete').textContent==='删除','delete text')}
 panel.querySelector('[data-action="delete-library"][data-id="'+id+'"]').click();await wait();assert(S.selectedLibrary==='lib0'&&S.libraries.length===2,'delete changed selection');assert(document.querySelector('.modal').textContent.includes('永久删除 '+S.libraries.find(x=>x.id===id).name),'wrong confirmation');closeC();}
 trigger.click();await wait();document.querySelector('.modal .library-switch-modal-body [data-action="new-library"]').click();assert(document.querySelector('#libraryForm'),'new missing');closeC();
 trigger.click();await wait();document.querySelector('.modal .library-switch-modal-body [data-action="select-library"][data-id="lib1"]').click();assert(S.selectedLibrary==='lib1','switch failed');
 S.view='overview';renderC();const row=document.querySelector('.library-empty-row');assert(row&&row.dataset.action==='open-library','overview entry');row.click();assert(S.view==='libraries'&&!document.querySelector('.modal .library-switch-modal-body'),'overview popup');
 S.auth=null;renderC();await wait();const eye=document.querySelector('.token-eye');assert(getComputedStyle(eye).fontSize==='18px'&&eye.type==='button'&&eye.getAttribute('aria-pressed')==='false','eye');
 out.push({width:innerWidth,theme,infoInert:true,descriptionFull:true,overflow:0,popupBounds:true,deleteConfirmOnly:true,selectionSafe:true,newAndSwitch:true,overviewDirect:true,eye:'18px'});
 }return out;
};
