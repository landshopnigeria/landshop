import {landshopAboutImages} from '../lib/landshop-brand-media';
/** One source of truth for the exactly matching homepage and About collage. */
export default function LandshopAboutCollage(){
 return <div className="v22-collage ls27-about-collage" aria-label="Landshop construction, on-site team and headquarters">
  {landshopAboutImages.map((image,i)=><img key={image.src} src={image.src} alt={image.alt} loading="lazy" decoding="async" className={'ls27-about-photo ls27-about-photo-'+(i+1)}/>)}
 </div>;
}
