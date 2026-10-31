'use client';
import {useState} from 'react';
import Link from 'next/link';
import {createBrowserClient} from '@supabase/ssr';
import StaffWorkActions from './StaffWorkActions';
type Task={id:string;title:string;status:string;due_at:string;details:string|null};
type Profile={username:string;kyc_state:string;staff_number:string|null;employment_state:string};
export default function BasicStaffWorkspace({profile,tasks,email,userId}:{profile:Profile;tasks:Task[];email:string;userId:string}){
 const [notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 function client(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)throw Error('Staff database configuration is missing');
  return createBrowserClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true}});
 }
 async function photo(file:File|null){
  if(!file)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){setNotice('Upload a JPEG, PNG or WebP portrait smaller than 5MB.');return}
  setBusy(true);setNotice('');
  try{
   const extension=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
   const path=userId+'/portrait/'+crypto.randomUUID().replaceAll('-','')+'_'+Date.now().toString(36).padEnd(20,'0')+'.'+extension;
   const db=client();
   const {error:uploadError}=await db.storage.from('landshop-staff-private').upload(path,file,{upsert:false,contentType:file.type});
   if(uploadError)throw uploadError;
   const {error}=await db.rpc('landshop_staff_submit_photo',{p_path:path});
   if(error)throw error;
   setNotice('Portrait submitted securely. Management will verify identity separately. Your basic work access remains active.');
  }catch(e){setNotice(e instanceof Error?e.message:'Unable to upload portrait')}finally{setBusy(false)}
 }
 async function signOut(){
  setBusy(true);try{await client().auth.signOut();window.location.replace('/staff/sign-in')}catch(e){setNotice(e instanceof Error?e.message:'Unable to sign out');setBusy(false)}
 }
 return <main style={{minHeight:'100vh',background:'#f3f8f5',fontFamily:'Arial,sans-serif',color:'#153e30'}}>
  <header style={{background:'#073f34',padding:'18px clamp(16px,4vw,48px)',color:'white',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
   <div><small style={{color:'#fb9e60',letterSpacing:2}}>LANDSHOP PEOPLE & MANAGEMENT</small><h1 style={{margin:'6px 0',fontSize:'clamp(23px,4vw,34px)'}}>My Staff Dashboard</h1></div>
   <button type="button" disabled={busy} onClick={signOut} style={{padding:'12px 16px',background:'#f26b10',color:'white',border:0,borderRadius:10,cursor:'pointer'}}>Log Out</button>
  </header>
  <section style={{margin:'20px auto',maxWidth:1200,padding:'0 18px'}}>
   <div style={{background:'white',border:'1px solid #d5e5dc',borderRadius:16,padding:22}}>
    <h2 style={{margin:'0 0 8px'}}>Welcome, {profile.username}</h2>
    <p>{email} · Basic Staff Access Active · Employment: {profile.employment_state}</p>
    <p>You can accept assigned work and send daily or monthly reports from your first active day. Management and payroll permissions require separate authorization.</p>
    <div style={{display:'flex',gap:15,flexWrap:'wrap',alignItems:'center'}}>
     <label style={{display:'grid',gap:7}}>Upload identity portrait for staff ID verification
      <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>void photo(e.target.files?.[0]||null)}/></label>
     <span>KYC: {profile.kyc_state.replaceAll('_',' ')}</span>
     <Link href="https://www.landshopnigeria.com">Landshop website</Link>
    </div>
    {notice&&<p role="status" aria-live="polite" style={{padding:10,background:'#eff6f0',borderRadius:9}}>{notice}</p>}
   </div>
  </section>
  <div style={{maxWidth:1240,margin:'auto'}}><StaffWorkActions active initialTasks={tasks}/></div>
 </main>;
}
