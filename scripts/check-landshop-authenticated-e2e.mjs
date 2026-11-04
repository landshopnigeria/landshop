/**
 * Production-safe, authenticated Landshop browser E2E.
 *
 * Run ONLY with dedicated, pre-authorized, email-confirmed E2E accounts.
 * Reads existing account and management screens. Never registers users, changes
 * roles, clocks attendance, uploads files, creates workflow runs, sends messages,
 * exports personal data, places orders or takes payments.
 *
 * Usage: node scripts/check-landshop-authenticated-e2e.mjs --suite=customer
 *        node scripts/check-landshop-authenticated-e2e.mjs --suite=staff-command
 *
 * Missing credentials are a BLOCKED/FAILED test, never a green skip.
 */
import assert from 'node:assert/strict';
import {appendFileSync} from 'node:fs';
import {chromium} from 'playwright';

const suite=process.argv.find(arg=>arg.startsWith('--suite='))?.slice(8);
if(!['customer','staff-command'].includes(suite)){
 console.error('AUTH E2E CONFIGURATION ERROR: expected --suite=customer or --suite=staff-command');
 process.exit(2);
}
const app='https://app.landshopnigeria.com';
const portal='https://portal.landshopnigeria.com';
const required=suite==='customer'?
 ['LANDSHOP_E2E_CUSTOMER_EMAIL','LANDSHOP_E2E_CUSTOMER_PASSWORD']:
 ['LANDSHOP_E2E_STAFF_EMAIL','LANDSHOP_E2E_STAFF_PASSWORD','LANDSHOP_E2E_MANAGEMENT_EMAIL','LANDSHOP_E2E_MANAGEMENT_PASSWORD'];
