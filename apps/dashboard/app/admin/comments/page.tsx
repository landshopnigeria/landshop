import {cookies} from 'next/headers';
import {createServerClient} from '@supabase/ssr';
import {redirect} from 'next/navigation';
import Link from 'next/link';
import {revalidatePath} from 'next/cache';
export const dynamic='force-dynamic';
export const metadata={title:'Moderate Article Comments | Landshop Admin'};
async function staffClient(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)throw Error('Supabase is not configured');
 const store=await cookies();
 const db=createServerClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',path:'/',secure:true,sameSite:'lax'},cookies:{getAll(){return store.getAll()},setAll(changes){try{changes.forEach(({name,value,options})=>store.set(name,value,options))}catch{}}}});
 const {data:{user},error}=await db.auth.getUser();
 if(error||!user||user.is_anonymous)redirect('https://portal.landshopnigeria.com/');
 const {data:members}=await db.from('organization_members').select('organization_id,role').eq('user_id',user.id).eq('status','active').in('role',['owner','admin','operations']);
 if(!members?.length)throw Error('Staff access required');
 const {data:orgs}=await db.from('organizations').select('id').eq('kind','landshop').in('id',members.map(m=>m.organization_id));
 if(!orgs?.length)throw Error('Landshop staff membership required');
 return {db,user};
}
async function review(formData:FormData){
 'use server';
 const id=String(formData.get('id')||''),decision=String(formData.get('decision')||'');
 if(!/^[a-f0-9-]{36}$/.test(id)||!['approved','rejected'].includes(decision))throw Error('Invalid comment moderation request');
 const {db,user}=await staffClient();
 const {error}=await db.from('article_comments').update({status:decision,reviewed_by:user.id,reviewed_at:new Date().toISOString()}).eq('id',id).eq('status','pending');
 if(error)throw new Error('Moderation failed');
 revalidatePath('/admin/comments');
}
export default async function CommentsAdmin(){
 let context:Awaited<ReturnType<typeof staffClient>>|null=null;
 try{context=await staffClient()}catch{return <main style={{padding:40,fontFamily:'Arial'}}><h1>Article Moderation</h1><p>You need an authorized Landshop management account to review comments.</p><Link href="/admin">Return to Command Center</Link></main>}
 const {data, error}=await context.db.from('article_comments').select('id,article_slug,body,created_at,status').eq('status','pending').order('created_at',{ascending:true}).limit(100);
 return <main style={{fontFamily:'Arial, sans-serif',maxWidth:1080,margin:'50px auto',padding:'0 24px',color:'#173d2e',lineHeight:1.65}}>
  <Link href="/admin" style={{color:'#167b59'}}>← Landshop Command Center</Link>
  <h1 style={{fontSize:'clamp(28px,4vw,46px)',marginBottom:5}}>Article comment moderation</h1>
  <p>Review reader contributions before publication. Public visitors can only read approved comments.</p>
  {error?<p role="alert">Unable to load pending comments. Check staff permissions and service availability.</p>:null}
  {!data?.length&&!error?<p style={{padding:24,background:'#eef7f1',borderRadius:12}}>No comments are awaiting moderation.</p>:null}
  <div style={{display:'grid',gap:17,marginTop:26}}>
   {(data||[]).map(item=><article key={item.id} style={{background:'#f5faf7',border:'1px solid #d8e7dc',borderRadius:15,padding:24}}>
    <div style={{display:'flex',gap:18,flexWrap:'wrap',fontSize:12,color:'#477361'}}><span>Article: <strong>{item.article_slug}</strong></span><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString('en-NG')}</time></div>
    <p style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',fontSize:16}}>{item.body}</p>
    <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
     <form action={review}><input type="hidden" name="id" value={item.id}/><input type="hidden" name="decision" value="approved"/><button type="submit" style={{padding:'11px 19px',background:'#2ba47a',color:'white',border:0,borderRadius:8,cursor:'pointer'}}>Approve</button></form>
     <form action={review}><input type="hidden" name="id" value={item.id}/><input type="hidden" name="decision" value="rejected"/><button type="submit" style={{padding:'11px 19px',background:'#fff',color:'#b42318',border:'1px solid #e8b8b4',borderRadius:8,cursor:'pointer'}}>Reject</button></form>
    </div>
   </article>)}
  </div>
 </main>
}
