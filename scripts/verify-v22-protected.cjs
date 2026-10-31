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
  .replace(/ \{label:'Careers',eyebrow:[\s\S]*?(?=\n \{label:'Company',eyebrow:)/, '')
  .replace(/\n{2,}(?= \{label:'Company',eyebrow:)/g,'\n');
 const expectedV30Header=p.endsWith('/SiteHeader.tsx');
 const groupsOnly=(value)=>value.split('const groups:Group[]=[')[1]?.split("const portal='https://portal.landshopnigeria.com'")[0];
 const topLinksOnly=(value)=>value.split('const topLinks=[')[1]?.split(';')[0];
 const headerStructure=[
  'ls-utility-inner','ls-global-search','ls-glass-header','ls-brand','ls-primary-nav',
  'ls-header-group','ls-mega','ls-mobile-subnav','ls-start','ls-mobile-bottom'
 ];
 const approvedV30=expectedV30Header&&
  groupsOnly(prior)===groupsOnly(current)&&groupsOnly(current)?.length>1000&&
  topLinksOnly(prior)===topLinksOnly(current)&&topLinksOnly(current)?.length>70&&
  headerStructure.every(marker=>current.includes(marker))&&
  ['ls30-services-grid','ls30-hamburger','openHover','onMouseEnter','ls30-mega-folding'].every(marker=>current.includes(marker))&&
  (current.includes('ls-utility-collapsed')||
   ['ls31-over-hero','ls31-nav-visible','ls31-nav-hidden','setNavVisible'].every(marker=>current.includes(marker)));
 const matches=expectedV30Header?(approvedHeader(prior)===approvedHeader(current)||approvedV30):prior===current;
 if(!matches){console.error('PROTECTED HEADER CHANGE OUTSIDE APPROVED GROUPS / V30 MOTION: '+p);failures++;}
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
const v30Style=readFileSync('apps/website/app/v30-header-motion-and-type.css','utf8');
for(const marker of ['.ls-utility-collapsed','.ls30-services-grid','.ls30-hamburger','ls30-unfold','ls30-fold','font-size:23px','prefers-reduced-motion']){
 if(!v30Style.includes(marker)){console.error('V30 protected site presentation marker missing: '+marker);failures++}
}
// V31 must keep the first navigation layer over the actual hero photograph,
// keep the slim utility bar visible, and use 28px for all public content titles.
const newHeader=readFileSync('apps/website/components/SiteHeader.tsx','utf8');
const v31=readFileSync('apps/website/app/v31-hero-overlay-scroll.css','utf8');
for(const marker of ['ls31-over-hero','ls31-nav-hidden','ls31-nav-visible','setNavVisible','window.requestAnimationFrame']){
 if(!newHeader.includes(marker)){console.error('V31 header behavior missing: '+marker);failures++}
}
for(const marker of ['position:absolute!important','top:100%!important','ls-utility-bar','ls31-nav-hidden','.ls-v23-hero .ls-v23-hero-inner','font-size:28px','prefers-reduced-motion']){
 if(!v31.includes(marker)){console.error('V31 hero/header overlay style missing: '+marker);failures++}
}
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
const chromeLayout=/<SiteHeader\/>\{children\}(?:<GlobalArticleCarousel\/>)?<SiteFooter\/>/;
if(!chromeLayout.test(layout)){console.error('Global SiteHeader/SiteFooter order missing or modified.');failures++}
if(layout.includes('<GlobalArticleCarousel/>')&&!layout.includes("import GlobalArticleCarousel from '../components/GlobalArticleCarousel';")){console.error('Global article carousel import missing.');failures++}
const priorFooter=execFileSync('git',['show','origin/'+base+':apps/website/components/SiteFooter.tsx'],{encoding:'utf8'});
if(foot!==priorFooter){console.error('Global footer must remain byte-for-byte identical to main.');failures++}
for(const p of ['apps/website/app/properties/[id]/page.tsx','apps/website/app/properties/[id]/property-details.css','apps/website/app/insights/[slug]/page.tsx']){
 const prior=execFileSync('git',['show','origin/'+base+':'+p],{encoding:'utf8'});
 const current=readFileSync(p,'utf8');
 const approvedArrowOnly=p.endsWith('/insights/[slug]/page.tsx')&&prior.replaceAll('↗','→')===current;
 if(prior!==current&&!approvedArrowOnly){console.error('PROTECTED PROPERTY/ARTICLE DETAIL CHANGED: '+p);failures++}
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
