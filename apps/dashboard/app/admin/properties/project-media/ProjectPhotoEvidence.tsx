'use client';
import {useState,type FormEvent} from 'react';
import {createBrowserClient} from '@supabase/ssr';

type Evidence={
 id:string;project_slug:string;photographer:string;captured_on:string;
 location_note:string;provenance_note:string;rights_basis:string;rights_reference:string;
 object_path:string;status:'pending'|'verified'|'rejected';uploaded_by:string;
 uploaded_at:string;review_note?:string|null
};
type ProjectSlug='green-island'|'merit-park'|'maiyegun-beach-estate'|'famous-gardens';
type RightsBasis='landshop_owned'|'owner_licensed'|'commissioned_with_release';
const projects:{id:ProjectSlug;name:string}[]=[
 {id:'green-island',name:'Green Island'},
 {id:'merit-park',name:'Merit Park'},
 {id:'maiyegun-beach-estate',name:'Maiyegun Beach Estate'},
 {id:'famous-gardens',name:'Famous Gardens'}
];
const statusColor={pending:'#9a620e',verified:'#067452',rejected:'#b23d3d'};
const field:React.CSSProperties={display:'block',width:'100%',boxSizing:'border-box',padding:'12px 13px',borderRadius:10,border:'1px solid #c9ded1',background:'#fff',fontSize:14,color:'#123d31',marginTop:6};
const labelStyle:React.CSSProperties={display:'block',fontSize:13,fontWeight:700,color:'#2a5947'};
const labelName:Record<RightsBasis,string>={
 landshop_owned:'Landshop original photograph',
 owner_licensed:'Written licence from owner or photographer',
 commissioned_with_release:'Commissioned photograph with signed release'
};

function client(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)throw Error('Project image storage is not configured');
 return createBrowserClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true}});
}

