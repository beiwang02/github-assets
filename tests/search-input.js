/* Synthetic IME and input editing audit; does not claim physical iPhone coverage. */
window.searchInputAudit=async(dark=false)=>{
 const check=(ok,msg)=>{if(!ok)throw Error(msg)};
 for(const view of ['assets','libraries']){
  libraryDisplayFixture(3,dark);S.selectedLibrary='lib1';S.view=view;S.assets[0].name='中文 photo';S.libraries[1].icons[0].name='中文 photo';renderC();
  const bind=view==='assets'?'asset-search':'icon-search',field=view==='assets'?'assetQuery':'iconQuery',input=document.querySelector(`[data-bind="${bind}"]`);
  check(!document.querySelector(`[data-sort-menu="${view==='assets'?'assets':'icons'}"]`),'sort menu removed');
  const toolbar=input.closest('.toolbar'),box=toolbar.getBoundingClientRect(),search=input.closest('.inner-search').getBoundingClientRect(),refresh=toolbar.querySelector('[data-action="refresh"]').getBoundingClientRect();
  const style=getComputedStyle(toolbar),available=box.width-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight)-parseFloat(style.borderLeftWidth)-parseFloat(style.borderRightWidth);check(Math.abs(search.width-available)<1,'full row search');check(refresh.top>=search.bottom,'actions below search');check(refresh.width<100,'compact refresh');
  input.focus();input.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true,data:''}));
  for(const text of ['zh','zhong','中文']){input.value=text;input.dispatchEvent(new CompositionEvent('compositionupdate',{bubbles:true,data:text}));input.dispatchEvent(new InputEvent('input',{bubbles:true,isComposing:true,data:text,inputType:'insertCompositionText'}));check(document.querySelector(`[data-bind="${bind}"]`)===input,'composition preserves node');check(S[field]==='','no filtering midway');}
  input.setSelectionRange(2,2);input.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:'中文'}));
  check(S[field]==='中文'&&document.querySelector(`[data-bind="${bind}"]`)===input,'Chinese commit preserved');
  for(const value of ['photo','不存在','中文 photo','中文','']){input.value=value;input.setSelectionRange(0,Math.min(2,value.length),'backward');input.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertFromPaste'}));check(input.value===value&&S[field]===value,'plain/paste/delete exact');check(input.selectionStart===0&&input.selectionEnd===Math.min(2,value.length),'selection preserved');check(document.querySelector(`[data-bind="${bind}"]`)===input,'same editing node');check(!!document.querySelector(view==='assets'?'.asset-card':'.json-reference-row')===(value!=='不存在'),'results transition');}
 }
 return {width:innerWidth,dark,passed:true,simulation:'DOM composition/input/paste/delete; not physical iPhone IME'};
};
