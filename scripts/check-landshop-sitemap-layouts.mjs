import {chromium} from 'playwright';
const root=process.env.LANDSHOP_TEST_URL||'http://127.0.0.1:3000';
const xml=await fetch(root+'/sitemap.xml').then(r=>{if(!r.ok)throw Error('Sitemap HTTP '+r.status);return r.text()});
const routes=[...new Set([...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>new URL(m[1].replaceAll('&amp;','&')).pathname))];
if(routes.length<60)throw Error('Incomplete public sitemap: '+routes.length);
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const failures=[];let checks=0;
try{
 const context=await browser.newContext({reducedMotion:'reduce'});
 // Public reads only. Never submit forms or access customer records.
 const page=await context.newPage();
 for(const path of routes){
  const response=await page.goto(root+path,{waitUntil:'domcontentloaded',timeout:30000});
  if(response?.status()!==200){failures.push(path+': HTTP '+response?.status());continue;}
  for(const width of [375,768,1440]){
   await page.setViewportSize({width,height:900});
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const result=await page.evaluate(()=>({
    overflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)>innerWidth+3,
    heading:!!document.querySelector('h1'),title:!!document.title.trim(),
    description:!!document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim(),
    canonical:document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    overflowElements:[...document.querySelectorAll('body *')].filter(el=>{const r=el.getBoundingClientRect();return r.right>innerWidth+3&&r.left<innerWidth&&r.width>0}).slice(0,10).map(el=>({tag:el.tagName,class:typeof el.className==='string'?el.className:'',width:Math.round(el.getBoundingClientRect().width),scroll:el.scrollWidth})),
    noindex:document.querySelector('meta[name="robots"]')?.getAttribute('content')?.includes('noindex')
   }));
   if(result.overflow||!result.heading||!result.title||!result.description||!result.canonical||result.noindex)failures.push(path+' @'+width+': '+JSON.stringify(result));
   checks++;
  }
 }
 console.log(JSON.stringify({routes:routes.length,checks,failures},null,2));
 if(failures.length)process.exitCode=1;
}finally{await browser.close();}
