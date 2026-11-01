import ApprovedArrow from './ApprovedArrow';

import Link from 'next/link';
import type {ReactNode} from 'react';
import {guides} from '../lib/guides';
import {articleHeroSlides} from '../lib/article-hero-gallery';
import ArticleDetailHero from './ArticleDetailHero';
import '../app/insights/article-hero.css';
type Props={eyebrow:string;title:string;intro:string;image?:string;imageAlt?:string;children:ReactNode};
export default function ContentShell({eyebrow,title,intro,image,imageAlt,children}:Props){
 // Only article-detail heroes use the approved slideshow.
 // Keep all non-article ContentShell pages and the article body byte-for-byte unchanged.
 const guide=eyebrow.startsWith('INSIGHTS / ')?guides.find(g=>g.title===title):undefined;
 if(guide)return <div className="content-page">
  <ArticleDetailHero title={guide.title} category={guide.category} summary={guide.summary} readingMinutes={guide.readingMinutes}
   slides={articleHeroSlides(guide.slug,guide.image,guide.imageAlt)}/>
  <div className="content-main">{children}</div>
 </div>;

 return <div className="content-page">
  <section className="content-hero"><div className="content-hero-inner">
   <div><nav className="content-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link> / {eyebrow}</nav>
    <span className="content-kicker">{eyebrow}</span><h1>{title}</h1><p>{intro}</p>
    <div className="content-actions"><Link className="content-cta" href="/applications">Explore Landshop Applications <ApprovedArrow /></Link><Link className="content-link" href="/contact">Speak with our team</Link></div>
   </div>
   {image&&<img src={image} alt={imageAlt||"Editorial photograph illustrating this page; not a verified property listing"} loading="eager"/>}
  </div></section>
  <div className="content-main">{children}</div>
 </div>
}
