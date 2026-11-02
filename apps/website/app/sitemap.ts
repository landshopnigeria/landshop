import type {MetadataRoute} from 'next';
import {publicDb,propertyHref} from '../lib/marketplace';
import {guides} from '../lib/guides';
import {landshopLocations} from '../lib/v22-locations';
export const dynamic='force-dynamic';
const base='https://www.landshopnigeria.com';
const high=['','about','contact','properties','estates','projects','projects/famous-gardens','products','plans/develop','plans/incubate','plans/grow','plans/devpro','plans/estatepro','insights','locations'];
const mid=['collections/prime','collections/luxury','projects/merit-park','projects/green-island','projects/maiyegun-beach-estate','services',
 'services/property-acquisition','services/advisory','services/mortgage','services/construction-credit',
 'investment-calculator','mortgage-calculator','loan-calculator','mortgage-review','visit','get-ready','diaspora','learn','plotwise','webinars',
 'careers','careers/programs','company/team','partners','partner-with-us','refer-and-earn','testimonials','support',
 'applications','thrift','grow/beta-mortgage','grow/mortgage-xtra','offers/plot-your-future','offer-terms',
 'coming-soon','privacy','terms'];
const hidden=new Set(['search','newsletter/unsubscribe','preferences','cookies','admin']);
const row=(path:string,priority:number,frequency:MetadataRoute.Sitemap[number]['changeFrequency']='monthly')=>({
 url:base+(path?'/'+path:'/'),changeFrequency:frequency,priority
});
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 const entries:MetadataRoute.Sitemap=[
 ...high.map(path=>row(path,path===''?1:path==='properties'?.95:.83,path==='properties'?'daily':'weekly')),
 ...mid.filter(path=>!hidden.has(path)).map(path=>row(path,.65,'monthly')),
 ...guides.map(guide=>row('insights/'+guide.slug,.72,'monthly')),
 ...landshopLocations.map(location=>row('locations/'+location.slug,.7,'monthly')),
 ...['2-bedroom-terrace','3-bedroom-apartment','3-bedroom-terrace'].map(kind=>row('homes/famous-gardens/'+kind,.7,'weekly'))
 ];
 const seen=new Set(entries.map(entry=>entry.url));
 try{
  const db=publicDb();
  if(db){
   const {data,error}=await db.from('properties').select('id,slug,status,created_at').eq('status','published').order('created_at',{ascending:false}).limit(2000);
   if(!error)for(const property of data||[]){
    const url=base+propertyHref(property);
    if(!seen.has(url)){entries.push({...row(propertyHref(property).replace(/^\//,''),.8,'weekly'),lastModified:property.created_at?new Date(property.created_at):undefined});seen.add(url);}
   }
  }
 }catch{ /* Static and editorial routes remain available during DB incidents. */ }
 return entries.filter(entry=>{if(seen.has(entry.url)){seen.delete(entry.url);return true;}return false;});
}
