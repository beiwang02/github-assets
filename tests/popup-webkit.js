/* Run in index.html?demo=1 on minis:// (no auth/API boot). */
window.runPopupChecks = async function(theme) {
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
    const before=[document.documentElement.scrollWidth,document.documentElement.clientWidth];
    let trigger=document.querySelector('.sort-trigger');trigger.click();await wait();
    let menu=document.querySelector('.floating-menu'),r=menu.getBoundingClientRect();
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
  assert(del.textContent==='删除当前库'&&del.closest('.modal-head')&&del.dataset.id==='one','delete header/current library');
  assert(document.querySelectorAll('.library-picker-delete').length===1,'duplicate delete');
  del.click();assert(document.querySelector('[data-action="confirm-exec"]')&&S.modalConfirm&&deletes===0,'must only confirm');closeC();
  // Sort inside a modal: portal survives clipping but closes with its owning dialog.
  openC(sortSelectC('libraries',S.librarySort,[['updated-desc','最近更新'],['name-asc','名称 A-Z']]));
  document.querySelector('#modalRoot .sort-trigger').click();await wait();closeC();assert(!document.querySelector('.floating-menu'),'modal cleanup');
  results.push({theme,interactions:'selection/persistence, Escape/focus, outside, 24 repeated cycles, render/modal cleanup, delete confirmation only: PASS',deletes});
  return results;
};
