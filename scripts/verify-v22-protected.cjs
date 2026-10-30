#!/usr/bin/env node
/* V23 protected release gate.
 * User approved global V24 footer/newsletter replacement. Header and
 * V23 property slider/filter must stay byte-for-byte unchanged.
 */
const {readFileSync}=require('node:fs');
const {execFileSync}=require('node:child_process');
const base=process.env.GITHUB_BASE_REF||'main';
let failures=0;
for(const p of [
 'apps/website/components/SiteHeader.tsx',
 'apps/website/app/site-navigation.css',
 'apps/website/app/icon-treatments.css'
]){
 const prior=execFileSync('git',['show','origin/'+base+':'+p],{encoding:'utf8'});
 const current=readFileSync(p,'utf8');
 if(prior!==current){console.error('PROTECTED HEADER CHANGED: '+p);failures++;}
 else console.log('PRESERVED UNCHANGED: '+p);
}
const home=readFileSync('apps/website/components/LandshopHome.tsx','utf8');
const style=readFileSync('apps/website/app/v23-video-preview.css','utf8');
const required=[
 'data-v23-design="cinematic-property-video-preview"',
 'data-landshop-hero="v16-separated-product-slides"',
 'className="glass-search ls-v23-property-filter"',
 ' '<V22HomeSections featured={featured}/>',
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

const layout=readFileSync('apps/website/app/layout.tsx','utf8');
const foot=readFileSync('apps/website/components/SiteFooter.tsx','utf8');
const footerCss=readFileSync('apps/website/app/v24-global-footer.css','utf8');
const oldHome=execFileSync('git',['show','origin/'+base+':apps/website/components/LandshopHome.tsx'],{encoding:'utf8'});
const heroBlock=(src)=>src.slice(src.indexOf('<section className="hero hero-v16'),src.indexOf('<V22HomeSections featured={featured}/>')).trim();
if(heroBlock(oldHome)!==heroBlock(home)){console.error('The protected V23 homepage slider or property filter changed.');failures++}
if(!layout.includes('<SiteHeader/>{children}<SiteFooter/>')){console.error('Global SiteHeader/SiteFooter layout missing.');failures++}
for(const marker of ['<NewsletterSignup/>','<FooterCarousel slides={slidesFromSources()}/>','ls24-global-footer','/testimonials','Privacy Policy','Terms & Conditions']){
 if(!foot.includes(marker)){console.error('V24 footer content missing: '+marker);failures++}
}
for(const marker of ['.ls24-glass-area','.ls24-newsletter-glass','.ls24-footer-bottom','.ls24-carousel-shell',"landshop-footer-cris6882.svg"]){
 if(!footerCss.includes(marker)){console.error('V24 footer style missing: '+marker);failures++}
}
for(const source of ['apps/website/components/ContentShell.tsx','apps/website/components/MarketChrome.tsx','apps/website/components/LandshopHome.tsx']){
 const body=readFileSync(source,'utf8');
 if(body.includes('<SiteFooter/>')){console.error('Duplicate local SiteFooter render in '+source);failures++}
}

if(failures)process.exitCode=1;
else console.log('PASS: approved V23 hero/filter unchanged and V24 global footer installed with current header protected.');
