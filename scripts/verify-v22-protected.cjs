#!/usr/bin/env node
/* V23 protected release gate.
 * The user explicitly approved replacing the homepage slider and filter
 * with the V23 recording-based preview. The live header/footer remain frozen.
 */
const {readFileSync}=require('node:fs');
const {execFileSync}=require('node:child_process');
const base=process.env.GITHUB_BASE_REF||'main';
let failures=0;
for(const p of [
 'apps/website/components/SiteHeader.tsx',
 'apps/website/components/SiteFooter.tsx',
 'apps/website/components/MarketChrome.tsx',
 'apps/website/app/site-navigation.css',
 'apps/website/app/icon-treatments.css'
]){
 const prior=execFileSync('git',['show','origin/'+base+':'+p],{encoding:'utf8'});
 const current=readFileSync(p,'utf8');
 if(prior!==current){console.error('PROTECTED HEADER/FOOTER CHANGED: '+p);failures++;}
 else console.log('PRESERVED UNCHANGED: '+p);
}
const home=readFileSync('apps/website/components/LandshopHome.tsx','utf8');
const style=readFileSync('apps/website/app/v23-video-preview.css','utf8');
const required=[
 'data-v23-design="cinematic-property-video-preview"',
 'data-landshop-hero="v16-separated-product-slides"',
 'className="glass-search ls-v23-property-filter"',
 '<SiteFooter/>',
 '<V22HomeSections featured={featured}/>',
 "['Buy','Sell','Rent','Shortlet']",
 'Your Property.',
 'Your Future.',
 'Invest in Knowledge.',
 'Incubate Possibility.',
 'A Clearer Path',
 'to Homeownership.',
 ...['query','state','city','area','type','min','max','bedrooms','bathrooms','minsize','availability','collection'].map(x=>'name="'+x+'"')
];
for(const marker of required){if(!home.includes(marker)){console.error('V23 preview element missing: '+marker);failures++;}}
for(const marker of ['.ls-v23-hero','.ls-v23-filter-holder','.ls-v23-form-grid','prefers-reduced-motion']){
 if(!style.includes(marker)){console.error('V23 style missing: '+marker);failures++;}
}
if(failures)process.exitCode=1;
else console.log('PASS: approved V23 interactive hero, twelve-field filter, existing sections and unchanged header/footer.');
