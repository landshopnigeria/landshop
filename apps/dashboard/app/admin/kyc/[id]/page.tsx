import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
import {redirect,notFound} from 'next/navigation';
import DecisionForm from './DecisionForm';
import DocumentReview from './DocumentReview';

export const dynamic='force-dynamic';
export default async function KycDetail({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(!/^[0-9a-f-]{36}$/i.test(id))notFound();
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return <main>Identity service not configured.</main>;
 const store=await cookies();
 const db=createServerClient(url,key,{
  cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true},
  cookies:{getAll(){return store.getAll()},setAll(changes){try{changes.forEach(({name,value,options})=>store.set(name,value,options))}catch{}}}
 });
 const {data:{user},error:authError}=await db.auth.getUser();
 if(authError||!user)redirect('https://portal.landshopnigeria.com/');
 const {data:members,error:memberError}=await db.from('organization_members')
  .select('organization_id,role').eq('user_id',user.id).eq('status','active');
 if(memberError||!members?.length)return <main>Access denied.</main>;
 const qualified=members.filter(m=>['owner','admin','operations','legal'].includes(m.role));
 if(!qualified.length)return <main>Access denied.</main>;
 const {data:orgs,error:orgError}=await db.from('organizations')
  .select('id').eq('kind','landshop').in('id',qualified.map(m=>m.organization_id));
 if(orgError||!orgs?.length)return <main>Access denied.</main>;
 const {data:submission,error}=await db.from('kyc_submissions')
  .select('id,kind,status,created_at,metadata,reviewed_at').eq('id',id).maybeSingle();
 if(error||!submission)notFound();
 const {data:documents}=await db.from('kyc_documents')
  .select('id,document_type,created_at').eq('submission_id',id);
 const metadata=submission.metadata&&typeof submission.metadata==='object'?
   submission.metadata as Record<string,unknown>:{};
 return <main style={{fontFamily:'Arial,sans-serif',minHeight:'100vh',background:'#f2f8f4',color:'#093e32',padding:'clamp(20px,5vw,65px)'}}>
  <a href="/admin/kyc">← KYC queue</a><h1>Review KYC submission</h1>
  <p>Reference: {submission.id} · {submission.status} · {submission.kind}</p>
  <section style={{background:'white',border:'1px solid #d8e5df',borderRadius:18,padding:24,marginBottom:22}}>
   <h2>Applicant-provided details</h2>
   {['fullName','phone','address','state','city','companyName','rcNumber'].map(key=>
     <p key={key}><strong>{key}:</strong> {String(metadata[key]||'Not provided')}</p>)}
   <h3>Document checklist</h3>
   <DocumentReview documents={documents||[]}/>
   <p role="note">Access is restricted to authorized reviewers; approval requires an actual document check and recorded justification.</p>
  </section>
  <DecisionForm submissionId={submission.id} status={submission.status}/>
 </main>;
}