export default function ProjectPhotoEvidence({userId,canReview,initial}:{userId:string;canReview:boolean;initial:Evidence[]}){
 const [items,setItems]=useState<Evidence[]>(initial);
 const [project,setProject]=useState<ProjectSlug>('green-island');
 const [file,setFile]=useState<File|null>(null);
 const [photographer,setPhotographer]=useState('');
 const [capturedOn,setCapturedOn]=useState('');
 const [location,setLocation]=useState('');
 const [provenance,setProvenance]=useState('');
 const [rightsBasis,setRightsBasis]=useState<RightsBasis>('landshop_owned');
 const [rightsReference,setRightsReference]=useState('');
 const [attested,setAttested]=useState(false);
 const [uploadPath,setUploadPath]=useState('');
 const [selected,setSelected]=useState('');
 const [reviewNote,setReviewNote]=useState('');
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [error,setError]=useState('');

 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setMessage('');setError('');
  try{
   if(!file)throw Error('Choose an original JPEG, PNG or WebP photograph.');
   const extensions:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
   const ext=extensions[file.type];
   if(!ext||file.size===0||file.size>10*1024*1024)throw Error('Use an original JPEG, PNG or WebP image no larger than 10 MiB.');
   if(provenance.trim().length<30||location.trim().length<8||rightsReference.trim().length<8)
    throw Error('Document the project identity, location, photograph source and written publication authority.');
   if(!attested)throw Error('Confirm that publication rights evidence exists before submitting.');
   const db=client();
   let path=uploadPath;
   if(!path){
    path=userId+'/'+project+'/'+crypto.randomUUID()+'.'+ext;
    const {error:uploadError}=await db.storage.from('landshop-project-evidence')
     .upload(path,file,{upsert:false,contentType:file.type,cacheControl:'0'});
    if(uploadError)throw Error('Private upload failed. Confirm your active staff permissions and retry.');
    setUploadPath(path);
   }
   const {data,error:registrationError}=await db.rpc('landshop_project_photo_submit',{
    p_project:project,p_path:path,p_photographer:photographer.trim(),
    p_captured_on:capturedOn,p_location:location.trim(),p_provenance:provenance.trim(),
    p_rights_basis:rightsBasis,p_rights_reference:rightsReference.trim(),
    p_attested:attested
   });
   if(registrationError||!data)throw Error('Original securely uploaded but evidence registration failed: '+(registrationError?.message||'Unknown error')+'. Correct the fields and use Retry Registration.');
   setItems(list=>[{
    id:String(data),project_slug:project,photographer:photographer.trim(),captured_on:capturedOn,
    location_note:location.trim(),provenance_note:provenance.trim(),
    rights_basis:rightsBasis,rights_reference:rightsReference.trim(),object_path:path,
    status:'pending',uploaded_by:userId,uploaded_at:new Date().toISOString(),review_note:null
   },...list]);
   setFile(null);setPhotographer('');setCapturedOn('');setLocation('');setProvenance('');
   setRightsReference('');setAttested(false);setUploadPath('');
   const input=document.getElementById('landshop-original-project-photo') as HTMLInputElement|null;
   if(input)input.value='';
   setMessage('Original registered privately. A second authorized reviewer must confirm identity and rights. No website photo has been published.');
  }catch(e){setError(e instanceof Error?e.message:'Submission failed')}
  finally{setBusy(false)}
 }

 async function inspect(item:Evidence){
  setError('');setMessage('');
  const tab=window.open('about:blank','_blank');
  if(tab)tab.opener=null;
  try{
   const {data,error}=await client().storage.from('landshop-project-evidence')
    .createSignedUrl(item.object_path,60);
   if(error||!data?.signedUrl)throw Error('Cannot access this private original.');
   if(tab)tab.location.href=data.signedUrl;
   else setError('Allow browser popups to inspect the private image.');
  }catch(e){tab?.close();setError(e instanceof Error?e.message:'Access denied')}
 }

 async function review(approve:boolean){
  setBusy(true);setMessage('');setError('');
  try{
   if(reviewNote.trim().length<30)throw Error('Document at least 30 characters covering image identity, location, date and rights evidence.');
   const {error}=await client().rpc('landshop_project_photo_review',{
    p_photo:selected,p_approve:approve,p_review_note:reviewNote.trim()
   });
   if(error)throw Error(error.message);
   setItems(list=>list.map(item=>item.id===selected?{
    ...item,status:approve?'verified':'rejected',review_note:reviewNote.trim()
   }:item));
   setSelected('');setReviewNote('');
   setMessage(approve?'Evidence verified for a separate editorial publication decision. The original remains private.':'Evidence rejected and retained privately for audit.');
  }catch(e){setError(e instanceof Error?e.message:'Review failed')}
  finally{setBusy(false)}
 }

 return <div style={{display:'grid',gap:24,maxWidth:1120}}>
  <section style={{padding:'clamp(18px,3vw,28px)',border:'1px solid #d0e6d7',background:'#fff',borderRadius:19}}>
   <h2 style={{margin:'0 0 10px',fontSize:22}}>Submit original project photography</h2>
   <p style={{fontSize:13,color:'#557464',lineHeight:1.7,marginBottom:22}}>
    Upload the unaltered original for verification. A historical sign or sales brochure
    does not prove the present physical condition of an estate. Never substitute another project's image.
   </p>
   <form onSubmit={submit} style={{display:'grid',gap:16}}>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:16}}>
     <label style={labelStyle}>Project
      <select required value={project} disabled={Boolean(uploadPath)} onChange={e=>setProject(e.target.value as ProjectSlug)} style={field}>
       {projects.map(p=><option value={p.id} key={p.id}>{p.name}</option>)}
      </select>
     </label>
     <label style={labelStyle}>Original photograph
      <input id="landshop-original-project-photo" type="file" accept="image/jpeg,image/png,image/webp" required={!uploadPath}
       disabled={Boolean(uploadPath)} style={field} onChange={e=>{setFile(e.currentTarget.files?.[0]||null);setUploadPath('')}}/>
     </label>
     <label style={labelStyle}>Photographer or originating organization
      <input required minLength={3} maxLength={180} style={field} value={photographer} onChange={e=>setPhotographer(e.target.value)} placeholder="Photographer or Landshop site team"/>
     </label>
     <label style={labelStyle}>Date photo was taken
      <input type="date" required max={new Date().toISOString().slice(0,10)} style={field} value={capturedOn} onChange={e=>setCapturedOn(e.target.value)}/>
     </label>
     <label style={labelStyle}>Exact location and project identifier
      <input required minLength={8} maxLength={260} style={field} value={location} onChange={e=>setLocation(e.target.value)} placeholder="Site, landmark, estate name, city"/>
     </label>
     <label style={labelStyle}>Evidence of usage rights
      <select style={field} value={rightsBasis} onChange={e=>setRightsBasis(e.target.value as RightsBasis)}>
       {Object.entries(labelName).map(([value,name])=><option value={value} key={value}>{name}</option>)}
      </select>
     </label>
    </div>
    <label style={labelStyle}>Source and identity explanation
     <textarea required rows={4} minLength={30} maxLength={1800} style={{...field,resize:'vertical'}} value={provenance}
      onChange={e=>setProvenance(e.target.value)} placeholder="Describe how the original was obtained, what estate features establish identity and what date or site records corroborate the match."/>
    </label>
    <label style={labelStyle}>Written rights record reference
     <input required minLength={8} maxLength={300} style={field} value={rightsReference}
      onChange={e=>setRightsReference(e.target.value)} placeholder="Internal authorization record, signed release reference or document ID"/>
    </label>
    <label style={{display:'flex',alignItems:'flex-start',gap:9,fontSize:13,lineHeight:1.6}}>
     <input type="checkbox" checked={attested} onChange={e=>setAttested(e.target.checked)} style={{marginTop:4}}/>
     I confirm that Landshop has or can substantiate rights to use the photograph and that the estate identification and date are accurate.
    </label>
    <div style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:14}}>
     <button type="submit" disabled={busy||(!file&&!uploadPath)||!attested}
      style={{border:0,borderRadius:10,background:'#2BA47A',color:'white',fontWeight:750,padding:'12px 21px',cursor:'pointer'}}>
      {busy?'Processing':uploadPath?'Retry Registration':'Upload Original Privately'}
     </button>
     <small style={{color:'#567263'}}>Private storage only. No public publication or sales-listing changes.</small>
    </div>
   </form>
  </section>

  <section style={{padding:'clamp(18px,3vw,28px)',background:'#fff',border:'1px solid #d0e6d7',borderRadius:19}}>
   <h2 style={{margin:'0 0 12px',fontSize:22}}>Photo verification register</h2>
   <p style={{color:'#557464',fontSize:13,lineHeight:1.7}}>
    {canReview?'Management can inspect originals and review evidence submitted by a different person.':'Your own submissions are visible here. Management must perform the independent review.'}
   </p>
   {!items.length?<p>No project photographs submitted yet.</p>:
    <div style={{display:'grid',gap:12}}>
     {items.map(item=><article key={item.id} style={{border:'1px solid #dae7de',padding:17,borderRadius:13,display:'grid',gap:10}}>
      <div style={{display:'flex',flexWrap:'wrap',justifyContent:'space-between',gap:10}}>
       <strong>{projects.find(p=>p.id===item.project_slug)?.name||item.project_slug}</strong>
       <span style={{fontSize:12,fontWeight:750,color:statusColor[item.status]}}>{item.status.toUpperCase()}</span>
      </div>
      <div style={{fontSize:13,lineHeight:1.7,color:'#527461'}}>
       <strong>{item.photographer}</strong>, captured {item.captured_on}. {item.location_note}
      </div>
      <p style={{fontSize:13,color:'#2f5746',margin:0,lineHeight:1.65}}>{item.provenance_note}</p>
      <small style={{fontSize:12,color:'#5a7365'}}>Rights basis: {labelName[item.rights_basis as RightsBasis]||item.rights_basis}. Reference: {item.rights_reference}</small>
      {item.review_note&&<p style={{fontSize:12,margin:0,color:'#5a7365'}}>Reviewer findings: {item.review_note}</p>}
      <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
       <button type="button" onClick={()=>inspect(item)} style={{padding:'9px 13px',borderRadius:9,border:'1px solid #afd5bf',background:'#f5faf6',color:'#125941'}}>Inspect original (60-second access)</button>
       {canReview&&item.status==='pending'&&item.uploaded_by!==userId&&
        <button type="button" onClick={()=>setSelected(item.id)} style={{padding:'9px 13px',border:0,borderRadius:9,background:'#F26B10',color:'white'}}>Review evidence</button>}
       {canReview&&item.status==='pending'&&item.uploaded_by===userId&&
        <small style={{alignSelf:'center',color:'#ad681f'}}>A different manager must review your own submission.</small>}
      </div>
     </article>)}
    </div>}
   {canReview&&selected&&<div style={{marginTop:24,borderTop:'1px solid #d8e9df',paddingTop:20,display:'grid',gap:11}}>
    <h3 style={{fontSize:18,margin:0}}>Independent management review</h3>
    <p style={{fontSize:13,color:'#557464',lineHeight:1.7,margin:0}}>
     Check the actual estate, original capture context, photographer, publication licence and documentary reference. An approval does not make the original public.
    </p>
    <textarea aria-label="Review findings" rows={4} minLength={30} maxLength={1200} style={{...field,resize:'vertical'}}
     value={reviewNote} onChange={e=>setReviewNote(e.target.value)}
     placeholder="Describe at least 30 characters of independent project identity, chronology and usage-rights findings."/>
    <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
     <button disabled={busy||reviewNote.trim().length<30} onClick={()=>review(true)} style={{padding:'11px 17px',background:'#2BA47A',border:0,color:'#fff',borderRadius:9}}>Verify evidence</button>
     <button disabled={busy||reviewNote.trim().length<30} onClick={()=>review(false)} style={{padding:'11px 17px',background:'#9a3434',border:0,color:'#fff',borderRadius:9}}>Reject evidence</button>
     <button onClick={()=>{setSelected('');setReviewNote('')}} style={{padding:'11px 17px',background:'#f4f5f4',border:'1px solid #ccd9d0',borderRadius:9}}>Cancel</button>
    </div>
   </div>}
   {message&&<p role="status" style={{padding:13,background:'#e9f8f1',color:'#126748',borderRadius:9}}>{message}</p>}
   {error&&<p role="alert" style={{padding:13,background:'#fff2ef',color:'#9a3434',borderRadius:9}}>{error}</p>}
  </section>
 </div>;
}
