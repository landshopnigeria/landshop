'use client';
import BrandedSelect from '../../../../components/BrandedSelect';

import {useState} from 'react';
import {createBrowserClient} from '@supabase/ssr';
type Asset={id:string;kind:string;status:string;object_path:string;uploaded_by:string};
type Kind='property_image'|'title_document'|'marketing_authority'|'video';
function client(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)throw Error('Storage not configured');
 return createBrowserClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true}});
}
const mimetypes=['image/jpeg','image/png','image/webp','application/pdf','video/mp4'];
export default function PropertyAssets({propertyId,propertyStatus,items,allowReview}:{propertyId:string;propertyStatus:string;items:Asset[];allowReview:boolean}){
 const [kind,setKind]=useState<Kind>('property_image');
 const [file,setFile]=useState<File|null>(null),[assets,setAssets]=useState(items);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const [reason,setReason]=useState(''),[selected,setSelected]=useState('');
 async function upload(){
  setBusy(true);setMessage('');
  try{
   if(!file)throw Error('Choose a file');
   if(!mimetypes.includes(file.type))throw Error('Unsupported file format');
   if(file.size>25*1024*1024||file.size===0)throw Error('File must be below 25 MiB');
   const extension=file.type==='application/pdf'?'pdf':file.type==='video/mp4'?'mp4':
     file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
   const path=propertyId+'/'+kind+'/'+crypto.randomUUID()+'.'+extension;
   const db=client();
   const {error:uploadError}=await db.storage.from('landshop-property-private')
     .upload(path,file,{upsert:false,contentType:file.type});
   if(uploadError)throw Error('Private upload failed. Check permissions and bucket configuration.');
   const {data,error}=await db.rpc('landshop_property_attach_asset',{
     p_property:propertyId,p_kind:kind,p_object_path:path});
   if(error)throw Error('Upload saved but evidence registration failed; contact support with the property reference.');
   setAssets(v=>[{id:String(data),kind,status:'pending',object_path:path,uploaded_by:'current'},...v]);
   setFile(null);setMessage('Original file attached. Independent verification is required.');
  }catch(e){setMessage(e instanceof Error?e.message:'Upload failed')}
  finally{setBusy(false)}
 }
 async function view(asset:Asset){
  setMessage('');
  const windowRef=window.open('about:blank','_blank');
  if(windowRef)windowRef.opener=null;
  try{
   const {data,error}=await client().storage.from('landshop-property-private')
    .createSignedUrl(asset.object_path,60);
   if(error||!data?.signedUrl)throw Error('Original file access denied.');
   if(windowRef)windowRef.location.href=data.signedUrl;
   else setMessage('Enable popups to inspect approved evidence.');
  }catch(e){windowRef?.close();setMessage(e instanceof Error?e.message:'Unable to view file')}
 }
 async function review(approve:boolean){
  setBusy(true);setMessage('');
  try{
   if(reason.trim().length<15)throw Error('Provide at least 15 characters explaining evidence checks.');
   const {error}=await client().rpc('landshop_property_verify_asset',{
     p_asset:selected,p_approve:approve,p_reason:reason.trim()});
   if(error)throw Error('Review rejected. Check permissions and separation of duties.');
   setAssets(v=>v.map(a=>a.id===selected?{...a,status:approve?'verified':'rejected'}:a));
   setReason('');setMessage('Evidence review saved with an audit record.');
  }catch(e){setMessage(e instanceof Error?e.message:'Could not save decision')}
  finally{setBusy(false)}
 }
 return <div style={{display:'grid',gap:24}}>
  {['draft','review'].includes(propertyStatus)&&<section style={{background:'white',padding:25,borderRadius:20}}>
   <h2>Upload original property evidence</h2>
   <p>Upload owner/developer photographs, land title, marketing authority or a property video. Never use AI-generated pictures as evidence of a listed property.</p>
   <div style={{display:'flex',flexWrap:'wrap',gap:15}}>
    <BrandedSelect value={kind} onChange={e=>setKind(e.target.value as Kind)} aria-label="Evidence type">
     <option value="property_image">Original property image</option><option value="title_document">Title document</option>
     <option value="marketing_authority">Marketing authority</option><option value="video">Property video</option>
    </BrandedSelect>
    <input aria-label="Select file" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,.mp4" onChange={e=>setFile(e.target.files?.[0]||null)}/>
    <button disabled={busy||!file} onClick={upload}>Upload Privately</button>
   </div>
  </section>}
  <section style={{background:'white',padding:25,borderRadius:20}}>
   <h2>Property evidence register</h2>
   {!assets.length?<p>No files uploaded.</p>:<ul style={{display:'grid',gap:12}}>
    {assets.map(a=><li key={a.id} style={{padding:13,border:'1px solid #cfe4d9',borderRadius:12}}>
     {a.kind.replaceAll('_',' ')} · <strong>{a.status}</strong>
     {allowReview&&<button style={{marginLeft:15}} onClick={()=>view(a)}>Inspect Original (60s)</button>}
     {allowReview&&a.status==='pending'&&<button style={{marginLeft:9}} onClick={()=>setSelected(a.id)}>Review</button>}
    </li>)}
   </ul>}
   {allowReview&&selected&&<section style={{marginTop:24,display:'grid',gap:10}}>
    <h3>Independent review</h3><p>Inspect the original and verify that it depicts this property, or establishes valid ownership/marketing rights.</p>
    <textarea aria-label="Verification notes" placeholder="Document the source, checks, and findings" value={reason}
      onChange={e=>setReason(e.target.value)} minLength={15} maxLength={1000} rows={4}/>
    <div style={{display:'flex',gap:12}}>
     <button disabled={busy||reason.trim().length<15} onClick={()=>review(true)}>Verify Evidence</button>
     <button disabled={busy||reason.trim().length<15} onClick={()=>review(false)}>Reject Evidence</button>
    </div>
   </section>}
  </section>
  <p role="status" aria-live="polite">{message}</p>
 </div>;
}
