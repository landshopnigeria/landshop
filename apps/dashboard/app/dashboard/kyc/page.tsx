import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import KycWizard from './wizard';

export const dynamic='force-dynamic';

export default async function KycPage(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return <main>Landshop identity service is not configured.</main>;
 const store=await cookies();
 const supabase=createServerClient(url,key,{
  cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true},
  cookies:{
    getAll(){return store.getAll()},
    setAll(changes){try{changes.forEach(({name,value,options})=>store.set(name,value,options))}catch{}}
  }
 });
 const {data:{user},error}=await supabase.auth.getUser();
 if(error||!user)redirect('https://portal.landshopnigeria.com/');
 const {data:submission}=await supabase.from('kyc_submissions')
   .select('id,kind,status,metadata,created_at')
   .eq('applicant_id',user.id).order('created_at',{ascending:false}).limit(1).maybeSingle();
 return <KycWizard userId={user.id} existing={submission||null}/>;
}
