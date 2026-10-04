/* Synthetic data only; real render, edit and clipboard event handlers. */
window.libraryBasenameAudit=async(dark=false)=>{
 libraryDisplayFixture(1,dark);S.view='libraries';S.selectedLibrary='lib0';
 const results=[];const check=(ok,label)=>{results.push({label,ok:!!ok});if(!ok)throw Error(label);};
 let copied='';Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{copied=text;}}});
 for(const file of ['json/1.json','json/nested/1.json','json/中文/中文 & <库>.json']){
  const lib=S.libraries[0];lib.file=file;lib.description='真实说明 json/保持';const before=JSON.stringify(lib);renderC();
  const subtitle=document.querySelector('.library-current-copy em');
  check(subtitle.textContent==='0 个图片引用 · '+file.split('/').pop(),'basename '+file);
  check(!subtitle.querySelector('*'),'escaped plain subtitle '+file);
  check(document.documentElement.scrollWidth<=innerWidth,'no page overflow '+file);
  check(subtitle.scrollWidth<=subtitle.clientWidth,'subtitle fits '+file);
  check(document.querySelector('.json-library-summary').textContent===lib.description,'description preserved');
  document.querySelector('.library-outside-actions [data-action="copy"]').click();await new Promise(r=>setTimeout(r,20));
  check(copied==='https://raw.githubusercontent.com/fixture/fixture/main/'+file.split('/').map(encodeURIComponent).join('/'),'actual clipboard full path '+file);
  document.querySelector('[data-action="edit-library"]').click();
  check(document.querySelector('#libraryForm [name="path"]').value===file.split('/').pop().replace(/\.json$/i,''),'existing edit value preserved '+file);
  check(S.libraries[0].file===file&&JSON.stringify(lib)===before,'real lib file preserved '+file);closeC();
 }
 S.libraries[0].file='json/1.json';renderC();return {width:innerWidth,dark,checks:results.length,results};
};
