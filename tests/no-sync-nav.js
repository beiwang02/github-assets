// Former sidebar/activity coverage uses the exact current template and flat navigation audit.
window.auditNoSyncNavC=async(dark)=>{
 if(!window.auditFlatNavigationC){await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='tests/flat-navigation.js';s.onload=resolve;s.onerror=reject;document.head.append(s);});}
 return await auditFlatNavigationC(dark);
};
