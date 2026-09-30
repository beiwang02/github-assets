window.auditFlatNavigationC=async(dark)=>{
 await fixtureReady;const checks=[],check=(name,pass)=>checks.push({name,pass:!!pass});
 const tick=()=>new Promise(r=>setTimeout(r,40)),click=s=>{const n=document.querySelector(s);check('entry '+s,n);n?.click();};
 const overflow=()=>document.documentElement.scrollWidth<=innerWidth;
 localStorage.setItem('gh-image-theme',dark?'dark':'light');S.auth={login:'fixture-user',name:'测试账号'};S.tokenLoginEnabled=true;S.isAdmin=true;S.adminConfigured=true;
 const assets=S.assets,libraries=S.libraries,groups=S.groups;
 S.repo={owner:'fixture-user',repo:'超长仓库身份'.repeat(12),branch:'long-branch'.repeat(10),assetsPath:'assets'};
 check('no sidebar/drawer',!document.querySelector('#sidebar,.sidebar-overlay,[data-action="toggle-sidebar"]'));
 check('exact two resource entries',document.querySelectorAll('.primary-nav [data-view]').length===2);
 check('settings gear explicit',document.querySelector('.settings-button[aria-label="仓库设置"] svg'));
 for(const connected of [false,true])for(const empty of [false,true]){
 S.connected=connected;S.assets=empty?[]:assets;S.libraries=empty?[]:libraries;S.groups=empty?[]:groups;S.assetQuery='';S.iconQuery='';
 for(const view of ['assets','libraries']){click('.primary-nav [data-view="'+view+'"]');await tick();check(view+' route '+connected+empty,S.view===view);check(view+' no overflow '+connected+empty,overflow());check(view+' active '+connected+empty,document.querySelector('.primary-nav [data-view="'+view+'"].active'));check('no overview content',!document.querySelector('.hero,.stat-grid,.activity-card'));}
 if(empty){check('empty CTA',document.querySelector('#app .empty-state button'));}
 click('.settings-button');await tick();check('settings '+connected+empty,S.view==='settings');check('settings overflow '+connected+empty,overflow());
 for(const action of ['create-repo','rename-repo','delete-repo','open-repo','logout','forget-token'])check('settings migration '+action,document.querySelector('#app [data-action="'+action+'"]'));
 check('admin entry',document.querySelector('#app [data-view="admin"]'));click('#app [data-view="admin"]');check('admin reachable',S.view==='admin'&&document.querySelector('#adminPolicyForm'));check('admin overflow',overflow());
 }
 S.connected=true;S.assets=assets;S.libraries=libraries;S.groups=groups;S.group=groups[0]?.name||'';S.assetQuery='Aurora';S.selected=new Set(['a']);S.view='assets';renderC();click('.settings-button');click('.primary-nav [data-view="assets"]');check('settings round trip search/selection',S.assetQuery==='Aurora'&&S.selected.has('a'));
 check('upload explicit',document.querySelector('[data-action="upload"]'));check('bulk actions',document.querySelector('[data-action="bulk-library"]')&&document.querySelector('[data-action="bulk-delete"]'));
 check('contain image',getComputedStyle(document.querySelector('.asset-card img')).objectFit==='contain');
 const grid=document.querySelector('.asset-grid');check('mobile three columns',innerWidth>700||getComputedStyle(grid).gridTemplateColumns.split(' ').length===3);
 const select=document.querySelector('.asset-select');check('selection frame preserved',select&&getComputedStyle(select).getPropertyValue('--selection-frame-size').trim()!=='0px');
 click('[data-action="manage-group"]');check('manage group modal',document.querySelector('#groupManageForm'));check('modal overflow',overflow());window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));check('escape close',!document.querySelector('.modal'));closeC();
 click('[data-action="upload"]');check('upload real form',document.querySelector('#uploadForm')&&document.querySelector('[data-action="new-group-from-upload"]'));click('[data-action="toggle-field-menu"]');await tick();check('group menu open',document.querySelector('.floating-menu'));check('field menu overflow',overflow());document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));closeC();
 S.view='libraries';S.selectedLibrary='lib0';S.iconQuery='';renderC();check('full explicit JSON copy',[...document.querySelectorAll('[data-action="copy"]')].some(x=>x.textContent.includes('复制 JSON 直链')));
 const trigger=document.querySelector('[data-action="open-library-picker"]');trigger.focus();trigger.click();check('library separate select/delete/create',document.querySelector('.library-switch-option')&&document.querySelector('.library-switch-delete')&&document.querySelector('.library-picker-create'));check('library modal overflow',overflow());document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));check('restore trigger focus',document.activeElement===trigger);
 click('[data-action="open-library-picker"]');click('.modal-backdrop');check('outside dismiss',!document.querySelector('.modal'));
 const before=S.selectedLibrary;click('.reference-select');check('nested reference selection not open',!document.querySelector('.modal')&&S.selectedIcons.size>0&&S.selectedLibrary===before);check('reference selected',document.querySelector('.json-reference-row.selected'));await tick();check('reference keyboard focus',document.querySelector('.json-reference-row[tabindex="0"]'));
 click('[data-action="new-library"]');check('new JSON library complete',document.querySelector('#libraryForm')&&document.querySelector('.modal h2').textContent==='新建 JSON 库');check('new library overflow',overflow());closeC();
 for(const view of ['overview','activity']){S.view=view;renderC();check('legacy direct '+view,S.view==='assets');window.dispatchEvent(new PopStateEvent('popstate',{state:{ghView:view,depth:2}}));check('legacy history '+view,S.view==='assets'&&history.state.ghView==='assets');}
 const long=libraries[0];const prev={name:long.name,file:long.file};long.name='长库名称'.repeat(40);long.file='libraries/'+('long-path-'.repeat(40))+'.json';S.view='libraries';renderC();check('long name/path overflow',overflow());click('[data-action="open-library-picker"]');check('long menu overflow',overflow());closeC();Object.assign(long,prev);
 S.auth=null;renderC();check('login no signed-in shell',getComputedStyle(document.querySelector('.topbar')).display==='none');check('login overflow',overflow());const token=document.querySelector('#mainTokenInput');token.value='fixture-not-a-token'.repeat(20);token.focus();await new Promise(r=>setTimeout(r,450));check('token caret unchanged',token.selectionStart===token.value.length&&token.selectionEnd===token.value.length);const icon=document.querySelector('.auth-theme-button');check('login 34px icon',Math.round(icon.getBoundingClientRect().width)===34);check('login icon no shadow',getComputedStyle(icon).boxShadow==='none');check('theme',document.documentElement.classList.contains('dark')===dark);
 S.auth={login:'fixture-user'};S.view='assets';renderC();check('signed-in default image resources',document.querySelector('.primary-nav [data-view="assets"].active'));check('sticky header',getComputedStyle(document.querySelector('.topbar')).position==='sticky');
 return {width:innerWidth,dark,pass:checks.every(x=>x.pass),checks};
};
