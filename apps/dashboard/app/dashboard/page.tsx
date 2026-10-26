import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic='force-dynamic';
export default async function Dashboard(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return <main><h1>Landshop</h1><p>Dashboard configuration is incomplete.</p></main>;
 const store=await cookies();
 const supabase=createServerClient(url,key,{
   cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true},
   cookies:{getAll(){return store.getAll()},setAll(changes){try{changes.forEach(({name,value,options})=>store.set(name,value,options))}catch{}}}
 });
 const {data:{user},error}=await supabase.auth.getUser();
 if(error||!user)redirect('https://portal.landshopnigeria.com/');
 const {data:profile}=await supabase.from('profiles').select('kyc_status,full_name').eq('id',user.id).maybeSingle();
 const approved=profile?.kyc_status==='approved';
 return <main style={{fontFamily:'Arial,sans-serif',padding:'clamp(18px,4vw,50px)',color:'#073f35',background:'#f5faf7',minHeight:'100vh'}}>
  <a href="https://www.landshopnigeria.com">Landshop</a>
  <h1>Welcome to Landshop</h1><p>{user.email}</p>
  {!approved?<section style={{padding:28,border:'1px solid #cce5d8',borderRadius:20,background:'white'}}>
   <h2>Complete your KYC</h2><p>Protected services remain unavailable until your KYC review is approved.</p>
   <p>Current status: {profile?.kyc_status||'not started'}</p>
   <p>Secure KYC submission and review are being implemented.</p>
  </section>:<section style={{padding:28,border:'1px solid #cce5d8',borderRadius:20,background:'white'}}>
   <h2>Account approved</h2><p>Property, mortgage, investment and referral features are being activated.</p>
  </section>}
 </main>;
}
