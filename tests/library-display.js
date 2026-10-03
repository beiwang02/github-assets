/* Browser fixture only: production render/actions/CSS, synthetic repository data. */
window.libraryDisplayFixture=(count=3,dark=false)=>{
 localStorage.setItem('gh-image-theme',dark?'dark':'light');
 document.body.classList.toggle('dark',dark);document.documentElement.classList.toggle('dark',dark);
 S.auth={login:'fixture'};S.assetQuery='';S.iconQuery='';S.connected=true;S.repo={owner:'fixture',repo:'fixture',branch:'main',assetsPath:'assets'};S.view='overview';
 const url='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><circle cx="32" cy="32" r="23" fill="#7580ff"/></svg>');
 S.assets=[{id:'a',name:'wanwan',url,group:'模拟分组',createdAt:'2026-10-03T00:00:00Z'}];
 S.groups=[{name:'模拟分组'}];S.libraries=Array.from({length:count},(_,i)=>({id:'lib'+i,name:i===0?'e 空库':'图片库 '+i,file:'lib'+i+'.json',description:i%2?'用户填写的真实说明':'',count:i%2,icons:i%2?[{name:'图片',url}]:[]}));renderC();
};
window.libraryDisplayAudit=async(dark=false)=>{
 const results=[];const check=(ok,label)=>{results.push({label,ok:!!ok});if(!ok)throw Error(label);};
 for(const count of [0,1,3]){
  libraryDisplayFixture(count,dark);
  const rows=[...document.querySelectorAll('.library-card .library-list-row')];
  check(rows.length===count,'row count '+count);check(!document.querySelector('.library-card-header'),'deleted header absent');
  check(document.documentElement.scrollWidth<=innerWidth,'no horizontal page overflow '+count);
  if(!count)check(!!document.querySelector('.library-card .empty-state'),'whole-list empty state');
  for(const row of rows){const rect=row.getBoundingClientRect();check(rect.width>0&&row.scrollWidth<=row.clientWidth,'row layout '+row.dataset.id);if(row.dataset.id==='lib0'){check(row.querySelector('b').textContent==='e 空库','real empty name');check(!row.querySelector('small'),'no invented empty subtitle');check(row.querySelector('strong').textContent==='0 个','zero count');check(row.querySelector('.list-meta span').textContent==='已读取','read status');check(row.querySelector('.library-row-icon').getBoundingClientRect().width===36,'small placeholder');}}
  if(count){rows[0].click();check(S.selectedLibrary==='lib0'&&S.view==='libraries','open empty library click');check(getComputedStyle(document.querySelector('.library-logo')).backgroundImage.includes('117, 128, 255'),'purple fallback');}
 }
 libraryDisplayFixture(3,dark);
 const card=document.querySelector('.quick-asset'),copy=card.querySelector('button');
 // Real DOM click/focus events; clipboard is test stub, no network or data writes.
 let copied='';const original=navigator.clipboard?.writeText;
 Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{copied=text;}}});
 copy.focus();copy.click();await new Promise(r=>setTimeout(r,20));copy.blur();
 check(copied===S.assets[0].url,'copy child actual handler');check(!document.querySelector('.modal'),'copy never opens detail');
 check(S.view==='overview','copy stays overview');check(getComputedStyle(card).outlineStyle==='none'||getComputedStyle(card).outlineWidth==='0px','no parent ring after child blur');
 card.focus();card.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));
 check(!!document.querySelector('.modal'),'keyboard parent opens detail');closeC();
 card.click();check(!!document.querySelector('.modal'),'direct parent click opens detail');closeC();
 return {width:innerWidth,dark,checks:results.length,results};
};
libraryDisplayFixture();
