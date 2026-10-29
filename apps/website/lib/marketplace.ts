
import {createClient} from '@supabase/supabase-js';
export type Listing={id:string,title:string,property_type:string,amount_kobo:number|null,status:string,estate_id:string|null,sale_mode?:string|null,bedrooms?:number|null,bathrooms?:number|null,availability?:string|null,floor_area_sqm?:number|null,land_area_sqm?:number|null,estates?:{name:string,state:string|null,city:string|null,lga?:string|null,area?:string|null}|null};
export const NIGERIA_STATES=['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','Federal Capital Territory','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'] as const;
export type Params={purpose?:string;type?:string;state?:string;lga?:string;city?:string;area?:string;min?:string;max?:string;beds?:string;baths?:string;min_size?:string;availability?:string;query?:string;sort?:string;page?:string};
export const PAGE_SIZE=6;
export function money(kobo:number|null|undefined){return typeof kobo==='number'&&Number.isFinite(kobo)?new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0}).format(kobo/100):'Price on request'}
export function publicDb(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;return url&&key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}):null}
export function cleanFilters(p:Params){
 const txt=(value?:string,max=80)=>(value||'').trim().slice(0,max).replace(/[,%()]/g,'');
 const state=txt(p.state,50),city=txt(p.city,60),type=txt(p.type,30),query=txt(p.query,80),lga=txt(p.lga,70),area=txt(p.area,70);
 const purpose=['Buy','Rent','Shortlet'].includes(p.purpose||'')?p.purpose!:'Buy';
 const sort=['newest','price_asc','price_desc'].includes(p.sort||'')?p.sort!:'newest';
 const positive=(raw?:string,limit=1000000000000)=>{const n=Number(raw);return raw&&Number.isSafeInteger(n)&&n>0&&n<=limit?n:0};
 const availability=['available','under_offer','reserved','sold','rented'].includes(p.availability||'')?p.availability!:'';
 const beds=positive(p.beds,25),baths=positive(p.baths,25),min_size=positive(p.min_size,100000000);
 return {purpose,type,state:NIGERIA_STATES.includes(state as typeof NIGERIA_STATES[number])?state:'',lga,city,area,query,sort,min:positive(p.min),max:positive(p.max),beds,baths,min_size,availability,page:Math.max(1,Math.min(100000,Number.isSafeInteger(Number(p.page))?Number(p.page):1))};
}
export type Filters=ReturnType<typeof cleanFilters>;
export function marketHref(filters:Filters,changes:Record<string,string|number|null>={}){const q=new URLSearchParams();for(const [key,value] of Object.entries({...filters,...changes})){if(value!==null&&value!==''&&value!==0&&!(key==='page'&&value===1)&&!(key==='purpose'&&value==='Buy')&&!(key==='sort'&&value==='newest'))q.set(key,String(value))}return '/properties'+(q.size?'?'+q.toString():'')}
export async function listPublished(filters:Filters){
 const db=publicDb();if(!db)return {rows:[] as Listing[],count:0,error:'Property service is not configured'};
 let estateIds:string[]|null=null;
 if(filters.state||filters.city||filters.lga||filters.area){
  let estateQuery=db.from('estates').select('id').eq('status','published').limit(500);
  if(filters.state)estateQuery=estateQuery.eq('state',filters.state);
  if(filters.lga)estateQuery=estateQuery.ilike('lga','%'+filters.lga+'%');
  if(filters.city)estateQuery=estateQuery.ilike('city','%'+filters.city+'%');
  if(filters.area)estateQuery=estateQuery.ilike('area','%'+filters.area+'%');
  const {data,error}=await estateQuery;
  if(error)return {rows:[] as Listing[],count:0,error:'Location lookup is temporarily unavailable'};
  estateIds=(data||[]).map(v=>v.id);
  if(!estateIds.length)return {rows:[] as Listing[],count:0,error:null};
 }
 let query=db.from('properties')
  .select('id,title,estate_id,property_type,amount_kobo,status,sale_mode,bedrooms,bathrooms,floor_area_sqm,land_area_sqm,availability,estates(name,state,city,lga,area)',{count:'exact'})
  .eq('status','published');
 if(filters.purpose==='Buy')query=query.or('sale_mode.eq.Buy,sale_mode.is.null');
 else query=query.eq('sale_mode',filters.purpose);
 if(estateIds)query=query.in('estate_id',estateIds);
 if(filters.type)query=query.eq('property_type',filters.type);
 if(filters.query)query=query.ilike('title','%'+filters.query+'%');
 if(filters.min)query=query.gte('amount_kobo',filters.min*100);
 if(filters.max)query=query.lte('amount_kobo',filters.max*100);
 if(filters.beds)query=query.gte('bedrooms',filters.beds);
 if(filters.baths)query=query.gte('bathrooms',filters.baths);
 if(filters.availability)query=query.eq('availability',filters.availability);
 if(filters.min_size){
  if(filters.type==='land')query=query.gte('land_area_sqm',filters.min_size);
  else if(filters.type)query=query.gte('floor_area_sqm',filters.min_size);
  else query=query.or('floor_area_sqm.gte.'+filters.min_size+',land_area_sqm.gte.'+filters.min_size);
 }
 if(filters.sort==='price_asc')query=query.order('amount_kobo',{ascending:true,nullsFirst:false}).order('id',{ascending:true});
 else if(filters.sort==='price_desc')query=query.order('amount_kobo',{ascending:false,nullsFirst:false}).order('id',{ascending:true});
 else query=query.order('created_at',{ascending:false}).order('id',{ascending:false});
 const {data,error,count}=await query.range((filters.page-1)*PAGE_SIZE,filters.page*PAGE_SIZE-1);
 return {rows:(data||[]) as unknown as Listing[],count:count||0,error:error?'Published inventory cannot be retrieved at this time':null};
}
