const fs=require('node:fs'),assert=require('node:assert/strict');
const js=fs.readFileSync('console.js','utf8'),css=fs.readFileSync('ui-refresh.css','utf8');
/* All three native upload selects became site-styled field menus with a hidden select kept. */
assert(!/<select name="group"/.test(js),'upload group uses field menu, not a visible select');
assert(!/<select name="library"/.test(js),'library selects use field menu, not visible selects');
assert(js.includes("fieldMenuC({name:'group',id:'uploadGroup'"),'upload group field menu present');
assert(js.includes("fieldMenuC({name:'library'"),'upload library field menu present');
assert(js.includes("fieldMenuC({name:'library',value:S.libraries[0]?.file||''"),'bulk library field menu present');
/* The native select is kept in the form (name + required) so submission/validation is unchanged. */
assert(js.includes('class="field-menu-native" tabindex="-1" aria-hidden="true"'),'hidden select marked field-menu-native');
assert(js.includes("<select name=\"${name}\""),'hidden select keeps name');
assert(js.includes("${required?'required':''}"),'required preserved on hidden select');
/* Sync handler resolves the owner by menu name (menu is portaled to body). */
assert(js.includes("document.querySelector(`[data-field-menu=\"${CSS.escape(target.dataset.menuName)}\"]`)"),'choose resolves owner by name after portal');
assert(js.includes('native.dispatchEvent(new Event(\'change\',{bubbles:true}))'),'change dispatched for draft capture');
assert(js.includes('syncFieldMenuC(owner,'),'trigger text syncs via owner');
assert(js.includes('document.querySelectorAll(`.sort-option[data-menu-name="${CSS.escape(name)}"]`)'),'checkmark sync queries portaled options globally');
assert(js.includes('menu.style.minWidth=`${Math.round(target.getBoundingClientRect().width)}px`'),'menu min-width equals trigger width');
assert(js.includes('class="sort-menu field-menu-popup"'),'menu carries dedicated popup class');
assert(css.includes('.field-menu-popup.floating-menu{width:max-content}'),'popup width content-driven');
/* Visual reuse: field menu reuses sort-control classes, native select hidden. */
assert(css.includes('.field-menu { width:100%; text-align:left; }'));
assert(css.includes('.field-menu-native { position:absolute; width:1px; height:1px; opacity:0; pointer-events:none;'));
/* Large image tap: prevent default + blur to avoid iOS focus ring flash. */
assert(js.includes("if(action==='asset-open'){e.preventDefault();e.stopImmediatePropagation();const item=S.assets.find(x=>x.id===target.dataset.id);if(item){target.blur();assetModal(item);}return;}"),'asset-open prevents default and blurs');
/* Activity times: real timestamp + relative rendering. */
assert(js.includes('time:Date.now()'),'readRepo records a real timestamp');
assert(js.includes('relativeTimeC(a.time)'),'activityView renders relative time');
assert(js.includes("if(diff<60_000)return '刚刚'"));
console.log('PASS field menus: 3 upload selects converted, hidden select kept for submit, portal-safe sync, asset-open no flash, relative activity time');
