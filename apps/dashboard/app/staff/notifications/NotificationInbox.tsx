'use client';
import {useState} from 'react';
import {createBrowserClient} from '@supabase/ssr';
type Notice={id:string;subject:string;body:string;created_at:string;seen_at:string|null};
function db(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!k)throw Error('Landshop account service unavailable');
 return createBrowserClient(url,k,{cookieOptions:{domain:'.landshopnigeria.com',sameSite:'lax',secure:true,path:'/'}});
}
export default function NotificationInbox({initial}:{initial:Notice[]}){
 const [rows,setRows]=useState(initial),[busy,setBusy]=useState<string|null>(null),[message,setMessage]=useState('');
 async function mark(id:string){
  setBusy(id);setMessage('');
  try{
   const {error}=await db().rpc('landshop_automation_mark_seen',{p_notice:id});
   if(error)throw Error(error.message);
   setRows(x=>x.map(n=>n.id===id?{...n,seen_at:new Date().toISOString()}:n));
   setMessage('Notification marked as read.');
  }catch(e){setMessage(e instanceof Error?e.message:'Unable to save notification status')}
  finally{setBusy(null)}
 }
 return <div style={{display:'grid',gap:12,marginTop:24}}>
  <div style={{padding:'14px 17px',borderRadius:12,background:'#e4f3e8',color:'#086b53',fontWeight:800}}>
   {rows.filter(n=>!n.seen_at).length} unread · {rows.length} recent notifications
  </div>
  {!rows.length?<section style={{background:'#fff',borderRadius:16,padding:30,border:'1px solid #dce9e0'}}>
   <strong>No notifications yet</strong><p style={{fontSize:12,color:'#6f8879'}}>Once the owner activates an internal workflow and its business event occurs, the resulting notification will appear here.</p>
  </section>:rows.map(n=><article key={n.id} style={{border:'1px solid #dceae0',borderRadius:14,padding:19,background:n.seen_at?'#fff':'#eff9f1',display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:16,flexWrap:'wrap'}}>
   <div style={{flex:'1 1 250px'}}><strong style={{fontSize:16}}>{n.subject}</strong><p style={{fontSize:13,color:'#557b66',lineHeight:1.6}}>{n.body}</p>
    <small style={{color:'#7a9084'}}>{new Date(n.created_at).toLocaleString('en-NG',{timeZone:'Africa/Lagos'})} WAT</small></div>
   {!n.seen_at&&<button disabled={busy!==null} onClick={()=>{void mark(n.id)}} style={{padding:'11px 14px',borderRadius:9,color:'#fff',background:'#0b8b6e',border:0,fontWeight:750}}>Mark read</button>}
  </article>)}
  {message&&<p role="status" style={{color:'#0a7259',padding:14,background:'#e8f5ea',borderRadius:11}}>{message}</p>}
 </div>;
}
