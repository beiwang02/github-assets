/* Offline fixture only. Mirror pseudo states into classes in actual loaded CSS;
   this tests the cascade/computed geometry, not an iPhone physical press. */
window.auditInteractionFinish=async()=>{
 await fixtureReady;
 if(!document.querySelector('#state-simulation')){
  const mirror=document.createElement('style');mirror.id='state-simulation';
  const walk=rules=>[...rules].map(r=>r.cssRules && !r.selectorText?`${r.cssText.slice(0,r.cssText.indexOf('{'))}{${walk(r.cssRules)}}`:r.cssText.replace(/:focus-visible/g,'.test-focus-visible').replace(/:focus-within/g,'.test-focus-within').replace(/:active/g,'.test-active').replace(/:hover/g,'.test-hover').replace(/:focus(?![\w-])/g,'.test-focus')).join('\n');
  mirror.textContent=[...document.styleSheets].map(s=>walk(s.cssRules)).join('\n');document.head.append(mirror);
 }
 const results=[],check=(name,ok,data)=>{results.push({name,ok,data});if(!ok)throw Error(JSON.stringify(results.at(-1)));};
 const ring=e=>{const c=getComputedStyle(e,'::after');return {r:[c.borderTopLeftRadius,c.borderTopRightRadius,c.borderBottomRightRadius,c.borderBottomLeftRadius],color:c.borderTopColor,top:c.top,bottom:c.bottom,outline:getComputedStyle(e).outlineStyle,filter:getComputedStyle(e).filter,shadow:getComputedStyle(e).boxShadow};};
 for(const dark of [false,true]){
  localStorage.setItem('gh-image-theme',dark?'dark':'light');
  for(const count of [3,1]){
   S.view='libraries';S.selectedIcons=new Set();S.libraries[0].icons=Array.from({length:count},(_,i)=>({name:'Fixture '+i,url:S.assets[0].url}));S.libraries[0].count=count;renderC();applyAppearance();await new Promise(r=>setTimeout(r,0));
   const rows=[...document.querySelectorAll('.json-reference-row')],list=rows[0].parentElement,lc=getComputedStyle(list);
   check('container inner radius',parseFloat(lc.borderTopLeftRadius)-parseFloat(lc.borderTopWidth)===11);
   for(const [i,row] of rows.entries()){
    const expected=[i===0?'11px':'0px',i===0?'11px':'0px',i===count-1?'11px':'0px',i===count-1?'11px':'0px'];
    const normal=ring(row);row.classList.add('test-active');const pressed=ring(row);
    check(`${dark}/${count}/${i} rounded press`,JSON.stringify(pressed.r)===JSON.stringify(expected)&&pressed.color!=='rgba(0, 0, 0, 0)'&&pressed.outline==='none'&&pressed.filter==='none'&&pressed.shadow==='none',{normal,pressed});
    for(const button of row.querySelectorAll('button')){
     button.classList.add('test-active');const nested=ring(row);
     check('nested '+button.dataset.action,nested.color==='rgba(0, 0, 0, 0)'&&nested.outline==='none'&&nested.filter==='none'&&nested.shadow==='none',nested);button.classList.remove('test-active');
    }
    row.classList.remove('test-active');row.classList.add('test-focus-visible');check('keyboard row ring',ring(row).color===pressed.color&&row.tabIndex===0,{focus:ring(row),pressed,tab:row.tabIndex});row.classList.remove('test-focus-visible');
    row.classList.add('selected');const bg=getComputedStyle(row).backgroundColor;row.classList.add('test-active');check('selected retained',getComputedStyle(row).backgroundColor===bg);row.classList.remove('test-active');
   }
   const create=document.querySelector('.json-workspace-create'),cs=getComputedStyle(create);check('secondary content width',create.offsetWidth<250&&!create.classList.contains('btn-primary'),{width:cs.width,bg:cs.backgroundColor});
   for(const b of document.querySelectorAll('.main-shell button')){b.disabled=true;b.classList.add('test-active');const c=getComputedStyle(b);check('disabled '+b.dataset.action,c.filter==='none'&&c.transform==='none'&&c.boxShadow==='none');b.disabled=false;b.classList.remove('test-active');}
   const cb=rows[0].querySelector('button');cb.classList.add('test-focus-visible');check('checkbox focus',getComputedStyle(cb).outlineStyle==='solid');
   check('no horizontal overflow',document.documentElement.scrollWidth<=innerWidth);
   check('text selectable',getComputedStyle(rows[0].querySelector('.json-reference-copy')).webkitUserSelect!=='none');
  }
  S.view='overview';renderC();applyAppearance();await new Promise(r=>setTimeout(r,0));const overview=document.querySelector('.library-list-row');overview.classList.add('test-active');check('overview single inset ring',getComputedStyle(overview).outlineStyle==='none'&&getComputedStyle(overview).boxShadow.includes('inset'));overview.classList.remove('test-active');overview.classList.add('test-focus-visible');check('overview keyboard focus',getComputedStyle(overview).outlineStyle==='solid');
  S.view='assets';renderC();applyAppearance();await new Promise(r=>setTimeout(r,0));const card=document.querySelector('.asset-card');card.classList.add('test-active');const copy=card.querySelector('[data-action="copy"]');copy.classList.add('test-active');check('asset nested no outline',getComputedStyle(card).outlineStyle==='none');
 }
 return {width:innerWidth,pass:results.every(r=>r.ok),checks:results.length,results};
};
