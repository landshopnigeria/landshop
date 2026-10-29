import type {MetadataRoute} from 'next';
import {publicDb,propertyHref} from '../lib/marketplace';
export const dynamic='force-dynamic';
const base='https://www.landshopnigeria.com';
const paths=['','about','contact','develop','incubate','grow','properties','insights','applications','thrift','company/team',
 'services/property-acquisition','services/advisory','services/mortgage','services/construction-credit',
 'grow/beta-mortgage','grow/mortgage-xtra'];
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 const today=new Date();
 const entries:MetadataRoute.Sitemap=paths.map(path=>({url:base+'/'+path,lastModified:today,changeFrequency:path==='properties'?'daily':'weekly',priority:path===''?1:path==='properties'?.95:.7}));
 const db=publicDb();
 if(!db)return entries;
 const {data,error}=await db.from('properties').select('id,slug,created_at').eq('status','published').order('created_at',{ascending:false}).limit(1000);
 if(error)return entries;
 for(const p of data||[]){
  entries.push({url:base+propertyHref(p),lastModified:p.created_at?new Date(p.created_at):today,changeFrequency:'weekly',priority:.8});
 }
 return entries;
}
