import Link from 'next/link';
import {notFound} from 'next/navigation';
import DetailExperience,{type DetailData} from '../../../components/DetailExperience';

const related=[
 {slug:'famous-gardens',title:'Famous Gardens',href:'/projects/famous-gardens',image:'/media/famous0.webp',description:'Site activities and documented estate imagery'},
 {slug:'merit-park',title:'Merit Park',href:'/projects/merit-park',image:'/media/drone0.webp',description:'Historical drone survey and project records'},
 {slug:'maiyegun-beach-estate',title:'Maiyegun Beach Estate',href:'/projects/maiyegun-beach-estate',image:'/media/maiyegun0.webp',description:'Original estate and coastal-site photography'},
 {slug:'green-island',title:'Green Island',href:'/projects/green-island',description:'Archived listing and title enquiries'}
];
const data:Record<string,DetailData>={
 'merit-park':{
 kind:'Project',title:'Merit Park',eyebrow:'PAST PROJECT · HISTORICAL SITE ARCHIVE',description:'Explore Merit Park through original Landshop site photographs, aerial development records and historical allocation reporting.',
 status:'Historical project · Current status on enquiry',category:'Past real estate project',location:'Ibeju-Lekki, Lagos · Historical record',date:'2020 allocation reporting; historical site survey',tags:['Merit Park','Aerial photography','Land acquisition','Project archive'],
 images:[
 {src:'/media/drone0.webp',caption:'Original Merit Park drone archive · Historical site conditions, not a current progress report'},
 {src:'/media/drone1.webp',caption:'Merit Park aerial project record · Date and current status require verification'},
 {src:'/media/drone2.webp',caption:'Historical aerial photograph showing development works at Merit Park'},
 {src:'/media/drone3.webp',caption:'Merit Park project site · Historical drone image'},
 {src:'/owner/2026/merit-park-archival-signage.jpg',caption:'Original billboard carrying Merit Park and Famous Gardens identity · Historical marketing material'}
 ],
 facts:[['Project category','Historical estate project'],['Record date','2020 allocation reporting'],['Site imagery','Original drone archive'],['Current availability','Not confirmed'],['Construction progress','Not independently verified'],['Survey / title','Request updated records']],
 overview:'Merit Park belongs to Landshop’s documented historical estate portfolio. The photographs supplied by Landshop show aerial views of development activity, while independent 2020 reporting describes historical allocation activity. These materials must not be interpreted as evidence of current ownership rights, completion or units available for purchase.',
 highlights:['Original aerial photographs from the Merit Park ZIP archive','Historical marketing and allocation records','Dedicated route to request current title, survey and allocation information'],
 milestones:[['2020','Published reporting described Landshop allocation activity'],['Historical archive','Drone photographs document works at the recorded site'],['Current review','Request dated progress photographs and updated title or allocation records']],
 disclaimer:'Historical photographs do not confirm current site condition, title, construction stage, completion, handover or sale availability. Verify all details in writing.',
 related:related.filter(x=>x.slug!=='merit-park'),primaryHref:'/contact?topic=Customer%20Support&project=merit-park',primaryLabel:'Request Merit Park records',secondaryHref:'/projects',secondaryLabel:'Explore projects'
 },
 'famous-gardens':{
 kind:'Project',title:'Famous Gardens',eyebrow:'LANDSHOP PROJECT · IBEREKODO, IBEJU-LEKKI',description:'Explore real photographs of estate construction, site inspections, workers, and property development at Famous Gardens.',
 status:'Current sales focus · Confirm exact unit and offer',category:'Residential estate development',location:'Iberekodo, Ibeju-Lekki, Lagos',date:'Historical photography from 2021; request current update',tags:['Famous Gardens','Estate development','Construction','Property acquisition'],
 images:[
 {src:'/media/famous0.webp',caption:'Original Famous Gardens site photography · Landshop archive'},
 {src:'/media/famous1.webp',caption:'Famous Gardens project site team and construction activity'},
 {src:'/media/famous2.webp',caption:'Famous Gardens on-site work and inspection'},
 {src:'/media/famous3.webp',caption:'Original estate development imagery from the project archive'},
 {src:'/media/famous4.webp',caption:'Landshop construction archive · Famous Gardens'},
 {src:'/owner/2026/famous-exterior.webp',caption:'Owner-supplied Famous Gardens property photography · Confirm exact unit before purchase'}
 ],
 facts:[['Project type','Residential estate'],['Location','Iberekodo, Ibeju-Lekki'],['Media','Actual owner-supplied photos'],['Inspection','Request appointment'],['Unit availability','Confirm with Landshop'],['Documents','Request approved property pack']],
 overview:'Famous Gardens is part of Landshop’s estate development portfolio. Explore the original construction and site photographs alongside residential imagery, then review unit-specific specifications, current availability, title information and documented purchase terms before proceeding.',
 highlights:['Original Nigerian construction and site photographs','Documented ownership and development journey','Inspection requests and secure purchase applications'],
 milestones:[['2021','Site photographs document estate activities and construction'],['Project archive','Gallery of property, construction and team photographs'],['Next step','Confirm current unit specifications, status and title documentation']],
 disclaimer:'Historic site photographs and project-level housing images may not represent the exact unit offered. Confirm current pricing, availability and approved documents before payment.',
 related:related.filter(x=>x.slug!=='famous-gardens'),primaryHref:'/visit?project=famous-gardens',primaryLabel:'Request site inspection',secondaryHref:'/homes/famous-gardens/2-bedroom-terrace',secondaryLabel:'Explore available homes'
 },
 'maiyegun-beach-estate':{
 kind:'Project',title:'Maiyegun Beach Estate',eyebrow:'PAST PROJECT · ORIGINAL ESTATE PHOTOGRAPHY',description:'See original Landshop Maiyegun coastal estate photography and historical project activity.',
 status:'Historical project · Current status on enquiry',category:'Coastal estate development',location:'Maiyegun · Confirm exact site record',date:'2021 historical photographs',tags:['Maiyegun','Beach estate','Development','Historical archive'],
 images:[
 {src:'/media/maiyegun0.webp',caption:'Original Maiyegun Beach Estate project photograph from Landshop archive'},
 {src:'/media/maiyegun1.webp',caption:'Historical Maiyegun estate and coastal-site view'},
 {src:'/media/maiyegun2.webp',caption:'Landshop Maiyegun site activity · Archive'},
 {src:'/media/maiyegun3.webp',caption:'Original Maiyegun 2021 project photo'},
 {src:'/media/maiyegun4.webp',caption:'Landshop Maiyegun Beach Estate · Historical site conditions'}
 ],
 facts:[['Project type','Beach estate'],['Archive year','2021'],['Photo source','Original Landshop ZIP'],['Current availability','Not verified'],['Title status','Request verification'],['Inspection','On request']],
 overview:'The Maiyegun Beach Estate archive includes original land and coastal development photographs captured for Landshop. It provides a historical record, rather than a guarantee that the photographed infrastructure or plot conditions are unchanged today.',
 highlights:['Original Maiyegun photographs rather than stock imagery','Dedicated historical development photo gallery','Enquiry pathway for current plot and allocation records'],
 milestones:[['2021','Original photographs captured at the estate'],['Archive','Coastal development imagery retained as historical record'],['Current review','Request contemporary condition and legal verification']],
 disclaimer:'Historical photographs do not independently establish ownership, title, current site conditions, completion or availability.',
 related:related.filter(x=>x.slug!=='maiyegun-beach-estate'),primaryHref:'/contact?topic=Customer%20Support&project=maiyegun-beach-estate',primaryLabel:'Request Maiyegun records',secondaryHref:'/projects',secondaryLabel:'All projects'
 },
 'green-island':{
 kind:'Project',title:'Green Island',eyebrow:'PAST PROJECT · ARCHIVED LISTING',description:'A historical Green Island project record with clear verification steps.',
 status:'Former listing · No active offer confirmed',category:'Historical land listing',location:'Ibeju-Lekki, Lagos · Archival listing',date:'2024 archived listing',tags:['Green Island','Historical listing','Land','Verification'],
 images:[{src:'/owner/2026/estate-architecture.webp',caption:'General Landshop portfolio photograph. This image is not verified as Green Island and does not represent an available Green Island property.'}],
 facts:[['Listing status','No longer active'],['Archive year','2024'],['Location','Ibeju-Lekki historical listing'],['Current plot imagery','Not verified'],['Availability','Not confirmed'],['Documentation','Request updated records']],
 overview:'Green Island appeared in an older Landshop LTD property listing. Original project-specific imagery has not been confirmed for publication, so no photographic claim is made about the current Green Island site.',
 highlights:['Preserves the historical property record','Avoids presenting unrelated photography as project evidence','Request current title, availability and location records'],
 milestones:[['2024','Former land listing published'],['Current status','Original listing is no longer active']],disclaimer:'The photograph shown is a general Landshop portfolio image, not a verified Green Island site photo. Do not infer current availability.',
 related:related.filter(x=>x.slug!=='green-island'),primaryHref:'/contact?topic=Customer%20Support&project=green-island',primaryLabel:'Request verified records',secondaryHref:'/projects',secondaryLabel:'Browse projects'
 }
};
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const d=data[slug];return {title:d?d.title+' | Landshop Projects':'Project not found',description:d?.description,alternates:d?{canonical:'/projects/'+slug}:undefined};}
export default async function Project({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const d=data[slug];if(!d)notFound();return <main className="ls26-page"><div className="ls26-container"><nav className="ls26-crumb"><Link href="/">Home</Link> / <Link href="/projects">Projects</Link> / {d.title}</nav></div><DetailExperience data={d}/>{slug==='merit-park'&&<section className="ls26-container" style={{paddingBottom:55}}><p>Historical source: <a href="https://thenationonlineng.net/firm-unveils-affordable-purchase-of-land-and-property/" target="_blank" rel="noopener noreferrer">Published report describing 2020 land allocation activity</a>. This reporting does not verify present-day ownership or construction status.</p></section>}</main>}
