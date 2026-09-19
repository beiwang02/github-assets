const fs=require('node:fs'),assert=require('node:assert/strict');
const css=fs.readFileSync('ui-refresh.css','utf8'),base=fs.readFileSync('styles.css','utf8');
const rule='input:focus,input:focus-visible,select:focus,select:focus-visible,textarea:focus,textarea:focus-visible{outline:none!important;box-shadow:none!important;border-color:var(--primary)!important}';
assert(css.includes(rule));assert.match(base,/--primary:\s*#5965f2/);assert(!css.includes('border-color:#797080!important'));assert(!css.includes('border-color:#b4a7c8!important'));
assert(css.includes('.auth-card #mainTokenInput:focus,.auth-card #mainTokenInput:focus-visible{border:1px solid var(--primary)!important;outline:none!important;box-shadow:none!important}'));
assert(!/:where\(button[^}]+border-color:var\(--primary\)/s.test(css));
console.log('PASS form focus: input/select/textarea use #5965f2 via --primary in light/dark, no ring; buttons remain excluded');
