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
 console.log('READINESS RESULT:',errors.length?'FAIL':'PASS',errors.length,'errors');
 if(errors.length){for(const e of errors)console.error('ERROR',e);process.exitCode=1;}
 await context.close();
}finally{await browser.close()}
