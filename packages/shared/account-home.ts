import type {SupabaseClient} from '@supabase/supabase-js';
/** Destination only. Every page/API retains its own database authorization. */
export async function accountHome(db:SupabaseClient,user:{id:string;user_metadata?:Record<string,unknown>}){
 const {data:state}=await db.rpc('landshop_my_account_state');
 if(state==='suspended'||state==='archived')return '/account-unavailable';
 // The server claims only a prior Owner assignment matched to confirmed Auth email.
 await db.rpc('landshop_claim_management_assignment');
 const {data:management,error}=await db.rpc('landshop_is_management',{p_user:user.id});
 if(!error&&management===true)return '/admin';
 const {data:staff}=await db.from('landshop_staff_profiles').select('user_id').eq('user_id',user.id).maybeSingle();
 return staff||user.user_metadata?.staff_signup===true?'/staff':'/dashboard';
}
