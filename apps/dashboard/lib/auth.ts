import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function requireApprovedUser() {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)throw new Error('Authentication has not been configured');
  const store=await cookies();
  const supabase=createServerClient(url,key,{
    cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true},
    cookies:{
      getAll(){return store.getAll()},
      setAll(changes){try{changes.forEach(({name,value,options})=>store.set(name,value,options))}catch{/* middleware refreshes sessions */}}
    }
  });
  const {data:{user},error}=await supabase.auth.getUser();
  if(error||!user)redirect('https://portal.landshopnigeria.com/');
  const {data:profile,error:profileError}=await supabase.from('profiles').select('kyc_status').eq('id',user.id).maybeSingle();
  if(profileError || profile?.kyc_status!=='approved')redirect('/dashboard');
  return {user,supabase};
}
