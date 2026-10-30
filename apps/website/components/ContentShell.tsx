
import Link from 'next/link';
import SiteFooter from './SiteFooter';
import type {ReactNode} from 'react';
type Props={eyebrow:string;title:string;intro:string;image?:string;imageAlt?:string;children:ReactNode};
export default function ContentShell({eyebrow,title,intro,image,imageAlt,children}:Props){
 return <div className="content-page">
  <section className="content-hero"><div className="content-hero-inner">
   <div><nav className="content-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link> / {eyebrow}</nav>
    <span className="content-kicker">{eyebrow}</span><h1>{title}</h1><p>{intro}</p>
    <div className="content-actions"><Link className="content-cta" href="/applications">Explore Landshop Applications →</Link><Link className="content-link" href="/contact">Speak with our team</Link></div>
   </div>
   {image&&<img src={image} alt={imageAlt||"Editorial photograph illustrating this page; not a verified property listing"} loading="eager"/>}
  </div></section>
  <div className="content-main">{children}</div>
  <SiteFooter/>
 </div>
}
