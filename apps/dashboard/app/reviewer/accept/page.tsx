import Link from 'next/link';
import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import AcceptReviewInvite from './AcceptReviewInvite';
export const dynamic='force-dynamic';
export const metadata={title:'Accept Landshop Reviewer Invitation'};
export default async function Page(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return <main>Landshop login is not configured.</main>;
 const jar=await cookies();
 const db=createServerClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true},
 cookies:{getAll(){return jar.getAll()},setAll(c){try{c.forEach(x=>jar.set(x.name,x.value,x.options))}catch{}}}});
 const {data:{user},error}=await db.auth.getUser();
 if(error||!user)redirect('https://portal.landshopnigeria.com/');
 return <main style={{fontFamily:'Arial,sans-serif',minHeight:'100vh',padding:'clamp(20px,5vw,70px)',background:'#f3faf5',color:'#123b2e'}}>
  <section style={{maxWidth:700,margin:'auto',padding:28,background:'#fff',borderRadius:20,border:'1px solid #d8e5dc'}}>
   <Link href="https://portal.landshopnigeria.com/" style={{color:'#07845c'}}>← Landshop Portal</Link>
   <h1>Accept your Landshop review appointment</h1>
   <p style={{lineHeight:1.7}}>Your verified account can accept an invitation issued by Landshop’s active owner. If you have not received an approved invitation, this action cannot grant you staff access.</p>
   <AcceptReviewInvite/>
  </section>
 </main>;
}
