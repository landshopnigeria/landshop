import Link from 'next/link';
import {FooterCarousel,NewsletterSignup,type FooterSlide} from './FooterInteractive';
import {landshopTestimonials} from '../lib/testimonials';
import {guides} from '../lib/guides';

const company=[
 {label:'About Landshop',href:'/about'},
 {label:'Who We Are',href:'/about#who-we-are'},
 {label:'Vision & Mission',href:'/about'},
 {label:'Our Leadership',href:'/company/team'},
 {label:'Our Partners',href:'/partners'},
 {label:'Client Experiences',href:'/testimonials'},
 {label:'Contact Us',href:'/contact'}
];
const explore=[
 {label:'Property Marketplace',href:'/properties'},
 {label:'Develop',href:'/develop'},
 {label:'Incubate',href:'/incubate'},
 {label:'Grow',href:'/grow'},
 {label:'Our Services',href:'/services'},
 {label:'Our Locations',href:'/locations'},
 {label:'Projects',href:'/projects'},
 {label:'Prime Estates',href:'/collections/prime'},
 {label:'Luxury Estates',href:'/collections/luxury'},
 {label:'DevPro',href:'/plans/devpro'},
 {label:'EstatePro',href:'/plans/estatepro'},
 {label:'Application Centre',href:'/applications'}
];
const resources=[
 {label:'Insights & Articles',href:'/insights'},
 {label:'Book Inspection',href:'/visit'},
 {label:'Mortgage Calculator',href:'/mortgage-calculator'},
 {label:'Future Locations',href:'/coming-soon'},
 {label:'Property Acquisition',href:'/services/property-acquisition'},
 {label:'Property Advisory',href:'/services/advisory'},
 {label:'Mortgage Guidance',href:'/services/mortgage'},
 {label:'Construction Credit',href:'/services/construction-credit'},
 {label:'Property Inspections',href:'/services/inspection'},
 {label:'Customer Portal',href:'https://portal.landshopnigeria.com'}
];
const socials=[
 {name:'Facebook',href:process.env.NEXT_PUBLIC_LANDSHOP_FACEBOOK_URL,paths:['M17.525 9H14V7.05c0-.91.603-1.12 1.027-1.12H17.5V2.02L14.094 2C10.35 2 9.5 4.79 9.5 6.577V9H7v4h2.5v9H14v-9h3.05z']},
 {name:'Instagram',href:process.env.NEXT_PUBLIC_LANDSHOP_INSTAGRAM_URL,paths:['M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm5.5-2.75a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5z']},
 {name:'X',href:process.env.NEXT_PUBLIC_LANDSHOP_X_URL,paths:['M18.901 2H22l-6.768 7.733L23.19 22h-6.23l-4.88-7.416L5.59 22H2.48l7.24-8.276L1.94 2h6.388l4.412 6.744L18.901 2Zm-1.092 18h1.728L7.38 3.894H5.525L17.809 20Z']},
 {name:'LinkedIn',href:process.env.NEXT_PUBLIC_LANDSHOP_LINKEDIN_URL||'https://www.linkedin.com/company/landshoplimited',paths:['M4.98 3.5a2.48 2.48 0 1 1 0 4.96 2.48 2.48 0 0 1 0-4.96zM3 10h4v12H3zm6.5 0h3.85v1.65h.05c.54-1.02 1.86-2.1 3.83-2.1 4.1 0 4.77 2.67 4.77 6.13V22h-4v-5.62c0-1.34-.03-3.06-1.86-3.06-1.86 0-2.14 1.46-2.14 2.96V22h-4V10z']},
 {name:'TikTok',href:process.env.NEXT_PUBLIC_LANDSHOP_TIKTOK_URL,paths:['M16.8 2h-3.1v12.5a3.5 3.5 0 1 1-3.2-3.48V7.92A6.7 6.7 0 1 0 16.8 14.6V8.27a8.1 8.1 0 0 0 4.64 1.46V6.57c-2.4-.16-4.29-1.91-4.64-4.57z']},
 {name:'YouTube',href:process.env.NEXT_PUBLIC_LANDSHOP_YOUTUBE_URL,paths:['M22 8.2a3.1 3.1 0 0 0-2.18-2.2C17.9 5.5 12 5.5 12 5.5s-5.9 0-7.82.5A3.1 3.1 0 0 0 2 8.2 33 33 0 0 0 1.5 12 33 33 0 0 0 2 15.8 3.1 3.1 0 0 0 4.18 18c1.92.5 7.82.5 7.82.5s5.9 0 7.82-.5A3.1 3.1 0 0 0 22 15.8a33 33 0 0 0 .5-3.8A33 33 0 0 0 22 8.2ZM10 15.2V8.8l5.5 3.2z']}
];
function trustedSocialUrl(url?:string){if(!url)return null;try{const u=new URL(url);return u.protocol==='https:'?url:null}catch{return null;}}
function FooterLinks({label,items}:{label:string;items:typeof company}){
 return <nav className="ls24-footer-col" aria-label={label+' links'}>
  <h2>{label}</h2>{items.map(item=><Link key={item.label} href={item.href}>{item.label}</Link>)}
 </nav>;
}
function slidesFromSources():FooterSlide[]{
 const reviews=landshopTestimonials.filter(t=>t.status==='approved').slice(0,4).map(t=>({
  id:'testimonial-'+t.id,kind:'testimonial' as const,type:'CLIENT EXPERIENCE',image:t.image,
  alt:'Editorial photo from Landshop materials; not a portrait of '+t.name,
  heading:t.quote,byline:t.name+' · Historical deck testimonial',href:'/testimonials',videoUrl:t.mediaType==='video'?t.mediaUrl:undefined
 }));
 const articles=guides.slice().reverse().slice(0,6).map(g=>({
  id:'article-'+g.slug,kind:'article' as const,type:'LANDSHOP INSIGHTS',image:g.image,
  alt:'Editorial image for '+g.title,heading:g.title,byline:g.category+' · LANDSHOP INSIGHTS',href:'/insights/'+g.slug
 }));
 const slides:FooterSlide[]=[];
 for(let i=0;i<Math.max(reviews.length,articles.length);i++){if(reviews[i])slides.push(reviews[i]);if(articles[i])slides.push(articles[i]);}
 return slides.slice(0,8);
}
export default function SiteFooter(){
 return <><NewsletterSignup/><footer className="ls24-global-footer" aria-label="Landshop global footer">
  <div className="ls24-glass-area"><div className="ls24-footer-main">
   <div className="ls24-brand-col">
    <Link href="/" aria-label="Landshop home"><img className="ls24-footer-logo" src="/media/logo-transparent.png" width={184} height={94} alt="Landshop — Develop, Incubate, Grow"/></Link>
    <p className="ls24-footer-brand-copy">Building wealth through real estate. Clearer pathways to ownership, investment enquiries and home financing.</p>
    <p className="ls24-contact-line"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 7 9-7"/></svg><a href="mailto:care@landshopnigeria.com">care@landshopnigeria.com</a></p>
    <p className="ls24-contact-line"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 4h4l2 5-2.5 2c1.5 3 3.5 5 6.5 6.5L17 15l4 2v4c-9 1-18-8-17-17z" strokeLinejoin="round"/></svg><a href="tel:+23418880063">+234 1 888 0063</a></p>
    <p className="ls24-contact-line"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg><span>Lagos, Nigeria</span></p>
   </div>
   <FooterLinks label="Company" items={company}/>
   <FooterLinks label="Explore" items={explore}/>
   <FooterLinks label="Resources" items={resources}/>
   <div className="ls24-footer-media"><FooterCarousel slides={slidesFromSources()}/></div>
  </div></div>
  <div className="ls24-footer-bottom"><div className="ls24-footer-bottom-inner">
   <span className="ls24-copyright">© {new Date().getUTCFullYear()} Landshop. All rights reserved.</span>
   <nav className="ls24-legal-links" aria-label="Legal information"><Link href="/terms">Terms &amp; Conditions</Link><Link href="/privacy">Privacy Policy</Link><Link href="/contact">Contact</Link></nav>
   <div className="ls24-social-links" aria-label="Landshop social media">
    {socials.map(item=>{const url=trustedSocialUrl(item.href);const svg=<svg viewBox="0 0 24 24" aria-hidden="true">{item.paths.map((p,i)=><path key={i} d={p}/>)}</svg>;
      return url?<a key={item.name} href={url} target="_blank" rel="noopener noreferrer" aria-label={'Landshop on '+item.name} title={item.name}>{svg}</a>
      :<span key={item.name} className="ls24-social-disabled" aria-label={item.name+' link not configured'} title={item.name+' — link pending verification'}>{svg}</span>
    })}
   </div>
  </div></div>
 </footer></>;
}
