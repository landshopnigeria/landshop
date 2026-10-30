#!/usr/bin/env node
/* V26 protection gate.
 * Preserve V24 header/footer and V23 filter structure. Explicitly permit
 * the owner-requested Projects menu and three updated hero messages.
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
 const approvedHeader=(content)=>content
  .replace(/ \{label:'Projects',eyebrow:[\s\S]*?(?=\n \{label:'Careers',eyebrow:|\n \{label:'Company',eyebrow:)/, '')
  .replace(/ \{label:'Careers',eyebrow:[\s\S]*?(?=\n \{label:'Company',eyebrow:)/, '');
 const matches=p.endsWith('/SiteHeader.tsx')?approvedHeader(prior)===approvedHeader(current):prior===current;
 if(!matches){console.error('PROTECTED HEADER CHANGE OUTSIDE APPROVED PROJECTS MENU: '+p);failures++;}
 else console.log('PRESERVED: '+p);
}
const home=readFileSync('apps/website/components/LandshopHome.tsx','utf8');
const style=readFileSync('apps/website/app/v23-video-preview.css','utf8');
const required=[
 'data-v23-design="cinematic-property-video-preview"',
 'data-landshop-hero="v16-separated-product-slides"',
 'className="glass-search ls-v23-property-filter"',
 '<V22HomeSections featured={featured}/>',
 "['Buy','Sell','Rent','Shortlet']",
 'Everyone deserves affordable property.',
 'Plot Your Future. Save ₦5 million.',
 'Where would you own next?',
 'Explore Famous Gardens',
 'Book Inspection',
 'Speak With Consultant',
 ...['query','state','city','area','type','min','max','bedrooms','bathrooms','minsize','availability','collection'].map(x=>'name="'+x+'"')
];
for(const marker of required){if(!home.includes(marker)){console.error('V23 preview element missing: '+marker);failures++;}}
for(const marker of ['.ls-v23-hero','.ls-v23-filter-holder','.ls-v23-form-grid','prefers-reduced-motion']){
 if(!style.includes(marker)){console.error('V23 style missing: '+marker);failures++;}
}

const layout=readFileSync('apps/website/app/layout.tsx','utf8');
const foot=readFileSync('apps/website/components/SiteFooter.tsx','utf8');
const footerCss=readFileSync('apps/website/app/v24-global-footer.css','utf8');
// Approved copy changes are intentionally not byte-equal to the V23 hero.
// Filter names, carousel hooks, hero layout and the V22 sections remain protected above.
if((home.match(/subtitle:/g)||[]).length!==3){console.error('Homepage must retain exactly three approved slides.');failures++;}
if(!home.includes('<V22HomeSections featured={featured}/>')){console.error('Homepage content sections missing.');failures++;}
if(!layout.includes('<SiteHeader/>{children}<SiteFooter/>')){console.error('Global SiteHeader/SiteFooter layout missing.');failures++}
const priorFooter=execFileSync('git',['show','origin/'+base+':apps/website/components/SiteFooter.tsx'],{encoding:'utf8'});
if(foot!==priorFooter){console.error('Global footer must remain byte-for-byte identical to main.');failures++}
for(const p of ['apps/website/app/properties/[id]/page.tsx','apps/website/app/properties/[id]/property-details.css','apps/website/app/insights/[slug]/page.tsx']){
 const prior=execFileSync('git',['show','origin/'+base+':'+p],{encoding:'utf8'});
 const current=readFileSync(p,'utf8');
 if(prior!==current){console.error('PROTECTED PROPERTY/ARTICLE DETAIL CHANGED: '+p);failures++}
}
for(const marker of ['<NewsletterSignup/>','<FooterCarousel slides={slidesFromSources()}/>','ls24-global-footer','/testimonials','Privacy Policy','Terms &amp; Conditions']){
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
else console.log('PASS: approved Projects/Careers additions, protected global header/footer, property detail and article templates.');
