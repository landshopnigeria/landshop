import Link from 'next/link';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {createServerClient} from '@supabase/ssr';
import SupervisorTasks from './SupervisorTasks';
export const dynamic='force-dynamic';
export const metadata={title:'My Team Tasks | Landshop'};
export default async function TeamPage(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)throw Error('Auth service unavailable');
 const store=await cookies();
 const db=createServerClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',sameSite:'lax',secure:true,path:'/'},cookies:{getAll(){return store.getAll()},setAll(x){try{x.forEach(v=>store.set(v.name,v.value,v.options))}catch{}}}});
 const {data:{user}}=await db.auth.getUser();if(!user)redirect('/staff/sign-in');
 const {data:eligible,error}=await db.rpc('landshop_is_task_supervisor',{p_user:user.id});
 if(error||eligible!==true)redirect('/staff');
 const [people,tasks]=await Promise.all([db.rpc('landshop_team_directory'),db.from('staff_tasks').select('id,title,status,assignee_id,due_at,planned_minutes,delay_allowance_minutes,score,assignee_report').eq('assigned_by',user.id).order('created_at',{ascending:false}).limit(100)]);
 const {data:summaryRows,error:summaryError}=await db.rpc('landshop_supervisor_task_summary');
 const summary=summaryRows?.[0];
 const performance=[
  ['All-time assigned',summary?.total_tasks],
  ['Awaiting review',summary?.submitted_tasks],
  ['In progress',summary?.in_progress_tasks],
  ['Accepted',summary?.accepted_tasks],
  ['Blocked',summary?.blocked_tasks],
  ['Overdue',summary?.overdue_tasks],
  ['Average accepted score',summary?.average_accepted_score],
 ];
 return <main style={{minHeight:'100vh',padding:'clamp(20px,5vw,65px)',fontFamily:'Arial,sans-serif',background:'#f2f9f4',color:'#154b36'}}>
  <div style={{maxWidth:1120,margin:'auto'}}><Link href="/staff" style={{color:'#0b8261'}}>← My Staff Dashboard</Link><p style={{fontSize:12,color:'#dc7016',fontWeight:850}}>LANDSHOP TEAM LEADERSHIP</p><h1>Manage team assignments</h1>
   <p style={{maxWidth:820,lineHeight:1.7,color:'#67806c'}}>Approved department managers can assign work, set documented durations and deadlines, and review only their own assigned tasks. This does not grant access to the Global Command Center, HR identity documents, payroll or unrelated teams.</p>
   {(people.error||tasks.error)&&<p role="alert">Team data could not be loaded. Check the staff role and verification status.</p>}
   <section aria-label="Supervisor performance overview" style={{margin:'22px 0'}}>
    <h2 style={{fontSize:23,marginBottom:6}}>Team performance since your first assignment</h2>
    <p style={{fontSize:13,color:'#637c6f',marginTop:0}}>All-time totals for tasks you assigned. Counts are computed securely on the server and are not limited to the latest 100 tasks displayed below.</p>
    {summaryError?<p role="alert">Performance summary is temporarily unavailable.</p>:
     <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(145px,1fr))',gap:12}}>
      {performance.map(([label,value])=><article key={String(label)} style={{borderRadius:13,padding:17,background:'white',border:'1px solid #dbe9de'}}>
       <div style={{fontSize:12,color:'#537565'}}>{label}</div>
       <strong style={{fontSize:29,display:'block',marginTop:6}}>{value??'—'}</strong>
      </article>)}
     </div>}
   </section>
   <SupervisorTasks people={people.data||[]} tasks={tasks.data||[]}/>
  </div></main>;
}
