const fs=require('node:fs'),assert=require('node:assert/strict');
const css=fs.readFileSync('ui-refresh.css','utf8'),base=fs.readFileSync('styles.css','utf8'),consoleCss=fs.readFileSync('console.css','utf8');
const rule='input:focus,input:focus-visible,select:focus,select:focus-visible,textarea:focus,textarea:focus-visible{outline:none!important;box-shadow:none!important;border-color:var(--ui-line-focus)!important}';
assert(css.includes(rule));assert.match(css,/--ui-line-focus:#cfd5fd/);assert.match(base,/--primary:\s*#5965f2/);assert(!css.includes('border-color:#797080!important'));assert(!css.includes('border-color:#b4a7c8!important'));
assert(css.includes('.auth-card #mainTokenInput:focus,.auth-card #mainTokenInput:focus-visible{border:1px solid var(--ui-line-focus)!important;outline:none!important;box-shadow:none!important}'));
assert(!/:where\(button[^}]+border-color:var\(--primary\)/s.test(css));
/* Focus/press outlines stay pale: no dark grey or saturated theme blue rings anywhere. */
assert(!css.includes('#85808c'), 'dark grey focus outline must not return');
assert(consoleCss.includes('):focus-visible { outline:2px solid var(--ui-line-focus);'), 'button focus outline must use the pale line colour');
assert(!consoleCss.includes("color-mix(in srgb,var(--primary) 62%,transparent)"), 'saturated focus outline must not return');
console.log('PASS form focus: input/select/textarea and button focus use the pale --ui-line-focus border, no ring; buttons remain excluded');
