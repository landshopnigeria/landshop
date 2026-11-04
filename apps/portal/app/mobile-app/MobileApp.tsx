'use client';
import {useEffect,useMemo,useRef,useState,type FormEvent,type ReactNode} from 'react';
import {browserSupabase} from '../../lib/supabase-browser';
import {accountHome} from '../../../../packages/shared/account-home';
import {assertLandshopPasswordSafe} from '../../../../packages/shared/landshop-password-screen';
import {MobileReferralPanel,MobileActivityPanel} from './MobileMemberPanels';

export type Screen='splash'|'onboarding'|'signup'|'signin'|'verify'|'reset'|'home'|'explore'|'property'|'inspection'|'mortgage'|'saved'|'referrals'|'notices'|'profile';
type Property={slug:string;title:string;location:string;image:string;summary:string;type:'land'|'homes'|'coastal';label:string;status:string;href:string;};
const SITE='https://www.landshopnigeria.com';
const DASH='https://app.landshopnigeria.com';
// Mobile estate images are bundled under the portal's own origin to remove cross-domain delays.
const photos=(path:string)=>path;
const properties:Property[]=[
 {slug:'famous-gardens',title:'Famous Gardens',location:'Ibeju-Lekki, Lagos',image:photos('/media/landshop-mobile-famous-gardens.jpg'),summary:'Explore the owner-supplied residential estate archive and enquire about property options.',type:'homes',label:'Owner photo archive',status:'Current units and pricing require confirmation',href:SITE+'/projects/famous-gardens'},
 {slug:'green-island',title:'Green Island Estate',location:'Iba-Oloja, Ibeju-Lekki',image:photos('/media/landshop-mobile-green-island-site-progress.webp'),summary:'An emerging residential community in the Lekki growth corridor, documented through Landshop site archives.',type:'land',label:'Historical site photograph',status:'Current plot availability unconfirmed',href:SITE+'/properties/green-island'},
 {slug:'maiyegun-beach-estate',title:'Maiyegun Beach Estate',location:'Jakande, Lekki, Lagos',image:photos('/media/maiyegun0.webp'),summary:'A coastal estate marketed by Landshop. Review actual site archives and request current developer information.',type:'coastal',label:'Original project photograph',status:'Partner development; current offers subject to verification',href:SITE+'/properties/maiyegun-beach-estate'},
 {slug:'blue-diamonds',title:'Blue Diamonds Estate',location:'Ibeju-Lekki, Lagos',image:photos('/media/landshop-mobile-blue-diamonds-concept.webp'),summary:'Landshop development concepts and estate planning materials. These illustrations are not completed buildings.',type:'land',label:'Owner-provided architectural concept',status:'Design concept; official availability on enquiry',href:SITE+'/properties/blue-diamonds'}
];
type IconName='home'|'search'|'coins'|'bell'|'user'|'arrow'|'back'|'heart'|'filter'|'calendar'|'clock'|'check'|'lock'|'mail'|'phone'|'eye'|'share'|'map'|'menu'|'shield'|'chart'|'users'|'bookmark'|'chevron'|'close'|'globe'|'download';
function Icon({name,size=19}: {name:IconName;size?:number}){
 const paths:Record<IconName,ReactNode>={
 home:<><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/><path d="M9 21v-7h6v7"/></>,
 search:<><circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/></>,
 coins:<><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v5c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></>,
 bell:<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 10h18c0-2-3-3-3-10M10 21h4"/></>,
 user:<><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></>,
 arrow:<><path d="M4 12h16m-7-7 7 7-7 7"/></>,
 back:<><path d="M20 12H4m7-7-7 7 7 7"/></>,
 heart:<><path d="M20.5 9.1c0 4.5-8.5 10.5-8.5 10.5S3.5 13.6 3.5 9.1a4.5 4.5 0 0 1 8.5-2 4.5 4.5 0 0 1 8.5 2Z"/></>,
 filter:<><path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="10" cy="18" r="2" fill="currentColor" stroke="none"/></>,
 calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></>,
 clock:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 3"/></>,
 check:<path d="m4 12 5 5L20 6"/>,
 lock:<><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
 mail:<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
 phone:<path d="M6 3h4l1 5-2 2c1.5 3 3 4.5 6 6l2-2 4 1v4c-9 3-20-8-15-16Z"/>,
 eye:<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
 share:<><circle cx="6" cy="12" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="m8 11 8-4M8 13l8 4"/></>,
 map:<><path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Z"/><path d="M9 3v16M15 5v16"/></>,
 menu:<path d="M3 6h18M3 12h18M3 18h18"/>,
 shield:<><path d="m12 2 9 4v6c0 6-4 9-9 10-5-1-9-4-9-10V6Z"/><path d="m8 12 3 3 5-6"/></>,
 chart:<path d="M3 20h18M6 16v-4M12 16V8M18 16V4m-12 8 6-4 6-4"/>,
 users:<><circle cx="9" cy="8" r="3"/><path d="M2 20v-2a7 7 0 0 1 14 0v2"/><path d="M17 5a3 3 0 0 1 0 6M22 20v-2a6 6 0 0 0-4-5.6"/></>,
 bookmark:<path d="M6 3h12v18l-6-4-6 4Z"/>,
 chevron:<path d="m6 9 6 6 6-6"/>,
 close:<path d="M5 5 19 19M19 5 5 19"/>,
 globe:<><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-5 5-5 13 0 18M12 3c5 5 5 13 0 18"/></>,
 download:<path d="M12 3v13m-5-5 5 5 5-5M4 19v2h16v-2"/>
 };
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
function CTA({children,onClick,secondary=false,disabled=false}:{children:ReactNode;onClick:()=>void;secondary?:boolean;disabled?:boolean}){
 return <button type="button" disabled={disabled} className={'lm-cta '+(secondary?'lm-cta-alt':'')} onClick={onClick}>{children}<Icon name="arrow" size={17}/></button>;
}
function Field({label,children}:{label:string;children:ReactNode}){return <label className="lm-field"><span>{label}</span>{children}</label>}

export default function MobileApp({initialScreen='onboarding'}:{initialScreen?:Screen}){
 const [screen,setScreen]=useState<Screen>(initialScreen),[slide,setSlide]=useState(0),[filter,setFilter]=useState<'all'|'land'|'homes'|'coastal'>('all');
 const [searchTerm,setSearchTerm]=useState('');
 const [selected,setSelected]=useState('famous-gardens'),[saved,setSaved]=useState<string[]>([]);
 const [name,setName]=useState(''),[userEmail,setUserEmail]=useState(''),[signedIn,setSignedIn]=useState(false);
 const [first,setFirst]=useState(''),[last,setLast]=useState(''),[email,setEmail]=useState(''),[phone,setPhone]=useState(''),[username,setUsername]=useState(''),[age,setAge]=useState('');
 const [gender,setGender]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[showPass,setShowPass]=useState(false),[agree,setAgree]=useState(false);
 const [signupStep,setSignupStep]=useState<1|2>(1),[busy,setBusy]=useState(false),[feedback,setFeedback]=useState('');
 const [price,setPrice]=useState(180000000),[deposit,setDeposit]=useState(20),[rate,setRate]=useState(18.5),[years,setYears]=useState(20);
 const [visitDate,setVisitDate]=useState(''),[visitTime,setVisitTime]=useState('10:00'),[visitCount,setVisitCount]=useState(1),[visitMode,setVisitMode]=useState<'physical'|'virtual'>('physical');
 const [installed,setInstalled]=useState(false),[installPrompt,setInstallPrompt]=useState<Event|null>(null);
 const [menuOpen,setMenuOpen]=useState(false),[expandedMenu,setExpandedMenu]=useState<'property'|'account'|'services'|null>(null);
 const mainScroll=useRef<HTMLDivElement|null>(null);
 const current=properties.find(p=>p.slug===selected)||properties[0];
 const go=(next:Screen)=>{setMenuOpen(false);setFeedback('');if(typeof window!=='undefined')window.history.pushState({screen:next},'',window.location.pathname+'?screen='+next);setScreen(next);};
 useEffect(()=>{mainScroll.current?.scrollTo({top:0,behavior:'instant'});},[screen,selected,slide]);
 useEffect(()=>{
  let active=true;
  const query=new URLSearchParams(window.location.search),target=query.get('screen');
  const screens=['onboarding','signup','signin','verify','reset','home','explore','property','inspection','mortgage','saved','referrals','notices','profile'];
  // Render the target immediately after hydration; do not hold navigation behind a cosmetic splash timer.
  setScreen(screens.includes(target||'')?target as Screen:'onboarding');
  const pop=()=>{const p=new URLSearchParams(window.location.search).get('screen');if(p&&screens.includes(p))setScreen(p as Screen);else setScreen('onboarding')};
  window.addEventListener('popstate',pop);
  try{const value:unknown=JSON.parse(window.localStorage.getItem('landshop.mobile.saved.v1')||'[]');setSaved(Array.isArray(value)?value.filter((v):v is string=>typeof v==='string'&&properties.some(p=>p.slug===v)).slice(0,30):[])}catch{setSaved([])}
  const standalone=window.matchMedia('(display-mode: standalone)').matches;setInstalled(standalone);
  const install=(event:Event)=>{event.preventDefault();setInstallPrompt(event)};
  window.addEventListener('beforeinstallprompt',install);
  const installedEvent=()=>{setInstalled(true);setInstallPrompt(null)};
  window.addEventListener('appinstalled',installedEvent);
  const auth=browserSupabase();
  auth.auth.getUser().then(({data})=>{const u=data.user;if(active&&u?.email_confirmed_at){setSignedIn(true);setName(String(u.user_metadata?.full_name||'').split(' ')[0]||'');setUserEmail(u.email||'')}}).catch(()=>{});
  const {data:{subscription}}=auth.auth.onAuthStateChange((_event,session)=>{if(!active)return;const u=session?.user;if(u?.email_confirmed_at){setSignedIn(true);setName(String(u.user_metadata?.full_name||'').split(' ')[0]||'');setUserEmail(u.email||'')}else{setSignedIn(false);setName('');setUserEmail('')}});
  return()=>{active=false;window.removeEventListener('popstate',pop);window.removeEventListener('beforeinstallprompt',install);window.removeEventListener('appinstalled',installedEvent);subscription.unsubscribe()};
 },[]);
 const toggleSaved=(slug:string)=>setSaved(v=>{const next=v.includes(slug)?v.filter(x=>x!==slug):[...v,slug];try{window.localStorage.setItem('landshop.mobile.saved.v1',JSON.stringify(next))}catch{}return next});
 const openProperty=(slug:string)=>{setSelected(slug);go('property')};
 const openSecureCustomer=(route:'applications'|'kyc'|'account')=>{
  if(!signedIn){go('signin');setFeedback('Please sign in to access your secure Landshop records.');return}
  const destinations={applications:'/dashboard/applications',kyc:'/dashboard/kyc',account:'/dashboard/account'};
  window.location.assign(DASH+destinations[route]);
 };
 const validEmail=(value:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
 const signIn=async(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();if(busy)return;setBusy(true);setFeedback('');
  try{
   const db=browserSupabase();
   const {data,error}=await db.auth.signInWithPassword({email:email.trim().toLowerCase(),password});
   if(error)throw error;
   if(!data.user?.email_confirmed_at){go('verify');setFeedback('Confirm your email address using the link in your inbox.');return}
   const home=await accountHome(db,data.user);
   if(home!=='/dashboard'){window.location.assign(DASH+home);return}
   setName(String(data.user.user_metadata?.full_name||'').split(' ')[0]);setUserEmail(data.user.email||'');setSignedIn(true);setPassword('');go('home');
  }catch(error){setFeedback(error instanceof Error?error.message:'Unable to sign in.')}
  finally{setBusy(false)}
 };
 const register=async(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();if(busy)return;setFeedback('');
  if(signupStep===1){
   if(!first.trim()||!last.trim()||!validEmail(email)||!(/^\+?[0-9 ()-]{8,20}$/.test(phone)))return setFeedback('Enter your name, valid email and telephone number.');
   setSignupStep(2);return;
  }
  setBusy(true);
  try{
   if(!/^[a-zA-Z][a-zA-Z0-9_.]{2,29}$/.test(username))throw Error('Enter a username between 3 and 30 characters, starting with a letter.');
   if(!age||Number(age)<18||Number(age)>120)throw Error('You must be at least 18 to register.');
   if(password.length<12||password!==confirm)throw Error('Use a password of at least 12 characters and match both passwords.');
   if(!agree)throw Error('Please accept the terms and privacy policy.');
   await assertLandshopPasswordSafe(password);
   document.cookie='landshop_mobile_flow=1; Path=/auth/callback; Max-Age=3600; SameSite=Lax; Secure';
   const {error}=await browserSupabase().auth.signUp({email:email.trim().toLowerCase(),password,options:{emailRedirectTo:'https://portal.landshopnigeria.com/auth/callback',data:{full_name:first.trim()+' '+last.trim(),username:username.trim().toLowerCase(),phone:phone.trim(),age:Number(age),gender}}});
   if(error)throw error;
   setPassword('');setConfirm('');go('verify');
  }catch(error){setFeedback(error instanceof Error?error.message:'Unable to register.')}
  finally{setBusy(false)}
 };
 const emailAction=async(action:'recovery'|'resend')=>{
  if(!validEmail(email))return setFeedback('Enter a valid email address first.');
  setBusy(true);setFeedback('');
  try{
   const resp=await fetch('/api/auth/email-action',{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,email:email.trim().toLowerCase()})});
   const body=await resp.json() as {ok?:boolean;message?:string};
   if(!resp.ok||!body.ok)throw Error(body.message||'Email request could not be sent.');
   setFeedback(body.message||'Check your inbox.');
  }catch(error){setFeedback(error instanceof Error?error.message:'Please try again.')}
  finally{setBusy(false)}
 };
 const google=async()=>{setFeedback('');try{document.cookie='landshop_mobile_flow=1; Path=/auth/callback; Max-Age=3600; SameSite=Lax; Secure';const {error}=await browserSupabase().auth.signInWithOAuth({provider:'google',options:{redirectTo:'https://portal.landshopnigeria.com/auth/callback'}});if(error)throw error;}catch{setFeedback('Google sign-in is not available. Please use email and password.')}};
 const logout=async()=>{try{await browserSupabase().auth.signOut();setSignedIn(false);setName('');setUserEmail('');go('signin')}catch{setFeedback('Unable to sign out at this time.')}};
 const installApp=async()=>{if(!installPrompt){setFeedback('On iPhone, use Safari Share then Add to Home Screen. On Android, use the browser Install app option.');return}const prompt=installPrompt as Event & {prompt?:()=>Promise<void>;userChoice?:Promise<{outcome:string}>};await prompt.prompt?.();setInstallPrompt(null)};
 const principal=Math.max(0,Number(price)*(1-Math.min(100,Math.max(0,Number(deposit)))/100));
 const months=Math.max(1,Number(years)*12),monthlyRate=Math.max(0,Number(rate))/1200;
 const monthly=monthlyRate===0?principal/months:principal*monthlyRate/(1-Math.pow(1+monthlyRate,-months));
 const total=monthly*months,interest=Math.max(0,total-principal);
 const money=(amount:number)=>'₦'+Math.round(amount).toLocaleString('en-NG');
 const shown=useMemo(()=>{const q=searchTerm.trim().toLocaleLowerCase();return properties.filter(p=>(filter==='all'||filter===p.type)&&(!q||[p.title,p.location,p.summary,p.type].some(text=>text.toLocaleLowerCase().includes(q))))},[filter,searchTerm]);
 const authButton=<div className="lm-auth-switch"><span>Already have an account?</span><button onClick={()=>go('signin')}>Sign In</button></div>;
 const photo=(src:string,alt:string,cls:string,eager=false)=> <img src={src} alt={alt} className={cls} loading={eager?'eager':'lazy'} decoding="async" fetchPriority={eager?'high':'auto'}/>;
 const continueInspection=()=>{
  const today=new Date().toLocaleDateString('en-CA',{timeZone:'Africa/Lagos'});
  if(!/^\d{4}-\d{2}-\d{2}$/.test(visitDate)||visitDate<today){setFeedback('Choose a valid future inspection date before continuing.');return}
  if(!/^(?:0[89]|1[0-6]):00$|^17:00$/.test(visitTime)){setFeedback('Select an inspection time between 08:00 and 17:00 WAT.');return}
  const url=new URL(SITE+'/visit');
  url.searchParams.set('project',current.slug);
  url.searchParams.set('date',visitDate);
  url.searchParams.set('time',visitTime);
  url.searchParams.set('attendees',String(Math.max(1,Math.min(20,visitCount))));
  url.searchParams.set('mode',visitMode);
  window.location.assign(url.toString());
 };
 const feature=(p:Property,compact=false)=><article key={p.slug} className={'lm-property-card '+(compact?'lm-property-compact':'')}>
   <button type="button" className="lm-card-image" onClick={()=>openProperty(p.slug)}>{photo(p.image,p.title+' - '+p.label,'lm-photo')}<span className="lm-photo-tag">{p.label}</span></button>
   <div className="lm-card-body"><div className="lm-card-heading"><div><h3>{p.title}</h3><p><Icon name="map" size={14}/>{p.location}</p></div><button className="lm-icon-btn" aria-label={saved.includes(p.slug)?'Remove from saved':'Save property'} aria-pressed={saved.includes(p.slug)} onClick={()=>toggleSaved(p.slug)}><Icon name="heart" size={18}/></button></div><p>{p.status}</p><button className="lm-text-action" onClick={()=>openProperty(p.slug)}>Explore estate <Icon name="arrow" size={16}/></button></div>
  </article>;
 return <main className="lm-stage">
  <div className="lm-shell">

   <div className="lm-scroll" ref={mainScroll}>
    {screen==='splash'&&<div className="lm-splash">
      <div className="lm-splash-wave"/><img src="/media/logo-transparent.png" alt="Landshop Nigeria" className="lm-splash-logo"/><p>Property ownership, made clearer.</p><div className="lm-loader" aria-label="Opening Landshop"><i/><i/><i/></div><img src={photos('/media/landshop-mobile-famous-gardens.jpg')} alt="Famous Gardens residential estate, owner-supplied photograph" className="lm-splash-picture" decoding="async" fetchPriority="high"/>
     </div>}
    {screen==='onboarding'&&<div className="lm-onboarding">
      <div className="lm-onboard-photo">{photo(photos(slide===0?'/media/landshop-mobile-famous-gardens.jpg':'/media/landshop-mobile-site-client-inspection.webp'),'Landshop owner-supplied property and inspection photography','lm-photo',true) }<img className="lm-onboard-logo" src="/media/logo-transparent.png" alt="Landshop Nigeria"/></div>
      <div className="lm-onboard-content"><span className="lm-eyebrow"><Icon name="shield" size={17}/> {slide===0?'Property discovery':'Finance and investment'}</span>
      <h1>{slide===0?<>Own property <em>with clarity.</em></>:<>Finance smarter. <em>Grow with purpose.</em></>}</h1>
      <p>{slide===0?'Discover Landshop estate portfolios, access published listings and speak to property consultants.':'Explore mortgage planning, property acquisition and referrals in a guided mobile experience.'}</p>
      <div className="lm-dots"><span className={slide===0?'active':''}/><span className={slide===1?'active':''}/></div>
      <div className="lm-two-actions"><button className="lm-soft-btn" onClick={()=>{if(slide===1){setSlide(0)}else go('home')}}>{slide===0?'Skip':'Back'}</button><CTA onClick={()=>{if(slide===0)setSlide(1);else go('signup')}}>{slide===0?'Next':'Get Started'}</CTA></div>
      <button className="lm-muted-link" onClick={()=>go('signin')}>Already registered? Sign In</button></div>
     </div>}
    {['signin','signup','verify','reset'].includes(screen)&&<div className="lm-auth">
      <div className="lm-auth-top"><img src="/media/logo-transparent.png" alt="Landshop Nigeria"/><button onClick={()=>go('home')} aria-label="Explore as guest"><Icon name="close"/></button></div>
      {screen==='signin'&&<><div className="lm-auth-hero"><h1>Welcome <em>back.</em></h1><p>Sign in to continue your Landshop property journey.</p>{photo(photos('/media/landshop-mobile-famous-completed-homes.webp'),'Owner-supplied estate photograph','lm-photo',true)}</div>
        <form className="lm-auth-form" onSubmit={signIn}>
         <Field label="Email address"><span className="lm-input-icon"><Icon name="mail"/><input required type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}/></span></Field>
         <Field label="Password"><span className="lm-input-icon"><Icon name="lock"/><input required type={showPass?'text':'password'} autoComplete="current-password" placeholder="Enter password" value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" onClick={()=>setShowPass(x=>!x)} aria-label="Toggle password visibility"><Icon name="eye"/></button></span></Field>
         <button className="lm-forgot" type="button" onClick={()=>go('reset')}>Forgot password?</button>
         <button className="lm-form-submit" type="submit" disabled={busy}>{busy?'Signing in…':'Sign In'}<Icon name="arrow"/></button>
        </form><div className="lm-oauth"><span>Or continue with</span><button onClick={google}><b>G</b> Continue with Google</button></div><div className="lm-auth-switch">New to Landshop? <button onClick={()=>{setSignupStep(1);go('signup')}}>Create Account</button></div></>}
      {screen==='signup'&&<><div className="lm-auth-heading"><h1>Create your <em>account.</em></h1><p>{signupStep===1?'A beautiful property journey starts here.':'Secure your account and confirm your details.'}</p><div className="lm-progress"><span className="active"/><span className={signupStep===2?'active':''}/></div></div>
        <form className="lm-auth-form" onSubmit={register}>
          {signupStep===1?<><Field label="First name"><input required autoComplete="given-name" maxLength={55} value={first} placeholder="Your first name" onChange={e=>setFirst(e.target.value)}/></Field>
          <Field label="Last name"><input required autoComplete="family-name" maxLength={55} value={last} placeholder="Your last name" onChange={e=>setLast(e.target.value)}/></Field>
          <Field label="Email address"><input required type="email" autoComplete="email" value={email} placeholder="you@example.com" onChange={e=>setEmail(e.target.value)}/></Field>
          <Field label="Phone / WhatsApp"><input required type="tel" autoComplete="tel" value={phone} placeholder="+234 800 000 0000" onChange={e=>setPhone(e.target.value)}/></Field></>
           :<><Field label="Username"><input required autoComplete="username" value={username} placeholder="Choose a username" pattern="[A-Za-z][A-Za-z0-9_.]{2,29}" onChange={e=>setUsername(e.target.value)}/></Field>
           <Field label="Age (18+)"><input required type="number" min={18} max={120} value={age} placeholder="Age" onChange={e=>setAge(e.target.value)}/></Field>
           <Field label="Gender (optional)"><select value={gender} onChange={e=>setGender(e.target.value)}><option value="">Prefer not to say</option><option value="female">Female</option><option value="male">Male</option></select></Field>
           <Field label="Password"><span className="lm-input-icon"><Icon name="lock"/><input required minLength={12} type={showPass?'text':'password'} autoComplete="new-password" placeholder="At least 12 characters" value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" onClick={()=>setShowPass(x=>!x)}><Icon name="eye"/></button></span></Field>
           <Field label="Confirm password"><input required minLength={12} type={showPass?'text':'password'} autoComplete="new-password" placeholder="Confirm password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></Field>
           <label className="lm-check"><input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)}/> I accept the <a href={SITE+'/terms'} target="_blank" rel="noopener noreferrer">Terms</a> and <a href={SITE+'/privacy'} target="_blank" rel="noopener noreferrer">Privacy Policy</a>.</label></>}
           <button className="lm-form-submit" disabled={busy} type="submit">{busy?'Please wait…':signupStep===1?'Continue':'Create Account'}<Icon name="arrow"/></button>
        </form>{signupStep===2&&<button className="lm-muted-link" onClick={()=>setSignupStep(1)}>Back to contact details</button>}{authButton}
      </>}
      {screen==='verify'&&<div className="lm-auth-state"><div className="lm-circle-icon"><Icon name="mail" size={34}/></div><h1>Check your inbox.</h1><p>We sent a confirmation link to {email||'your email address'}. Verify your email before signing in.</p><CTA disabled={busy} onClick={()=>void emailAction('resend')}>{busy?'Sending…':'Resend verification'}</CTA><button className="lm-muted-link" onClick={()=>go('signin')}>Back to Sign In</button></div>}
      {screen==='reset'&&<div className="lm-auth-state"><div className="lm-circle-icon"><Icon name="lock" size={34}/></div><h1>Reset your password.</h1><p>Enter the email associated with your account. We will send secure recovery instructions.</p><Field label="Email address"><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></Field><CTA disabled={busy} onClick={()=>void emailAction('recovery')}>{busy?'Sending…':'Send Recovery Link'}</CTA><button className="lm-muted-link" onClick={()=>go('signin')}>Back to Sign In</button></div>}
     </div>}
    {!['splash','onboarding','signin','signup','verify','reset'].includes(screen)&&<>
     <div className="lm-app-top"><button className="lm-menu-trigger" onClick={()=>setMenuOpen(true)} aria-label="Open dashboard navigation" aria-expanded={menuOpen}><Icon name="menu"/></button><img src="/media/logo-transparent.png" alt="Landshop Nigeria"/><div><button className="lm-icon-btn lm-bell" aria-label="Notifications" onClick={()=>go('notices')}><Icon name="bell"/></button><button className="lm-icon-btn lm-user-trigger" aria-label="Open profile and account menu" onClick={()=>go('profile')}><Icon name="user"/></button></div></div>
     {screen==='home'&&<div className="lm-app-page">
       <div className="lm-welcome"><p>Good {new Date().getHours()<12?'morning':new Date().getHours()<17?'afternoon':'evening'}{signedIn&&name?', '+name:''} <span>✳</span></p><h1>Find your next <em>opportunity.</em></h1><p>Browse Landshop estates and plan your next property move.</p></div>
       <button className="lm-searchbar" onClick={()=>go('explore')}><Icon name="search"/><span>Search estates, locations, projects…</span><Icon name="filter"/></button>
       <div className="lm-quick-actions">
        <button onClick={()=>go('explore')}><Icon name="home"/>Buy</button><button onClick={()=>window.location.assign(SITE+'/incubate')}><Icon name="chart"/>Invest</button><button onClick={()=>go('mortgage')}><Icon name="coins"/>Mortgage</button><button onClick={()=>go('referrals')}><Icon name="users"/>Refer</button>
       </div>
       <div className="lm-section-title"><h2>Featured estate</h2><button onClick={()=>go('explore')}>Explore all <Icon name="arrow" size={15}/></button></div>
       <button className="lm-featured" onClick={()=>openProperty('famous-gardens')}>
        {photo(properties[0].image,'Famous Gardens Landshop owner-supplied property archive','lm-photo',true)}
        <div><small>LANDSHOP PORTFOLIO</small><h3>Famous Gardens</h3><p>Ibeju-Lekki, Lagos</p><span>Explore estate <Icon name="arrow" size={15}/></span></div>
       </button>
       <div className="lm-summary-row"><button onClick={()=>go('saved')}><Icon name="heart"/> <span><small>Saved on device</small><strong>{saved.length}</strong></span></button><button onClick={()=>go('inspection')}><Icon name="calendar"/><span><small>Plan a visit</small><strong>Book</strong></span></button><button onClick={()=>go('referrals')}><Icon name="users"/><span><small>Refer & Grow</small><strong>Share</strong></span></button></div>
       <div className="lm-member-shortcuts" aria-label="Customer account services">
        <button onClick={()=>openSecureCustomer('applications')}><span><Icon name="bookmark" size={19}/></span><strong>My Applications</strong><Icon name="arrow" size={17}/></button>
        <button onClick={()=>openSecureCustomer('kyc')}><span><Icon name="shield" size={19}/></span><strong>Identity Verification</strong><Icon name="arrow" size={17}/></button>
       </div>
       <div className="lm-section-title"><h2>Estate portfolio</h2><button onClick={()=>go('explore')}>See All <Icon name="arrow" size={15}/></button></div>
       <div className="lm-location-row">{properties.slice(1).map(p=><button key={p.slug} onClick={()=>openProperty(p.slug)}>{photo(p.image,p.title,'lm-photo')}<span>{p.title}</span></button>)}</div>
       <div className="lm-promo"><div><small>LANDSHOP GROW</small><h3>Mortgage Planner</h3><p>Estimate repayment scenarios and explore your affordability.</p><button onClick={()=>go('mortgage')}>Plan Your Mortgage <Icon name="arrow" size={16}/></button></div>{photo(photos('/media/landshop-mobile-product-grow.webp'),'Landshop-owned product photography','lm-photo')}</div>
     </div>}
     {screen==='explore'&&<div className="lm-app-page">
       <div className="lm-heading"><small>DISCOVER LANDSHOP</small><h1>Explore <em>properties.</em></h1><p>Owner-supplied estate portfolios. Published availability and prices are confirmed separately.</p></div>
       <label className="lm-searchbar lm-search-input"><Icon name="search"/><input type="search" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Search estate, location or project" aria-label="Search Landshop estate portfolio"/></label>
       <div className="lm-filterrow">{([['all','All Estates'],['homes','Homes'],['land','Land'],['coastal','Coastal']] as const).map(([key,title])=><button key={key} className={filter===key?'active':''} onClick={()=>setFilter(key)}>{title}</button>)}</div>
       <p className="lm-tally">{shown.length} estate portfolio {shown.length===1?'entry':'entries'}</p>
       <div className="lm-property-list">{shown.length?shown.map(p=>feature(p)):<div className="lm-empty"><Icon name="search" size={30}/><h2>No matching estates.</h2><p>Try another location or clear your search.</p><button className="lm-restore-search" onClick={()=>{setSearchTerm('');setFilter('all')}}>Clear search and filters</button></div>}</div>
       <a className="lm-outline-link" href={SITE+'/properties'}>Open Verified Property Marketplace <Icon name="arrow"/></a>
     </div>}
     {screen==='property'&&<div className="lm-app-page lm-detail">
       <div className="lm-heading-row"><button onClick={()=>go('explore')}><Icon name="back"/></button><span>ESTATE DETAILS</span><button aria-label="Save" onClick={()=>toggleSaved(current.slug)}><Icon name="heart"/></button></div>
       <div className="lm-detail-hero">{photo(current.image,current.title+' '+current.label,'lm-photo')}<span className="lm-img-overlay">{current.label}</span></div>
       <div className="lm-detail-name"><div><h1>{current.title}</h1><p><Icon name="map" size={16}/>{current.location}</p></div><button onClick={()=>{if(navigator.share)void navigator.share({title:current.title,url:current.href});else window.open(current.href,'_blank','noopener,noreferrer')}} aria-label="Share estate"><Icon name="share"/></button></div>
       <div className="lm-facts"><div><Icon name="shield"/>Owner archive</div><div><Icon name="calendar"/>Enquiry only</div><div><Icon name="home"/>Estate portfolio</div></div>
       <section className="lm-info-block"><h2>Overview</h2><p>{current.summary}</p><p><strong>Current status:</strong> {current.status}.</p></section>
       <section className="lm-info-block"><h2>Before you decide</h2><div className="lm-checkrows"><p><Icon name="check"/> Request current availability and an official price</p><p><Icon name="check"/> Verify title, survey and approvals</p><p><Icon name="check"/> Schedule a confirmed estate inspection</p></div></section>
       <div className="lm-advisor-panel"><Icon name="users" size={31}/><div><strong>Landshop property consultant</strong><p>Speak to the team about the estate and its current status.</p></div></div>
       <div className="lm-two-actions"><CTA onClick={()=>go('inspection')}>Book Inspection</CTA><CTA secondary onClick={()=>window.open(current.href,'_blank','noopener,noreferrer')}>Estate Details</CTA></div>
     </div>}
     {screen==='inspection'&&<div className="lm-app-page">
       <div className="lm-heading-row"><button onClick={()=>go('property')}><Icon name="back"/></button><span>VISIT PLANNER</span></div>
       <div className="lm-heading"><h1>Book an <em>inspection.</em></h1><p>Select your preferred date and time before opening Landshop’s secure inspection request.</p></div>
       <div className="lm-visit-summary">{photo(current.image,current.title,'lm-photo')}<div><small>SELECTED ESTATE</small><strong>{current.title}</strong><span>{current.location}</span></div></div>
       <div className="lm-form-box"><Field label="Preferred visit date"><input type="date" min={new Date().toLocaleDateString('en-CA',{timeZone:'Africa/Lagos'})} value={visitDate} onChange={e=>setVisitDate(e.target.value)}/></Field>
         <Field label="Visit type"><select value={visitMode} onChange={e=>setVisitMode(e.target.value as 'physical'|'virtual')}><option value="physical">Physical inspection</option><option value="virtual">Live virtual tour</option></select></Field>
         <Field label="Preferred time (WAT)"><select value={visitTime} onChange={e=>setVisitTime(e.target.value)}>{['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'].map(t=><option key={t} value={t}>{t} WAT</option>)}</select></Field>
         <Field label="Number of visitors"><input type="number" min={1} max={20} value={visitCount} onChange={e=>setVisitCount(Math.max(1,Math.min(20,Number(e.target.value)||1)))}/></Field>
       </div>
       <div className="lm-note"><Icon name="shield" size={22}/> This is a preferred visit request, not a confirmed appointment. The secure booking service will verify the property and available time.</div>
       <CTA onClick={continueInspection}>Continue to Secure Booking</CTA>
     </div>}
     {screen==='mortgage'&&<div className="lm-app-page">
       <div className="lm-heading"><small>FINANCE / GROW</small><h1>Mortgage <em>planner.</em></h1><p>Estimate repayments using your own assumptions. This is not a lender quotation.</p></div>
       <div className="lm-finance-hero">{photo(photos('/media/landshop-mobile-product-grow.webp'),'Original Landshop product photograph','lm-photo')}<div>Own more with <em>clarity.</em></div></div>
       <div className="lm-finance-fields">
        <Field label="Property price (₦)"><input type="number" min={0} max={100000000000} step={100000} value={price} onChange={e=>setPrice(Number(e.target.value)||0)}/></Field>
        <Field label="Deposit (%)"><input type="number" min={0} max={99} step={1} value={deposit} onChange={e=>setDeposit(Number(e.target.value)||0)}/></Field>
        <Field label="Interest rate (% p.a.)"><input type="number" min={0} max={100} step=".1" value={rate} onChange={e=>setRate(Number(e.target.value)||0)}/></Field>
        <Field label="Loan term (years)"><input type="number" min={1} max={40} value={years} onChange={e=>setYears(Number(e.target.value)||1)}/></Field>
       </div>
       <div className="lm-result"><small>ESTIMATED MONTHLY REPAYMENT</small><h2>{money(monthly)}</h2><p>Illustrative amortising loan; deposit and fees are excluded from repayments.</p></div>
       <div className="lm-breakdown"><h3>Payment breakdown</h3><div className="lm-donut-wrap"><div className="lm-donut" style={{background:'conic-gradient(#2ba47a 0 '+(total?principal/total*100:100)+'%,#f26b10 0)'}}><div><strong>{money(total)}</strong><small>Total</small></div></div><div><p><span className="lm-dot-green"/> Principal <strong>{money(principal)}</strong></p><p><span className="lm-dot-orange"/> Interest <strong>{money(interest)}</strong></p></div></div></div>
       <div className="lm-two-actions"><CTA onClick={()=>window.location.assign(SITE+'/mortgage-calculator')}>Full Calculator</CTA><CTA secondary onClick={()=>window.location.assign(SITE+'/contact')}>Advisor</CTA></div>
     </div>}
     {screen==='saved'&&<div className="lm-app-page"><div className="lm-heading"><h1>Saved <em>estates.</em></h1><p>Your favourites are saved on this device, not to your online account.</p></div>{saved.length?<div className="lm-property-list">{properties.filter(p=>saved.includes(p.slug)).map(p=>feature(p))}</div>:<div className="lm-empty"><Icon name="heart" size={40}/><h2>Nothing saved yet.</h2><p>Explore the portfolio and tap the heart on an estate.</p><CTA onClick={()=>go('explore')}>Explore Estates</CTA></div>}</div>}
     {screen==='referrals'&&<div className="lm-app-page"><div className="lm-heading"><small>REFER &amp; GROW</small><h1>Share the <em>opportunity.</em></h1><p>Use your personal invitation code, shareable link and secure referral dashboard.</p></div>
      <div className="lm-referral-hero">{photo(photos('/media/landshop-mobile-site-client-inspection.webp'),'Landshop team with a client at a property inspection','lm-photo')}<div><span>LANDSHOP REFERRALS</span><h2>Grow together.</h2></div></div>
      <MobileReferralPanel signedIn={signedIn} onSignIn={()=>go('signin')}/>
     </div>}
     {screen==='notices'&&<div className="lm-app-page"><div className="lm-heading"><h1>Account <em>updates.</em></h1><p>See the latest recorded status of your property applications.</p></div>
      <MobileActivityPanel signedIn={signedIn} onSignIn={()=>go('signin')}/>
     </div>}
     {screen==='profile'&&<div className="lm-app-page"><div className="lm-heading"><h1>My <em>profile.</em></h1><p>Manage your account and personalise your Landshop experience.</p></div><div className="lm-profile-card"><div className="lm-avatar"><Icon name="user" size={29}/></div><div><strong>{signedIn?(name||'Landshop customer'):'Guest visitor'}</strong><small>{signedIn?userEmail:'Sign in to manage your profile'}</small></div></div><div className="lm-profile-links">
      <button onClick={()=>openSecureCustomer('account')}><Icon name="user"/> Account & settings <Icon name="arrow"/></button>
      <button onClick={()=>openSecureCustomer('applications')}><Icon name="bookmark"/> My applications <Icon name="arrow"/></button>
      <button onClick={()=>openSecureCustomer('kyc')}><Icon name="shield"/> Identity verification <Icon name="arrow"/></button>
      <button onClick={()=>go('saved')}><Icon name="heart"/> Saved estates <Icon name="arrow"/></button>
      <button onClick={()=>go('referrals')}><Icon name="users"/> Referral centre <Icon name="arrow"/></button>
      <button onClick={installApp}><Icon name="download"/> {installed?'Added to Home Screen':'Install mobile app'} <Icon name="arrow"/></button>
      <button onClick={()=>window.location.assign(SITE+'/contact')}><Icon name="phone"/> Contact Landshop <Icon name="arrow"/></button>
     </div><button className="lm-profile-auth" onClick={()=>signedIn?void logout():go('signin')}>{signedIn?'Sign Out':'Sign In / Create Account'}</button></div>}
     </>}
     {feedback&&<div className="lm-feedback" role="status" aria-live="polite">{feedback}<button aria-label="Dismiss message" onClick={()=>setFeedback('')}><Icon name="close" size={15}/></button></div>}
    </div>
    {menuOpen&&<div className="lm-drawer-layer"><button className="lm-drawer-scrim" aria-label="Close navigation" onClick={()=>setMenuOpen(false)}/><aside className="lm-drawer" aria-label="Customer navigation"><div className="lm-drawer-head"><strong>My Landshop</strong><button onClick={()=>setMenuOpen(false)} aria-label="Close menu"><Icon name="close"/></button></div><div className="lm-drawer-identity"><Icon name="user"/><div><strong>{signedIn?(name||'Customer'):'Welcome, guest'}</strong><small>{signedIn?userEmail:'Sign in to access your dashboard'}</small></div></div><button onClick={()=>go('home')}><Icon name="home"/> Home</button><button onClick={()=>signedIn?openSecureCustomer('applications'):go('signin')}><Icon name="chart"/> My Dashboard</button>{([['property','Property & inspections'],['account','My account'],['services','Services & finance']] as const).map(([key,title])=><div key={key} className="lm-drawer-group"><button aria-expanded={expandedMenu===key} onClick={()=>setExpandedMenu(expandedMenu===key?null:key)}>{title}<Icon name="chevron"/></button>{expandedMenu===key&&<div className="lm-drawer-children">{key==='property'?<><button onClick={()=>go('explore')}>Explore estates</button><button onClick={()=>go('saved')}>Saved properties</button><button onClick={()=>go('inspection')}>Book inspection</button><button onClick={()=>openSecureCustomer('applications')}>Applications</button></>:key==='account'?<><button onClick={()=>go('profile')}>My profile</button><button onClick={()=>openSecureCustomer('account')}>Account settings</button><button onClick={()=>openSecureCustomer('kyc')}>Identity verification</button></>:<><button onClick={()=>go('mortgage')}>Mortgage planner</button><button onClick={()=>go('referrals')}>Referral centre</button><button onClick={()=>go('notices')}>Activity & updates</button></>}</div>}</div>)}<button onClick={()=>signedIn?void logout():go('signin')}><Icon name="user"/>{signedIn?'Log out':'Sign in / Sign up'}</button></aside></div>}
    {['home','explore','property','inspection','mortgage','saved','referrals','notices','profile'].includes(screen)&&<nav className="lm-tabbar" aria-label="Mobile app navigation">
     {([['home','home','Home'],['explore','search','Explore'],['referrals','chart','Dashboard'],['notices','bell','Activity'],['profile','user','Profile']] as [Screen,IconName,string][]).map(([key,icon,label])=><button key={key} onClick={()=>key==='referrals'&&signedIn?openSecureCustomer('applications'):go(key)} className={screen===key?'active':''} aria-current={screen===key?'page':undefined}><Icon name={icon} size={21}/><span>{label}</span></button>)}
    </nav>}
    <div className="lm-home-indicator" aria-hidden="true"><i/></div>
   </div>
   <div className="lm-desktop-aside"><span className="lm-live-tag">LIVE MOBILE EXPERIENCE</span><h2>Landshop.<br/><em>Made for mobile.</em></h2><p>The approved iPhone-style customer experience, using Landshop owner photography and secure account services.</p><div className="lm-aside-links"><button onClick={()=>go('onboarding')}>Onboarding</button><button onClick={()=>go('signup')}>Create account</button><button onClick={()=>go('signin')}>Sign in</button><button onClick={()=>go('home')}>Home</button><button onClick={()=>go('explore')}>Explore</button><button onClick={()=>go('property')}>Estate details</button><button onClick={()=>go('inspection')}>Book inspection</button><button onClick={()=>go('mortgage')}>Mortgage</button><button onClick={()=>go('referrals')}>Referrals</button><button onClick={()=>go('profile')}>Profile</button></div><p className="lm-aside-small">Install this secure mobile web app from your phone browser. Native iOS and Android packages are separate release builds.</p></div>
  </main>;
}
