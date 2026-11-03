import {NextRequest,NextResponse} from 'next/server';
import {createServerClient} from '@supabase/ssr';

function callbackFailure(reason:string){
 return NextResponse.redirect('https://app.landshopnigeria.com/staff/sign-in?error='+reason,
  {headers:{'Cache-Control':'private, no-store, max-age=0'}});
}

// Staff-specific verified-email entrypoint, registered as an allowed Supabase redirect.
// Auth cookies use the same .landshopnigeria.com scope as the staff application.
export async function GET(request:NextRequest){
 const origin='https://app.landshopnigeria.com';
 const code=request.nextUrl.searchParams.get('code');
 const tokenHash=request.nextUrl.searchParams.get('token_hash');
 const type=request.nextUrl.searchParams.get('type')||'signup';
 if(!code&&!tokenHash)return callbackFailure('missing_confirmation');
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return callbackFailure('configuration');
 const response=NextResponse.redirect(origin+'/staff');
 response.headers.set('Cache-Control','private, no-store');
 const supabase=createServerClient(url,key,{
  cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true},
  cookies:{
   getAll(){return request.cookies.getAll()},
   setAll(changes){changes.forEach(({name,value,options})=>{
    request.cookies.set(name,value);
    response.cookies.set(name,value,options);
   })}
  }
 });
 let error:unknown=null;
 if(code){
  const result=await supabase.auth.exchangeCodeForSession(code);error=result.error;
 }else if(tokenHash&&['signup','invite','email_change','magiclink','recovery'].includes(type)){
  const result=await supabase.auth.verifyOtp({token_hash:tokenHash,type:type as 'signup'|'invite'|'email_change'|'magiclink'|'recovery'});
  error=result.error;
 }else return callbackFailure('invalid_confirmation');
 if(error)return callbackFailure('verification_failed');
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return callbackFailure('session_unavailable');
 // Initialize verified staff personal profile; no employment, KYC or role elevation.
 if(type!=='recovery'&&user.email_confirmed_at&&user.user_metadata?.staff_signup===true){
  const fields=user.user_metadata,age=fields.age_at_registration;
  if(typeof fields.preferred_username==='string'&&typeof age==='number'&&
     Number.isInteger(age)&&age>=18&&age<=120&&typeof fields.gender==='string'&&
     typeof fields.requested_role==='string'){
   await supabase.rpc('landshop_staff_onboard',{
    p_username:fields.preferred_username,p_age:age,p_gender:fields.gender,
    p_requested_role:fields.requested_role
   });
  }
 }
 // Recovery links must remain password recovery links and may not bypass that flow.
 if(type==='recovery')response.headers.set('Location','https://portal.landshopnigeria.com/update-password');
 else if(user.user_metadata?.staff_signup!==true){
  // Nonstaff accounts must never be silently enrolled as employees.
  response.headers.set('Location',origin+'/dashboard');
 }else{
  // Same verified-management gate as the Command Center. Merely requesting
  // an executive role in editable signup metadata never grants privileges.
  const {data:members,error:memberError}=await supabase.from('organization_members')
   .select('organization_id,role').eq('user_id',user.id).eq('status','active');
  if(!memberError&&members?.length){
   const allowed=members.filter(m=>['owner','ceo','founder','admin','technology_officer','technology_consultant'].includes(m.role));
   if(allowed.length){
    const [{data:organizations,error:orgError},{data:management,error:managementError}]=await Promise.all([
     supabase.from('organizations').select('id').eq('kind','landshop')
      .in('id',allowed.map(m=>m.organization_id)),
     supabase.rpc('landshop_is_management',{p_user:user.id})
    ]);
    if(!orgError&&organizations?.length&&!managementError&&management===true)
     response.headers.set('Location',origin+'/admin');
   }
  }
 }
 return response;
}
