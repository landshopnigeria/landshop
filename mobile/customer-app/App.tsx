import React,{useEffect,useMemo,useRef,useState} from 'react';
import {ActivityIndicator,Image,ImageBackground,KeyboardAvoidingView,Linking,Platform,Pressable,SafeAreaView,ScrollView,Share,StatusBar,StyleSheet,Text,TextInput,View,useWindowDimensions} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import type {Session} from '@supabase/supabase-js';
import {supabase} from './src/supabase';
import {parseInboundUrl} from './src/auth-links';
import {finishNativeAuthentication,nativeAuthEnabled,nativeCallbackUrl,signInWithNativeGoogle,webCallbackUrl} from './src/native-auth';

type Page='signin'|'signup'|'verify'|'reset-password'|'dashboard'|'referrals'|'kyc'|'profile';
type Summary={total_referrals:number;email_verified:number;kyc_verified:number;approved_applications:number};
const green='#078a6b',ink='#123a32',orange='#e97721',muted='#688278';
const portal='https://portal.landshopnigeria.com',app='https://app.landshopnigeria.com';
const logo=portal+'/media/logo.webp';
const building=portal+'/media/auth-landshop-building.jpg';
const signinPhoto=portal+'/media/auth-landshop-signin-staff.jpg';
const signupPhoto=portal+'/media/auth-landshop-signup-staff.jpg';
const pattern=/^LANDSHOP[0-9]{2,12}$/;
function navigateWebsite(url:string){Linking.openURL(url).catch(()=>{});}
function Brand(){return <Pressable onPress={()=>navigateWebsite('https://www.landshopnigeria.com')} accessibilityLabel="Landshop homepage"><Image source={{uri:logo}} resizeMode="contain" style={{width:155,height:63,alignSelf:'center'}}/></Pressable>}
function Primary({label,onPress,loading=false}:{label:string;onPress:()=>void;loading?:boolean}){
 return <Pressable disabled={loading} onPress={onPress} accessibilityRole="button" style={{marginTop:8,opacity:loading ? 0.65 : 1}}>
  <LinearGradient colors={['#072e2b','#039e75']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.primary}>{loading?<ActivityIndicator color="white"/>:<Text style={styles.primaryText}>{label}</Text>}</LinearGradient>
 </Pressable>;
}
function Field({title,value,onChange,placeholder,secure=false,keyboardType='default',autoCapitalize='none'}:{
 title:string;value:string;onChange:(next:string)=>void;placeholder?:string;secure?:boolean;
 keyboardType?:'default'|'email-address'|'phone-pad'|'number-pad';autoCapitalize?:'none'|'words'
}){
 return <View style={{marginBottom:11}}><Text style={styles.fieldLabel}>{title}</Text>
 <TextInput accessibilityLabel={title} style={styles.field} placeholderTextColor="#84968e"
  placeholder={placeholder} value={value} onChangeText={onChange} secureTextEntry={secure}
  keyboardType={keyboardType} autoCapitalize={autoCapitalize}
  autoCorrect={false} textContentType={secure?'password':undefined}/></View>;
}
function Action({label,onPress}:{label:string;onPress:()=>void}){return <Pressable onPress={onPress} style={styles.action}><Text style={styles.actionText}>{label}</Text><Text style={{color:green,fontSize:22}}>›</Text></Pressable>}
function Caption({children}:{children:React.ReactNode}){return <Text style={styles.caption}>{children}</Text>}
export default function App(){
 const [session,setSession]=useState<Session|null>(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
 const [page,setPage]=useState<Page>('signin'),[step,setStep]=useState<1|2>(1),[notice,setNotice]=useState('');
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState('');
 const [newPassword,setNewPassword]=useState(''),[newPasswordConfirm,setNewPasswordConfirm]=useState('');
 const processingLinks=useRef(new Set<string>()),recoveryInProgress=useRef(false);
 const [first,setFirst]=useState(''),[last,setLast]=useState(''),[phone,setPhone]=useState(''),[username,setUsername]=useState(''),[age,setAge]=useState(''),[gender,setGender]=useState(''),[accepted,setAccepted]=useState(false);
 const [referral,setReferral]=useState(''),[code,setCode]=useState(''),[kyc,setKyc]=useState('not_started');
 const [wallet,setWallet]=useState(0),[applications,setApplications]=useState(0),[summary,setSummary]=useState<Summary|null>(null);
 const {width}=useWindowDimensions();
 const large=width>=680;
 const invite=useMemo(()=>code?portal+'/?mode=signup&ref='+encodeURIComponent(code):'', [code]);
 useEffect(()=>{
  let mounted=true;
  supabase.auth.getSession().then(({data})=>{
   if(mounted){setSession(data.session);setPage(current=>data.session&&current==='signin'?'dashboard':current);setLoading(false);}
  }).catch(()=>{if(mounted)setLoading(false)});
  const {data:{subscription}}=supabase.auth.onAuthStateChange((event,s)=>{
   if(!mounted)return;
   setSession(s);
   if(event==='PASSWORD_RECOVERY'){recoveryInProgress.current=true;setPage('reset-password');}
   else if(s){setPage(current=>recoveryInProgress.current?'reset-password':current==='verify'?'verify':'dashboard');}
   else setPage(current=>['signup','verify','reset-password'].includes(current)?current:'signin');
  });
  const incoming=async(raw:string|null|undefined)=>{
   if(!mounted)return;
   const link=parseInboundUrl(raw);
   if(link.kind==='invitation'){
    const {data}=await supabase.auth.getSession();
    if(!mounted)return;
    if(data.session){setNotice('Referral invitations are for new registrations. Your existing Landshop account is unchanged.');setPage('dashboard');return;}
    setReferral(link.referral);setPage('signup');setStep(1);return;
   }
   if(link.kind==='auth-error'){setNotice(link.message);setPage('signin');return;}
   if(link.kind!=='auth-code'&&link.kind!=='auth-token')return;
   const identifier=link.kind==='auth-code'?'code:'+link.code:'token:'+link.tokenHash;
   if(processingLinks.current.has(identifier))return;
   processingLinks.current.add(identifier);
   if((link.kind==='auth-code'&&link.recovery)||(link.kind==='auth-token'&&link.otpType==='recovery'))recoveryInProgress.current=true;
   setBusy(true);setNotice('');
   try{
    const recovery=await finishNativeAuthentication(link);
    if(!mounted)return;
    if(recovery){setPage('reset-password');setNotice('Set a new password for your Landshop account.');}
    else{setPage('dashboard');setNotice('Your Landshop account is verified.');}
   }catch(err){
    if(!mounted)return;
    processingLinks.current.delete(identifier);recoveryInProgress.current=false;
    setNotice(err instanceof Error?err.message:'The authentication link could not be verified.');
    setPage('signin');
   }finally{if(mounted)setBusy(false)}
  };
  Linking.getInitialURL().then(incoming).catch(()=>{});
  const listener=Linking.addEventListener('url',e=>{void incoming(e.url)});
  return()=>{mounted=false;subscription.unsubscribe();listener.remove()};
 },[]);
 useEffect(()=>{
  if(!session?.user)return;
  const id=session.user.id;
  Promise.all([
   supabase.from('profiles').select('kyc_status').eq('id',id).maybeSingle(),
   supabase.from('referral_codes').select('code').eq('user_id',id).maybeSingle(),
   supabase.from('referral_wallets').select('available_kobo').eq('user_id',id).maybeSingle(),
   supabase.from('applications').select('id',{count:'exact',head:true}).eq('applicant_id',id),
   supabase.rpc('landshop_referral_summary')
  ]).then(([p,c,w,a,s])=>{
   setKyc(p.data?.kyc_status||'not_started');
   setCode(c.data?.code||'');
   setWallet(Number(w.data?.available_kobo||0));
   setApplications(a.count||0);
   setSummary(Array.isArray(s.data)?s.data[0]||null:null);
  }).catch(()=>setNotice('Unable to refresh your account information.'));
 },[session?.user?.id]);
 function switchPage(next:Page){setPage(next);setNotice('');}
 function basicValid(){return !!first.trim()&&!!last.trim()&&/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)&&/^\+?[0-9 ()-]{8,20}$/.test(phone);}
 async function signIn(){
  if(!email.trim()||!password){setNotice('Enter your email and password.');return;}
  setBusy(true);setNotice('');
  try{const {error}=await supabase.auth.signInWithPassword({email:email.trim().toLowerCase(),password});if(error)throw error;setPassword('');setPage('dashboard');}
  catch(e){setNotice(e instanceof Error?e.message:'Unable to sign in.')}
  finally{setBusy(false);}
 }
 async function signUp(){
  if(!basicValid()){setNotice('Complete your name, valid email and phone details.');setStep(1);return;}
  if(!/^[a-zA-Z][a-zA-Z0-9_.]{2,29}$/.test(username)){setNotice('Choose a valid username (3–30 characters).');return;}
  if(!age||Number(age)<18||Number(age)>120){setNotice('Registration requires a minimum age of 18.');return;}
  if(password.length<12||password!==confirm){setNotice('Password must contain at least 12 characters and match confirmation.');return;}
  if(!accepted){setNotice('Please accept the Terms and Privacy Policy.');return;}
  setBusy(true);setNotice('');
  try{
   const {data,error}=await supabase.auth.signUp({email:email.trim().toLowerCase(),password,options:{
    emailRedirectTo:nativeAuthEnabled?nativeCallbackUrl:webCallbackUrl,
    data:{full_name:(first.trim()+' '+last.trim()),phone:phone.trim(),username:username.trim().toLowerCase(),age:Number(age),gender,
     ...(pattern.test(referral)?{referral_code:referral}:{})}
   }});
   if(error)throw error;
   setPassword('');setConfirm('');setPage(data.session?'dashboard':'verify');
  }catch(e){setNotice(e instanceof Error?e.message:'Unable to create your account.');}
  finally{setBusy(false);}
 }
 async function forgotPassword(){
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){setNotice('Enter your email to request a secure reset link.');return;}
  setBusy(true);try{
   const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:nativeAuthEnabled?nativeCallbackUrl+'?type=recovery':portal+'/auth/callback?type=recovery'});
   if(error)throw error;setNotice('If this email is registered, a password reset link has been requested.');
  }catch{setNotice('Unable to request a reset link. Please try again.');}finally{setBusy(false);}
 }
 async function resend(){
  setBusy(true);try{
   const {error}=await supabase.auth.resend({type:'signup',email:email.trim().toLowerCase(),options:{emailRedirectTo:nativeAuthEnabled?nativeCallbackUrl:webCallbackUrl}});
   if(error)throw error;setNotice('A new confirmation email has been requested.');
  }catch{setNotice('Unable to resend verification email.');}finally{setBusy(false);}
 }
 async function signOut(){await supabase.auth.signOut({scope:'local'});recoveryInProgress.current=false;setSession(null);setPage('signin');setPassword('');setCode('');setSummary(null);}
 async function google(){
  if(!nativeAuthEnabled){navigateWebsite(portal+(page==='signup'?'?mode=signup':''));return;}
  setBusy(true);setNotice('');
  try{
   const authUrl=await signInWithNativeGoogle(page==='signup'?referral:'');
   if(!authUrl){setNotice('Google sign-in did not return a callback.');return;}
   if(authUrl.startsWith('landshop:'))await handleGoogleUrl(authUrl);
   else setNotice(authUrl);
  }catch(err){setNotice(err instanceof Error?err.message:'Unable to complete Google sign-in.');}
  finally{setBusy(false)}
 }
 async function handleGoogleUrl(url:string){
  const link=parseInboundUrl(url);
  if(link.kind!=='auth-code'&&link.kind!=='auth-token')return;
  const key=link.kind==='auth-code'?'code:'+link.code:'token:'+link.tokenHash;
  if(processingLinks.current.has(key))return;
  processingLinks.current.add(key);
  try{const recovery=await finishNativeAuthentication(link);setPage(recovery?'reset-password':'dashboard');}
  catch(err){processingLinks.current.delete(key);setNotice(err instanceof Error?err.message:'Google sign-in could not be completed.');}
 }
 async function updateRecoveredPassword(){
  if(newPassword.length<12||newPassword!==newPasswordConfirm){setNotice('Choose at least 12 characters and confirm the new password.');return;}
  if(!recoveryInProgress.current){setNotice('Open a valid recovery email link to reset your password.');return;}
  setBusy(true);setNotice('');
  try{
   const {error}=await supabase.auth.updateUser({password:newPassword});
   if(error)throw error;
   recoveryInProgress.current=false;setNewPassword('');setNewPasswordConfirm('');
   setPage('dashboard');setNotice('Your Landshop password has been updated.');
  }catch(err){setNotice(err instanceof Error?err.message:'Password update was unsuccessful.');}
  finally{setBusy(false)}
 }
 async function copy(){if(!invite)return;await Clipboard.setStringAsync(invite);setNotice('Referral link copied.');}
 async function share(){if(!invite)return;await Share.share({message:'Join Landshop Nigeria: '+invite,url:invite,title:'Landshop Referral'});}
 const header=<Brand/>;
 const auth=page==='signin'||page==='signup'||page==='verify'||page==='reset-password';
 const authForm=<View style={[styles.formCard,{maxWidth:large?520:480}]}>
  {header}
  {page!=='verify'&&page!=='reset-password'&&<View style={styles.tabs}><Pressable accessibilityRole="button" onPress={()=>switchPage('signin')} style={[styles.tab,page==='signin'&&styles.tabActive]}><Text style={[styles.tabText,page==='signin'&&styles.tabTextActive]}>Sign In</Text></Pressable><Pressable accessibilityRole="button" onPress={()=>{switchPage('signup');setStep(1)}} style={[styles.tab,page==='signup'&&styles.tabActive]}><Text style={[styles.tabText,page==='signup'&&styles.tabTextActive]}>Sign Up</Text></Pressable></View>}
  {page==='signin'&&<><Text style={styles.heading}>Welcome <Text style={styles.accent}>Back</Text></Text>
   <Caption>Sign in to your Landshop Nigeria account</Caption>
   <Field title="Email address" value={email} onChange={setEmail} placeholder="you@example.com" keyboardType="email-address"/>
   <Field title="Password" value={password} onChange={setPassword} placeholder="Enter your password" secure/>
   <Pressable onPress={forgotPassword} style={{alignSelf:'flex-end',paddingVertical:5}}><Text style={styles.inlineLink}>Forgot password?</Text></Pressable>
   <Primary label="Sign In →" loading={busy} onPress={signIn}/>
   <Text style={styles.footerPrompt}>Don't have an account? <Text style={styles.inlineLink} onPress={()=>{switchPage('signup');setStep(1)}}>Sign Up</Text></Text>
   <Pressable style={styles.google} disabled={busy} onPress={google}><Text style={styles.googleText}>{nativeAuthEnabled?'Continue with Google':'Continue with Google on Website'}</Text></Pressable>
  </>}
  {page==='signup'&&<><Text style={styles.stepText}>STEP {step} OF 2</Text><View style={styles.stepBar}><View style={styles.progressActive}/><View style={[styles.progressActive,{backgroundColor:step===2?green:'#e0e8e3'}]}/></View>
   <Text style={styles.heading}>Create Your <Text style={styles.accent}>Account</Text></Text>
   <Caption>Join Landshop Nigeria and begin your property journey.</Caption>
   {referral?<Text style={styles.refNotice}>Invitation: {referral}</Text>:null}
   {step===1?<><Field title="First name" value={first} onChange={setFirst} placeholder="First name" autoCapitalize="words"/>
    <Field title="Last name" value={last} onChange={setLast} placeholder="Last name" autoCapitalize="words"/>
    <Field title="Email address" value={email} onChange={setEmail} placeholder="you@example.com" keyboardType="email-address"/>
    <Field title="WhatsApp / phone" value={phone} onChange={setPhone} placeholder="+234 800 000 0000" keyboardType="phone-pad"/>
    <Primary label="Next →" onPress={()=>{if(!basicValid())setNotice('Enter a valid name, email and phone number.');else{setNotice('');setStep(2);}}}/></>:
   <><Field title="Username" value={username} onChange={setUsername} placeholder="Preferred username"/>
    <View style={styles.row}><View style={styles.half}><Field title="Age" value={age} onChange={setAge} placeholder="18+" keyboardType="number-pad"/></View>
    <View style={styles.half}><Text style={styles.fieldLabel}>Gender (optional)</Text><Pressable style={styles.field} onPress={()=>setGender(gender===''?'female':gender==='female'?'male':gender==='male'?'prefer-not-to-say':'')}><Text style={{color:gender?ink:muted}}>{gender||'Select a gender'}</Text></Pressable></View></View>
    <Field title="Password" value={password} onChange={setPassword} placeholder="Minimum 12 characters" secure/>
    <Field title="Confirm password" value={confirm} onChange={setConfirm} placeholder="Re-enter password" secure/>
    <Pressable style={styles.checkrow} onPress={()=>setAccepted(!accepted)}><Text style={{color:green,fontSize:20}}>{accepted?'☑':'□'}</Text><Text style={{flex:1,color:ink,fontSize:11}}>I agree to Landshop's Terms and Privacy Policy.</Text></Pressable>
    <Pressable onPress={()=>navigateWebsite('https://www.landshopnigeria.com/privacy')}><Text style={styles.inlineLink}>Read Privacy Policy</Text></Pressable>
    <Pressable onPress={()=>{setStep(1);setNotice('')}}><Text style={styles.inlineLink}>← Previous step</Text></Pressable>
    <Primary label="Create Account →" loading={busy} onPress={signUp}/></>}
   <Text style={styles.footerPrompt}>Already have an account? <Text style={styles.inlineLink} onPress={()=>switchPage('signin')}>Sign In</Text></Text>
   <Pressable style={styles.google} disabled={busy} onPress={google}><Text style={styles.googleText}>{nativeAuthEnabled?'Continue with Google':'Continue with Google on Website'}</Text></Pressable>
  </>}
  {page==='verify'&&<><Text style={styles.verifyIcon}>✉</Text><Text style={styles.heading}>Verify Your <Text style={styles.accent}>Email</Text></Text>
   <Caption>We sent a confirmation link to {email}. {nativeAuthEnabled?'Open it to return securely to this app.':'Open it to confirm your account, then sign in here.'}</Caption>
   <Primary label="Open Email App" onPress={()=>navigateWebsite('mailto:')}/>
   <Pressable style={styles.google} onPress={resend} disabled={busy}><Text style={styles.googleText}>Resend Email</Text></Pressable>
   <Pressable style={{marginTop:15,alignSelf:'center'}} onPress={()=>switchPage('signin')}><Text style={styles.inlineLink}>Back to Sign In</Text></Pressable>
  </>}
  {page==='reset-password'&&<><Text style={styles.verifyIcon}>✓</Text>
   <Text style={styles.heading}>Set New <Text style={styles.accent}>Password</Text></Text>
   <Caption>Create a new password for your verified Landshop account.</Caption>
   <Field title="New password" value={newPassword} onChange={setNewPassword} placeholder="Minimum 12 characters" secure/>
   <Field title="Confirm new password" value={newPasswordConfirm} onChange={setNewPasswordConfirm} placeholder="Repeat your new password" secure/>
   <Primary label="Update Password" loading={busy} onPress={updateRecoveredPassword}/>
  </>}
  {!!notice&&<Text accessibilityRole="alert" style={styles.message}>{notice}</Text>}
 </View>;
 const overview=<><Text style={styles.overline}>LANDSHOP CUSTOMER ACCOUNT</Text>
  <Text style={[styles.heading,{textAlign:'left',fontSize:31,marginBottom:7}]}>Welcome to <Text style={styles.accent}>Landshop</Text></Text>
  <Text style={{fontSize:13,color:muted,marginBottom:20}}>{session?.user.email}</Text>
  <Pressable onPress={()=>switchPage('kyc')} style={styles.kycBadge}><Text style={{color:green,fontWeight:'700'}}>✓  KYC: {kyc.replaceAll('_',' ')}</Text><Text style={{color:green,fontSize:20}}>›</Text></Pressable>
  <View style={styles.quickGrid}>
   {[['Invest in Property',()=>navigateWebsite('https://www.landshopnigeria.com/properties')],['Refer & Grow',()=>switchPage('referrals')],['Build Wealth',()=>navigateWebsite(portal+'/applications/incubate-investment')],['Applications',()=>navigateWebsite(app+'/dashboard/applications')],['Referral Wallet',()=>switchPage('referrals')],['Support',()=>navigateWebsite(portal+'/support')]].map(([title,go])=><Pressable key={String(title)} style={styles.quickCard} onPress={go as ()=>void}><Text style={styles.quickIcon}>⌂</Text><Text style={styles.quickText}>{String(title)}</Text></Pressable>)}
  </View>
  <View style={styles.row}><View style={[styles.summaryCard,styles.half]}><Text style={styles.summaryTitle}>Applications</Text><Text style={styles.summaryNumber}>{applications}</Text></View><View style={[styles.summaryCard,styles.half]}><Text style={styles.summaryTitle}>Approved Wallet</Text><Text style={styles.summaryNumber}>{new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0}).format(wallet/100)}</Text></View></View>
  <Action label="My referral link and QR" onPress={()=>switchPage('referrals')}/>
  <Action label="Identity verification" onPress={()=>switchPage('kyc')}/>
 </>;
 const refScreen=<><Text style={styles.overline}>REFER & GROW</Text><Text style={styles.heading}>Your Referral <Text style={styles.accent}>Centre</Text></Text>
  {code?<><View style={styles.summaryCard}><Text style={styles.summaryTitle}>Unique Landshop referral code</Text><Text style={[styles.summaryNumber,{fontSize:30}]}>{code}</Text><Text style={styles.linkText}>{invite}</Text>
    <View style={styles.row}><View style={styles.half}><Primary label="Copy Link" onPress={copy}/></View><View style={styles.half}><Primary label="Share" onPress={share}/></View></View></View>
    <View style={[styles.summaryCard,{alignItems:'center'}]}><QRCode value={invite} size={194} backgroundColor="#fff" color="#0a342b"/><Text style={{marginTop:12,fontWeight:'700',color:ink}}>Scan to register</Text><Caption>Every scan opens your personal Landshop registration link.</Caption></View>
    <View style={styles.row}><View style={[styles.summaryCard,styles.half]}><Text style={styles.summaryTitle}>Registrations</Text><Text style={styles.summaryNumber}>{summary?.total_referrals||0}</Text></View><View style={[styles.summaryCard,styles.half]}><Text style={styles.summaryTitle}>KYC Approved</Text><Text style={styles.summaryNumber}>{summary?.kyc_verified||0}</Text></View></View>
    <Text style={{fontSize:11,color:muted,lineHeight:17}}>Rewards are recorded only after authorized financial approval. Invitations alone do not earn a commission.</Text>
   </>:<Text style={styles.message}>Your personal code is being prepared. Refresh your account to check again.</Text>}</>;
 const kycScreen=<><Text style={styles.overline}>ACCOUNT VERIFICATION</Text><Text style={styles.heading}>Verify Your <Text style={styles.accent}>Identity</Text></Text>
   <Caption>Protect your account and complete Landshop's secure identity review.</Caption>
   <View style={styles.summaryCard}><Text style={styles.summaryTitle}>Current verification status</Text><Text style={styles.summaryNumber}>{kyc.replaceAll('_',' ')}</Text></View>
   {['Personal information','ID document upload','Selfie verification','Address confirmation','Landshop review'].map((label,i)=><View key={label} style={styles.kycStep}><Text style={styles.kycNumber}>{i+1}</Text><Text style={{color:ink,flex:1,fontWeight:'600'}}>{label}</Text><Text style={{color:muted}}>›</Text></View>)}
   <Primary label="Continue KYC Securely" onPress={()=>navigateWebsite(app+'/dashboard/kyc')}/>
   <Text style={{fontSize:11,color:muted,lineHeight:18,marginTop:12}}>The full document and selfie capture currently opens Landshop's authenticated web KYC. Native capture is not yet enabled.</Text>
 </>;
 const profileScreen=<><Text style={styles.overline}>MY ACCOUNT</Text><Text style={styles.heading}>Account & <Text style={styles.accent}>Security</Text></Text><Action label="Manage account profile" onPress={()=>navigateWebsite(app+'/dashboard/account')}/><Action label="My applications" onPress={()=>navigateWebsite(app+'/dashboard/applications')}/><Action label="Landshop website" onPress={()=>navigateWebsite('https://www.landshopnigeria.com')}/><Primary label="Sign Out" onPress={signOut}/></>;
 return <SafeAreaView style={styles.root}><StatusBar barStyle="dark-content"/>
 {loading?<View style={styles.loader}><ActivityIndicator color={green} size="large"/><Text style={{marginTop:12,color:muted}}>Opening Landshop securely…</Text></View>:
 auth?<ImageBackground source={{uri:page==='signup'?signupPhoto:signinPhoto}} resizeMode="cover" style={styles.background}>
   <View style={styles.backgroundTint}/>
   <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.authCenter}>
     <View style={{width:'100%',maxWidth:large?520:480}}>{authForm}</View>
    </ScrollView>
   </KeyboardAvoidingView>
 </ImageBackground>:
 <View style={{flex:1,backgroundColor:'#f1f7f3'}}>
  <View style={styles.topbar}><Brand/><Text style={{color:green,fontWeight:'800',fontSize:12}}>MY LANDSHOP</Text></View>
  <ScrollView contentContainerStyle={styles.screenPad} showsVerticalScrollIndicator={false}>
   {page==='dashboard'?overview:page==='referrals'?refScreen:page==='kyc'?kycScreen:profileScreen}
   {!!notice&&<Text style={styles.message}>{notice}</Text>}
  </ScrollView>
  <View style={styles.dock}>{[['Home','dashboard'],['Properties','properties'],['Refer','referrals'],['KYC','kyc'],['Account','profile']].map(([label,target])=><Pressable key={label} onPress={()=>target==='properties'?navigateWebsite('https://www.landshopnigeria.com/properties'):switchPage(target as Page)} style={styles.dockItem}><Text style={{fontSize:19,color:page===target?green:muted}}>{label==='Home'?'⌂':label==='Refer'?'↗':label==='KYC'?'✓':label==='Account'?'◉':'⌕'}</Text><Text style={{fontSize:10,color:page===target?green:muted,fontWeight:'700'}}>{label}</Text></Pressable>)}</View>
 </View>}
 </SafeAreaView>;
}
const styles=StyleSheet.create({
 root:{flex:1,backgroundColor:'#f5f9f6'},loader:{flex:1,alignItems:'center',justifyContent:'center'},
 background:{flex:1,justifyContent:'center'},backgroundTint:{...StyleSheet.absoluteFill,backgroundColor:'rgba(232,241,236,.55)'},
 authCenter:{flexGrow:1,justifyContent:'center',alignItems:'center',paddingHorizontal:16,paddingVertical:20},
 formCard:{width:'100%',alignSelf:'center',backgroundColor:'rgba(255,255,255,.93)',borderColor:'rgba(255,255,255,.98)',borderWidth:1,borderRadius:25,paddingHorizontal:22,paddingTop:16,paddingBottom:22,shadowColor:'#06372a',shadowOpacity:.18,shadowRadius:24,elevation:12},
 tabs:{flexDirection:'row',alignSelf:'center',backgroundColor:'#e4eee9',borderRadius:12,padding:3,marginBottom:14,marginTop:2,width:245},
 tab:{flex:1,padding:11,alignItems:'center',borderRadius:10},tabActive:{backgroundColor:'white',borderBottomWidth:2,borderBottomColor:green},
 tabText:{color:'#718c80',fontWeight:'700',fontSize:13},tabTextActive:{color:green},
 heading:{fontSize:26,fontWeight:'800',color:ink,textAlign:'center',letterSpacing:-.7,lineHeight:34,marginBottom:2},
 accent:{color:green,textDecorationLine:'underline',textDecorationColor:orange},caption:{fontSize:12,color:muted,textAlign:'center',lineHeight:19,marginBottom:16,marginTop:4},
 fieldLabel:{color:'#456e5e',fontSize:11,fontWeight:'700',marginBottom:6},
 field:{borderColor:'#ceded4',borderWidth:1,backgroundColor:'#fff',borderRadius:11,height:47,paddingHorizontal:12,justifyContent:'center',fontSize:13,color:ink},
 primary:{height:48,borderRadius:11,alignItems:'center',justifyContent:'center'},primaryText:{color:'white',fontSize:14,fontWeight:'800'},
 inlineLink:{color:green,fontWeight:'800',fontSize:12},
 footerPrompt:{fontSize:12,color:muted,textAlign:'center',marginVertical:14},
 google:{borderWidth:1,borderColor:'#d8e7dc',backgroundColor:'#fff',alignItems:'center',padding:14,borderRadius:10,marginTop:3},
 googleText:{fontWeight:'700',fontSize:12,color:ink},
 message:{marginTop:13,borderRadius:9,backgroundColor:'#eaf8ef',padding:11,fontSize:12,lineHeight:18,color:'#075c45'},
 stepText:{textAlign:'center',fontSize:10,letterSpacing:2,color:green,fontWeight:'800',marginTop:5},
 stepBar:{flexDirection:'row',gap:6,alignSelf:'center',marginVertical:9},
 progressActive:{width:45,height:4,backgroundColor:green,borderRadius:4},
 refNotice:{textAlign:'center',color:green,fontSize:11,marginBottom:10},
 row:{flexDirection:'row',alignItems:'stretch',gap:10},half:{flex:1,minWidth:0},
 checkrow:{display:'flex',flexDirection:'row',alignItems:'center',gap:7,paddingVertical:7},
 verifyIcon:{fontSize:48,color:orange,textAlign:'center',marginVertical:15},
 topbar:{height:70,backgroundColor:'#fff',borderBottomWidth:1,borderBottomColor:'#e4eee8',paddingHorizontal:18,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
 screenPad:{paddingHorizontal:17,paddingTop:26,paddingBottom:48},
 overline:{color:green,letterSpacing:1.5,fontSize:10,fontWeight:'800',marginBottom:9},
 kycBadge:{padding:14,backgroundColor:'#fff',borderColor:'#d9ebe0',borderWidth:1,borderRadius:13,flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:15},
 quickGrid:{flexDirection:'row',flexWrap:'wrap',gap:9,marginBottom:18},
 quickCard:{width:'31%',minWidth:100,flexGrow:1,minHeight:105,borderRadius:14,backgroundColor:'#fff',borderColor:'#e3efe7',borderWidth:1,padding:13,justifyContent:'space-between'},
 quickText:{fontSize:11,fontWeight:'700',color:ink},quickIcon:{fontSize:23,color:green},
 summaryCard:{backgroundColor:'#fff',borderRadius:15,padding:17,borderColor:'#e1eee5',borderWidth:1,marginBottom:14},
 summaryTitle:{fontSize:11,color:muted,fontWeight:'700',marginBottom:7},summaryNumber:{fontSize:21,color:green,fontWeight:'800'},
 action:{backgroundColor:'#fff',paddingVertical:15,paddingHorizontal:17,borderWidth:1,borderColor:'#e0ece4',borderRadius:11,marginVertical:5,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
 actionText:{fontSize:13,color:ink,fontWeight:'700'},
 dock:{flexDirection:'row',justifyContent:'space-around',alignItems:'center',height:68,backgroundColor:'#fff',borderTopWidth:1,borderTopColor:'#e0eae2'},
 dockItem:{flex:1,alignItems:'center',justifyContent:'center',gap:2},
 linkText:{color:muted,fontSize:11,marginVertical:8},kycStep:{flexDirection:'row',alignItems:'center',gap:13,padding:15,borderColor:'#e2eee6',borderWidth:1,backgroundColor:'white',borderRadius:12,marginVertical:5},
 kycNumber:{backgroundColor:'#e6f5ec',width:28,height:28,textAlign:'center',textAlignVertical:'center',borderRadius:15,color:green,fontWeight:'800'}
});
