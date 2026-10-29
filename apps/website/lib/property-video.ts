export type SupportedVideo={platform:'YouTube'|'Instagram'|'TikTok'|'Vimeo';url:string;embed:string;title:string};
const ALLOWED=new Set(['youtube.com','www.youtube.com','m.youtube.com','youtu.be','www.youtu.be','youtube-nocookie.com','www.youtube-nocookie.com','instagram.com','www.instagram.com','tiktok.com','www.tiktok.com','m.tiktok.com','vimeo.com','www.vimeo.com']);
const ID=/^[a-zA-Z0-9_-]{6,60}$/;
export function parsePropertyVideo(raw:string,title='Property video'):SupportedVideo|null{
 try{
  const url=new URL(raw.trim());
  if(url.protocol!=='https:'||url.username||url.password||url.port||!ALLOWED.has(url.hostname.toLowerCase()))return null;
  const host=url.hostname.toLowerCase(),segments=url.pathname.split('/').filter(Boolean);
  let platform:SupportedVideo['platform'],embed:string;
  if(host.includes('youtu')){
   const id=host.includes('youtu.be')?segments[0]:url.searchParams.get('v')||(segments[0]==='shorts'||segments[0]==='embed'?segments[1]:'');
   if(!id||!/^[\w-]{11}$/.test(id))return null;
   platform='YouTube';embed='https://www.youtube-nocookie.com/embed/'+id;
  }else if(host.includes('vimeo')){
   const id=segments[0];if(!id||!/^\d{5,15}$/.test(id))return null;
   platform='Vimeo';embed='https://player.vimeo.com/video/'+id;
  }else if(host.includes('instagram')){
   if(!['reel','p','tv'].includes(segments[0])||!segments[1]||!ID.test(segments[1]))return null;
   platform='Instagram';embed='https://www.instagram.com/'+segments[0]+'/'+segments[1]+'/embed/';
  }else{
   const id=segments.find(s=>/^\d{10,25}$/.test(s));
   if(!id)return null;
   platform='TikTok';embed='https://www.tiktok.com/embed/v2/'+id;
  }
  return {platform,url:url.toString(),embed,title:title.slice(0,140)};
 }catch{return null;}
}
