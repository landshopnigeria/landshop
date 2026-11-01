import ApprovedArrow from '../../../components/ApprovedArrow';

import ContentShell from '../../../components/ContentShell';
import Link from 'next/link';
import {editorialImages} from '../../../lib/editorial-imagery';
import {notFound} from 'next/navigation';
const plans={
 'beta-mortgage':{name:'Beta Mortgage',title:'Explore a structured route to your own home.',intro:'Prepare the information needed for a mortgage pre-qualification assessment. Actual terms and lender approval depend on verified documentation.',image:editorialImages.grow.src,items:['Understand your expected equity contribution and affordability.','Gather income and identification records requested by the lender.','Compare indicative repayments before submitting for formal assessment.'],form:'beta-mortgage'},
 'mortgage-xtra':{name:'Mortgage Xtra',title:'Plan a financing journey with greater clarity.',intro:'Begin a structured financing enquiry, review affordability and progress through documentation and inspection checks.',image:editorialImages.planning.src,items:['Review project suitability and the relevant financing application.','Provide accurate employment, income and household details.','Follow approved assessment, inspection and equity confirmation processes.'],form:'mortgage-xtra'}
} as const;
type Product=keyof typeof plans;
export function generateStaticParams(){return Object.keys(plans).map(product=>({product}))}
export async function generateMetadata({params}:{params:Promise<{product:string}>}){const {product}=await params;return {title:product in plans?plans[product as Product].name+' | Landshop':'Product Not Found | Landshop'}}
export default async function MortgageProduct({params}:{params:Promise<{product:string}>}){
 const {product}=await params;if(!(product in plans))notFound();
 const p=plans[product as Product];
 return <ContentShell eyebrow={'Grow / '+p.name} title={p.title} intro={p.intro} image={p.image}>
  <section><h2>What to expect</h2><div className="content-grid">{p.items.map((v,i)=><div className="content-tile" key={v}><span className="number">0{i+1}</span><h3>{['Prepare','Apply','Review'][i]}</h3><p>{v}</p></div>)}</div></section>
  <div className="content-grid two">
   <article className="content-tile"><h3>Estimate affordability</h3><p>Explore deposit, principal, repayment term and indicative monthly payment before applying.</p><a href="https://portal.landshopnigeria.com/calculator">Open Mortgage Calculator <ApprovedArrow /></a></article>
   <article className="content-tile"><h3>Apply securely</h3><p>Use the separate, multi-step {p.name} form for a structured and reviewable application.</p><a href={'https://portal.landshopnigeria.com/applications/'+p.form}>Start {p.name} application <ApprovedArrow /></a></article>
  </div>
  <aside className="content-aside"><strong>Important:</strong> Mortgage rates, lender approval, equity amounts, credit availability and repayment obligations are not guaranteed by this page. Obtain the latest written terms.</aside>
  <Link className="content-link" href="/grow"><ApprovedArrow direction="left" /> All Grow products</Link>
 </ContentShell>
}
