import ApprovedArrow from '../../components/ApprovedArrow';
import Link from 'next/link';import VisitEnquiryForm from '../../components/VisitEnquiryForm';
export const metadata={alternates:{canonical:'/visit'},title:'Book a Property Inspection | Landshop Nigeria',description:'Request an in-person or live virtual Famous Gardens inspection with a preferred date and time.'};
export default async function Visit({searchParams}:{searchParams:Promise<{project?:string,home?:string,topic?:string,property_id?:string,date?:string,time?:string,attendees?:string,mode?:string}>}){
 const q=await searchParams;
 const today=new Date().toLocaleDateString('en-CA',{timeZone:'Africa/Lagos'});
 const preferredDate=typeof q.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(q.date)&&q.date>=today?q.date:undefined;
 const preferredTime=typeof q.time==='string'&&/^(?:0[89]|1[0-6]):[0-5]\d$|^17:00$/.test(q.time)?q.time:undefined;
 const visitorCount=Number(q.attendees);
 const attendees=Number.isSafeInteger(visitorCount)&&visitorCount>=1&&visitorCount<=20?visitorCount:1;
 const visitMode=q.mode==='virtual'?'virtual':'physical';
 const project=typeof q.project==='string'&&/^[a-z0-9-]{1,70}$/.test(q.project)?q.project:undefined;
 const projectNames:Record<string,string>={'famous-gardens':'Famous Gardens','green-island':'Green Island Estate','maiyegun-beach-estate':'Maiyegun Beach Estate','blue-diamonds':'Blue Diamonds Estate'};
 const projectName=project&&projectNames[project]?projectNames[project]:'Famous Gardens';
 const projectHref=project&&projectNames[project]?'/projects/'+project:'/projects/famous-gardens';
 return <main className="ls26-page"><div className="ls26-container"><nav className="ls26-crumb"><Link href="/">Home</Link> / Request inspection</nav><section className="ls26-two"><div className="ls26-prose"><span className="ls26-eyebrow">{projectName.toUpperCase()} · PHYSICAL OR VIRTUAL</span><h1>Come with questions. Leave with a clearer picture.</h1><p>Explore {projectName} in person or on a live virtual tour. Review the project information and ask about its current status, location and ownership process.</p><div className="ls26-steps"><article><span>01</span><p>Select your preferred visit type and date.</p></article><article><span>02</span><p>Receive confirmation from the Landshop team before attending.</p></article><article><span>03</span><p>See the unit and discuss specifications, documents and payment options.</p></article></div><Link href={projectHref} className="ls26-outline">Explore {projectName} <ApprovedArrow /></Link></div><VisitEnquiryForm home={q.home} project={project} propertyId={q.property_id} preferredDate={preferredDate} preferredTime={preferredTime} attendees={attendees} mode={visitMode}/></section></div></main>}
