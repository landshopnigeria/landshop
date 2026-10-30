import {cookies} from 'next/headers';
import {createServerClient} from '@supabase/ssr';
import {redirect} from 'next/navigation';
import Link from 'next/link';
export const dynamic='force-dynamic';
export const metadata={title:'Seven Cities Allocation | Landshop'};
export default async function SevenCities(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return <main>Supabase configuration missing.</main>;
 const cookiesStore=await cookies();
 const db=createServerClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',sameSite:'lax',secure:true,path:'/'},
  cookies:{getAll(){return cookiesStore.getAll()},setAll(items){try{items.forEach(x=>cookiesStore.set(x.name,x.value,x.options))}catch{}}}});
 const {data:{user},error:authError}=await db.auth.getUser();
 if(authError||!user)redirect('https://portal.landshopnigeria.com/');
 const {data:members}=await db.from('organization_members').select('organization_id,role').eq('user_id',user.id).eq('status','active');
 const admin=(members||[]).filter(x=>['owner','ceo','founder','admin','technology_officer','technology_consultant'].includes(x.role));
 if(!admin.length)return <main style={{padding:40}}>Landshop Operations or Legal access required.</main>;
 const {data:organizations}=await db.from('organizations').select('id').eq('kind','landshop').in('id',admin.map(x=>x.organization_id));
 if(!organizations?.length)return <main style={{padding:40}}>Access denied.</main>;
 const {data:programmes,error:programmeError}=await db.from('allocation_programmes').select('id,name,status,created_at').order('created_at',{ascending:false});
 const programme=programmes?.find(p=>p.name==='Seven Cities Allocation');
 const {data:cases}=programme?await db.from('allocation_cases')
  .select('id,reference,eligibility,status,cx_cleared,finance_cleared,legal_cleared,survey_cleared,allocation_type,invite_status,peg_identifier')
  .eq('programme_id',programme.id).order('created_at',{ascending:false}).limit(100):{data:[]};
 const {data:sites}=programme?await db.from('allocation_sites').select('name,survey_status')
  .eq('programme_id',programme.id):{data:[]};
 const values=cases||[];const ready=values.filter(c=>c.status==='ready').length;
 const outstanding=values.filter(c=>!c.cx_cleared||!c.finance_cleared||!c.legal_cleared||!c.survey_cleared).length;
 const invited=values.filter(c=>['sent','confirmed'].includes(c.invite_status)).length;
 const theme={bg:'#f0f8f4',paper:'white',ink:'#0c4434',green:'#078b6d'} as const;
 return <main style={{fontFamily:'Arial,Helvetica,sans-serif',padding:'clamp(17px,5vw,60px)',background:theme.bg,minHeight:'100vh',color:theme.ink}}>
  <nav style={{display:'flex',gap:22,fontSize:13,marginBottom:25}}><Link href="/admin">← Command Center</Link><Link href="/admin/properties">Properties</Link><Link href="/admin/automation">Automation</Link></nav>
  <header style={{background:'linear-gradient(125deg,#06483e,#01836b)',padding:35,borderRadius:24,color:'white',marginBottom:20}}>
   <span style={{letterSpacing:3,fontSize:11}}>LANDSHOP · ALLOCATION MANAGEMENT</span>
   <h1 style={{fontSize:'clamp(29px,4vw,50px)',margin:'10px 0'}}>Seven Cities Allocation</h1>
   <p>Cross-department coordination: CX · Finance · Legal · Survey · Operations · Security</p>
   <p>Status: {programmeError?'Unavailable':programme?.status||'Not configured'}</p>
  </header>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:14,marginBottom:23}}>
   {[['Total allocation cases',values.length],['Ready for allocation',ready],['Pending departmental clearance',outstanding],['Invitations sent / confirmed',invited],['Tracked allocation sites',sites?.length||0]].map(([label,v])=>
    <article key={label as string} style={{background:theme.paper,padding:25,border:'1px solid #dbede2',borderRadius:16}}><small>{label}</small><h2 style={{fontSize:33,margin:'10px 0'}}>{v}</h2><small>Current records</small></article>)}
  </div>
  <section style={{background:theme.paper,padding:25,borderRadius:22,marginBottom:24}}>
   <h2>Holistic Allocation List</h2><p>Cases must pass eligibility, Customer Experience, Finance, Legal and Survey clearance before an authorized reviewer may mark them ready. Source data must be formally validated.</p>
   <div style={{overflowX:'auto'}}><table style={{minWidth:780,width:'100%',borderCollapse:'collapse'}}>
    <thead><tr>{['Reference','Eligibility','CX','Finance','Legal','Survey','Invitation','Status'].map(x=><th key={x} style={{textAlign:'left',padding:13,borderBottom:'1px solid #dbe7df'}}>{x}</th>)}</tr></thead>
    <tbody>{values.map(row=><tr key={row.id}>{[row.reference,row.eligibility,row.cx_cleared?'Cleared':'Pending',row.finance_cleared?'Cleared':'Pending',row.legal_cleared?'Cleared':'Pending',row.survey_cleared?'Cleared':'Pending',row.invite_status,row.status].map((item,i)=><td key={i} style={{padding:13,borderBottom:'1px solid #edf2ee'}}>{item}</td>)}</tr>)}</tbody>
   </table>{!values.length&&<p style={{color:'#6c8277'}}>No approved allottees or plot records are loaded. Do not create allocation decisions from an illustrative preview.</p>}</div>
  </section>
  <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:18}}>
   {[['Approved Allocation List','Coordinate CX, Surveyor, Legal and Finance to reconcile all qualifying customers.'],
     ['Survey Layouts & Pegs','Track authenticated layouts, plot markers and site coordinates, including Green Island, Alacrity City and Dominion City references from the working document.'],
     ['Client Invitations','Personalized email, SMS, WhatsApp, delivery receipt and follow-up calling—after provider authorization.'],
     ['Security & Event Operations','Coordinate onsite security, venue arrangements, attendance and the allocation ceremony.'],
     ['Legal Documentation','Track Deeds of Assignment, estate guidelines, surveys and handover letters with private access.'],
     ['Post-Allocation Follow-up','Record permanent/provisional allocations, client confirmations and outstanding obligations.']].map(([heading,copy])=>
      <article key={heading} style={{background:theme.paper,border:'1px solid #deeee5',padding:24,borderRadius:18}}><h3>{heading}</h3><p style={{lineHeight:1.7,color:'#6c8075',fontSize:13}}>{copy}</p></article>)}
  </section>
  <p style={{marginTop:25,color:'#617c6b',fontSize:12}}>This operational screen uses verified records only. The uploaded Seven Cities strategy describes project execution and documentation; it does not provide a complete validated allocation list or identify seven city names.</p>
 </main>;
}