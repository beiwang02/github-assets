window.auditMultiSelect=async()=>{
 await fixtureReady;const results=[];
 for(const theme of ['light','dark']){
 localStorage.setItem('gh-image-theme',theme);applyAppearance();const pair=[];
 for(const view of ['assets','libraries']){
 S.view=view;S.selected.clear();S.selectedIcons?.clear();renderC();await new Promise(r=>setTimeout(r,60));
 const b=document.querySelector(view==='assets'?'.asset-select':'.reference-select');if(!b)throw Error('missing checkbox');
 const sample=()=>{const c=getComputedStyle(b),v=getComputedStyle(b,view==='assets'?'::before':null);return {border:v.borderColor,bg:v.backgroundColor,mark:c.color,opacity:c.opacity,focus:c.outlineColor,size:[b.offsetWidth,b.offsetHeight],filter:c.filter}};
 const normal=sample();b.click();const selected=sample(),selectedSemantics=b.getAttribute('aria-pressed')==='true'&&b.textContent==='✓'&&!document.querySelector('.modal');b.click();const deselected=b.getAttribute('aria-pressed')==='false'&&!document.querySelector('.modal');
 b.focus();const focus=sample();b.disabled=true;const disabled=sample();b.disabled=false;b.setAttribute('aria-busy','true');const busy=sample();b.removeAttribute('aria-busy');
 pair.push({view,normal,selected,focus,disabled,busy,selectedSemantics,deselected});
 }
 for(const state of ['normal','selected','focus','disabled','busy'])for(const key of ['border','bg','mark','opacity','focus','filter'])if(pair[0][state][key]!==pair[1][state][key])throw Error(theme+' '+state+' '+key+' mismatch '+JSON.stringify(pair));
 if(!pair.every(p=>p.selectedSemantics&&p.deselected&&p.disabled.opacity==='0.5'&&p.busy.opacity==='0.5'))throw Error('interaction failed');
 const expected=theme==='light'?'rgb(196, 204, 222)':'rgb(83, 102, 129)';if(pair[0].normal.border!==expected)throw Error('border regression');results.push({theme,width:innerWidth,pair});
 }return results;
};
