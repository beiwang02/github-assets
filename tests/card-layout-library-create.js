// Offline fixture only: no production data writes or actual clipboard writes.
window.auditCardLayout=async(dark=false,view='assets')=>{
 await fixtureReady;const results=[];
 const check=(name,ok,data)=>{results.push({name,ok,data});if(!ok)throw Error(JSON.stringify(results.at(-1)));};
 const settle=async()=>{for(let i=0;i<3;i++){enhanceControlsC();document.body.append(document.createComment('observer regression'));await new Promise(r=>setTimeout(r,0));}};
 const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right};};
 const saved=S.assets[0];S.assets=Array.from({length:6},(_,i)=>({...saved,id:'a'+i,name:'Fixture '+i}));
 let copied=[];copyC=async text=>{copied.push(text);};
 for(let pass=0;pass<2;pass++){
  closeC();S.view=view;S.selected=new Set();S.selectedIcons=new Set();localStorage.setItem('gh-image-theme',dark?'dark':'light');renderC();applyAppearance();await settle();
  const selector=view==='assets'?'.asset-card':view==='overview'?'.quick-asset':'.json-reference-row';
  for(const card of document.querySelectorAll(selector)){
   check(`${dark}/${view}/${pass} composite`,!card.classList.contains('ui-button')&&card.tabIndex===0&&card.getAttribute('role')==='button',{display:getComputedStyle(card).display});
   if(view!=='libraries'){
    const preview=card.querySelector('.asset-preview,.quick-asset-image'),name=card.querySelector('.asset-name-row,.quick-asset-name-row'),p=rect(preview),n=rect(name);
    check('square preview above name/actions',Math.abs(p.width-p.height)<1&&p.width>65&&p.bottom<=n.y+1,{preview:p,name:n});
    check('original column count',getComputedStyle(card.parentElement).gridTemplateColumns.split(' ').length===(innerWidth<=700?3:6));
   }else check('JSON row stays flex',getComputedStyle(card).display==='flex');
  }
  if(view==='overview')check('overview library layout preserved',getComputedStyle(document.querySelector('.library-list-row')).display==='flex');
  const card=document.querySelector(selector),copy=card.querySelector('[data-action="copy"]'),before=copied.length;copy.click();await settle();
  check('nested copy only',copied.length===before+1&&!document.querySelector('.modal'));
  if(view==='assets'||view==='libraries'){
   const button=card.querySelector('.asset-select,.reference-select');button.click();await settle();
   check('nested selection only',!document.querySelector('.modal')&&(view==='assets'?S.selected.size:S.selectedIcons.size)===1);
  }
  document.querySelector(selector).dispatchEvent(new KeyboardEvent('keydown',{key:pass?' ':'Enter',bubbles:true,cancelable:true}));await settle();check('keyboard opens card detail',!!document.querySelector('.modal'));closeC();
  if(view==='libraries'){
   const buttons=[...document.querySelectorAll('.library-outside-actions button')];
   check('current actions correct order',buttons.map(b=>b.dataset.action).join(',')==='new-library,edit-library,copy');
   check('no standalone create',!document.querySelector('.json-workspace-heading button')&&!!document.querySelector('.json-workspace-heading p'));
   const c=buttons[0],css=getComputedStyle(c);check('normal blue primary, no banner',c.classList.contains('btn-primary')&&css.backgroundImage==='linear-gradient(135deg, rgb(102, 113, 252), rgb(88, 96, 223))'&&c.offsetWidth<250,{bg:css.backgroundColor,width:c.offsetWidth});
   check('normal sizes/no overflow',buttons.every(b=>parseFloat(getComputedStyle(b).fontSize)>=12&&b.scrollWidth<=b.clientWidth&&rect(b).right<=innerWidth));
   c.click();await settle();check('new-library opens create form',!!document.querySelector('#libraryForm')&&S.editingLibrary===null);closeC();
  }
  check('no page overflow',document.documentElement.scrollWidth<=innerWidth);
 }
 const libs=S.libraries;S.libraries=[];S.view='libraries';renderC();await settle();check('empty library primary create',!!document.querySelector('.btn-primary[data-action="new-library"]'));S.libraries=libs;
 return {width:innerWidth,pass:true,checks:results.length,results};
};
