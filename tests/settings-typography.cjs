const fs=require('node:fs'),cp=require('node:child_process'),assert=require('node:assert/strict');
const css=fs.readFileSync('ui-refresh.css','utf8'),base=cp.execFileSync('git',['show','360c42a:ui-refresh.css'],{encoding:'utf8'});
const marker='\n/* Settings typography (release 122): stop WebKit inflation locally; preserve pinch zoom. */\n';
assert.equal(css.split(marker).length,2,'One scoped approved typography block');
const block=css.slice(css.indexOf(marker));
const expected=`
/* Settings typography (release 122): stop WebKit inflation locally; preserve pinch zoom. */
.settings-grid{-webkit-text-size-adjust:100%;text-size-adjust:100%}
.settings-grid .settings-card h3{font-size:14px;line-height:1.4}
.settings-grid .settings-card>p{font-size:12px;line-height:1.6;overflow-wrap:anywhere}
.settings-grid .form-field label{font-size:12px;line-height:1.4}
.settings-grid .form-field :is(input,select){min-width:0;width:100%;font-size:14px;line-height:1.4}
.settings-grid :is(.field-help,.security-note){font-size:12px;line-height:1.6;overflow-wrap:anywhere}
.settings-grid :is(.info-list,.info-row,.account-panel>div:last-child){min-width:0}
.settings-grid .info-row{font-size:12px;line-height:1.5}
.settings-grid .info-row>span{flex-shrink:0}
.settings-grid .info-row>b{white-space:normal;overflow-wrap:anywhere}
.settings-grid .account-panel b{font-size:13px;line-height:1.4;overflow-wrap:anywhere}
.settings-grid .account-panel small{font-size:12px;line-height:1.5;overflow-wrap:anywhere}
@media(max-width:700px){.settings-grid .form-field :is(input,select){font-size:16px}}
`;
assert.equal(block,expected,'Exact finite whitelist, no blanket exemption');
assert.equal(css.replace(expected,''),base,'Every other UI style byte frozen to approved production HEAD');
for(const f of ['console.js','console.css','styles.css','popup.js','github.js'])assert.equal(fs.readFileSync(f,'utf8'),cp.execFileSync('git',['show','360c42a:'+f],{encoding:'utf8'}),f+' unchanged');
const html=fs.readFileSync('index.html','utf8');assert.equal(html.replaceAll('clean-ui-release-122','clean-ui-release-121'),cp.execFileSync('git',['show','360c42a:index.html'],{encoding:'utf8'}));
assert(!html.includes('user-scalable=no')&&!html.includes('maximum-scale='),'User zoom is retained');
assert(block.includes('100%')&&!block.includes('text-size-adjust:none'));
assert(!/opacity|color:|background:|padding:|gap:|button|\.btn|grid-template/.test(block),'No colors, disabled semantics, buttons, spacing, or grid layout changed');
const js=fs.readFileSync('console.js','utf8');const settings=js.slice(js.indexOf('function settingsPage()'),js.indexOf('async function loadAdminPolicy()'));
assert.equal((settings.match(/class="form-field"/g)||[]).length,4);assert(settings.includes('class="settings-grid"')&&settings.includes('class="account-panel"'));
console.log('PASS settings typography: exact scoped whitelist, unchanged business/UI bytes, correct actual form-field markup, mobile 16px input with zoom enabled, identity/path wrapping, cache122');
