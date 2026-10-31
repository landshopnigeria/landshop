'use client';
import {useState} from 'react';
import {createBrowserClient} from '@supabase/ssr';
type Item={id:string;staff_id:string;recipient_role:string;period:string;report_date:string;title:string;details:string;status:string;created_at:string};
export default function StaffReportReviews({initial}:{initial:Item[]}){
 const [records,setRecords]=useState(initial),[busy,setBusy]=useState<string|null>(null),[message,setMessage]=useState(''),[notes,setNotes]=useState<Record<string,string>>({});
 async function decide(id:string,decision:'reviewed'|'returned'){
  const comment=(notes[id]||'').trim();
  if(comment.length<10){setMessage('Provide at least 10 characters explaining your review decision.');return}
  setBusy(id);setMessage('');
  try{
   const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
   if(!url||!key)throw Error('Database is unavailable');
   const db=createBrowserClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true}});
   const {error}=await db.rpc('landshop_staff_review_submission',{p_submission:id,p_decision:decision,p_comment:comment});
   if(error)throw error;
   setRecords(items=>items.map(item=>item.id===id?{...item,status:decision}:item));
   setMessage('Review decision recorded and audited.');
  }catch(e){setMessage(e instanceof Error?e.message:'Review failed')}
  finally{setBusy(null)}
 }
 return <section style={{display:'grid',gap:12,marginTop:18}}>
  {message&&<p role="status">{message}</p>}
  {records.map(r=><article key={r.id} style={{background:'white',borderRadius:14,padding:20,border:'1px solid #d9e7dd',overflowWrap:'anywhere'}}>
   <div style={{display:'flex',justifyContent:'space-between',gap:16,flexWrap:'wrap'}}><h2 style={{fontSize:19,margin:0}}>{r.title}</h2><strong>{r.status}</strong></div>
   <p><small>{r.period} · {r.report_date} · Routed to {r.recipient_role.replaceAll('_',' ')} · Staff {r.staff_id}</small></p>
   <p style={{whiteSpace:'pre-wrap'}}>{r.details}</p>
   {['submitted','returned'].includes(r.status)&&<>
    <label style={{display:'grid',gap:7}}>Management review note<textarea value={notes[r.id]||''} onChange={e=>setNotes(s=>({...s,[r.id]:e.target.value}))} minLength={10} maxLength={2000} style={{border:'1px solid #b8d8c5',borderRadius:8,padding:10,minHeight:65}}/></label>
    <div style={{display:'flex',gap:10,marginTop:10}}><button type="button" disabled={busy!==null} onClick={()=>decide(r.id,'reviewed')}>Mark reviewed</button><button type="button" disabled={busy!==null} onClick={()=>decide(r.id,'returned')}>Return for revision</button></div>
   </>}
  </article>)}
  {records.length===0&&<p>There are no reports visible to your management account.</p>}
 </section>;
}
