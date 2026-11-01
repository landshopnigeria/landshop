import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.0";

// Never accept identity results from a browser. Veriff controls document
// authenticity, selfie comparison and liveness; only signed, re-fetched
// provider decisions can update a staff profile.
const env=(key:string)=>Deno.env.get(key)?.trim()||"";
const supabaseUrl=env("SUPABASE_URL");
const serviceKey=env("SUPABASE_SERVICE_ROLE_KEY");
const providerKey=env("VERIFF_API_KEY");
const providerSecret=env("VERIFF_SHARED_SECRET");
const providerBase=env("VERIFF_BASE_URL")||"https://stationapi.veriff.com";
const providerEnabled=env("VERIFF_IDV_ENABLED")==="true" && Boolean(providerKey&&providerSecret);
const allowedOrigins=new Set(["https://app.landshopnigeria.com","http://localhost:3000","http://127.0.0.1:3000"]);
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const admin=createClient(supabaseUrl,serviceKey,{auth:{autoRefreshToken:false,persistSession:false}});
const encoder=new TextEncoder();

function respond(value:unknown,status=200,origin?:string){
 const headers:Record<string,string>={"Content-Type":"application/json; charset=utf-8","Cache-Control":"private, no-store, max-age=0","Vary":"Origin"};
 if(origin&&allowedOrigins.has(origin))headers["Access-Control-Allow-Origin"]=origin;
 return new Response(JSON.stringify(value),{status,headers});
}
function fail(message:string,status=400,origin?:string){return respond({error:message},status,origin)}
function safeProviderBase(){
 const url=new URL(providerBase);
 if(url.protocol!=="https:"||url.username||url.password||
  !(url.hostname==="stationapi.veriff.com"||url.hostname.endsWith(".veriff.com")))throw Error("Invalid identity provider URL");
 return url.origin;
}
function safeSessionUrl(s:string){
 try{const u=new URL(s);return u.protocol==="https:"&&(u.hostname==="veriff.me"||u.hostname.endsWith(".veriff.me")||u.hostname==="veriff.com"||u.hostname.endsWith(".veriff.com"))}catch{return false}
}
function secureEqual(a:string,b:string){
 if(a.length!==b.length)return false;
 let difference=0;
 for(let i=0;i<a.length;i++)difference|=a.charCodeAt(i)^b.charCodeAt(i);
 return difference===0;
}
async function sign(value:string){
 const key=await crypto.subtle.importKey("raw",encoder.encode(providerSecret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const bytes=new Uint8Array(await crypto.subtle.sign("HMAC",key,encoder.encode(value)));
 return Array.from(bytes).map(b=>b.toString(16).padStart(2,"0")).join("");
}
async function confirmDecision(session:string){
 const url=safeProviderBase()+"/v1/sessions/"+encodeURIComponent(session)+"/decision";
 const response=await fetch(url,{headers:{"Content-Type":"application/json","X-AUTH-CLIENT":providerKey,"X-HMAC-SIGNATURE":await sign(session)},signal:AbortSignal.timeout(16000)});
 if(!response.ok)throw Error("Identity provider decision check unavailable");
 const raw=await response.text();
 const returned=response.headers.get("x-hmac-signature");
 if(!returned||!secureEqual(returned.toLowerCase(),await sign(raw)))throw Error("Identity provider response signature failed");
 const result=JSON.parse(raw);
 return result?.verification||null;
}
async function reconcile(sessionRow:{id:string;user_id:string;provider_session_id:string;status:string}){
 if(!providerEnabled)return null;
 const result=await confirmDecision(sessionRow.provider_session_id);
 if(!result)return null;
 if(result.id!==sessionRow.provider_session_id||result.vendorData!==sessionRow.id||result.endUserId!==sessionRow.user_id)throw Error("Identity session correlation failed");
 let state=String(result.status||"");
 if(!["approved","declined","review","resubmission_requested","expired","abandoned"].includes(state))return null;
 const documentType=typeof result.document?.type==="string"?result.document.type:"";
 const documentCountry=typeof result.document?.country==="string"?result.document.country:"";
 const code=Number.isInteger(result.code)?result.code:null;
 // Passing a liveness-only flow cannot approve identity. The provider must
 // return evidence of a verified identity document as well.
 if(state==="approved"&&!(code===9001&&documentType&&documentCountry))state="review";
 const {error}=await admin.rpc("landshop_staff_identity_provider_decision",{
  p_session:sessionRow.provider_session_id,p_status:state,p_code:code,
  p_document_type:documentType,p_document_country:documentCountry
 });
 if(error)throw Error("Identity decision could not be recorded");
 return state;
}
async function bearerUser(request:Request){
 const auth=request.headers.get("authorization")||"";
 if(!auth.startsWith("Bearer ")||auth.length>4100) return null;
 const {data,error}=await admin.auth.getUser(auth.slice(7));
 if(error||!data.user||!data.user.email_confirmed_at)return null;
 return data.user;
}
Deno.serve(async request=>{
 const origin=request.headers.get("origin")||"";
 if(request.method==="OPTIONS"){
  if(!allowedOrigins.has(origin))return fail("Forbidden",403);
  return new Response(null,{status:204,headers:{"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Max-Age":"180","Vary":"Origin","Cache-Control":"no-store"}});
 }
 if(request.method!=="POST")return fail("Method not allowed",405,origin);
 const target=new URL(request.url);
 if(target.searchParams.get("event")==="decision"){
  if(!providerEnabled)return fail("Provider is not provisioned",503);
  const headerKey=request.headers.get("x-auth-client")||"";
  const signature=request.headers.get("x-hmac-signature")||"";
  if(!secureEqual(headerKey,providerKey)||!/^[a-f0-9]{64}$/i.test(signature))return fail("Unauthorized provider",401);
  const raw=await request.text();
  if(raw.length>100000)return fail("Verification payload too large",413);
  if(!secureEqual(signature.toLowerCase(),await sign(raw)))return fail("Invalid provider signature",401);
  let payload:any;
  try{payload=JSON.parse(raw)}catch{return fail("Invalid verification event",400)}
  const session=payload?.verification?.id;
  if(typeof session!=="string"||!uuid.test(session))return fail("Missing verification session",400);
  const {data:row,error}=await admin.from("landshop_staff_identity_verifications")
   .select("id,user_id,provider_session_id,status").eq("provider_session_id",session).maybeSingle();
  if(error||!row)return fail("Unrecognized identity session",404);
  if(payload.verification.vendorData!==row.id||payload.verification.endUserId!==row.user_id)return fail("Wrong identity session",403);
  try{await reconcile(row);return respond({received:true})}
  catch{ return fail("Verification pending recheck",503) }
 }
 if(origin&&!allowedOrigins.has(origin))return fail("Forbidden origin",403);
 const user=await bearerUser(request);
 if(!user)return fail("Confirmed staff sign-in required",401,origin);
 let payload:any={};
 try{payload=await request.json()}catch{return fail("Invalid JSON",400,origin)}
 const action=typeof payload?.action==="string"?payload.action:"status";
 if(!["status","start"].includes(action))return fail("Invalid action",400,origin);
 const {data:profile,error:profileError}=await admin.from("landshop_staff_profiles")
  .select("user_id,organization_id,employment_state,kyc_state,photo_path,verification_provider")
  .eq("user_id",user.id).maybeSingle();
 if(profileError||!profile)return fail("Staff profile unavailable",404,origin);
 if(profile.employment_state!=="active")return fail("Staff account is not active",403,origin);
 const {data:member,error:memberError}=await admin.from("organization_members")
  .select("role").eq("user_id",user.id).eq("organization_id",profile.organization_id)
  .eq("status","active").maybeSingle();
 if(memberError||!member||member.role!=="staff")return fail("Basic staff membership required",403,origin);
 const {data:latest,error:readError}=await admin.from("landshop_staff_identity_verifications")
  .select("id,user_id,provider_session_id,status,session_url,created_at")
  .eq("user_id",user.id).order("created_at",{ascending:false}).limit(1).maybeSingle();
 if(readError)return fail("Identity verification unavailable",503,origin);
 if(action==="status"){
  let current=latest?.status||"not_started";
  if(latest&&["pending","review","resubmission_requested"].includes(current)&&providerEnabled){
   try{const result=await reconcile(latest);if(result)current=result}catch{/* Keep last verified database status; no false approvals. */}
  }
  return respond({enabled:providerEnabled,status:profile.kyc_state==="approved"?"approved":current,
   next:!providerEnabled?"provider_configuration_required":profile.kyc_state==="approved"?"completed":"complete_document_and_live_selfie",
   url:latest&&["pending","resubmission_requested"].includes(current)&&safeSessionUrl(latest.session_url)?latest.session_url:null},200,origin);
 }
 if(!providerEnabled)return fail("Independent identity provider is not configured yet. Basic staff access remains active.",503,origin);
 if(payload.consent!==true)return fail("Explicit biometric processing consent is required",400,origin);
 if(profile.kyc_state==="approved")return respond({status:"approved"},200,origin);
 if(profile.kyc_state!=="submitted"||!profile.photo_path)return fail("Upload your private portrait before starting identity verification",409,origin);
 if(latest&&["pending","review","resubmission_requested"].includes(latest.status)){
  return respond({status:latest.status,url:safeSessionUrl(latest.session_url)?latest.session_url:null},200,origin);
 }
 const {count,error:countError}=await admin.from("landshop_staff_identity_verifications")
  .select("id",{count:"exact",head:true}).eq("user_id",user.id)
  .gte("created_at",new Date(Date.now()-86400000).toISOString());
 if(countError)return fail("Identity verification is temporarily unavailable",503,origin);
 if((count||0)>=3)return fail("Daily verification limit reached. Request a manual review or try again tomorrow.",429,origin);
 const attemptId=crypto.randomUUID();
 let response:Response;
 try{
  response=await fetch(safeProviderBase()+"/v1/sessions",{
   method:"POST",headers:{"Content-Type":"application/json","X-AUTH-CLIENT":providerKey},
   body:JSON.stringify({verification:{
    callback:"https://app.landshopnigeria.com/staff?verification=complete",
    vendorData:attemptId,endUserId:user.id
   }}),signal:AbortSignal.timeout(15000)
  });
 }catch{return fail("Identity provider connection unavailable",503,origin)}
 if(!response.ok)return fail("Identity provider could not start verification",503,origin);
 const created=await response.json().catch(()=>null);
 const providerSession=created?.verification?.id,providerUrl=created?.verification?.url;
 if(typeof providerSession!=="string"||!uuid.test(providerSession)||
   typeof providerUrl!=="string"||!safeSessionUrl(providerUrl))return fail("Identity provider returned an invalid session",502,origin);
 const {error:insertError}=await admin.from("landshop_staff_identity_verifications").insert({
  id:attemptId,user_id:user.id,provider:"veriff",provider_session_id:providerSession,
  portrait_path:profile.photo_path,session_url:providerUrl,status:"pending",
  consented_at:new Date().toISOString()
 });
 if(insertError)return fail("Identity session could not be securely registered; retry after review.",409,origin);
 await admin.from("audit_events").insert({actor_id:user.id,event_type:"staff.biometric_session_started",
  metadata:{provider:"veriff",session_id:providerSession,consented:true}});
 return respond({status:"pending",url:providerUrl},200,origin);
});
