const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('console.js','utf8');let now=Date.parse('2026-09-30T17:00:00Z'),tick,visible;const stamp=now-59000;
class Clock extends Date{constructor(...a){super(...(a.length?a:[now]));}static now(){return now;}}
const node={dataset:{activityTime:String(stamp)},textContent:'刚刚'},doc={hidden:false,querySelectorAll:s=>{assert.equal(s,'[data-activity-time]');return [node];},addEventListener:(e,fn)=>{assert.equal(e,'visibilitychange');visible=fn;}};
const ctx=vm.createContext({Date:Clock,Intl,window:{},document:doc,setInterval:(fn,ms)=>{assert.equal(ms,15000);tick=fn;return 1;},S:{activity:[]},escC:String});
vm.runInContext(src.slice(src.indexOf('function relativeTimeC('),src.indexOf('function overviewView(')),ctx);
assert.equal(ctx.relativeTimeC(stamp),'刚刚');now+=61000;tick();assert.equal(node.textContent,'2 分钟前');assert.equal(node.dataset.activityTime,String(stamp));
doc.hidden=true;now+=120000;tick();assert.equal(node.textContent,'2 分钟前');doc.hidden=false;visible();assert.equal(node.textContent,'4 分钟前');
now=Date.parse('2026-09-30T17:00:00Z');assert.equal(ctx.relativeTimeC(Date.parse('2026-09-29T16:30:00Z')),'昨天 00:30');assert.equal(ctx.relativeTimeC(Date.parse('2026-09-27T18:00:00Z')),'09-28 02:00');assert.equal(ctx.relativeTimeC(Date.parse('2025-12-31T17:00:00Z')),'01-01 01:00');assert.equal(ctx.relativeTimeC(Date.parse('2024-12-31T17:00:00Z')),'2025-01-01');assert.equal(ctx.relativeTimeC('unknown'),'unknown');
ctx.S.activity=[{title:'Event',detail:'Detail',time:stamp}];const html=ctx.activityView();assert(html.includes('datetime="'+new Date(stamp).toISOString()+'"'));assert(html.includes('北京时间'));assert.equal(ctx.S.activity[0].time,stamp);
const css=fs.readFileSync('ui-refresh.css','utf8');assert(css.includes('.asset-card:not(.selected):not(:focus-visible){outline:none!important}'));assert(css.includes('.asset-card:focus-visible{outline:2px'));assert(css.includes('grid-template-columns:repeat(3,minmax(0,1fr))'));
console.log('PASS activity clock: 15s timer, hidden pause, visibility catch-up, immutable timestamps, Beijing midnight/year boundaries, no whole-page render; local equal actions and pointer-vs-keyboard focus.');
