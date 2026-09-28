const fs=require('node:fs'),assert=require('node:assert/strict');
const css=fs.readFileSync('console.css','utf8'),js=fs.readFileSync('console.js','utf8');
const rule=css.match(/\.token-input-wrap input \{([^}]+)\}/)?.[1];
assert(rule,'token input rule');
assert(rule.includes('padding-right:52px'),'keep clear gap to the eye button');
assert(rule.includes('text-overflow:ellipsis')&&rule.includes('white-space:nowrap'),'overflowing token shows an ellipsis instead of a half-cut dot');
assert(js.includes('id="mainTokenInput" type="password"'),'still a real password field so the eye toggle keeps working');
console.log('PASS token field: long values ellipsis, eye toggle untouched, spacing kept');