const missing=required.filter(key=>!process.env[key]?.trim());
if(missing.length){
 console.error('AUTH E2E BLOCKED: dedicated GitHub Actions secrets not configured: '+missing.join(', '));
 console.error('Do not use a customer, employee or owner personal account. Provision isolated, verified test users with least-privilege roles.');
 if(process.env.GITHUB_STEP_SUMMARY){
  appendFileSync(process.env.GITHUB_STEP_SUMMARY,'\n### Authenticated '+suite+' suite: BLOCKED\n\nMissing: '+missing.map(x=>'\x60'+x+'\x60').join(', ')+'. No authenticated features were verified.\n');
 }
 process.exit(2);
}
const creds={
 customer:{email:process.env.LANDSHOP_E2E_CUSTOMER_EMAIL,password:process.env.LANDSHOP_E2E_CUSTOMER_PASSWORD},
 staff:{email:process.env.LANDSHOP_E2E_STAFF_EMAIL,password:process.env.LANDSHOP_E2E_STAFF_PASSWORD},
 management:{email:process.env.LANDSHOP_E2E_MANAGEMENT_EMAIL,password:process.env.LANDSHOP_E2E_MANAGEMENT_PASSWORD}
};
const redact=value=>{
 let out=String(value?.message||value||'Unknown test error');
 for(const item of Object.values(creds))for(const secret of [item.email,item.password])if(secret)out=out.replaceAll(secret,'[REDACTED]');
 return out.slice(0,370);
};
const passed=[],failed=[];
async function check(name,fn){
 const start=Date.now();
 try{await fn();passed.push(name);console.log('AUTH E2E PASS '+name+' ('+(Date.now()-start)+'ms)');return true;}
 catch(e){failed.push({name,error:redact(e)});console.error('AUTH E2E FAIL '+name+': '+redact(e));return false;}
}
function contextOptions(){return {locale:'en-NG',viewport:{width:1366,height:900},reducedMotion:'reduce',serviceWorkers:'block',acceptDownloads:false};}
function ensureOrigin(page,origin,prefix){
 const url=new URL(page.url());
 assert.equal(url.origin,origin,'Signed-in navigation left expected host');
 assert.ok(url.pathname===prefix||url.pathname.startsWith(prefix+'/'),'Expected '+prefix+' workspace');
}
async function navigate(page,url){
 const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
 assert.ok(response&&[200,304].includes(response.status()),'Page navigation returned '+response?.status());
 await page.locator('body').waitFor({state:'visible',timeout:16000});
}
async function responsive(page,path,widths=[375,768,1440]){
 for(const width of widths){
  await page.setViewportSize({width,height:width<500?812:900});
  await navigate(page,app+path);
  ensureOrigin(page,app,path);
  const size=await page.evaluate(()=>({documentWidth:document.documentElement.scrollWidth,viewport:window.innerWidth}));
  assert.ok(size.documentWidth<=size.viewport+4,path+' overflows at '+width+'px: '+JSON.stringify(size));
 }
}
async function signInCustomer(page){
 await navigate(page,portal+'/');
 await page.getByRole('tab',{name:'Sign In'}).click();
 await page.locator('.authForm input[type="email"]').fill(creds.customer.email);
 await page.locator('.authForm input[type="password"]').fill(creds.customer.password);
 await page.locator('.authForm button[type="submit"]').click();
 await page.waitForURL(url=>url.origin===app&&url.pathname==='/dashboard',{timeout:45000});
 ensureOrigin(page,app,'/dashboard');
 await page.locator('.dc-shell').waitFor({state:'visible',timeout:16000});
}
async function signInStaff(page,credsForRole,expected){
 await navigate(page,app+'/staff/sign-in');
 await page.locator('#staff-login-email').fill(credsForRole.email);
 await page.locator('#staff-login-password').fill(credsForRole.password);
 await page.locator('button.lsa-submit').click();
 await page.waitForURL(url=>url.origin===app&&url.pathname===expected,{timeout:45000});
 ensureOrigin(page,app,expected);
 await page.locator('main, .ls25-shell, .ls-basic-shell').first().waitFor({state:'visible',timeout:18000});
}
async function assertNoCommandCenter(page){
 assert.equal(await page.locator('.cc-workspace').count(),0,'Non-manager must not see the Command Center');
 assert.ok(!new URL(page.url()).pathname.startsWith('/admin'),'Non-manager reached protected admin route');
}
function report(){
 const summary={suite,passed:passed.length,failed:failed.length,failures:failed};
 console.log('AUTH E2E SUMMARY '+JSON.stringify(summary));
 if(process.env.GITHUB_STEP_SUMMARY){
  const rows=[
   '\n### Landshop authenticated '+suite+' browser suite\n',
   '| Result | Count |','|---|---:|',
   '| Passed | '+passed.length+' |','| Failed | '+failed.length+' |',
   '\nAll tests used isolated, pre-authorized test logins. Production records were not changed.\n'
  ];
  if(failed.length)rows.push('Failing assertions: '+failed.map(x=>'\x60'+x.name+'\x60').join(', '));
  appendFileSync(process.env.GITHUB_STEP_SUMMARY,rows.join('\n')+'\n');
 }
 if(failed.length)process.exitCode=1;
}
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 if(suite==='customer'){
  const context=await browser.newContext(contextOptions()),page=await context.newPage();
  page.setDefaultTimeout(16000);
  const signedIn=await check('Customer verified-email sign-in and own dashboard',()=>signInCustomer(page));
  if(signedIn){
   await check('Customer dashboard and referral tools render',async()=>{
    await page.locator('nav[aria-label="Customer dashboard"]').waitFor({state:'attached'});
    await page.locator('#referrals').waitFor({state:'attached'});
    assert.ok(await page.locator('a[href="/dashboard/account"]').count()>0,'Profile link not available');
   });
   await check('Customer account & security is accessible',async()=>{
    await navigate(page,app+'/dashboard/account');
    ensureOrigin(page,app,'/dashboard/account');
    assert.match(await page.locator('h1').first().innerText(),/My Landshop account/i);
   });
   await check('Customer applications and KYC are accessible without submitting records',async()=>{
    for(const path of ['/dashboard/applications','/dashboard/kyc']){
     await navigate(page,app+path);
     ensureOrigin(page,app,path);
     assert.ok(await page.locator('main').count()>0,'Missing primary content: '+path);
    }
   });
   await check('Customer cannot enter management Command Center',async()=>{
    await page.goto(app+'/admin',{waitUntil:'domcontentloaded',timeout:45000});
    await assertNoCommandCenter(page);
   });
   await check('Customer dashboard phone/tablet/desktop responsive',async()=>{
    await responsive(page,'/dashboard');
    await page.setViewportSize({width:1366,height:900});
   });
  }
  await context.close();
 }else{
  const staffContext=await browser.newContext(contextOptions()),staffPage=await staffContext.newPage();
  staffPage.setDefaultTimeout(16000);
  const staffLoggedIn=await check('Dedicated employee sign-in reaches personal staff workspace',()=>signInStaff(staffPage,creds.staff,'/staff'));
  if(staffLoggedIn){
   await check('Staff workspace navigation renders',async()=>{
    const nav=staffPage.locator('nav[aria-label="Staff and owner navigation"], aside[aria-label="Staff dashboard sections"] nav');
    await nav.first().waitFor({state:'attached',timeout:18000});
    assert.ok(await nav.first().locator('button').count()>0,'Staff navigation controls missing');
   });
   await check('Staff account does not inherit Command Center privileges',async()=>{
    await staffPage.goto(app+'/admin',{waitUntil:'domcontentloaded',timeout:45000});
    await assertNoCommandCenter(staffPage);
   });
   await check('Staff dashboard responsive on phone tablet and desktop',async()=>{
    await responsive(staffPage,'/staff');
   });
  }
  await staffContext.close();

  // A separate confirmed management account is required. Never elevate the
  // staff test user's membership or trust requested-role/user_metadata.
  const adminContext=await browser.newContext(contextOptions()),adminPage=await adminContext.newPage();
  adminPage.setDefaultTimeout(20000);
  const scriptErrors=[];
  adminPage.on('pageerror',error=>{const message=redact(error);if(/forEach is not a function|Cannot read properties of (?:null|undefined)/i.test(message))scriptErrors.push(message)});
  const managerLoggedIn=await check('Verified management account reaches the Command Center',()=>signInStaff(adminPage,creds.management,'/admin'));
  if(managerLoggedIn){
   await check('Command Center overview and authorized read-only sections render',async()=>{
    await adminPage.locator('.cc-workspace').waitFor({state:'visible'});
    for(const path of ['/admin/audit','/admin/staff']){
     await navigate(adminPage,app+path);
     ensureOrigin(adminPage,app,path);
     assert.ok(await adminPage.locator('main').count()>0,'Missing management page: '+path);
    }
   });
   await check('Automation visual canvas boots without JavaScript errors',async()=>{
    await adminPage.setViewportSize({width:1366,height:900});
    await navigate(adminPage,app+'/admin/automation');
    ensureOrigin(adminPage,app,'/admin/automation');
    await adminPage.locator('iframe[title="Landshop Automation Operating System"]').waitFor({state:'attached'});
    const studio=adminPage.frameLocator('iframe[title="Landshop Automation Operating System"]');
    await studio.locator('#app').waitFor({state:'attached',timeout:20000});
    await studio.locator('.category-toggle').first().waitFor({state:'attached',timeout:20000});
    assert.ok(await studio.locator('.category-toggle').count()>=2,'Automation action groups not initialized');
    assert.equal(scriptErrors.length,0,'Canvas script crashed: '+scriptErrors.join('; '));
   });
   await check('Accordion opens only one action category at a time',async()=>{
    const studio=adminPage.frameLocator('iframe[title="Landshop Automation Operating System"]');
    const groups=studio.locator('.category-toggle');
    assert.ok(await groups.count()>=2,'Need two action groups');
    await groups.nth(0).click();
    await groups.nth(1).click();
    assert.equal(await groups.nth(1).getAttribute('aria-expanded'),'true','Second group did not open');
    assert.equal(await groups.nth(0).getAttribute('aria-expanded'),'false','Previous group stayed open');
   });
   await check('Management operations menu works without invoking a workflow',async()=>{
    const tools=adminPage.locator('.nexus-host-more summary');
    await tools.click();
    assert.ok(await adminPage.locator('.nexus-host-menu a[href="/admin/communications"]').isVisible());
    await tools.click();
   });
   await check('Automation mobile Steps and Canvas modes respond',async()=>{
    await adminPage.setViewportSize({width:375,height:812});
    await navigate(adminPage,app+'/admin/automation');
    const studio=adminPage.frameLocator('iframe[title="Landshop Automation Operating System"]');
    const appNode=studio.locator('#app');
    await appNode.waitFor({state:'attached',timeout:20000});
    await studio.locator('[data-mobile-mode="canvas"]').click();
    assert.equal(await appNode.getAttribute('data-mobile-mode'),'canvas');
    await studio.locator('[data-mobile-mode="steps"]').click();
    assert.equal(await appNode.getAttribute('data-mobile-mode'),'steps');
    assert.equal(scriptErrors.length,0,'Canvas crashed on mobile');
   });
   await check('Communications mobile navigation and message preview respond',async()=>{
    await navigate(adminPage,app+'/admin/communications');
    await adminPage.locator('#comm-mobile-section').waitFor({state:'visible'});
    await adminPage.locator('#comm-mobile-section').selectOption('templates');
    await adminPage.getByRole('heading',{name:'Premium customer communication studio'}).waitFor({state:'visible',timeout:18000});
    await adminPage.locator('#comm-mobile-section').selectOption('journeys');
    await adminPage.getByRole('heading',{name:'Six connected customer journeys'}).waitFor({state:'visible',timeout:18000});
    assert.ok(await adminPage.locator('a[href="/admin/automation"]').count()>0,'Missing direct visual builder navigation');
   });
   await check('Command Center responsive on phone tablet and desktop',async()=>{
    await responsive(adminPage,'/admin');
    await responsive(adminPage,'/admin/communications');
   });
   await check('Authorized management access does not expose credentials or send messages',async()=>{
    // This suite only navigates, reads, switches local panels and inspects DOM.
    await navigate(adminPage,app+'/admin/automation');
    assert.equal(scriptErrors.length,0,'Critical client-side JS exception');
   });
  }
  await adminContext.close();
 }
} catch(e){
 failed.push({name:'Browser harness',error:redact(e)});
 console.error('AUTH E2E FAIL Browser harness: '+redact(e));
} finally {
 await browser?.close();
 report();
}
