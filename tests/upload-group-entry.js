// Run in ui-refresh-fixture.html only; never submit a repository mutation.
window.auditUploadGroupEntry=async function(dark=false){
 await fixtureReady;
 localStorage.setItem('gh-image-theme',dark?'dark':'light');applyAppearance();
 uploadModal();await new Promise(r=>setTimeout(r,30));
 const form=document.querySelector('#uploadForm'),button=form.querySelector('.modal-inline-create'),select=form.querySelector('#uploadGroup'),library=form.querySelector('[name=library]');
 const rect=button.getBoundingClientRect(),sr=select.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(button);
 const text=range.getBoundingClientRect(),style=getComputedStyle(button),jsonLabel=library.previousElementSibling.getBoundingClientRect();
 const result={width:innerWidth,dark,text:button.textContent,icons:button.querySelectorAll('svg').length,leftDelta:text.left-sr.left,gap:rect.top-sr.bottom,textGap:text.top-sr.bottom,touchHeight:rect.height,color:style.color,background:style.backgroundColor,jsonGap:jsonLabel.top-rect.bottom,overflow:document.documentElement.scrollWidth>innerWidth};
 button.scrollIntoView({block:'center'});
 const hit=button.getBoundingClientRect();result.hitTarget=document.elementFromPoint(hit.left+20,hit.top+20)?.closest('button')===button;
 button.click();await new Promise(r=>setTimeout(r,30));result.clicked=!!document.querySelector('#groupCreateForm');
 result.pass=result.text==='新建分组'&&!result.icons&&Math.abs(result.leftDelta)<1&&result.gap>=6&&result.gap<=8&&result.textGap>=6&&result.textGap<=10&&result.touchHeight>=40&&result.jsonGap>0&&!result.overflow&&result.hitTarget&&result.clicked;
 closeC();S.uploadDraft=null;return result;
};
