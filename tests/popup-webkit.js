/* Run in index.html?demo=1 on minis:// (no auth/API boot). */
window.runPopupChecks = async function(theme) {
  for (const name of ['localStorage','sessionStorage']) {
    const data=new Map();
    Object.defineProperty(window,name,{configurable:true,value:{getItem:k=>data.get(String(k))??null,setItem:(k,v)=>data.set(String(k),String(v)),removeItem:k=>data.delete(String(k)),clear:()=>data.clear()}});
  }
  // Test-only opaque-origin history shim; state reads also throw in WebKit minis://.
  Object.defineProperty(history,'state',{configurable:true,writable:true,value:null});
  for (const name of ['pushState','replaceState']) Object.defineProperty(history,name,{configurable:true,value(state){history.state=state;}});
  const wait = () => new Promise(resolve => setTimeout(resolve, 100));
  const assert = (ok, message) => {if (!ok) throw new Error(message);};
  window.fetch = () => {throw new Error('Network forbidden in popup fixture');};
  let deletes = 0;
  window.GitHubClient = class {deleteLibrary(){deletes++;throw new Error('Delete forbidden');}};
  localStorage.setItem('gh-image-theme',theme);
  S.auth={login:'fixture',name:'Fixture'};S.connected=true;
  S.repo={owner:'fixture',repo:'demo',branch:'main',assetsPath:'assets'};
  S.groups=[];S.assets=[];S.libraries=[{id:'one',name:'库一',file:'one.json',count:0,icons:[]},{id:'two',name:'库二',file:'two.json',count:0,icons:[]}];S.selectedLibrary='one';
  const results=[];
  for (const [view,kind,key] of [['assets','assets','assetSort'],['libraries','icons','iconSort']]) {
    S.view=view;S[key]='newest';renderC();
    if(view==='libraries') {
      S.libraries[0].description='北望 <img src=x onerror=alert(1)>';renderC();
      const summary=document.querySelector('.json-library-summary'),css=getComputedStyle(summary);
      assert(summary.textContent===S.libraries[0].description&&!summary.querySelector('img'),'description escaping');
      assert(css.backgroundColor==='rgba(0, 0, 0, 0)'&&css.borderTopWidth==='0px'&&css.padding==='0px'&&css.borderRadius==='0px','description box');
      results.push({theme,description:{background:css.backgroundColor,border:css.borderTopWidth,padding:css.padding,radius:css.borderRadius,margin:css.marginTop}});
    }
    const before=[document.documentElement.scrollWidth,document.documentElement.clientWidth];
    let trigger=document.querySelector('.sort-trigger');trigger.click();await wait();
    let menu=document.querySelector('.floating-menu'),r=menu.getBoundingClientRect();
    const weights=[getComputedStyle(trigger).fontWeight,...[...menu.querySelectorAll('.sort-option')].map(x=>getComputedStyle(x).fontWeight)];
    assert(weights.every(x=>x==='500'),'sort weight');
    results.push({theme,view,weights});
    const after=[document.documentElement.scrollWidth,document.documentElement.clientWidth];
    assert(r.left>=7&&r.right<=innerWidth-7,'menu exceeds viewport');
    assert(after[0]===before[0]&&after[0]===after[1],'document width changed/overflow');
    results.push({theme,view,viewport:innerWidth,before,after,rect:{left:r.left,right:r.right,top:r.top,bottom:r.bottom}});
    menu.querySelector('[data-sort-value="name-desc"]').click();await wait();assert(S[key]==='name-desc','sort not saved');
    assert(localStorage.getItem(kind==='assets'?'gh-assets-sort':'gh-icons-sort')==='name-desc','sort not persisted');
    trigger=document.querySelector('.sort-trigger');trigger.click();await wait();
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
    assert(!document.querySelector('.floating-menu')&&document.activeElement===trigger,'Escape/focus');
    trigger.click();await wait();document.querySelector('#pageTitle').click();assert(!document.querySelector('.floating-menu'),'outside click');
    for(let i=0;i<12;i++){trigger.click();await wait();trigger.click();}
    assert(!document.querySelector('.floating-menu')&&trigger.getAttribute('aria-expanded')==='false','repeat cleanup');
    trigger.click();await wait();renderC();assert(!document.querySelector('.floating-menu'),'render cleanup');
  }
  // Two simultaneously available anchors, including a viewport-bottom anchor.
  openC(sortSelectC('libraries',S.librarySort,[['updated-desc','最近更新'],['name-asc','名称 A-Z']]));
  const first=document.querySelector('#app .sort-trigger'), second=document.querySelector('#modalRoot .sort-trigger');
  first.click();await wait();second.click();await wait();
  assert(document.querySelectorAll('.floating-menu').length===1&&first.getAttribute('aria-expanded')==='false','single active menu');
  AnchoredMenu.close();
  const bottomOwner=second.closest('.sort-control');
  document.body.append(bottomOwner);
  Object.assign(bottomOwner.style,{position:'fixed',bottom:'8px',left:'8px',zIndex:'1300'});
  second.click();await wait();
  const flipped=document.querySelector('.floating-menu').getBoundingClientRect(),anchor=second.getBoundingClientRect();
  assert(flipped.bottom<=anchor.top&&flipped.top>=7,'bottom flip');
  results.push({theme,flip:{top:flipped.top,bottom:flipped.bottom,anchorTop:anchor.top},singleMenu:'PASS'});
  closeC();bottomOwner.remove();
  libraryPickerModal();const del=document.querySelector('.library-picker-delete');
  assert(del.textContent==='删除当前库'&&del.closest('.library-picker-heading')&&!del.closest('.modal-head')&&del.dataset.id==='one','delete heading/current library');
  const heading=del.closest('.library-picker-heading'),label=heading.querySelector('h3');
  const dr=del.getBoundingClientRect(),lr=label.getBoundingClientRect(),hr=heading.getBoundingClientRect();
  const centerDelta=Math.abs((dr.top+dr.bottom-lr.top-lr.bottom)/2),rightGap=Math.abs(hr.right-dr.right);
  assert(centerDelta<1&&rightGap<1,'heading/delete alignment');
  assert(!document.querySelector('#modalRoot .sort-trigger'),'unexpected picker sort');
  assert(document.documentElement.scrollWidth===innerWidth,'picker overflow');
  results.push({theme,viewport:innerWidth,heading:{centerDelta,rightGap},pickerWidth:document.documentElement.scrollWidth});
  assert(document.querySelectorAll('.library-picker-delete').length===1,'duplicate delete');
  del.click();assert(document.querySelector('[data-action="confirm-exec"]')&&S.modalConfirm&&deletes===0,'must only confirm');closeC();
  // Sort inside a modal: portal survives clipping but closes with its owning dialog.
  openC(sortSelectC('libraries',S.librarySort,[['updated-desc','最近更新'],['name-asc','名称 A-Z']]));
  document.querySelector('#modalRoot .sort-trigger').click();await wait();closeC();assert(!document.querySelector('.floating-menu'),'modal cleanup');
  results.push({theme,interactions:'selection/persistence, Escape/focus, outside, 24 repeated cycles, render/modal cleanup, delete confirmation only: PASS',deletes});
  S.libraries[0].icons=[0,1,2].map(i=>({name:'图标'+i,url:'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#7183ed"/></svg>')}));
  S.libraries[0].count=3;
  let referenceRatio;
  for(const count of [0,3]) {
    S.view='libraries';S.selectedIcons=new Set(count?[0,1,2]:[]);renderC();
    if(count) document.querySelector('[data-action="select-icon"]').click();
    const h=document.querySelector('.json-references h3'),a=document.querySelector('[data-role="icons-selection-toolbar"]'),hr=h.getBoundingClientRect(),ar=a.getBoundingClientRect();
    const range=document.createRange();range.selectNodeContents(h);
    assert(range.getClientRects().length===1&&getComputedStyle(h).whiteSpace==='nowrap','reference heading wraps');
    assert(hr.right<=ar.left&&ar.right<=innerWidth&&document.documentElement.scrollWidth===innerWidth,'reference action overflow');
    const ref=document.querySelector('.json-reference-thumb'),img=ref.querySelector('img');
    referenceRatio=img.getBoundingClientRect().width/ref.getBoundingClientRect().width;
    results.push({theme,heading:{selected:S.selectedIcons.size,width:hr.width,height:hr.height,actionWidth:ar.width,rightGap:innerWidth-ar.right},overflow:0});
  }
  S.view='overview';renderC();await wait();
  const tiles=[...document.querySelectorAll('.library-preview-tile')];
  assert(tiles.length===3,'three cover images');
  const covers=tiles.map(tile=>{const r=tile.getBoundingClientRect(),im=tile.querySelector('img'),ir=im.getBoundingClientRect(),css=getComputedStyle(im);const ratio=ir.width/r.width;
    assert(Math.abs(ratio-referenceRatio)<.002,'cover/reference inset ratio');
    assert(r.width===(innerWidth<=700?28:52)&&Math.abs(ir.width-ir.height)<.1&&css.objectFit==='contain'&&css.borderRadius==='0px','cover shape/size');
    return {plate:r.width,image:ir.width,inset:ir.left-r.left,ratio,background:getComputedStyle(tile).backgroundColor};});
  assert(document.documentElement.scrollWidth===innerWidth,'overview overflow');
  assert(document.body.classList.contains('dark')===(theme==='dark'),'theme not applied');
  results.push({theme,referenceRatio,covers,overviewOverflow:0});
  return results;
};
