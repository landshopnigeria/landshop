import {chromium} from 'playwright';
const root=process.env.LANDSHOP_TEST_URL||'http://127.0.0.1:3000';
const routes=['/','/about','/products','/properties','/projects','/collections/prime','/insights'];
const widths=[240,280,320,375,768,1440,3840];
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
try{
 const context=await browser.newContext({locale:'en-NG',reducedMotion:'reduce',deviceScaleFactor:1});
 const page=await context.newPage();
 for(const path of routes){
  for(const width of widths){
   const height=width<600?760:width<1100?1000:1100;
   await page.setViewportSize({width,height});
   let response;
   try{response=await page.goto(root+path,{waitUntil:'domcontentloaded',timeout:30000});}
   catch(error){errors.push(path+' @'+width+': navigation failed '+String(error));continue;}
   if(response?.status()!==200){errors.push(path+' @'+width+': HTTP '+response?.status());continue;}
   const result=await page.evaluate(()=>{
    const doc=document.documentElement;
    return {viewport:window.innerWidth,
      documentWidth:doc.scrollWidth,
      bodyWidth:document.body.scrollWidth,
      hasH1:Boolean(document.querySelector('h1')),
      hasTitle:Boolean(document.title?.trim()),
      hasDescription:Boolean(document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim()),
      linksWithoutLabels:[...document.querySelectorAll('a')].filter(a=>!((a.textContent||'').trim()||a.getAttribute('aria-label')||a.querySelector('img[alt]'))).length
    };
   });
   if(Math.max(result.documentWidth,result.bodyWidth)>width+3){
    const overflow=await page.evaluate(()=>{
      const width=window.innerWidth;
      return [...document.querySelectorAll('body *')].map(element=>{
       const r=element.getBoundingClientRect();
       return {tag:element.tagName.toLowerCase(),className:typeof element.className==='string'?element.className.slice(0,125):'',
         left:Math.round(r.left),right:Math.round(r.right),scrollWidth:element.scrollWidth,clientWidth:element.clientWidth};
      }).filter(x=>x.right>width+3 && x.left<width && x.right-x.left>0).sort((a,b)=>b.right-a.right).slice(0,12);
    });
    console.error('OVERFLOW ELEMENTS',path,width,JSON.stringify(overflow));
    errors.push(path+' @'+width+': horizontal page overflow '+Math.max(result.documentWidth,result.bodyWidth)+'px');
   }
   if(!result.hasH1||!result.hasTitle||!result.hasDescription)
    errors.push(path+' @'+width+': missing essential heading/title/description');
   console.log('CHECK',path,width,JSON.stringify(result));
  }
 }
 for(const path of ['/robots.txt','/sitemap.xml','/llms.txt']){
  const response=await page.request.get(root+path);
  if(response.status()!==200)errors.push(path+': expected 200, received '+response.status());
 }
 const homepage=await page.request.get(root+'/');
 const home=await homepage.text();
 if(!home.includes('application/ld+json')||!home.includes('schema.org'))
  errors.push('Homepage organization/website structured data missing');
 const search=await page.request.get(root+'/search?q=estate');
 const html=await search.text();
 if(!/noindex/i.test(html))errors.push('Internal search results must be noindex');
 const contact=await page.request.get(root+'/api/contact');
 if((contact.headers()['x-content-type-options']||'')!=='nosniff')errors.push('Security nosniff header missing');
 if(!(homepage.headers()['strict-transport-security']||'').includes('max-age='))errors.push('HSTS header missing');
 // Interactive proof that the glass header is on the hero image, not above it,
 // and slides out/in on both desktop and touch-sized screens.
 const motionContext=await browser.newContext({locale:'en-NG',reducedMotion:'no-preference'});
 try{
  const motionPage=await motionContext.newPage();
  for(const width of [375,1440]){
   await motionPage.setViewportSize({width,height:width<600?760:920});
   await motionPage.goto(root+'/',{waitUntil:'domcontentloaded',timeout:30000});
   await motionPage.waitForTimeout(650);
   const layout=await motionPage.evaluate(()=>{
    const utility=document.querySelector('.ls-utility-bar')?.getBoundingClientRect();
    const nav=document.querySelector('.ls-glass-header')?.getBoundingClientRect();
    const hero=document.querySelector('.ls-v23-hero')?.getBoundingClientRect();
    const headline=document.querySelector('.ls-v23-hero-title');
    return {utilityBottom:utility?.bottom??-1,navTop:nav?.top??-1,
      navBottom:nav?.bottom??-1,heroTop:hero?.top??-1,
      heroBottom:hero?.bottom??-1,headlineTop:headline?.getBoundingClientRect().top??-1,
      titleSize:headline?getComputedStyle(headline).fontSize:'none'};
   });
   if(Math.abs(layout.heroTop-layout.utilityBottom)>8||
      layout.navTop<layout.heroTop-5||layout.navTop>layout.heroTop+25||
      layout.navBottom>=layout.heroBottom||
      layout.headlineTop<layout.navBottom+15)
    errors.push('V31 overlay '+width+'px: header must be on hero with separate headline: '+JSON.stringify(layout));
   if(layout.titleSize!=='33px')
    errors.push('V32 hero title at '+width+'px must be 33px, got '+layout.titleSize);
   const heroPresentation=await motionPage.evaluate(()=>{
    const heading=document.querySelector('.ls-v23-hero-title');
    const outer=heading?.getBoundingClientRect();
    const first=heading?.querySelector('span');
    const second=heading?.querySelector('strong');
    const utility=document.querySelector('.ls-utility-links');
    const adminLink=document.querySelector('.ls-site-chrome a[href="https://app.landshopnigeria.com/admin"]');
    return {
     width:outer?.width??0,
     firstDisplay:first?getComputedStyle(first).display:'none',
     secondDisplay:second?getComputedStyle(second).display:'none',
     publicCommandCenter:Boolean(adminLink)||Boolean(utility?.textContent?.includes('Command Center'))
    };
   });
   if(heroPresentation.firstDisplay!=='inline'||heroPresentation.secondDisplay!=='inline')
    errors.push('V32 hero headline must wrap naturally instead of forced breaks: '+JSON.stringify(heroPresentation));
   if(width>700&&heroPresentation.width<650)
    errors.push('V32 desktop hero headline did not gain sufficient width: '+JSON.stringify(heroPresentation));
   if(heroPresentation.publicCommandCenter)
    errors.push('V32 Command Center must not appear in public header');
   await motionPage.evaluate(()=>window.scrollTo({top:800,behavior:'instant'}));
   try{await motionPage.waitForFunction(()=>document.querySelector('.ls-site-chrome')?.classList.contains('ls31-nav-hidden'),null,{timeout:3500})}
   catch{errors.push('V31 main header did not hide on downward scroll @'+width+'px')}
   const topAfterDown=await motionPage.evaluate(()=>{
    const el=document.querySelector('.ls-utility-bar');
    return el?{visible:getComputedStyle(el).visibility,top:el.getBoundingClientRect().top}:null;
   });
   if(!topAfterDown||topAfterDown.visible!=='visible'||Math.abs(topAfterDown.top)>3)
    errors.push('V31 top utility bar should remain visible @'+width+'px: '+JSON.stringify(topAfterDown));
   await motionPage.evaluate(()=>window.scrollTo({top:260,behavior:'instant'}));
   try{await motionPage.waitForFunction(()=>document.querySelector('.ls-site-chrome')?.classList.contains('ls31-nav-visible'),null,{timeout:3500})}
   catch{const diagnostics=await motionPage.evaluate(()=>({scrollY:window.scrollY,scrollHeight:document.documentElement.scrollHeight,nav:document.querySelector('.ls-site-chrome')?.className}));errors.push('V31 main header did not return on upward scroll @'+width+'px: '+JSON.stringify(diagnostics))}
   console.log('V31 HEADER/MOTION CHECK',width,JSON.stringify(layout));
  }
  await motionPage.goto(root+'/insights/property-due-diligence',{waitUntil:'domcontentloaded',timeout:30000});
  const articleColors=await motionPage.evaluate(()=>{
   const bodyHeading=document.querySelector('.v22-article-body section h2');
   const sidebarHeading=document.querySelector('.v22-article-sidebar h3');
   return {body:bodyHeading?getComputedStyle(bodyHeading).color:'missing',
    sidebar:sidebarHeading?getComputedStyle(sidebarHeading).color:'missing'};
  });
  if(articleColors.body!=='rgb(43, 164, 122)'||articleColors.sidebar!=='rgb(43, 164, 122)')
   errors.push('V32 article detail headings should use official primary green: '+JSON.stringify(articleColors));
  console.log('V32 ARTICLE HEADING CHECK',JSON.stringify(articleColors));
  // V33 interactive regression: hovering over a carousel freezes its slide,
  // leaving it resumes timer-based advancement without clicking controls.
  await motionPage.goto(root+'/',{waitUntil:'domcontentloaded',timeout:30000});
  await motionPage.waitForSelector('.v22-quote blockquote');
  await motionPage.hover('.v22-quote');
  await motionPage.waitForTimeout(650);
  const quoteBefore=await motionPage.locator('.v22-quote blockquote').textContent();
  await motionPage.waitForTimeout(7600);
  const quoteWhileHovered=await motionPage.locator('.v22-quote blockquote').textContent();
  if(quoteBefore!==quoteWhileHovered)
   errors.push('V33 testimonial carousel advanced while mouse was hovering');
  await motionPage.mouse.move(0,0);
  try{
   await motionPage.waitForFunction(before=>document.querySelector('.v22-quote blockquote')?.textContent!==before,quoteBefore,{timeout:10000});
  }catch{
   errors.push('V33 testimonial carousel did not resume automatic advance after mouse exit');
  }
  console.log('V33 CAROUSEL HOVER/RESUME CHECK',JSON.stringify({frozen:quoteBefore===quoteWhileHovered}));
  await motionPage.close();
 }finally{await motionContext.close()}
 console.log('READINESS RESULT:',errors.length?'FAIL':'PASS',errors.length,'errors');
 if(errors.length){for(const e of errors)console.error('ERROR',e);process.exitCode=1;}
 await context.close();
}finally{await browser.close()}
