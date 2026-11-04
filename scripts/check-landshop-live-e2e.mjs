/**
 * Read-only production browser E2E across website, customer portal and staff app.
 * Never creates accounts, sends email, changes production records, or submits money.
 * Authenticated tests run only with explicitly provisioned dedicated test credentials.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {chromium,request as playwrightRequest} from 'playwright';

const origins={
 website:'https://www.landshopnigeria.com',
 bare:'https://landshopnigeria.com',
 portal:'https://portal.landshopnigeria.com',
 app:'https://app.landshopnigeria.com'
};
const failures=[],passed=[],skipped=[];
const expected=process.env.LANDSHOP_E2E_RELEASE_SHA||'';
const add=(name,err)=>{if(err){failures.push({name,error:String(err.message||err).slice(0,480)});console.error('E2E FAIL',name,String(err.message||err).slice(0,480));}else{passed.push(name);console.log('E2E PASS',name)}};
async function step(name,fn){try{await fn();add(name)}catch(err){add(name,err)}}
const network=await playwrightRequest.newContext({timeout:26000,ignoreHTTPSErrors:false});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({locale:'en-NG',reducedMotion:'reduce',viewport:{width:1366,height:900},serviceWorkers:'block'});
 const page=await context.newPage();
 const navigate=async(url)=>{
  const r=await page.goto(url,{waitUntil:'domcontentloaded',timeout:36000});
  assert.equal(r?.status(),200,'Unexpected status for '+url);
  await page.locator('body').waitFor({state:'visible',timeout:15000});
 };
 const waitForHydration=async(selector)=>{
  await page.waitForFunction(sel=>{
   const element=document.querySelector(sel);
   return !!element&&Object.keys(element).some(k=>k.startsWith('__reactProps'));
  },selector,{timeout:18000});
 };
 const logos={};
 for(const [site,origin] of Object.entries(origins)){
  await step('Live '+site+' health and published release',async()=>{
   const response=await network.get(origin+'/api/release-health');
   assert.equal(response.status(),200,'Health endpoint failed at '+origin);
   const body=await response.json();
   assert.ok(body&&typeof body==='object','Invalid health response');
   const json=JSON.stringify(body);
   if(expected)assert.ok(json.includes(expected.slice(0,12)),site+' does not match release '+expected.slice(0,12));
  });
  await step('Live '+site+' exact transparent corporate logo',async()=>{
   const r=await network.get(origin+'/media/logo-transparent.png');
   assert.equal(r.status(),200);
   assert.match(r.headers()['content-type']||'',/image\/png/);
   const bytes=await r.body();
   assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a','Not a PNG');
   assert.equal(bytes.readUInt8(25),6,'Logo PNG must use true-colour RGBA');
   assert.ok(bytes.length>10000,'Unexpectedly small logo');
   logos[site]=createHash('sha256').update(bytes).digest('hex');
  });
 }
 await step('Identical live logo across all four domains',async()=>{
  assert.equal(new Set(Object.values(logos)).size,1,'Brand artwork differs across domains');
 });
 await step('Public client navigation completes across main pages',async()=>{
  await navigate(origins.website+'/');
  await waitForHydration('.ls-primary-nav a[href="/properties"]');
  for(const [name,path] of [['Properties','/properties'],['Insights','/insights'],['Contact','/contact']]){
   const started=Date.now();
   await page.getByRole('navigation',{name:'Site navigation'}).getByRole('link',{name,exact:true}).click();
   await page.waitForURL(origins.website+path,{timeout:15000});
   await page.locator('main h1').waitFor({state:'visible',timeout:10000});
   console.log('E2E NAVIGATION',path,Date.now()-started+'ms');
  }
 });
 await step('Customer portal sign-in and home-link rendering',async()=>{
  await navigate(origins.portal+'/');
  await page.getByRole('tab',{name:'Sign In'}).waitFor({state:'visible'});
  await waitForHydration('button[role="tab"]');
  assert.match(await page.locator('h1').first().innerText(),/Welcome\s+Back/i);
  const home=page.locator('a.authBrand');
  assert.equal(new URL(await home.getAttribute('href')).origin,origins.website);
  assert.ok((await home.locator('img').getAttribute('src')).includes('logo-transparent.png'));
  assert.ok(await page.getByRole('textbox',{name:'Email address'}).isVisible());
 });
 await step('Customer registration steps, field validation and back navigation (without signup)',async()=>{
  await page.getByRole('tab',{name:'Sign Up'}).click();
  await page.waitForFunction(()=>document.querySelector('h1')?.textContent?.includes('Create Your'),undefined,{timeout:7000});
  assert.match(await page.locator('.authProgress').innerText(),/Step 1 of 2/);
  await page.getByRole('button',{name:/Next/i}).click();
  assert.match(await page.locator('.authProgress').innerText(),/Step 1 of 2/,'Empty signup must stay on first step');
  await page.getByLabel('First name').fill('Landshop');
  await page.getByLabel('Last name').fill('Readiness');
  await page.getByLabel('Email address').fill('readiness@example.invalid');
  await page.getByLabel('WhatsApp / phone').fill('+234 801 234 5678');
  await page.getByRole('button',{name:/Next/i}).click();
  await page.getByLabel('Username').waitFor({state:'visible'});
  assert.match(await page.locator('.authProgress').innerText(),/Step 2 of 2/);
  await page.getByRole('button',{name:/Previous step/i}).click();
  assert.match(await page.locator('.authProgress').innerText(),/Step 1 of 2/);
  await page.getByRole('tab',{name:'Sign In'}).click();
  assert.match(await page.locator('h1').first().innerText(),/Welcome\s+Back/i);
 });
 await step('Customer recovery and support routes',async()=>{
  const paths=['/reset-password','/support'];
  for(const path of paths){
   await navigate(origins.portal+path);
   assert.ok((await page.locator('body').innerText()).trim().length>90,'Empty page '+path);
  }
 });
 await step('Staff sign-in and sign-up controls',async()=>{
  await navigate(origins.app+'/staff/sign-in');
  assert.match(await page.locator('h1').first().innerText(),/Welcome\s+back/i);
  assert.ok(await page.locator('#staff-login-email').isVisible());
  await page.locator('a[href="/staff/sign-up"]').first().click();
  await page.locator('#su-role').waitFor({state:'visible'});
  await waitForHydration('#su-role');
  const home=page.locator('a[aria-label="Landshop homepage"]').first();
  assert.equal(new URL(await home.getAttribute('href')).origin,origins.website);
  await page.locator('#su-role').selectOption('owner');
  assert.equal(await page.locator('#su-role').inputValue(),'owner');
  await page.waitForFunction(()=>document.querySelector('h1')?.textContent?.includes('Landshop Owner'),undefined,{timeout:7000});
 });
 await step('Staff owner deep-link preselection never bypasses sign-up',async()=>{
  await navigate(origins.app+'/staff/sign-up?role=owner');
  await page.waitForFunction(()=>document.querySelector('#su-role')?.value==='owner',{timeout:10000});
  assert.ok(await page.locator('#su-terms').isVisible());
  assert.ok(await page.locator('input[type="password"]').count()>=1);
 });
 await step('Anonymous Command Center routes do not expose private UI',async()=>{
  for(const path of ['/admin','/admin/users','/admin/audit','/admin/communications']){
   const r=await network.get(origins.app+path,{maxRedirects:0});
   assert.ok([302,303,307,308,401,403].includes(r.status()),path+': anonymous request got '+r.status());
   if(r.status()>=300&&r.status()<400){
    const dest=r.headers()['location']||'';
    assert.ok(dest.includes('/staff/sign-in'),path+': wrong sign-in redirect: '+dest);
    assert.ok(!/evil\.|javascript:|data:/i.test(dest),path+': unsafe redirect');
   }
  }
 });
 await step('Portal auth callback without token safely fails',async()=>{
  const r=await network.get(origins.portal+'/auth/callback',{maxRedirects:0});
  assert.ok([302,303,307,308].includes(r.status()),'Callback without token must redirect safely');
  const where=new URL(r.headers()['location'],origins.portal);
  assert.equal(where.origin,origins.portal);
  assert.equal(where.pathname,'/');
  assert.equal(where.searchParams.get('error'),'missing_code');
  assert.match(r.headers()['cache-control']||'',/no-store/);
 });
 await step('Staff callback without token does not grant access',async()=>{
  const r=await network.get(origins.app+'/auth/callback',{maxRedirects:0});
  assert.ok([302,303,307,308,400].includes(r.status()),'Missing staff callback token: '+r.status());
  if(r.status()<400){
   const destination=new URL(r.headers()['location'],origins.app);
   assert.equal(destination.origin,origins.app);
   assert.ok(!destination.pathname.startsWith('/admin'));
  }
 });
 await step('Auth email endpoint rejects cross-origin requests without sending email',async()=>{
  const r=await network.post(origins.portal+'/api/auth/email-action',{
   headers:{'Origin':'https://invalid-test-origin.example.invalid','Content-Type':'application/json'},
   data:'{}'
  });
  assert.equal(r.status(),403,'Public auth email endpoint must reject foreign Origin');
 });
 await step('Public home, about, properties and inquiry are browser-accessible',async()=>{
  for(const path of ['/','/about','/properties','/contact']){
   await navigate(origins.website+path);
   assert.ok((await page.locator('h1').count())>0,'Missing heading '+path);
   assert.ok((await page.title()).trim().length>7,'Missing document title '+path);
  }
 });
 await step('Corporate website header logo links home',async()=>{
  await navigate(origins.website+'/about');
  const home=page.locator('a.ls-brand').first();
  assert.equal(await home.getAttribute('href'),'/');
  assert.ok((await home.locator('img').getAttribute('src')).includes('logo-transparent.png'));
 });
 await step('Critical pages do not overflow on phone, tablet and desktop',async()=>{
  for(const [site,path] of [['website','/about'],['portal','/'],['app','/staff/sign-in']]){
   for(const width of [375,768,1440]){
    await page.setViewportSize({width,height:900});
    await navigate(origins[site]+path);
    const measured=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:window.innerWidth}));
    assert.ok(measured.scroll<=measured.viewport+4,site+path+' overflows at '+width+': '+JSON.stringify(measured));
   }
  }
 });
 // Credentials are optional and must belong to controlled, pre-authorized test accounts.
 // Never attempt payments, role grants, customer submissions or real email sends here.
 const customerEmail=process.env.LANDSHOP_E2E_CUSTOMER_EMAIL;
 const customerPassword=process.env.LANDSHOP_E2E_CUSTOMER_PASSWORD;
 if(customerEmail&&customerPassword){
  await step('Dedicated customer sign-in and verified-email dashboard redirect',async()=>{
   await page.setViewportSize({width:1366,height:900});
   await navigate(origins.portal+'/');
   await page.locator('.authForm input[type="email"]').fill(customerEmail);
   await page.locator('.authForm input[type="password"]').fill(customerPassword);
   await page.getByRole('button',{name:/Sign In/}).last().click();
   await page.waitForURL(url=>url.origin===origins.app&&url.pathname.startsWith('/dashboard'),{timeout:45000});
   assert.ok(!page.url().includes('error='));
  });
 }else{skipped.push('Authenticated customer dashboard: dedicated E2E credentials not configured');}
 const staffEmail=process.env.LANDSHOP_E2E_STAFF_EMAIL;
 const staffPassword=process.env.LANDSHOP_E2E_STAFF_PASSWORD;
 if(staffEmail&&staffPassword){
  await step('Dedicated staff sign-in and authorized personal workspace',async()=>{
   await page.setViewportSize({width:1366,height:900});
   await navigate(origins.app+'/staff/sign-in');
   await page.locator('#staff-login-email').fill(staffEmail);
   await page.locator('#staff-login-password').fill(staffPassword);
   await page.locator('button.lsa-submit').click();
   await page.waitForURL(url=>url.origin===origins.app&&url.pathname.startsWith('/staff')&&!url.pathname.startsWith('/staff/sign-in'),{timeout:45000});
  });
 }else{skipped.push('Authenticated staff and Command Center actions: dedicated E2E credentials not configured');}
 await context.close();
}finally{
 await browser?.close();
 await network.dispose();
}
for(const item of skipped)console.warn('E2E NOT TESTED',item);
console.log('E2E SUMMARY',JSON.stringify({passed:passed.length,failed:failures.length,skipped:skipped.length,failures,skipped}));
if(failures.length)process.exitCode=1;
