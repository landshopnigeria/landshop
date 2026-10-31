/** Privacy-enhanced, consent-free-until-play YouTube embed. The poster has no third-party network dependency. */
import {useId} from 'react';
const options={
 prime:{id:'xRGG6aZq120',title:'Explore Landshop Prime Estates',external:'https://www.youtube.com/watch?v=xRGG6aZq120'},
 about:{id:'Q29UrjaqAJU',title:'About Landshop — Company Introduction',external:'https://www.youtube.com/watch?v=Q29UrjaqAJU'}
} as const;
export default function LandshopVideo({video}:{video:keyof typeof options}){
 const item=options[video];
 return <div className="ls27-video-block">
  <div className="ls27-video-landscape">
   <iframe src={'https://www.youtube-nocookie.com/embed/'+item.id+'?rel=0'} title={item.title} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen/>
  </div>
  <a className="ls27-video-fallback" href={item.external} target="_blank" rel="noopener noreferrer">Watch {video==='prime'?'Landshop Prime':'About Landshop'} on YouTube <span aria-hidden="true">↗</span></a>
 </div>;
}
