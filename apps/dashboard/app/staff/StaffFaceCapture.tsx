'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import './staff-face-capture.css';

type CaptureMode='upload'|'camera'|'scan';
type Props={busy:boolean;status:string;onSubmit:(image:File)=>Promise<void>|void};
const steps=['Face the camera directly','Turn your face slightly left','Turn your face slightly right'];
const accepts=['image/jpeg','image/png','image/webp'];
export default function StaffFaceCapture({busy,status,onSubmit}:Props){
 const [mode,setMode]=useState<CaptureMode>('upload');
 const [consent,setConsent]=useState(false);
 const [cameraOn,setCameraOn]=useState(false);
 const [captured,setCaptured]=useState<File|null>(null);
 const [preview,setPreview]=useState<string|null>(null);
 const [scanFrames,setScanFrames]=useState<File[]>([]);
 const [error,setError]=useState('');
 const [sending,setSending]=useState(false);
 const videoRef=useRef<HTMLVideoElement|null>(null);
 const streamRef=useRef<MediaStream|null>(null);
 const cameraRequestRef=useRef(0);
 const stopCamera=useCallback(()=>{
  cameraRequestRef.current+=1;
  streamRef.current?.getTracks().forEach(track=>track.stop());
  streamRef.current=null;
  if(videoRef.current)videoRef.current.srcObject=null;
  setCameraOn(false);
 },[]);
 useEffect(()=>{
  const onPageHide=()=>{cameraRequestRef.current+=1;streamRef.current?.getTracks().forEach(track=>track.stop());streamRef.current=null};
  window.addEventListener('pagehide',onPageHide);
  return()=>{window.removeEventListener('pagehide',onPageHide);onPageHide()};
 },[]);
 useEffect(()=>{
  if(!captured){setPreview(null);return}
  const url=URL.createObjectURL(captured);
  setPreview(url);
  return()=>URL.revokeObjectURL(url);
 },[captured]);
 const changeMode=(next:CaptureMode)=>{
  if(busy||sending)return;
  stopCamera();setMode(next);setCaptured(null);setScanFrames([]);setError('');
 };
 const validate=(file:File)=>{
  if(!accepts.includes(file.type)||file.size>5*1024*1024||file.size<4000)
   throw Error('Use a clear JPEG, PNG or WebP portrait between 4 KB and 5 MB.');
 };
 const choose=(file:File|null)=>{
  if(!file)return;
  try{validate(file);setCaptured(file);setError('')}catch(e){setError(e instanceof Error?e.message:'Invalid image')}
 };
 async function openCamera(){
  if(!consent){setError('Confirm your consent before enabling the camera.');return}
  if(!navigator.mediaDevices?.getUserMedia){setError('A secure HTTPS connection and camera-capable browser are required. You can upload a photo instead.');return}
  setError('');
  try{
   stopCamera();
   const requestToken=cameraRequestRef.current;
   const media=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:'user',width:{ideal:1280},height:{ideal:960}}});
   if(cameraRequestRef.current!==requestToken||!videoRef.current){media.getTracks().forEach(track=>track.stop());return}
   streamRef.current=media;
   if(videoRef.current){videoRef.current.srcObject=media;await videoRef.current.play()}
   setCameraOn(true);
  }catch(e){stopCamera();setError(e instanceof Error?'Unable to access camera: '+e.message:'Camera permission denied or unavailable.')}
 }
 async function snap():Promise<File>{
  const video=videoRef.current;
  if(!cameraOn||!video||video.videoWidth<200||video.videoHeight<200)throw Error('Wait for the camera preview to become ready.');
  const canvas=document.createElement('canvas');
  const scale=Math.min(1,1200/video.videoWidth);
  canvas.width=Math.round(video.videoWidth*scale);
  canvas.height=Math.round(video.videoHeight*scale);
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('Image capture is unavailable on this browser.');
  ctx.drawImage(video,0,0,canvas.width,canvas.height);
  const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/jpeg',.88));
  if(!blob)throw Error('Unable to capture a photo; please retry.');
  const image=new File([blob],'landshop-selfie-'+Date.now()+'.jpg',{type:'image/jpeg',lastModified:Date.now()});
  validate(image);return image;
 }
 async function takePhoto(){
  try{
   const photo=await snap();
   if(mode==='camera'){setCaptured(photo);stopCamera();return}
   const all=[...scanFrames,photo];
   setScanFrames(all);
   if(all.length===steps.length){setCaptured(all[0]);stopCamera()}
  }catch(e){setError(e instanceof Error?e.message:'Camera capture failed')}
 }
 async function submit(){
  if(!captured||busy||sending)return;
  if(!consent){setError('Confirm your consent before sending an identity portrait.');return}
  setSending(true);setError('');
  try{validate(captured);await onSubmit(captured)}
  catch(e){setError(e instanceof Error?e.message:'Could not submit your portrait')}
  finally{setSending(false)}
 }
 return <section className="ls-face" aria-labelledby="ls-face-title">
  <div className="ls-face-heading"><div><small>STAFF IDENTITY</small><h3 id="ls-face-title">Photo & Camera Verification</h3><p>Choose how to submit your staff portrait. Camera access is requested only when you open it.</p></div><span className="ls-face-state">KYC: {status.replaceAll('_',' ')}</span></div>
  <div className="ls-face-options" role="group" aria-label="Identity portrait submission method">
   <button type="button" aria-pressed={mode==='upload'} className={mode==='upload'?'selected':''} disabled={busy||sending} onClick={()=>changeMode('upload')}><span aria-hidden="true">▧</span><strong>Upload Photo</strong><small>Choose a saved picture</small></button>
   <button type="button" aria-pressed={mode==='camera'} className={mode==='camera'?'selected':''} disabled={busy||sending} onClick={()=>changeMode('camera')}><span aria-hidden="true">◉</span><strong>Camera Photo</strong><small>Snap a new picture</small></button>
   <button type="button" aria-pressed={mode==='scan'} className={mode==='scan'?'selected':''} disabled={busy||sending} onClick={()=>changeMode('scan')}><span aria-hidden="true">◎</span><strong>Guided Live Scan</strong><small>Front, left and right views</small></button>
  </div>
  <label className="ls-face-consent"><input type="checkbox" checked={consent} disabled={busy||sending} onChange={e=>{setConsent(e.target.checked);if(!e.target.checked)stopCamera()}}/><span>I consent to Landshop collecting and storing my facial portrait privately for staff identity review. I understand this does not automatically verify my identity.</span></label>
  {mode==='upload'&&<div className="ls-face-upload"><label htmlFor="ls-face-file">Select a clear portrait</label><input id="ls-face-file" type="file" accept="image/jpeg,image/png,image/webp" disabled={!consent||busy||sending} onChange={e=>choose(e.currentTarget.files?.[0]||null)}/><small>JPEG, PNG or WebP, maximum 5 MB. Face clearly visible, good lighting, no filters.</small></div>}
  {mode!=='upload'&&<div className="ls-face-camera">
   {cameraOn&&<div className="ls-face-camera-label"><span aria-hidden="true">●</span> Camera active</div>}
   <div className="ls-face-video-wrap"><video ref={videoRef} autoPlay muted playsInline aria-label="Live camera view for staff identity portrait" style={{display:cameraOn?'block':'none'}}/><div className="ls-face-outline" aria-hidden="true"/>{!cameraOn&&<div className="ls-face-camera-empty">Camera is off. Choose Start Camera when ready.</div>}</div>
   {mode==='scan'&&<div className="ls-face-instructions" aria-live="polite">
    <strong>{scanFrames.length===3?'All three views captured':steps[scanFrames.length]}</strong>
    <p>{scanFrames.length===3?'Review your front portrait below and submit.':'Step '+(scanFrames.length+1)+' of 3. Keep your face inside the oval and capture the requested angle.'}</p>
    <div className="ls-face-steps">{steps.map((step,i)=><span key={step} className={i<scanFrames.length?'done':i===scanFrames.length?'current':''} aria-label={'View '+(i+1)+': '+step}>{i<scanFrames.length?'✓':i+1}</span>)}</div>
    <small>Guided pose capture is not an automated anti-spoofing or document face-match check. Only your front portrait is uploaded for identity review.</small>
   </div>}
   <div className="ls-face-camera-actions">{!cameraOn&&<button type="button" disabled={!consent||busy||sending} onClick={()=>void openCamera()}>Start Camera</button>}{cameraOn&&<><button type="button" disabled={busy||sending} onClick={()=>void takePhoto()}>{mode==='scan'?'Capture View '+(scanFrames.length+1):'Take Photo'}</button><button type="button" className="secondary" onClick={stopCamera}>Turn Off Camera</button></>}{captured&&<button type="button" className="secondary" disabled={busy||sending} onClick={()=>{setCaptured(null);setScanFrames([]);void openCamera()}}>Retake</button>}</div>
  </div>}
  {preview&&<div className="ls-face-preview"><img src={preview} alt="Preview of the portrait selected for submission"/><div><strong>Portrait ready</strong><p>Check that the face is centered and clearly visible before submitting.</p></div></div>}
  {error&&<p className="ls-face-error" role="alert">{error}</p>}
  <div className="ls-face-submit"><button type="button" disabled={!captured||!consent||busy||sending} onClick={()=>void submit()}>{busy||sending?'Submitting securely...':'Submit My Portrait'}</button><p>Basic staff access activates after confirmed staff registration. Formal identity approval, employee ID and restricted privileges require verified checks.</p></div>
 </section>;
}
