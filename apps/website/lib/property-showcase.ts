import {publicDb} from './marketplace';
import {parsePropertyVideo,type SupportedVideo} from './property-video';
export type FeatureRow={label:string;value:string};
export type PriceRow={name:string;amount_ngn:number|null;details:string};
export type PublicMedia={id:string;property_id:string;kind:'photo'|'floorplan';title:string;src:string;position:number};
export type PropertyShowcase={
 description:string;address_line:string;city:string;state:string;lga:string;landmark:string;postal_code:string;
 latitude:number|null;longitude:number|null;location_verified:boolean;
 features:FeatureRow[];pricing:PriceRow[];amenities:string[];videos:SupportedVideo[];
};
const s=(v:unknown,max=300)=>typeof v==='string'?v.trim().slice(0,max):'';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const emptyShowcase:PropertyShowcase={description:'',address_line:'',city:'',state:'',lga:'',landmark:'',postal_code:'',latitude:null,longitude:null,location_verified:false,features:[],pricing:[],amenities:[],videos:[]};
export async function loadShowcase(id:string):Promise<PropertyShowcase>{
 const db=publicDb();if(!db||!uuid.test(id))return emptyShowcase;
 const {data,error}=await db.from('property_showcase').select('payload,location_verified').eq('property_id',id).maybeSingle();
 if(error||!data||!data.payload||typeof data.payload!=='object'||Array.isArray(data.payload))return emptyShowcase;
 const p=data.payload as Record<string,unknown>;
 const num=(v:unknown,min:number,max:number)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max?v:null;
 const features=(Array.isArray(p.features)?p.features:[]).slice(0,30).map((r:unknown)=>{
  const x=r&&typeof r==='object'&&!Array.isArray(r)?r as Record<string,unknown>:{};
  return {label:s(x.label,90),value:s(x.value,240)};
 }).filter(v=>v.label&&v.value);
 const pricing=(Array.isArray(p.pricing)?p.pricing:[]).slice(0,30).map((r:unknown)=>{
  const x=r&&typeof r==='object'&&!Array.isArray(r)?r as Record<string,unknown>:{};
  return {name:s(x.name,100),amount_ngn:num(x.amount_ngn,0,1000000000000),details:s(x.details,250)};
 }).filter(v=>v.name);
 const videos=(Array.isArray(p.videos)?p.videos:[]).slice(0,12).map((r:unknown)=>{
  const x=r&&typeof r==='object'&&!Array.isArray(r)?r as Record<string,unknown>:{};
  return parsePropertyVideo(s(x.url,1000),s(x.title,140)||'Property video');
 }).filter((v):v is SupportedVideo=>v!==null);
 const latitude=num(p.latitude,-90,90),longitude=num(p.longitude,-180,180);
 return {description:s(p.description,6000),address_line:s(p.address_line,350),city:s(p.city,100),state:s(p.state,100),
 lga:s(p.lga,100),landmark:s(p.landmark,150),postal_code:s(p.postal_code,30),latitude,longitude,
 location_verified:data.location_verified===true&&latitude!==null&&longitude!==null&&Boolean(s(p.address_line,350))&&Boolean(s(p.city,100))&&Boolean(s(p.state,100)),
 features,pricing,amenities:(Array.isArray(p.amenities)?p.amenities:[]).slice(0,30).map(x=>s(x,100)).filter(Boolean),videos};
}
export async function loadPropertyMedia(ids:string[]):Promise<Record<string,PublicMedia[]>>{
 const db=publicDb(),valid=[...new Set(ids.filter(id=>uuid.test(id)))].slice(0,40);
 const output:Record<string,PublicMedia[]>={};
 if(!db||!valid.length)return output;
 const {data,error}=await db.from('property_showcase_media').select('id,property_id,kind,title,object_path,position').in('property_id',valid).eq('status','approved').order('position',{ascending:true}).limit(200);
 if(error)return output;
 for(const item of data||[]){
  if(!valid.includes(item.property_id)||!['photo','floorplan'].includes(item.kind))continue;
  const path=String(item.object_path||'');
  if(!path.startsWith(item.property_id+'/'+item.kind+'/')||!/\.(?:webp|jpe?g|png|pdf)$/i.test(path)||path.includes('..'))continue;
  const {data:url}=db.storage.from('landshop-property-public').getPublicUrl(path);
  if(!url.publicUrl)continue;
  (output[item.property_id] ||= []).push({id:item.id,property_id:item.property_id,kind:item.kind,title:String(item.title||'Property media'),src:url.publicUrl,position:Number(item.position)||0});
 }
 return output;
}
export function propertyAddress(p:PropertyShowcase):string{
 return [p.address_line,p.landmark,p.lga,p.city,p.state,'Nigeria'].filter(Boolean).join(', ');
}
