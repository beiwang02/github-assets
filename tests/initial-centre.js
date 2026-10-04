window.initialCentreAudit=async(dark=false)=>{
 const check=(ok,label)=>{if(!ok)throw Error(label)};
 libraryDisplayFixture(5,dark);
 const names=['emby图标库','透明图标库','E大写库','😀库','e'+ '很长库名'.repeat(40)];
 S.libraries.forEach((l,i)=>{l.name=names[i];l.count=i;l.description=i%2?'真实说明':'';l.file='json/nested/'+i+'.json';});renderC();
 const output=[];
 for(const row of document.querySelectorAll('.library-card .library-list-row')){
  const icon=row.querySelector('.library-row-icon'),text=icon.firstElementChild,a=icon.getBoundingClientRect(),b=text.getBoundingClientRect(),latin=text.classList.contains('library-initial-latin');
  check(a.width===36&&a.height===36,'36 icon');check(row.getBoundingClientRect().height===72,'72 row');check(getComputedStyle(icon).padding==='0px','no padding');check(getComputedStyle(text).lineHeight==='16px','unit line height');
  check(Math.abs((b.left+b.width/2)-(a.left+a.width/2))<.1,'horizontal centre');check(Math.abs((b.top+b.height/2)-(a.top+a.height/2)+(latin?1:0))<.1,'vertical centre/optical 1px');check(row.scrollWidth<=row.clientWidth,'long row overflow');
  output.push({text:text.textContent,lineHeight:getComputedStyle(text).lineHeight,offset:(b.top+b.height/2)-(a.top+a.height/2)});
 }
 for(const l of S.libraries){S.view='libraries';S.selectedLibrary=l.id;renderC();const icon=document.querySelector('.library-current-info .library-logo');check(icon.textContent===Array.from(l.name)[0],'workspace Unicode');check(icon.getBoundingClientRect().width===36,'workspace 36');check(!icon.querySelector('.library-initial'),'workspace layout unchanged');}
 S.view='settings';renderC();check(document.querySelector('.security-note').textContent==='Token 只在服务器内存会话中使用；“记住此设备”仅保存在当前浏览器本地。','security copy');S.view='overview';renderC();
 return {width:innerWidth,dark,passed:true,output};
};
