'use client';
import {useEffect,useState} from 'react';
import {createBrowserClient} from '@supabase/ssr';
import SiteIcon from './SiteIcon';
const home='https://portal.landshopnigeria.com/';
function client(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return null;return createBrowserClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true}})}
export default function PropertyActions({propertyId,title,slug}:{propertyId:string;title:string;slug:string}){
 const [saved,setSaved]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const url='https://www.landshopnigeria.com/properties/'+encodeURIComponent(slug);
 useEffect(()=>{let cancelled=false;(async()=>{const db=client();if(!db)return;const {data:{user}}=await db.auth.getUser();
  if(!user)return;const {data}=await db.from('property_saved_listings').select('property_id').eq('property_id',propertyId).eq('user_id',user.id).maybeSingle();
  if(!cancelled)setSaved(Boolean(data))})();return()=>{cancelled=true}},[propertyId]);
 async function toggle(){
  if(busy)return;setBusy(true);setMessage('');
  try{const db=client();if(!db)throw Error('Sign-in service unavailable');
   const {data:{user}}=await db.auth.getUser();
   if(!user){setMessage('Sign in to your Landshop account to save this property.');return}
   const {error}=saved?await db.from('property_saved_listings').delete().eq('property_id',propertyId).eq('user_id',user.id):
    await db.from('property_saved_listings').insert({user_id:user.id,property_id:propertyId});
   if(error)throw Error('Could not update your saved properties');
   setSaved(v=>!v);setMessage(saved?'Property removed from saved list.':'Property saved to your account.');
  }catch(e){setMessage(e instanceof Error?e.message:'Unable to save this property')}finally{setBusy(false)}
 }
 async function share(){
  setMessage('');
  try{if(navigator.share){await navigator.share({title,url});return}
   await navigator.clipboard.writeText(url);setMessage('Property link copied.');
  }catch{setMessage('Share was cancelled or is unavailable. You can use Copy link.')}
 }
 async function copy(){try{await navigator.clipboard.writeText(url);setMessage('Property link copied.')}catch{setMessage('Copy is unavailable. Select the URL from your browser address bar.')}}
 return <div className="ld-actions" aria-label="Property sharing and saving">
  <button type="button" disabled={busy} onClick={toggle}><SiteIcon name="heart" size={20}/>{saved?'Saved':'Save property'}</button>
  <button type="button" onClick={share}><SiteIcon name="share" size={20}/>Share</button>
  <button type="button" onClick={copy}><SiteIcon name="copy" size={20}/>Copy link</button>
  <a href={'https://wa.me/?text='+encodeURIComponent(title+': '+url)} target="_blank" rel="noopener noreferrer"><SiteIcon name="external" size={20}/>WhatsApp</a>
  {message&&<span className="ld-action-feedback" role="status">{message}{message.startsWith('Sign in')&&<a href={home}>Open portal</a>}</span>}
 </div>;
}
