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
 if(error||!user)redirect('/staff/sign-in');
 const {data:members,membershipError}=await (async()=>{const q=await db.from('organization_members')
  .select('organization_id,role').eq('user_id',user.id).eq('status','active');
  return {data: q.data,membershipError:q.error}})();
 if(membershipError||!members?.length)redirect('/staff');
 const managementRoles=['owner','ceo','founder','admin','technology_officer','technology_consultant'];
 const ownerOnly=roles.length===1&&roles[0]==='owner';
 // Explicit page roles and a live database verification are both required.
 // A requested title or an active membership alone cannot confer command access.
 // A verified owner is the enterprise super-administrator across every
 // Command Center module. Department roles remain restricted to their pages.
 const eligible=members.filter(member=>managementRoles.includes(member.role)&&
  (member.role==='owner'||(!ownerOnly&&roles.includes(member.role))));
 if(!eligible.length)redirect('/staff');
 const {data:verifiedManager,error:verificationError}=await db.rpc('landshop_is_management',{p_user:user.id});
 if(verificationError||verifiedManager!==true)redirect('/staff');
 const {data:organizations,error:orgError}=await db.from('organizations').select('id').eq('kind','landshop')
   .in('id',eligible.map(member=>member.organization_id));
 if(orgError||!organizations?.length)redirect('/staff');
 return {db,user,organizationIds:organizations.map(x=>x.id)};
}