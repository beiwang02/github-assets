const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const js=fs.readFileSync('console.js','utf8'),html=fs.readFileSync('index.html','utf8');
assert(!/data-view=["']activity["']/.test(html+js),'No visible activity entry');
assert(!js.includes('activity:activityPage'),'Retired route is not dispatchable');
assert(js.includes('S.activity.unshift('));assert(js.includes('function activityView('));assert(js.includes('function scheduleRepositorySyncC('));
let rendered='',meta='',closed=0;
const S={auth:{login:'fixture'},view:'activity',activity:[{title:'retained'}]};
const c=vm.createContext({S,closeSortMenus(){closed++},document:{body:{classList:{toggle(){}}}},$c:()=>({set innerHTML(x){rendered=x}}),loginView:()=>'<login>',overviewView:()=>'<overview>',librariesView:()=>'<libraries>',assetsView:()=>'<assets>',settingsPage:()=>'<settings>',adminPage:()=>'<admin>',setMetaC(){meta=S.view},applyAppearance(){},restoreSubmissionC(){}});
vm.runInContext(js.slice(js.indexOf('function renderC()'),js.indexOf('function openC(')),c);
for(const auth of [null,{login:'fixture'}]){S.auth=auth;S.view='activity';c.renderC();assert.equal(S.view,'overview');assert.equal(rendered,auth?'<overview>':'<login>');assert.equal(S.activity.length,1);}
for(const v of ['overview','assets','libraries','settings','admin']){S.view=v;c.renderC();assert.equal(S.view,v);assert.equal(meta,v);assert.equal(rendered,'<'+v+'>');}
assert.equal(closed,7);
console.log('PASS no-sync-nav: no visible entry/route, legacy activity falls back before auth/meta, remaining views and internal logs/sync retained');
