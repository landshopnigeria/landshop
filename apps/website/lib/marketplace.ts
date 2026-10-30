import {createClient} from '@supabase/supabase-js';
export type Listing={
 id:string;title:string;slug:string|null;property_type:string;collection_type?:'Prime'|'Luxury'|null;amount_kobo:number|null;price_is_starting_at:boolean;status:string;estate_id:string|null;
 sale_mode:'Buy'|'Rent'|'Shortlet'|null;bedrooms:number|null;bathrooms:number|null;floor_area_sqm:number|null;land_area_sqm:number|null;availability:string|null;
 estates?:{name:string;state:string|null;city:string|null;lga:string|null;area:string|null}|null
};
export const NIGERIA_STATES=['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','Federal Capital Territory','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'] as const;
export type Params={purpose?:string;type?:string;state?:string;city?:string;lga?:string;area?:string;min?:string;max?:string;bedrooms?:string;bathrooms?:string;minsize?:string;availability?:string;collection?:string;query?:string;sort?:string;page?:string;view?:string};
export const PAGE_SIZE=12;
export function propertyHref(property:{id:string;slug?:string|null}){return '/properties/'+encodeURIComponent(property.slug||property.id)}
export function propertyPrice(p:{amount_kobo:number|null|undefined;price_is_starting_at?:boolean|null}){return (p.price_is_starting_at&&p.amount_kobo!=null?'From ':'')+money(p.amount_kobo)}
export function money(kobo:number|null|undefined){return typeof kobo==='number'&&Number.isFinite(kobo)?new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0}).format(kobo/100):'Price on request'}
export function publicDb(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;return url&&key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}):null}
export function cleanFilters(p:Params){
 const clean=(value?:string,max=90)=>(typeof value==='string'?value:'').trim().slice(0,max);
 const state=clean(p.state,45),city=clean(p.city,60),lga=clean(p.lga,60),area=clean(p.area,70),type=clean(p.type,40),query=clean(p.query,80);
 const purpose=['Buy','Rent','Shortlet'].includes(p.purpose||'')?p.purpose!:'Buy';
 const sort=['newest','price_asc','price_desc'].includes(p.sort||'')?p.sort!:'newest';
 const view=p.view==='list'?'list':'grid';
 const positive=(raw?:string)=>{const n=Number(raw);return raw&&Number.isSafeInteger(n)&&n>0&&n<=1000000000000?n:0};
 const bedrooms=Number.isInteger(Number(p.bedrooms))&&Number(p.bedrooms)>=1&&Number(p.bedrooms)<=10?Number(p.bedrooms):0;
 const bathrooms=Number.isInteger(Number(p.bathrooms))&&Number(p.bathrooms)>=1&&Number(p.bathrooms)<=10?Number(p.bathrooms):0;
 const minsize=Number.isSafeInteger(Number(p.minsize))&&Number(p.minsize)>=1&&Number(p.minsize)<=100000000?Number(p.minsize):0;
 const availability=['available','off_plan','completed'].includes(p.availability||'')?p.availability!:'';
 const collection=['Prime','Luxury'].includes(p.collection||'')?p.collection!:'';
 return {purpose,type:['land','house','apartment','commercial','shortlet'].includes(type)?type:'',state:NIGERIA_STATES.includes(state as typeof NIGERIA_STATES[number])?state:'',city,lga,area,query,sort,view,bedrooms,bathrooms,minsize,availability,collection,min:positive(p.min),max:positive(p.max),page:Math.max(1,Math.min(100000,Number.isSafeInteger(Number(p.page))?Number(p.page):1))};
}
export type Filters=ReturnType<typeof cleanFilters>;
export function marketHref(filters:Filters,changes:Record<string,string|number|null>={}){const q=new URLSearchParams();for(const [key,value] of Object.entries({...filters,...changes})){if(value!==null&&value!==''&&value!==0&&!(key==='page'&&value===1)&&!(key==='purpose'&&value==='Buy')&&!(key==='sort'&&value==='newest')&&!(key==='view'&&value==='grid'))q.set(key,String(value))}return '/properties'+(q.size?'?'+q.toString():'')}
function safeLike(value:string){return value.replace(/[%_,\\]/g,'').trim()}
export async function listPublished(filters:Filters){
 const db=publicDb();if(!db)return {rows:[] as Listing[],count:0,error:'Property service is not configured'};
 // A Prime/Luxury collection is recorded in the historical deck but not yet
 // verified against the current estate/property database schema. Do not
 // silently pretend that this requested category is an active listing filter.
 // A Prime/Luxury classification is published only after a verified staff review.
 // Existing drafts with no verified collection remain absent from public results.
 let estateIds:string[]|null=null;
 if(filters.state||filters.city||filters.lga||filters.area){
  let estateQuery=db.from('estates').select('id').eq('status','published').limit(500);
  if(filters.state)estateQuery=estateQuery.eq('state',filters.state);
  if(filters.city){const q=safeLike(filters.city);estateQuery=estateQuery.or('city.ilike.%'+q+'%,lga.ilike.%'+q+'%')}
  if(filters.lga)estateQuery=estateQuery.ilike('lga','%'+safeLike(filters.lga)+'%');
  if(filters.area){const q=safeLike(filters.area);estateQuery=estateQuery.or('area.ilike.%'+q+'%,name.ilike.%'+q+'%')}
  const {data,error}=await estateQuery;
  if(error)return {rows:[] as Listing[],count:0,error:'Location lookup is temporarily unavailable'};
  estateIds=(data||[]).map(v=>v.id);
  if(!estateIds.length)return {rows:[] as Listing[],count:0,error:null};
 }
 let propertyQuery=db.from('properties')
  .select('id,title,slug,estate_id,property_type,amount_kobo,price_is_starting_at,status,sale_mode,bedrooms,bathrooms,floor_area_sqm,land_area_sqm,availability,estates(name,state,city,lga,area)',{count:'exact'})
  .eq('status','published');
 if(estateIds)propertyQuery=propertyQuery.in('estate_id',estateIds);
 if(filters.purpose==='Buy')propertyQuery=propertyQuery.or('sale_mode.eq.Buy,sale_mode.is.null').neq('property_type','shortlet');
 else propertyQuery=propertyQuery.eq('sale_mode',filters.purpose);
 if(filters.type)propertyQuery=propertyQuery.eq('property_type',filters.type);
 if(filters.collection)propertyQuery=propertyQuery.eq('collection_type',filters.collection).not('collection_verified_at','is',null);
 if(filters.query)propertyQuery=propertyQuery.ilike('title','%'+safeLike(filters.query)+'%');
 if(filters.bedrooms)propertyQuery=propertyQuery.gte('bedrooms',filters.bedrooms);
 if(filters.bathrooms)propertyQuery=propertyQuery.gte('bathrooms',filters.bathrooms);
 if(filters.minsize){if(filters.type==='land')propertyQuery=propertyQuery.gte('land_area_sqm',filters.minsize);else if(filters.type)propertyQuery=propertyQuery.gte('floor_area_sqm',filters.minsize);else propertyQuery=propertyQuery.or('floor_area_sqm.gte.'+filters.minsize+',land_area_sqm.gte.'+filters.minsize)}
 if(filters.availability)propertyQuery=propertyQuery.eq('availability',filters.availability);
 if(filters.min)propertyQuery=propertyQuery.gte('amount_kobo',filters.min*100);
 if(filters.max)propertyQuery=propertyQuery.lte('amount_kobo',filters.max*100);
 if(filters.sort==='price_asc')propertyQuery=propertyQuery.order('amount_kobo',{ascending:true,nullsFirst:false}).order('id',{ascending:true});
 else if(filters.sort==='price_desc')propertyQuery=propertyQuery.order('amount_kobo',{ascending:false,nullsFirst:false}).order('id',{ascending:true});
 else propertyQuery=propertyQuery.order('created_at',{ascending:false}).order('id',{ascending:false});
 const {data,error,count}=await propertyQuery.range((filters.page-1)*PAGE_SIZE,filters.page*PAGE_SIZE-1);
 return {rows:(data||[]) as unknown as Listing[],count:count||0,error:error?'Published inventory cannot be retrieved at this time':null};
}
