#!/usr/bin/env node
/* Verifies protected production chrome and marketplace search have not changed. */
const {readFileSync}=require('node:fs');
const {execFileSync}=require('node:child_process');
const base=process.env.GITHUB_BASE_REF||'main';
const path='apps/website/components/LandshopHome.tsx';
const previous=execFileSync('git',['show','origin/'+base+':'+path],{encoding:'utf8'});
const current=readFileSync(path,'utf8');
function exactBlock(text,startMark,endMark){const a=text.indexOf(startMark);if(a===-1)throw Error('Missing protected block: '+startMark);const b=text.indexOf(endMark,a);if(b===-1)throw Error('Missing protected closing: '+endMark);return text.slice(a,b+endMark.length);}
for(const [name,start,end] of [
 ['Hero slider','<section className="hero hero-v16"','</section>'],
 ['Property search','<form className="glass-search"','</form>']
]){
 if(exactBlock(previous,start,end)!==exactBlock(current,start,end)){console.error(name+' source was changed. V22 requires explicit approval before editing.');process.exitCode=1;}
 else console.log('PROTECTED: '+name+' is byte-for-byte unchanged.');
}
for(const protectedFile of ['apps/website/components/SiteHeader.tsx','apps/website/app/site-navigation.css','apps/website/app/icon-treatments.css']){
 const a=execFileSync('git',['show','origin/'+base+':'+protectedFile],{encoding:'utf8'});
 const b=readFileSync(protectedFile,'utf8');
 if(a!==b){console.error('Protected header/interface file changed: '+protectedFile);process.exitCode=1;}
 else console.log('PROTECTED: '+protectedFile);
}
