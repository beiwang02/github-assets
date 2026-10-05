const fs=require('node:fs'),assert=require('node:assert/strict');const js=fs.readFileSync('console.js','utf8');
for(const contract of ["S.selectedIcons.clear();S.iconQuery='';closeC();renderC();$c('.library-name-trigger')?.focus({preventScroll:true})","if(action==='icon-open')","if(action==='delete-icon')","if(action==='select-icon')","if(e.key==='Escape'&&!pendingSubmission)closeC()"]){assert(js.includes(contract));}
assert(js.includes('图片文件不会删除。'));assert(js.includes('data-action="copy" data-copy="${escC(icon.url)}"'));
assert(js.includes('function syncIconSelectionUI(indexes)'));assert(js.includes('function renderIconsToolbar()'));assert(js.includes('icons.every(x=>S.selectedIcons.has(x.index))'));
console.log('PASS retained source-index, filtered selection, in-place toolbar, editing/copy/reference-only deletion and picker focus contracts (static)');
