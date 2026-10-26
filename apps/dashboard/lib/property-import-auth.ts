import {NextRequest} from 'next/server';
import {createServerClient} from '@supabase/ssr';

export async function authorizedImporter(request:NextRequest){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return null;
 const db=createServerClient(url,key,{
  cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true},
  cookies:{getAll(){return request.cookies.getAll()},setAll(){}}
 });
 const {data:{user},error}=await db.auth.getUser();
 if(error||!user)return null;
 const {data:members, error:memberError}=await db.from('organization_members')
 .select('organization_id,role').eq('user_id',user.id).eq('status','active');
 if(memberError||!members?.length)return null;
 const approved=members.filter(x=>['owner','admin','legal','operations','sales'].includes(x.role));
 if(!approved.length)return null;
 const {data:orgs,error:orgError}=await db.from('organizations').select('id').eq('kind','landshop').in('id',approved.map(x=>x.organization_id));
 return (!orgError&&orgs?.length)?{user,db}:null;
}
