// Run in ui-refresh-fixture.html only; never submit a repository mutation.
window.auditUploadGroupEntry=async function(dark=false){
 await fixtureReady;localStorage.setItem('gh-image-theme',dark?'dark':'light');applyAppearance();
 uploadModal();await new Promise(r=>setTimeout(r,30));
 const form=document.querySelector('#uploadForm'),button=form.querySelector('.modal-inline-create'),glyph=button.querySelector('span'),select=form.querySelector('#uploadGroup'),library=form.querySelector('[name=library]');
 const rect=button.getBoundingClientRect(),sr=select.getBoundingClientRect(),text=glyph.getBoundingClientRect(),jsonLabel=library.previousElementSibling.getBoundingClientRect();
 const result={width:innerWidth,dark,leftDelta:text.left-sr.left,selectGlyphGap:text.top-sr.bottom,touchHeight:rect.height,visualGap:jsonLabel.top-text.bottom,hitToLabelGap:jsonLabel.top-rect.bottom,overflow:document.documentElement.scrollWidth>innerWidth};
 button.scrollIntoView({block:'center'});const br=button.getBoundingClientRect(),jr=library.previousElementSibling.getBoundingClientRect();
 result.buttonHit=document.elementFromPoint(br.left+20,br.top+20)?.closest('button')===button;
 result.jsonHit=document.elementFromPoint(jr.left+5,jr.top+jr.height/2)===library.previousElementSibling;
 button.click();await new Promise(r=>setTimeout(r,30));result.clicked=!!document.querySelector('#groupCreateForm');
 result.pass=Math.abs(result.leftDelta)<1&&result.selectGlyphGap>=6&&result.selectGlyphGap<=8&&result.touchHeight>=40&&result.visualGap>=14&&result.visualGap<=18&&result.buttonHit&&result.jsonHit&&result.clicked&&!result.overflow;
 closeC();S.uploadDraft=null;return result;
};
window.auditGroupDeleteAlignment=async function(dark=false){
 await fixtureReady;localStorage.setItem('gh-image-theme',dark?'dark':'light');applyAppearance();S.group=S.groups[0]?.name||'fixtures';manageGroupModal();await new Promise(r=>setTimeout(r,30));
 const input=document.querySelector('#group-name-input'),del=document.querySelector('.group-delete-link'),label=document.querySelector('.group-name-label label'),ir=input.getBoundingClientRect(),dr=del.getBoundingClientRect();
 const result={width:innerWidth,dark,rightDelta:dr.right-ir.right,labelLeftDelta:label.getBoundingClientRect().left-ir.left,touchHeight:dr.height};result.pass=Math.abs(result.rightDelta)<.01&&Math.abs(result.labelLeftDelta)<.01&&result.touchHeight>=40;closeC();return result;
};
