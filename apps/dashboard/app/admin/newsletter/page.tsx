import Link from 'next/link';
import {cookies} from 'next/headers';
import {createServerClient} from '@supabase/ssr';
import {redirect} from 'next/navigation';
import {revalidatePath} from 'next/cache';
export const dynamic='force-dynamic';
export const metadata={title:'Daily Newsletter | Landshop Admin'};
function lagosDay(){
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'Africa/Lagos',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(p=>[p.type,p.value]));
 return parts.year+'-'+parts.month+'-'+parts.day;
}
async function staff(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)throw new Error('Newsletter administration is not configured.');
 const cs=await cookies();
 const db=createServerClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',path:'/',secure:true,sameSite:'lax'},
  cookies:{getAll(){return cs.getAll()},setAll(items){try{items.forEach(({name,value,options})=>cs.set(name,value,options))}catch{}}}});
 const {data:{user},error}=await db.auth.getUser();
 if(error||!user||user.is_anonymous)redirect('https://portal.landshopnigeria.com/');
 const {data:members}=await db.from('organization_members').select('organization_id,role')
  .eq('user_id',user.id).eq('status','active').in('role',['owner','admin','operations','ceo','founder']);
 if(!members?.length)throw new Error('Newsletter approval requires authorized Landshop staff.');
 const {data:orgs}=await db.from('organizations').select('id').eq('kind','landshop')
  .in('id',members.map(m=>m.organization_id));
 if(!orgs?.length)throw new Error('Landshop staff membership is required.');
 return db;
}
async function approve(data:FormData){
 'use server';
 const db=await staff();
 const day=String(data.get('date')||''),slug=String(data.get('slug')||'').trim();
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)))throw new Error('Choose a valid date and an existing published Insights slug.');
 const {error}=await db.rpc('landshop_approve_newsletter_campaign',{p_date:day,p_slug:slug});
 if(error)throw new Error(error.message);
 revalidatePath('/admin/newsletter');
}
async function cancel(data:FormData){
 'use server';
 const db=await staff(),id=String(data.get('id')||'');
 if(!/^[a-f0-9-]{36}$/i.test(id))throw new Error('Invalid campaign');
 const {error}=await db.rpc('landshop_cancel_newsletter_campaign',{p_id:id});
 if(error)throw new Error(error.message);
 revalidatePath('/admin/newsletter');
}
export default async function NewsletterAdmin(){
 let db:Awaited<ReturnType<typeof staff>>|null=null;
 try{db=await staff()}catch{return <main style={{padding:40}}><h1>Landshop Newsletter</h1><p>Authorized staff sign-in is required.</p><Link href="/admin">Return to Command Center</Link></main>}
 const {data,error}=await db.rpc('landshop_staff_newsletter_campaigns');
 const day=lagosDay();
 const linkStyle={color:'#087857',fontWeight:650};
 return <main style={{fontFamily:'Arial, sans-serif',color:'#153e2b',maxWidth:1070,margin:'48px auto',padding:'0 24px 80px',lineHeight:1.65}}>
  <Link href="/admin" style={linkStyle}>← Landshop Command Center</Link>
  <span style={{display:'block',fontSize:12,letterSpacing:'.13em',color:'#1e9471',fontWeight:780,marginTop:28}}>LANDSHOP · CONTENT OPERATIONS</span>
  <h1 style={{fontSize:'clamp(30px,4vw,47px)',letterSpacing:'-.045em',margin:'8px 0 6px'}}>Daily property newsletter</h1>
  <p>Approve one published article for a chosen date. Sending is separately controlled by production email credentials, the Broadcast stream, explicit consent and an emergency off-switch. Approval does not override delivery safeguards.</p>
  <section style={{background:'#f0f8f3',border:'1px solid #d0e6d7',borderRadius:17,padding:'24px 26px',margin:'27px 0'}}>
   <h2 style={{margin:'0 0 15px'}}>Approve an article digest</h2>
   <form action={approve} style={{display:'grid',gridTemplateColumns:'minmax(180px,.65fr) minmax(250px,1.5fr)',gap:15}}>
    <label style={{display:'grid',gap:6,fontSize:13,fontWeight:650}}>Delivery date (Lagos time)
     <input type="date" name="date" defaultValue={day} min={day} required style={{padding:13,borderRadius:9,border:'1px solid #b9d2c3',font: 'inherit'}}/>
    </label>
    <label style={{display:'grid',gap:6,fontSize:13,fontWeight:650}}>Existing published Insights article slug
     <input type="text" name="slug" pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="e.g. property-due-diligence" maxLength={130} required style={{padding:13,borderRadius:9,border:'1px solid #b9d2c3',font:'inherit'}}/>
    </label>
    <p style={{gridColumn:'1/-1',fontSize:12,color:'#516f5e',margin:0}}>Find the slug in <Link href="https://www.landshopnigeria.com/insights" style={linkStyle}>published Landshop Insights</Link>. The dispatcher independently verifies the article exists in the approved codebase and on the live website.</p>
    <button type="submit" style={{justifySelf:'start',gridColumn:'1/-1',border:0,padding:'14px 21px',background:'#218a64',color:'#fff',borderRadius:10,fontWeight:760,cursor:'pointer'}}>Approve digest for selected day</button>
   </form>
  </section>
  <h2>Campaign approval register</h2>
  {error?<p role="alert">Campaign register is unavailable. Check staff permissions.</p>:null}
  {!data?.length&&!error?<p>No article campaigns have been approved yet. The delivery workflow will not send messages without an approved campaign.</p>:null}
  <div style={{display:'grid',gap:12}}>
   {(data||[]).map((item:{id:string;send_date:string;article_slug:string;status:string;approved_at:string})=><article key={item.id} style={{border:'1px solid #d8e5d9',borderRadius:13,padding:'17px 20px',display:'flex',gap:20,justifyContent:'space-between',alignItems:'center',flexWrap:'wrap'}}>
    <div><strong>{item.send_date}</strong> · <span style={{color:item.status==='approved'?'#14764f':'#956a39'}}>{item.status}</span>
     <p style={{margin:'5px 0 0'}}><a href={'https://www.landshopnigeria.com/insights/'+encodeURIComponent(item.article_slug)} style={linkStyle} target="_blank" rel="noopener noreferrer">{item.article_slug}</a></p>
    </div>
    {item.status==='approved'?<form action={cancel}><input type="hidden" name="id" value={item.id}/><button type="submit" style={{padding:'10px 15px',borderRadius:8,background:'#fff',color:'#a23e2d',border:'1px solid #deb4ae',cursor:'pointer'}}>Cancel pending dispatch</button></form>:null}
   </article>)}
  </div>
  <p style={{marginTop:30,fontSize:12,color:'#587763'}}>All newsletter subscriber emails, unsubscribe tokens and provider credentials are restricted; this screen intentionally exposes no subscriber list.</p>
 </main>;
}
