/** Strict allowlist for Landshop native account links; no arbitrary redirect URLs. */
export type Inbound=
 |{kind:'invitation';referral:string}
 |{kind:'auth-code';code:string;recovery:boolean}
 |{kind:'auth-token';tokenHash:string;otpType:'signup'|'recovery'|'invite'|'email_change'|'magiclink'}
 |{kind:'auth-error';message:string}
 |{kind:'ignored'};
const pattern=/^LANDSHOP[0-9]{2,12}$/;
const otpTypes=['signup','recovery','invite','email_change','magiclink'] as const;

export function parseInboundUrl(raw:string|null|undefined):Inbound{
 if(!raw||raw.length>5000)return {kind:'ignored'};
 let url:URL;
 try{url=new URL(raw)}catch{return {kind:'ignored'}}
 const native=url.protocol==='landshop:';
 const validPortal=url.protocol==='https:'&&url.hostname==='portal.landshopnigeria.com';
 const authCallback=native&&((url.hostname==='auth'&&url.pathname==='/callback')||(!url.hostname&&url.pathname==='/auth/callback'));
 const inviteLink=(native&&url.hostname==='invite')||(validPortal&&(url.pathname==='/'||url.pathname===''));
 if(authCallback){
  const error=url.searchParams.get('error');
  if(error)return {kind:'auth-error',message:'The authentication link was rejected or has expired. Request a new link.'};
  const code=url.searchParams.get('code');
  if(code&&code.length<=2048)return {kind:'auth-code',code,recovery:url.searchParams.get('type')==='recovery'};
  const tokenHash=url.searchParams.get('token_hash');
  const type=url.searchParams.get('type');
  if(tokenHash&&tokenHash.length<=2048&&otpTypes.some(t=>t===type))
    return {kind:'auth-token',tokenHash,otpType:type as (typeof otpTypes)[number]};
  return {kind:'auth-error',message:'This authentication link is incomplete. Please request a new one.'};
 }
 if(inviteLink){
  const code=(url.searchParams.get('ref')||'').trim().toUpperCase();
  if(pattern.test(code))return {kind:'invitation',referral:code};
 }
 return {kind:'ignored'};
}
