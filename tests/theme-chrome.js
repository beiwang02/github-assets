/* Local fixture only; no auth/logout/API writes. Tests the real theme functions. */
window.auditThemeChrome=async()=>{
 await fixtureReady;const failures=[],evidence=[],mm=window.matchMedia;
 const check=(ok,label,data)=>{if(!ok)failures.push({label,data});};
 const sample=()=>({mode:localStorage.getItem('gh-image-theme'),meta:document.querySelector('meta[name="theme-color"]').content,scheme:getComputedStyle(document.documentElement).colorScheme,root:getComputedStyle(document.documentElement).backgroundColor,body:getComputedStyle(document.body).backgroundColor,dark:document.body.classList.contains('dark')});
 function verify(dark,label){const s=sample();evidence.push({label,...s});check(s.meta===(dark?'#0b1629':'#f6f8fc')&&s.scheme===(dark?'dark':'light')&&s.root===s.body&&s.dark===dark,label,s);}
 for(const auth of [null,{login:'fixture-user'}])for(const mode of ['light','dark']){S.auth=auth;localStorage.setItem('gh-image-theme',mode);renderC();verify(mode==='dark',`${auth?'inside':'login'} restored ${mode}`);cycleAppearance();verify(mode==='light'?true:mm('(prefers-color-scheme: dark)').matches,'cycle '+mode);}
 for(const dark of [false,true]){window.matchMedia=q=>q==='(prefers-color-scheme: dark)'?{matches:dark,addEventListener(){}}:mm(q);localStorage.setItem('gh-image-theme','system');applyAppearance();verify(dark,'system '+dark);}
 window.matchMedia=mm;S.auth={login:'fixture-user'};localStorage.setItem('gh-image-theme','light');renderC();return {pass:!failures.length,failures,evidence};
};
