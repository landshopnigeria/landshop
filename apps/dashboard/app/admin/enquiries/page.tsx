import Link from 'next/link';
import {requireLandshopStaff} from '../../../lib/admin-access';
export const dynamic='force-dynamic';
export const metadata={title:'Website Enquiries | Landshop Command Center'};
export default async function WebsiteEnquiries(){
 const {db}=await requireLandshopStaff(['owner','executive','admin','operations','sales','marketing']);
 const {data,error}=await db.from('contact_enquiries')
  .select('id,full_name,email,phone,topic,message,status,created_at')
  .order('created_at',{ascending:false}).limit(150);
 return <main className="enquiries-command"><style>{".enquiries-command{background:#f1f8f4;color:#123f33;min-height:100vh;padding:clamp(20px,5vw,60px);font-family:Arial,Helvetica,sans-serif}.enquiries-wrap{max-width:1320px;margin:auto}.enquiries-wrap>nav a{color:#098165;font-size:13px;font-weight:750}.enquiries-intro{margin:32px 0}.enquiries-intro span{font-size:11px;letter-spacing:2px;color:#087b5e;font-weight:800}.enquiries-intro h1{font-size:clamp(34px,4vw,55px);letter-spacing:-1px;margin:8px 0}.enquiries-intro p{color:#5d796c;max-width:740px;line-height:1.6}.enquiries-count{font-size:12px;color:#577466}.enquiries-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.enquiry-record{background:#fff;border:1px solid #d9e9df;border-radius:19px;padding:25px;box-shadow:0 13px 32px #0b493512;min-width:0}.enquiry-meta,.enquiry-title,.enquiry-contact{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}.enquiry-meta{font-size:11px;color:#547163}.enquiry-meta span:first-child{color:#0b745b;font-weight:800;text-transform:uppercase;letter-spacing:1px}.enquiry-title h2{font-size:21px;margin:17px 0}.enquiry-title span{font-size:11px;background:#e8f5ec;border-radius:20px;padding:7px 10px;text-transform:capitalize;color:#087b5f}.enquiry-message{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.65;color:#365c4e;font-size:14px;max-height:220px;overflow:auto}.enquiry-contact{justify-content:flex-start;gap:15px;border-top:1px solid #e5eee7;padding-top:16px}.enquiry-contact a{font-size:13px;color:#087e61;font-weight:800}.enquiry-email,.enquiries-policy{font-size:11px;color:#698176;overflow-wrap:anywhere}.enquiries-policy{margin-top:35px}.enquiries-empty{background:white;border:1px solid #d4e8dc;border-radius:18px;padding:32px}.enquiry-contact a:focus-visible{outline:3px solid #f26b10;outline-offset:3px}@media(max-width:820px){.enquiries-grid{grid-template-columns:1fr}}\n"}</style>
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
     </article>)}</div></>}
   <p className="enquiries-policy">Privacy: enquiry contents are restricted to authorized Landshop staff. Do not disclose personal details outside approved customer-service channels.</p>
  </div>
 </main>;
}
