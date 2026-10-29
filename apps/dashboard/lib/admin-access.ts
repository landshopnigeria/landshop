import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
export async function requireLandshopStaff(roles:string[]){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)throw Error('Supabase configuration missing');
 const store=await cookies();
 const db=createServerClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true},
  cookies:{getAll(){return store.getAll()},setAll(changes){try{changes.forEach(({name,value,options})=>store.set(name,value,options))}catch{}}}});
 const {data:{user},error}=await db.auth.getUser();
 if(error||!user)redirect('https://portal.landshopnigeria.com/');
 const {data:members,membershipError}=await (async()=>{const q=await db.from('organization_members')
  .select('organization_id,role').eq('user_id',user.id).eq('status','active');
  return {data: q.data,membershipError:q.error}})();
 if(membershipError||!members?.length)redirect('/dashboard');
 const eligible=members.filter(member=>roles.includes(member.role));
 if(!eligible.length)redirect('/dashboard');
 const {data:organizations,error:orgError}=await db.from('organizations').select('id').eq('kind','landshop')
   .in('id',eligible.map(member=>member.organization_id));
 if(orgError||!organizations?.length)redirect('/dashboard');
 return {db,user,organizationIds:organizations.map(x=>x.id)};
}