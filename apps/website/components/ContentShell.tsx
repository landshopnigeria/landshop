
import Link from 'next/link';
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
  <footer className="content-footer"><div className="content-footer-inner">
   <div><img src="/media/logo-transparent.png" width={124} height={58} alt="Landshop official logo"/><div>Develop · Incubate · Grow</div><small>Property terms and financial eligibility require documented confirmation.</small></div>
   <nav aria-label="Footer"><Link href="/about">About</Link><Link href="/properties">Properties</Link><Link href="/insights">Insights</Link><Link href="/contact">Contact</Link><a href="https://portal.landshopnigeria.com">Customer Portal</a></nav>
  </div></footer>
 </div>
}
