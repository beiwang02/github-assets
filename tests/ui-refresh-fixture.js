// Test-only state. Production scripts are loaded unchanged; no GitHub mutation.
window.fixtureReady=new Promise(resolve=>setTimeout(()=>{
 const image='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><rect width="640" height="400" fill="#6757d9"/><text x="220" y="220" fill="white" font-size="48">Aurora</text></svg>');
 S.auth={login:'fixture-user',name:'测试账号'};S.repo={owner:'fixture-user',repo:'assets',branch:'main',assetsPath:'assets'};S.connected=true;
 S.assets=[{id:'a',name:'Aurora',path:'assets/品牌/aurora.svg',group:'品牌',ext:'svg',url:image,createdAt:'2026-09-19'}];S.groups=[{name:'品牌',count:1}];
 S.libraries=['品牌素材库','精选壁纸'].map((name,i)=>({id:'lib'+i,name,description:'产品品牌与合作伙伴素材',file:'libraries/brand'+i+'.json',count:1,icons:[{name:'Aurora',url:image}]}));
 S.selectedLibrary='lib0';S.view='libraries';localStorage.setItem('gh-image-theme','light');renderC();applyAppearance();resolve(true);
},50));
window.auditRestoration=async()=>{
 await fixtureReady;const mm=window.matchMedia,results=[];
 for(const dark of [false,true]){
  window.matchMedia=q=>q==='(prefers-color-scheme: dark)'?{matches:dark,addEventListener(){}}:mm(q);
  localStorage.setItem('gh-image-theme','system');S.auth={login:'fixture-user'};S.view='overview';renderC();applyAppearance();await new Promise(r=>setTimeout(r,30));
  const buttons=[...document.querySelectorAll('.hero-actions .btn')],bounds=buttons.map(b=>{const r=b.getBoundingClientRect();return {top:r.top,left:r.left,right:r.right,overflow:b.scrollWidth>b.clientWidth};});
  const multiline=buttons.some(b=>{const w=document.createTreeWalker(b,NodeFilter.SHOW_TEXT);while(w.nextNode()){if(!w.currentNode.textContent.trim())continue;const r=document.createRange();r.selectNodeContents(w.currentNode);if(r.getClientRects().length>1)return true;}return false;});
  const icons=()=>[...document.querySelectorAll('.appearance-button svg')].map(s=>({html:s.outerHTML,filled:s.querySelector('path').getAttribute('fill')==='currentColor'&&getComputedStyle(s.querySelector('path')).fill===getComputedStyle(s).color,outline:!!s.querySelector('circle[fill="none"]')}));
  const header=icons(),pageOverflow=document.documentElement.scrollWidth>innerWidth;S.auth=null;renderC();applyAppearance();await new Promise(r=>setTimeout(r,30));const login=icons();
  results.push({width:innerWidth,dark,bounds,singleRow:new Set(bounds.map(b=>b.top)).size===1,multiline,overflow:pageOverflow||bounds.some(b=>b.overflow||b.right>innerWidth),iconFilled:[...header,...login].every(i=>i.filled&&i.outline),sameIcon:login.every(i=>i.html===header[0].html)});
 }
 window.matchMedia=mm;S.auth={login:'fixture-user'};S.view='overview';renderC();return results;
};
window.auditUI=()=>{
 const visible=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
 const buttons=[...document.querySelectorAll('button,.project-link,[role="button"]')].filter(visible);
 const multiline=buttons.filter(e=>{const w=document.createTreeWalker(e,NodeFilter.SHOW_TEXT);while(w.nextNode()){const n=w.currentNode;if(!n.textContent.trim())continue;const r=document.createRange();r.selectNodeContents(n);if(r.getClientRects().length>1)return true;}return false;}).map(e=>e.textContent.trim());
 return {width:innerWidth,theme:localStorage.getItem('gh-image-theme'),overflow:document.documentElement.scrollWidth>innerWidth,buttons:buttons.length,unadapted:buttons.filter(e=>!e.classList.contains('ui-button')).length,multiline,modal:document.querySelector('.modal')?{opacity:getComputedStyle(document.querySelector('.modal')).opacity,width:document.querySelector('.modal').getBoundingClientRect().width}:null,backButtons:document.querySelectorAll('.page-back').length,syncDots:document.querySelectorAll('.json-reference-status').length};
};
