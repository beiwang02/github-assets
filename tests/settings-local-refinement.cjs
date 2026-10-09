const fs=require('node:fs'),{createHash}=require('node:crypto'),assert=require('node:assert/strict');
// Frozen SHA-256 from 7c65fc7; works in an isolated release without .git.
const hash=s=>createHash('sha256').update(s).digest('hex');
const current=require('./release-127-normalize.cjs').normalize(fs.readFileSync('ui-refresh.css','utf8'),'ui-refresh.css');
const old='font-size:clamp(.75rem, .6875rem + .25vw, .8125rem)';
const next='font-size:clamp(.71875rem, .65625rem + .25vw, .75rem)';
assert.equal(current.split(next).length-1,5);
assert.equal(hash(current.replaceAll(next,old)),'312e2786756f3de370edd888e98c34ecdeb7470a2ceaf8f5180319b442b81a8c','Only five font-size values changed from 7c65fc7');
const frozen={
 'styles.css':'be537ffeed0635381cd672f526daae11145dc6f06183a98c530b230928915928',
 'console.css':'bd3b8d5cbf04a172967c405923218057fd2ffbb338d156e242dd7036c6a97a8c',
 'responsive.css':'492cfc4fe2a8422fb0462a18f2d5e1777335d9e740930165ba83f303ec7e939a',
 'console.js':'0e2692eecb27a499e467d133b086c39fc8fa27696c1ad522f1b4dd3b49d79ccc',
 'popup.js':'c418c860001c5cfedd3e9e059f43f8bd10660f2430f3f1aab1168957c1a97840',
 'github.js':'2e7f665303dc90ed0b8e3104fbd454c0cb13eba8f6f831c2d3c692a73ad7215d'
};
for(const [f,expected] of Object.entries(frozen))assert.equal(hash(require('./release-127-normalize.cjs').normalize(fs.readFileSync(f,'utf8'),f)),expected,f+' unchanged');
const html=require('./release-127-normalize.cjs').normalize(fs.readFileSync('index.html','utf8'),'index.html');
assert.equal(html.split('clean-ui-release-126').length-1,4);
assert.equal(hash(html.replaceAll('clean-ui-release-126','clean-ui-release-125')),'57781b31d674b377196f239fd1cde3eb6b8f27e8c56cd256397284cf4a07ab95','Only four cache markers changed');
const clamp=(root,w)=>Math.max(.71875*root,Math.min(.75*root,.65625*root+.25*w/100));
for(const w of [320,390,1440]) {
 assert.equal(clamp(16,w),w===1440?12:11.5);
 assert(clamp(24,w)>clamp(16,w));assert(clamp(32,w)>clamp(24,w));
 assert(clamp(16,w)<Math.max(.8125*16,Math.min(.875*16,.75*16+.25*w/100)));
}
console.log('PASS settings local refinement: exactly five font-size-only changes against 7c65fc7; modal/global/geometry/zoom untouched; 320/390/1440 and 150%/200% root hierarchy');
