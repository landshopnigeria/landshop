'use client';
import {useState} from 'react';
import {createBrowserClient} from '@supabase/ssr';
import './showcase-editor.css';
type Payload=Record<string,unknown>;
type Asset={id:string;kind:string;status:string;object_path:string;uploaded_by:string};
type Media={id:string;kind:string;status:string;object_path:string;title:string;submitted_by:string;created_at:string};
type Props={propertyId:string;propertyStatus:string;initial:Payload;approved:boolean;currentUserId:string;canApprove:boolean;assets:Asset[];initialMedia:Media[]};
const text=(v:unknown)=>typeof v==='string'?v:'';
const lines=(v:unknown)=>Array.isArray(v)?v:[];
const permitted=new Set(['youtube.com','www.youtube.com','youtu.be','m.youtube.com','www.youtu.be','instagram.com','www.instagram.com','tiktok.com','www.tiktok.com','m.tiktok.com','vimeo.com','www.vimeo.com']);
function client(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)throw new Error('Supabase is not configured');
 return createBrowserClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true}});
}
function parseRows(raw:string,type:'features'|'pricing'|'videos'){
 return raw.split('\n').map(row=>row.trim()).filter(Boolean).slice(0,30).map(row=>{
  const cols=row.split('|').map(x=>x.trim());
  if(type==='features'){if(!cols[0]||!cols[1])throw Error('Each feature needs: Feature | Value');return {label:cols[0].slice(0,90),value:cols.slice(1).join(' | ').slice(0,240)}}
  if(type==='pricing'){
   const amount=cols[1]?.replace(/[₦,\s]/g,'');
   const n=amount?Number(amount):null;
   if(!cols[0]||n!==null&&(!Number.isFinite(n)||n<0||n>1000000000000))throw Error('Pricing format: Unit | Price in naira | Notes');
   return {name:cols[0].slice(0,100),amount_ngn:n,details:(cols[2]||'').slice(0,250)}
  }
  if(!cols[0]||!cols[1])throw Error('Videos require: Title | HTTPS URL');
  let url:URL;try{url=new URL(cols[1])}catch{throw Error('Video URL is not valid')}
  if(url.protocol!=='https:'||url.username||url.password||url.port||!permitted.has(url.hostname.toLowerCase()))throw Error('Video must be from YouTube, TikTok, Instagram or Vimeo');
  return {title:cols[0].slice(0,140),url:url.toString()};
 });
}
async function optimizeImage(file:File):Promise<Blob>{
 if(file.size>20*1024*1024)throw Error('Image exceeds the 20 MB upload limit');
 const href=URL.createObjectURL(file);
 try{
  const img=new Image();img.src=href;await img.decode();
  const longest=Math.max(img.naturalWidth,img.naturalHeight);
  if(!longest||longest>25000)throw Error('Invalid image dimensions');
  const ratio=Math.min(1,1920/longest),canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(img.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(img.naturalHeight*ratio));
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('Image processing not supported');
  ctx.drawImage(img,0,0,canvas.width,canvas.height);
  const output=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/webp',.84));
  if(!output||output.type!=='image/webp')throw Error('Could not prepare WebP preview');
  return output;
 }finally{URL.revokeObjectURL(href)}
}
export default function ShowcaseEditor({propertyId,propertyStatus,initial,approved,currentUserId,canApprove,assets,initialMedia}:Props){
 const [fields,setFields]=useState<Record<string,string>>({
  description:text(initial.description),address_line:text(initial.address_line),landmark:text(initial.landmark),
  lga:text(initial.lga),city:text(initial.city),state:text(initial.state),postal_code:text(initial.postal_code),
  latitude:initial.latitude==null?'':String(initial.latitude),longitude:initial.longitude==null?'':String(initial.longitude)
 });
 const [features,setFeatures]=useState(lines(initial.features).map((v:any)=>[v.label,v.value].join(' | ')).join('\n'));
 const [pricing,setPricing]=useState(lines(initial.pricing).map((v:any)=>[v.name,v.amount_ngn??'',v.details||''].join(' | ')).join('\n'));
 const [amenities,setAmenities]=useState(lines(initial.amenities).map(String).join('\n'));
 const [videos,setVideos]=useState(lines(initial.videos).map((v:any)=>[v.title,v.url].join(' | ')).join('\n'));
 const [media,setMedia]=useState(initialMedia),[kind,setKind]=useState<'photo'|'floorplan'>('photo');
 const [source,setSource]=useState(''),[file,setFile]=useState<File|null>(null),[mediaTitle,setMediaTitle]=useState('');
 const [selected,setSelected]=useState(''),[reviewNote,setReviewNote]=useState('');
 const [pinVerified,setPinVerified]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const formValue=(key:string)=><input value={fields[key]||''} onChange={event=>setFields(v=>({...v,[key]:event.target.value}))} maxLength={key==='address_line'?350:100}/>;
 async function save(){
  setBusy(true);setMessage('');
  try{
   const coord=(v:string,min:number,max:number)=>{if(!v.trim())return null;const n=Number(v);if(!Number.isFinite(n)||n<min||n>max)throw Error('Coordinates out of range');return n;};
   const payload={
    ...fields,description:fields.description.trim(),latitude:coord(fields.latitude,-90,90),
    longitude:coord(fields.longitude,-180,180),
    features:parseRows(features,'features'),pricing:parseRows(pricing,'pricing'),
    amenities:amenities.split('\n').map(s=>s.trim().slice(0,100)).filter(Boolean).slice(0,30),
    videos:parseRows(videos,'videos')
   };
   if(payload.description.length>6000)throw Error('Description exceeds 6000 characters');
   const {error}=await client().rpc('landshop_showcase_save',{p_property:propertyId,p_payload:payload});
   if(error)throw Error(error.message||'Could not save property details');
   setMessage('Property detail draft saved. A separate authorized reviewer must approve it before publication.');
  }catch(e){setMessage(e instanceof Error?e.message:'Save failed');}
  finally{setBusy(false)}
 }
 async function approveProfile(){
  setBusy(true);setMessage('');
  try{
   const {error}=await client().rpc('landshop_showcase_approve',{p_property:propertyId,p_confirm_pin:pinVerified});
   if(error)throw Error(error.message||'Approval was rejected');
   setMessage('Independent approval recorded. Approved details will appear when the property is published.');
  }catch(e){setMessage(e instanceof Error?e.message:'Approval failed')}finally{setBusy(false)}
 }
 async function upload(){
  setBusy(true);setMessage('');
  try{
   if(!file)throw Error('Select a property photo or floor plan');
   if(mediaTitle.trim().length<3)throw Error('Add a meaningful caption');
   if(kind==='photo'&&!source)throw Error('Choose the independently verified original photo first');
   if(kind==='floorplan'&&!['application/pdf','image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Floor plan must be a JPEG, PNG, WebP or PDF');
   if(kind==='photo'&&!file.type.startsWith('image/'))throw Error('Please upload an original photograph');
   const blob=file.type==='application/pdf'&&kind==='floorplan'?file:await optimizeImage(file);
   if(blob.size>20*1024*1024)throw Error('Media exceeds 20 MB');
   const extension=blob.type==='application/pdf'?'pdf':'webp',path=propertyId+'/'+kind+'/'+crypto.randomUUID().replaceAll('-','')+'.'+extension;
   const db=client();
   const {error:storageError}=await db.storage.from('landshop-property-public').upload(path,blob,{contentType:blob.type,upsert:false});
   if(storageError)throw Error('Approved-media storage upload failed: '+storageError.message);
   const {data,error}=await db.rpc('landshop_showcase_submit_media',{p_property:propertyId,p_kind:kind,p_path:path,p_title:mediaTitle.trim(),p_source_asset:kind==='photo'?source:null});
   if(error)throw Error('Derivative uploaded but submission failed. Contact an administrator with path '+path);
   setMedia(v=>[{id:String(data),kind,status:'pending',object_path:path,title:mediaTitle.trim(),submitted_by:currentUserId,created_at:new Date().toISOString()},...v]);
   setFile(null);setMediaTitle('');setMessage('Property media submitted for independent approval. Public listing will not show it until reviewed.');
  }catch(e){setMessage(e instanceof Error?e.message:'Media upload failed')}finally{setBusy(false)}
 }
 async function reviewMedia(approve:boolean){
  setBusy(true);setMessage('');
  try{
   if(reviewNote.trim().length<15)throw Error('Give at least 15 characters describing rights and property identity checks');
   const {error}=await client().rpc('landshop_showcase_review_media',{p_media:selected,p_approve:approve,p_note:reviewNote.trim()});
   if(error)throw Error(error.message||'Review denied');
   setMedia(v=>v.map(m=>m.id===selected?{...m,status:approve?'approved':'rejected'}:m));
   setSelected('');setReviewNote('');setMessage('Media review decision recorded.');
  }catch(e){setMessage(e instanceof Error?e.message:'Review failed')}finally{setBusy(false)}
 }
 const verified=assets.filter(a=>a.kind==='property_image'&&a.status==='verified');
 return <section className="ls-editor">
  <div className="ls-editor-head"><span>LANDSHOP PROPERTY ENGINE / V19</span><h2>Property detail, pricing &amp; media studio</h2><p>Prepare accurate public information. All changes require independent review, and precise map pins require explicit address verification.</p></div>
  <div className="ls-editor-block"><h3>01 / Property description &amp; precise address</h3><label>Detailed description<textarea rows={6} value={fields.description} maxLength={6000} onChange={e=>setFields(x=>({...x,description:e.target.value}))} placeholder="Describe the actual property, location, status, title and important context."/></label>
   <div className="ls-editor-fields">{[['address_line','Street address / plot reference'],['landmark','Landmark'],['lga','LGA'],['city','City / Town'],['state','State'],['postal_code','Postal code'],['latitude','Latitude'],['longitude','Longitude']].map(([k,label])=><label key={k}>{label}{formValue(k)}</label>)}</div>
   <p className="ls-editor-note">The map is visible only when a separate reviewer explicitly confirms that the coordinates correspond to the street address.</p>
  </div>
  <div className="ls-editor-block"><h3>02 / Property features &amp; pricing tables</h3><div className="ls-editor-fields">
   <label>Feature rows — one per line<textarea rows={6} value={features} onChange={e=>setFeatures(e.target.value)} placeholder="Parking | 2 spaces\nTitle | Government allocation\nElectricity | Dedicated supply"/></label>
   <label>Price rows — one per line<textarea rows={6} value={pricing} onChange={e=>setPricing(e.target.value)} placeholder="2 Bedroom | 250000000 | Initial deposit on request\n3 Bedroom | 350000000 | Subject to availability"/></label>
   <label>Amenities — one per line<textarea rows={5} value={amenities} onChange={e=>setAmenities(e.target.value)} placeholder="24-hour security\nSwimming pool\nFitness centre"/></label>
   <label>Videos — Title | URL per line<textarea rows={5} value={videos} onChange={e=>setVideos(e.target.value)} placeholder="Estate tour | https://youtu.be/XXXXXXXXXXX\nOverview | https://vimeo.com/123456789"/></label>
  </div><p className="ls-editor-note">Video providers: YouTube, Instagram, TikTok and Vimeo. Uploading or pasting generic third-party property imagery is not permitted.</p>
   <button disabled={busy} onClick={save} className="ls-editor-action">Save property-detail draft</button>
  </div>
  {canApprove&&<div className="ls-editor-block ls-editor-review"><h3>03 / Independent content approval</h3><label className="ls-editor-checkbox"><input type="checkbox" checked={pinVerified} onChange={e=>setPinVerified(e.target.checked)}/> I have checked that the exact street address matches the latitude/longitude map marker. Leave unchecked to hide the map.</label><button className="ls-editor-action" disabled={busy||!['review','published'].includes(propertyStatus)} onClick={approveProfile}>Approve latest submitted details</button><p className="ls-editor-note">The staff member who last saved the draft cannot approve their own changes. Property must be in Review or Published status.</p></div>}
  <div className="ls-editor-block"><h3>04 / Original photography &amp; floor plans</h3><p>Upload an optimized marketing copy from an independently verified owner photograph, or a legitimate public floor plan. No identity documents, deeds or private surveys.</p>
   <div className="ls-editor-fields"><label>Media category<select value={kind} onChange={e=>setKind(e.target.value as 'photo'|'floorplan')}><option value="photo">Property photo</option><option value="floorplan">Public floor plan / layout</option></select></label>
   {kind==='photo'&&<label>Verified original photo<select value={source} onChange={e=>setSource(e.target.value)}><option value="">Select verified original</option>{verified.map(a=><option key={a.id} value={a.id}>Verified photo · {a.id.slice(0,8)}</option>)}</select></label>}
   <label>Caption<input value={mediaTitle} onChange={e=>setMediaTitle(e.target.value)} maxLength={140} placeholder="Front exterior / Ground floor layout"/></label>
   <label>File<input type="file" accept={kind==='photo'?'image/jpeg,image/png,image/webp':'image/jpeg,image/png,image/webp,application/pdf'} onChange={e=>setFile(e.target.files?.[0]||null)}/></label>
   </div><button className="ls-editor-action" disabled={busy||!file||kind==='photo'&&!source} onClick={upload}>Upload for independent media review</button>
   {!verified.length&&kind==='photo'&&<p className="ls-editor-note">First upload the genuine owner/developer photo in the private evidence register below and have it verified.</p>}
   <div className="ls-editor-media-list"><h4>Media review queue ({media.length})</h4>{!media.length?<p>No public property media submitted.</p>:media.map(m=><div key={m.id} className="ls-editor-media-row"><div><strong>{m.title}</strong><small>{m.kind} · {m.status} · {m.object_path}</small></div>{canApprove&&m.status==='pending'&&m.submitted_by!==currentUserId&&<button onClick={()=>setSelected(m.id)}>Review media</button>}</div>)}</div>
   {canApprove&&selected&&<div className="ls-editor-decision"><h4>Independent media decision</h4><p>Inspect the submitted derivative, source photo, permissions, listing identity and caption before approval.</p><a target="_blank" rel="noopener noreferrer" href={client().storage.from('landshop-property-public').getPublicUrl(media.find(m=>m.id===selected)?.object_path||'').data.publicUrl}>Inspect submitted media</a><textarea value={reviewNote} rows={3} minLength={15} onChange={e=>setReviewNote(e.target.value)} placeholder="Rights and property match checks, image source and reviewer findings"/><div><button disabled={busy||reviewNote.trim().length<15} onClick={()=>reviewMedia(true)}>Approve media</button><button disabled={busy||reviewNote.trim().length<15} onClick={()=>reviewMedia(false)}>Reject media</button></div></div>}
  </div>
  <p className="ls-editor-message" role="status" aria-live="polite">{message||(!approved?'No property detail snapshot published yet.':'An approved property detail snapshot exists.')}</p>
 </section>;
}
