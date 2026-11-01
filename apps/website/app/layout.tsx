import '../../../packages/shared/EnterpriseReadability.css';
import '../../../packages/shared/BrandedSelect.css';
import type {Metadata} from 'next';
import './globals.css';
import './content-pages.css';
import './reference-updates.css';
import './homepage-v16.css';
import './site-navigation.css';
import './icon-treatments.css';
import './home-three.css';
import './v22-premium.css';
import './v23-video-preview.css';
import './v24-global-footer.css';
import './premium-2026.css';
import './v28-approved-home.css';
import './production-readiness.css';
import './v29-nigerian-media-global-insights.css';
import './v30-header-motion-and-type.css';
import './v31-hero-overlay-scroll.css';
import './v32-editorial-and-hero.css';
import './owner-photo-refresh.css';
import './public-icon-70.css';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import GlobalArticleCarousel from '../components/GlobalArticleCarousel';
// Every marketing page must be served fresh while the V16 site is actively updated.
// Next.js static-prerendered HTML previously sent s-maxage=31536000 (one year).
// Keep hashed /_next/static assets cacheable; only route HTML is dynamic.
export const dynamic='force-dynamic';
export const metadata:Metadata={
 metadataBase:new URL('https://www.landshopnigeria.com'),
 title:{default:'Landshop Nigeria | Property Ownership, Estates & Home Financing',template:'%s | Landshop Nigeria'},
 description:'Explore Landshop Nigeria estates, Famous Gardens, property acquisition, shared-ownership enquiries and mortgage guidance. Understand verified property options and your next step.',
 applicationName:'Landshop Nigeria',
 category:'real estate',
 robots:{index:true,follow:true,googleBot:{index:true,follow:true,'max-image-preview':'large','max-snippet':-1,'max-video-preview':-1}},
 openGraph:{type:'website',url:'https://www.landshopnigeria.com/',siteName:'Landshop Nigeria',locale:'en_NG',
   title:'Landshop Nigeria | Everyone Deserves Affordable Property',
   description:'Explore verified property options, estates and homeownership pathways with Landshop Nigeria.',
   images:[{url:'/owner/2026/slider-01.webp',alt:'Real estate residential buildings photographed for Landshop in Nigeria'}]},
 twitter:{card:'summary_large_image',title:'Landshop Nigeria | Property Ownership and Estates',
   description:'Explore estates, products, projects and real estate guidance in Nigeria.',
   images:['/owner/2026/slider-01.webp']},
 icons:{
 icon:[{url:'/favicon.ico?v=landshop-20261031',type:'image/x-icon',sizes:'any'},
       {url:'/icon.png',type:'image/png',sizes:'100x100'}],
 shortcut:'/favicon.ico?v=landshop-20261031',
 apple:[{url:'/apple-icon.png',type:'image/png',sizes:'100x100'}]
}
};
const structuredData={
 '@context':'https://schema.org','@graph':[
  {'@type':'Organization','@id':'https://www.landshopnigeria.com/#organization',name:'Landshop Nigeria',
   legalName:'Landshop Limited',url:'https://www.landshopnigeria.com/',
   logo:'https://www.landshopnigeria.com/media/logo.webp',
   description:'Nigerian real estate company offering property acquisition, shared-ownership enquiries, mortgage guidance and property development services.',
   address:{'@type':'PostalAddress',streetAddress:"Suite 1, 3rd Floor, King’s Deck, Alternative Route, Chevron Drive, Lekki-Epe Expressway",addressLocality:'Lekki',addressRegion:'Lagos',addressCountry:'NG'},
   contactPoint:{'@type':'ContactPoint',contactType:'customer support',telephone:'+23418880063',email:'care@landshopnigeria.com',areaServed:'NG'}},
  {'@type':'WebSite','@id':'https://www.landshopnigeria.com/#website',name:'Landshop Nigeria',url:'https://www.landshopnigeria.com/',
   inLanguage:'en-NG',publisher:{'@id':'https://www.landshopnigeria.com/#organization'},
   potentialAction:{'@type':'SearchAction',target:{'@type':'EntryPoint',urlTemplate:'https://www.landshopnigeria.com/search?q={search_term_string}'},'query-input':'required name=search_term_string'}}
 ]
};

export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><head><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structuredData).replace(/</g,'\\u003c')}}/><meta name="landshop-release" content={process.env.NEXT_PUBLIC_LANDSHOP_RELEASE_SHA||'unversioned'}/></head><body><SiteHeader/>{children}<GlobalArticleCarousel/><SiteFooter/></body></html>}
