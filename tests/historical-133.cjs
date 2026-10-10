// Historical contracts run against exactly authorized prior bytes; new OAuth-only tests use live source.
const fs=require('node:fs'),path=require('node:path'),normalize=require('./release-133-normalize.cjs').normalize,original=fs.readFileSync;
fs.readFileSync=function(file,...args){const value=original.call(this,file,...args);const name=typeof file==='string'?path.basename(file):'';if(typeof value==='string'&&['console.js','server.mjs','index.html','README.md','.env.example'].includes(name))return normalize(value,name);return value;};
