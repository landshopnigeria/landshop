import Link from 'next/link';
import './enquiries.css';
import {requireLandshopStaff} from '../../../lib/admin-access';
import EnquiryAction from './EnquiryAction';
export const dynamic='force-dynamic';
export const metadata={title:'Website Enquiries | Landshop Command Center'};
export default async function WebsiteEnquiries(){
 const {db}=await requireLandshopStaff(['owner','executive','admin','operations','sales','marketing']);
 const {data,error}=await db.from('contact_enquiries')
  .select('id,full_name,email,phone,topic,message,status,created_at')
  .order('created_at',{ascending:false}).limit(150);
 return <main className="enquiries-command">
  <div className="enquiries-wrap"><nav aria-label="Breadcrumb"><Link href="/admin">← Landshop Command Center</Link></nav>
   <div className="enquiries-intro"><span>LANDSHOP · CUSTOMER RELATIONSHIPS</span><h1>Website Enquiries</h1>
    <p>Live messages submitted through the public Landshop contact form. Accessible only to authorized management, operations, sales and marketing staff.</p></div>
   {error?<div role="alert" className="enquiries-empty">Enquiries could not be retrieved. Confirm the contact intake migration and staff permissions.</div>:
    !data?.length?<div className="enquiries-empty">No website enquiries have been received yet.</div>:
    <><p className="enquiries-count">{data.length} most recent visible enquiries · Latest first</p>
     <div className="enquiries-grid">{data.map(item=><article key={item.id} className="enquiry-record">
      <div className="enquiry-meta"><span>{item.topic}</span><span>{new Date(item.created_at).toLocaleString('en-NG',{dateStyle:'medium',timeStyle:'short',timeZone:'Africa/Lagos'})}</span></div>
      <div className="enquiry-title"><h2>{item.full_name}</h2><span>{item.status.replaceAll('_',' ')}</span></div>
      <p className="enquiry-message">{item.message}</p>
      <div className="enquiry-contact"><a href={'mailto:'+encodeURIComponent(item.email)+'?subject='+encodeURIComponent('Re: your Landshop '+item.topic+' enquiry')}>Reply by email ↗</a>
       {item.phone&&<a href={'tel:'+item.phone.replace(/[^+\d]/g,'')}>Call customer ↗</a>}</div>
      <p className="enquiry-email">Customer email: {item.email}{item.phone?' · '+item.phone:''}</p>
      <EnquiryAction id={item.id} current={item.status}/>
     </article>)}</div></>}
   <p className="enquiries-policy">Privacy: enquiry contents are restricted to authorized Landshop staff. Do not disclose personal details outside approved customer-service channels.</p>
  </div>
 </main>;
}
