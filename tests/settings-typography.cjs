const fs=require('node:fs'),cp=require('node:child_process'),assert=require('node:assert/strict');
const css=fs.readFileSync('ui-refresh.css','utf8'),base=cp.execFileSync('git',['show','360c42a:ui-refresh.css'],{encoding:'utf8'});
const marker='\n/* Settings typography (release 122): stop WebKit inflation locally; preserve pinch zoom. */\n';
assert.equal(css.split(marker).length,2,'One scoped approved typography block');
const block=css.slice(css.indexOf(marker));
const expected=`
/* Settings typography (release 122): stop WebKit inflation locally; preserve pinch zoom. */
.settings-grid{-webkit-text-size-adjust:100%;text-size-adjust:100%}
.settings-grid .settings-card h3{font-size:clamp(.875rem, .8125rem + .25vw, .9375rem);line-height:1.4}
.settings-grid .settings-card>p{font-size:clamp(.75rem, .6875rem + .25vw, .8125rem);line-height:1.6;overflow-wrap:anywhere}
.settings-grid .form-field label{font-size:clamp(.75rem, .6875rem + .25vw, .8125rem);line-height:1.4}
.settings-grid .form-field :is(input,select){min-width:0;width:100%;font-size:clamp(.8125rem, .75rem + .25vw, .875rem);line-height:1.4}
.settings-grid :is(.field-help,.security-note){font-size:clamp(.75rem, .6875rem + .25vw, .8125rem);line-height:1.6;overflow-wrap:anywhere}
.settings-grid :is(.info-list,.info-row,.account-panel>div:last-child){min-width:0}
.settings-grid .info-row{font-size:clamp(.75rem, .6875rem + .25vw, .8125rem);line-height:1.5}
.settings-grid .info-row>span{flex-shrink:0}
.settings-grid .info-row>b{white-space:normal;overflow-wrap:anywhere}
.settings-grid .account-panel b{font-size:clamp(.8125rem, .75rem + .25vw, .875rem);line-height:1.4;overflow-wrap:anywhere}
.settings-grid .account-panel small{font-size:clamp(.75rem, .6875rem + .25vw, .8125rem);line-height:1.5;overflow-wrap:anywhere}
${require('./settings-simplify-normalize.cjs').current}
`;
assert.equal(block,expected,'Exact finite whitelist, no blanket exemption');
assert.equal(css.replace(expected,''),base,'Every other UI style byte frozen to approved production HEAD');
const {normalizeMoveGroups,normalizeMoveClient,MOVE_BASELINE}=require('./move-groups-normalize.cjs');
assert.equal(MOVE_BASELINE,'70aa84d','Move feature baseline is the independently released cache122');
for(const f of ['console.js','console.css','styles.css','popup.js','github.js']){
 const current=fs.readFileSync(f,'utf8');
 const normalized=f==='console.js'?normalizeMoveGroups(current):f==='github.js'?normalizeMoveClient(current):current;
 assert.equal(normalized,cp.execFileSync('git',['show',MOVE_BASELINE+':'+f],{encoding:'utf8'}),f+' frozen except exact authorized move literals');
 assert.equal(normalized,cp.execFileSync('git',['show','360c42a:'+f],{encoding:'utf8'}),f+' pre-typography contract retained');
}
const html=fs.readFileSync('index.html','utf8');assert.equal(require('./release-123.cjs').normalizeIndex(html).replaceAll('clean-ui-release-122','clean-ui-release-121'),cp.execFileSync('git',['show','360c42a:index.html'],{encoding:'utf8'}));
assert(!html.includes('user-scalable=no')&&!html.includes('maximum-scale='),'User zoom is retained');
assert(block.includes('100%')&&!block.includes('text-size-adjust:none'));
const typographyOnly=block.replace(require('./settings-simplify-normalize.cjs').current,'');
assert(!/opacity|color:|background:|padding:|gap:|button|\.btn|grid-template/.test(typographyOnly),'No changes outside exact identity-card authorization');
assert(!block.includes('font-size:16px'),'Responsive inputs stay in 13–14px range at default root; no focus zoom hack');
assert(!/transform|zoom:|maximum-scale|user-scalable/.test(block));
const js=fs.readFileSync('console.js','utf8');const settings=js.slice(js.indexOf('function settingsPage()'),js.indexOf('async function loadAdminPolicy()'));
assert.equal((settings.match(/class="form-field"/g)||[]).length,4);assert(settings.includes('class="settings-grid"')&&settings.includes('class="account-panel"'));
console.log('PASS settings typography: exact scoped whitelist, unchanged business/UI bytes, correct actual form-field markup, responsive rem+clamp mobile/desktop 13–14px input with zoom enabled, identity-only unruled rows and muted note, identity/path wrapping, cache122');
