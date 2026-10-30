import React,{useCallback,useEffect,useState} from 'react';
import {ActivityIndicator,Linking,Pressable,ScrollView,StyleSheet,Text,TextInput,View} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import {File} from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import {supabase} from './supabase';
import {BrandIcon} from './BrandIcon';

type DocType='portrait'|'government_id'|'utility_bill';
type KycDraft={id:string;status:string;kind:string;metadata:Record<string,unknown>|null};
type ExistingDoc={document_type:string;object_path:string};
const green='#078a6b',ink='#143a30',muted='#587568';
const LIMIT=10*1024*1024;
const allowed=['image/jpeg','image/png','image/webp','application/pdf'] as const;
type AllowedMime=(typeof allowed)[number];
const docs:{type:DocType;label:string}[]=[
 {type:'portrait',label:'Current selfie / portrait'},
 {type:'government_id',label:'Government-issued identification'},
 {type:'utility_bill',label:'Recent utility bill / proof of address'}
];
const extensions:Record<AllowedMime,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','application/pdf':'pdf'};
function signatureOK(bytes:Uint8Array,mime:AllowedMime):boolean{
 if(bytes.length<12)return false;
 if(mime==='image/jpeg')return bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 if(mime==='image/png')return [137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n);
 if(mime==='application/pdf')return [37,80,68,70,45].every((n,i)=>bytes[i]===n);
 return [82,73,70,70].every((n,i)=>bytes[i]===n)&&[87,69,66,80].every((n,i)=>bytes[i+8]===n);
}
export function validateKycFile(mime:string,size:number):asserts mime is AllowedMime{
 if(!allowed.some(t=>t===mime))throw Error('Use a JPG, PNG, WebP or PDF document.');
 if(!Number.isFinite(size)||size<=0||size>LIMIT)throw Error('Each file must be between 1 byte and 10 MB.');
}
function Button({title,action,disabled=false}:{title:string;action:()=>void;disabled?:boolean}){
 return <Pressable accessibilityRole="button" disabled={disabled} onPress={action} style={[styles.btn,disabled&&{opacity:.45}]}><Text style={styles.btnText}>{title}</Text></Pressable>
}
function Input({label,value,change,lines=1}:{label:string;value:string;change:(v:string)=>void;lines?:number}){
 return <View style={{marginBottom:11}}><Text style={styles.label}>{label}</Text><TextInput accessibilityLabel={label} style={[styles.input,lines>1&&{minHeight:72,textAlignVertical:'top'}]} autoCapitalize="words" value={value} onChangeText={change} multiline={lines>1}/></View>
}
export default function KycIntake({onClose}:{onClose:()=>void}){
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 const [step,setStep]=useState<0|1|2>(0),[submission,setSubmission]=useState<KycDraft|null>(null);
 const [existing,setExisting]=useState<ExistingDoc[]>([]),[name,setName]=useState(''),[phone,setPhone]=useState('');
 const [address,setAddress]=useState(''),[state,setState]=useState(''),[city,setCity]=useState('');
 const [consent,setConsent]=useState(false);
 const retrieve=useCallback(async()=>{
  setLoading(true);setNotice('');
  try{
   const {data:{user},error:userError}=await supabase.auth.getUser();
   if(userError||!user)throw Error('Sign in again to complete identity verification.');
   if(!user.email_confirmed_at)throw Error('Please verify your email before uploading identity documents.');
   const {data,error}=await supabase.from('kyc_submissions')
    .select('id,status,kind,metadata').eq('applicant_id',user.id)
    .order('created_at',{ascending:false}).limit(1).maybeSingle();
   if(error)throw error;
   const record=(data||null) as KycDraft|null;
   setSubmission(record);
   if(record){
    const metadata=record.metadata||{};
    setName(String(metadata.fullName||''));setPhone(String(metadata.phone||''));
    setAddress(String(metadata.address||''));setState(String(metadata.state||''));setCity(String(metadata.city||''));
    setConsent(metadata.verificationConsent===true);
    const found=await supabase.from('kyc_documents').select('document_type,object_path').eq('submission_id',record.id);
    if(found.error)throw found.error;
    setExisting(found.data||[]);
   }else setExisting([]);
  }catch(error){setNotice(error instanceof Error?error.message:'Could not open KYC.');}
  finally{setLoading(false)}
 },[]);
 useEffect(()=>{void retrieve()},[retrieve]);
 const editable=!submission||submission.status==='draft';
 const info=()=>({fullName:name.trim(),phone:phone.trim(),address:address.trim(),state:state.trim(),city:city.trim(),verificationConsent:consent});
 function validateDetails(){
  if([name,phone,address,state,city].some(s=>s.trim().length<2))throw Error('Complete your legal name, phone and residential address, state and city.');
  if(!/^\+?[0-9 ()-]{8,20}$/.test(phone))throw Error('Enter a valid phone number.');
 }
 async function draft():Promise<string>{
  validateDetails();
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user||!user.email_confirmed_at)throw Error('Your verified session is required.');
  if(submission&&submission.status!=='draft')throw Error('Submitted KYC cannot be edited.');
  const metadata=info();
  if(submission){
   const {data,error}=await supabase.from('kyc_submissions')
    .update({metadata}).eq('id',submission.id).eq('applicant_id',user.id).eq('status','draft').select('id').single();
   if(error||!data)throw Error('Unable to update the secure KYC draft.');
   return data.id;
  }
  const {data,error}=await supabase.from('kyc_submissions')
   .insert({applicant_id:user.id,kind:'individual',metadata}).select('id').single();
  if(error||!data)throw Error('Unable to create your KYC draft.');
  setSubmission({id:data.id,status:'draft',kind:'individual',metadata});
  return data.id;
 }
 async function saveAndContinue(){
  if(busy)return;
  setBusy(true);setNotice('');
  try{await draft();setStep(1);setNotice('Your details are saved privately. Add your required documents.')}
  catch(e){setNotice(e instanceof Error?e.message:'Unable to save draft.')}
  finally{setBusy(false)}
 }
 async function upload(type:DocType,source:'camera'|'file'){
  if(busy)return;
  setBusy(true);setNotice('');
  try{
   if(existing.some(d=>d.document_type===type))throw Error('This document was already uploaded. Contact support if a replacement is needed.');
   let uri:string, mime:string, size:number|undefined;
   if(source==='camera'){
    if(type!=='portrait')throw Error('Camera capture is reserved for the portrait.');
    const permission=await ImagePicker.requestCameraPermissionsAsync();
    if(!permission.granted)throw Error('Camera permission is needed to capture your selfie.');
    const result=await ImagePicker.launchCameraAsync({mediaTypes:['images'],cameraType:'front',quality:0.85,exif:false});
    if(result.canceled||!result.assets?.length)return;
    const asset=result.assets[0];uri=asset.uri;mime=asset.mimeType||'image/jpeg';size=asset.fileSize;
   }else{
    const result=await DocumentPicker.getDocumentAsync({type:[...allowed],copyToCacheDirectory:true,multiple:false});
    if(result.canceled||!result.assets?.length)return;
    const asset=result.assets[0];uri=asset.uri;mime=asset.mimeType||'';size=asset.size;
   }
   const file=new File(uri);
   const fileSize=size??file.size;
   validateKycFile(mime,fileSize);
   const bytes=await file.bytes();
   validateKycFile(mime,bytes.byteLength);
   if(!signatureOK(bytes,mime))throw Error('File content does not match its declared type.');
   const submissionId=await draft();
   const {data:{user},error:authError}=await supabase.auth.getUser();
   if(authError||!user)throw Error('Sign in again to upload documents.');
   const objectPath=user.id+'/'+submissionId+'/'+type+'-'+Crypto.randomUUID()+'.'+extensions[mime];
   const content=bytes.slice().buffer;
   const uploaded=await supabase.storage.from('landshop-kyc').upload(objectPath,content,{contentType:mime,upsert:false,cacheControl:'0'});
   if(uploaded.error)throw Error('Secure upload failed. Please check your connection and retry.');
   const record=await supabase.from('kyc_documents').insert({
    applicant_id:user.id,submission_id:submissionId,document_type:type,object_path:objectPath
   });
   if(record.error){
    await supabase.storage.from('landshop-kyc').remove([objectPath]);
    throw Error('The document could not be registered. Retry or contact support.');
   }
   setExisting(previous=>[...previous,{document_type:type,object_path:objectPath}]);
   setNotice('Secure document uploaded. Your verification is still pending review.');
  }catch(e){setNotice(e instanceof Error?e.message:'Unable to upload file.');}
  finally{setBusy(false)}
 }
 async function submit(){
  if(busy)return;
  setBusy(true);setNotice('');
  try{
   if(!consent)throw Error('You must consent to identity verification before submitting.');
   const missing=docs.filter(d=>!existing.some(x=>x.document_type===d.type));
   if(missing.length)throw Error('Missing required documents: '+missing.map(d=>d.label).join(', '));
   const id=await draft();
   const {data:{user}}=await supabase.auth.getUser();
   if(!user)throw Error('Your session has expired.');
   const {data,error}=await supabase.from('kyc_submissions')
    .update({status:'submitted'}).eq('id',id).eq('applicant_id',user.id).eq('status','draft').select('status').single();
   if(error||!data)throw Error('Submission was not accepted. Your draft remains saved.');
   setSubmission(previous=>previous?{...previous,status:'submitted'}:previous);
   setStep(2);setNotice('KYC submitted for review. Landshop has not yet verified or approved your identity.');
  }catch(e){setNotice(e instanceof Error?e.message:'Unable to submit KYC.');}
  finally{setBusy(false)}
 }
 if(loading)return <View style={styles.center}><ActivityIndicator color={green}/><Text style={styles.muted}>Loading your secure KYC records…</Text></View>;
 return <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
  <Pressable onPress={onClose} style={styles.back}><Text style={styles.link}>← Customer dashboard</Text></Pressable>
  <Text style={styles.eyebrow}>LANDSHOP · IDENTITY VERIFICATION</Text>
  <Text style={styles.title}>Secure <Text style={{color:green}}>KYC</Text></Text>
  <Text style={styles.muted}>Your documents are stored privately. Submitting a form does not grant financial or identity approval.</Text>
  <View style={styles.steps}>{['Details','Documents','Review'].map((label,i)=>
   <View key={label} style={[styles.step,step===i&&styles.activeStep]}><Text style={[styles.stepLabel,step===i&&{color:green}]}>{i+1}. {label}</Text></View>)}</View>
  {submission?.status&&submission.status!=='draft'?<View style={styles.panel}>
   <BrandIcon name="shield" size={32}/><Text style={styles.head}>Current status: {submission.status.replaceAll('_',' ')}</Text>
   <Text style={styles.muted}>Only Landshop's authorised review team can approve or reject KYC. You cannot edit an application after submission.</Text>
   <Button title="Refresh Review Status" action={()=>{void retrieve()}}/>
   <Button title="Contact Support" action={()=>{void Linking.openURL('https://portal.landshopnigeria.com/support')}}/>
  </View>:<>
   {step===0&&<View style={styles.panel}>
    <Text style={styles.head}>Your personal details</Text>
    <Input label="Full legal name" value={name} change={setName}/>
    <Input label="Phone / WhatsApp" value={phone} change={setPhone}/>
    <Input label="Residential address" value={address} change={setAddress} lines={3}/>
    <Input label="State" value={state} change={setState}/>
    <Input label="City / Town" value={city} change={setCity}/>
    <Button title={busy?'Saving…':'Save & Continue'} action={()=>{void saveAndContinue()}} disabled={busy}/>
   </View>}
   {step===1&&<View style={styles.panel}>
    <Text style={styles.head}>Private document upload</Text>
    <Text style={styles.muted}>JPG, PNG, WebP or PDF · up to 10 MB each. Your selfie can be taken with the front camera.</Text>
    {docs.map(doc=>{
     const done=existing.some(d=>d.document_type===doc.type);
     return <View key={doc.type} style={styles.document}>
      <View style={styles.documentTitle}><BrandIcon name={done?'shield':'file'} size={20}/><Text style={styles.docText}>{doc.label}</Text><Text style={{color:done?green:muted,fontSize:12}}>{done?'Saved':'Required'}</Text></View>
      {!done&&<View style={styles.row}>
       <View style={styles.half}><Button title="Choose File" action={()=>{void upload(doc.type,'file')}} disabled={busy}/></View>
       {doc.type==='portrait'&&<View style={styles.half}><Button title="Take Selfie" action={()=>{void upload(doc.type,'camera')}} disabled={busy}/></View>}
      </View>}
     </View>})}
    <View style={styles.row}><View style={styles.half}><Button title="Back" action={()=>setStep(0)} disabled={busy}/></View>
     <View style={styles.half}><Button title="Review KYC" action={()=>setStep(2)} disabled={busy||existing.length<3}/></View></View>
   </View>}
   {step===2&&<View style={styles.panel}>
    <Text style={styles.head}>Review your submission</Text>
    <Text style={styles.muted}>Legal name: {name}{'\n'}Address: {city}, {state}{'\n'}Required files: {docs.filter(d=>existing.some(x=>x.document_type===d.type)).length} of 3</Text>
    <Pressable accessibilityRole="checkbox" accessibilityState={{checked:consent}} onPress={()=>setConsent(v=>!v)} style={styles.consent}>
     <Text style={{fontSize:22,color:green}}>{consent?'☑':'□'}</Text><Text style={{fontSize:12,color:ink,flex:1}}>I consent to Landshop processing these documents for identity verification and understand they require human review.</Text>
    </Pressable>
    <Pressable onPress={()=>{void Linking.openURL('https://www.landshopnigeria.com/privacy-policy')}}><Text style={styles.link}>Read Landshop Privacy Policy</Text></Pressable>
    <View style={styles.row}><View style={styles.half}><Button title="Back" action={()=>setStep(1)} disabled={busy}/></View><View style={styles.half}><Button title={busy?'Submitting…':'Submit for Review'} action={()=>{void submit()}} disabled={busy||!consent}/></View></View>
   </View>}
  </>}
  {!!notice&&<Text accessibilityRole="alert" style={styles.notice}>{notice}</Text>}
 </ScrollView>
}
const styles=StyleSheet.create({
 page:{padding:18,paddingBottom:56,backgroundColor:'#f1f8f3',flexGrow:1},
 back:{marginBottom:18},link:{color:green,fontSize:12,fontWeight:'700'},
 eyebrow:{color:green,fontWeight:'800',fontSize:10,letterSpacing:1.5},
 title:{fontSize:31,fontWeight:'800',color:ink,marginVertical:9},muted:{fontSize:12,lineHeight:19,color:muted,marginVertical:8},
 steps:{flexDirection:'row',gap:7,marginVertical:19},step:{flex:1,borderBottomColor:'#d9e9df',borderBottomWidth:3,paddingBottom:10},
 activeStep:{borderBottomColor:green},stepLabel:{fontSize:11,color:muted,fontWeight:'700'},
 panel:{backgroundColor:'#fff',borderWidth:1,borderColor:'#dcece1',borderRadius:20,padding:17},
 head:{fontSize:17,fontWeight:'800',color:ink,marginBottom:12},
 label:{fontSize:11,color:'#436b58',fontWeight:'700',marginBottom:6},
 input:{borderWidth:1,borderColor:'#cedfd3',borderRadius:10,padding:11,minHeight:46,fontSize:13,color:ink,backgroundColor:'#fff'},
 btn:{backgroundColor:green,borderRadius:10,minHeight:44,paddingHorizontal:12,marginTop:10,alignItems:'center',justifyContent:'center'},
 btnText:{color:'#fff',fontSize:12,fontWeight:'800'},
 document:{paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#ebf3ef'},
 documentTitle:{flexDirection:'row',alignItems:'center',gap:8},docText:{flex:1,fontSize:12,color:ink,fontWeight:'700'},
 row:{flexDirection:'row',gap:10},half:{flex:1},consent:{flexDirection:'row',gap:10,alignItems:'center',marginVertical:16},
 notice:{color:'#205b47',fontSize:12,lineHeight:18,backgroundColor:'#e6f6ed',padding:13,borderRadius:10,marginTop:14},
 center:{flex:1,alignItems:'center',justifyContent:'center',padding:20}
});
