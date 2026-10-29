
import ContentShell from '../../../components/ContentShell';
import Link from 'next/link';
import {editorialImages} from '../../../lib/editorial-imagery';
import {notFound} from 'next/navigation';
const services={
 'property-acquisition':{title:'Property Acquisition',tagline:'From a property enquiry to an informed decision.',description:'Discover estate opportunities and work through the information needed to evaluate a documented property acquisition.',steps:['Identify a suitable estate, plot or housing option.','Review the title information, location, specifications and payment terms.','Arrange an inspection and complete a secure product application.'],image:editorialImages.develop.src,target:'/develop'},
 'advisory':{title:'Property Advisory',tagline:'Independent questions deserve clear answers.',description:'Landshop helps customers organize information about available properties and acquisition pathways. Specific title, pricing and legal decisions require current professional review.',steps:['Define your location, purpose and budget.','Obtain project-specific supporting documentation.','Review risks, responsibilities and next steps before committing.'],image:editorialImages.team.src,target:'/contact'},
 'mortgage':{title:'Mortgage Guidance',tagline:'Understand the full cost of homeownership.',description:'Explore Beta Mortgage and Mortgage Xtra application pathways, eligibility and indicative mortgage calculations.',steps:['Estimate your available equity and monthly affordability.','Provide accurate income and household information.','Submit for lender-specific pre-qualification and documented review.'],image:editorialImages.planning.src,target:'/grow'},
 'construction-credit':{title:'Construction Credit Enquiries',tagline:'Plan your development financing responsibly.',description:'Discuss potential development or construction funding requirements with Landshop. No credit product, approved lender or borrowing terms are implied by this enquiry page.',steps:['Provide project location and proposed works.','Prepare ownership, planning and project cost documents.','Request confirmation of currently available financing arrangements.'],image:editorialImages.architecture.src,target:'/contact'}
} as const;
type Slug=keyof typeof services;
export function generateStaticParams(){return Object.keys(services).map(slug=>({slug}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const svc=services[slug as Slug];return {title:svc?svc.title+' | Landshop':'Service Not Found | Landshop',description:svc?.description}}
export default async function ServicePage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 if(!(slug in services))notFound();
 const svc=services[slug as Slug];
 return <ContentShell eyebrow={'Our Services / '+svc.title} title={svc.tagline} intro={svc.description} image={svc.image}>
  <section><h2>How to approach {svc.title.toLowerCase()}</h2><div className="content-grid">{svc.steps.map((step,i)=><div className="content-tile" key={step}><span className="number">0{i+1}</span><h3>{['Discover','Verify','Proceed'][i]}</h3><p>{step}</p></div>)}</div></section>
  <aside className="content-band"><h2>Take the next step with Landshop.</h2><p>Availability, pricing, financing and eligibility require formal confirmation. A website enquiry does not create a financial commitment or guarantee approval.</p><Link className="content-cta" href={svc.target}>Continue →</Link></aside>
 </ContentShell>
}
