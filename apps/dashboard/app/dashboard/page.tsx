import {redirect} from 'next/navigation';
import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
import Link from 'next/link';
import ReferralToolkit from './ReferralToolkit';
import './customer.css';

export const dynamic='force-dynamic';
export const metadata={title:'My Landshop | Customer Dashboard'};
function Icon({name}:{name:string}){
 const common={width:23,height:23,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round' as const,strokeLinejoin:'round' as const,'aria-hidden':true as const};
 switch(name){
 case 'home':return <svg {...common}><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/></svg>;
 case 'users':return <svg {...common}><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 6a3 3 0 0 1 0 6m1 3a5 5 0 0 1 3 5"/></svg>;
 case 'chart':return <svg {...common}><path d="M4 20V9m6 11V4m6 16v-8m4 8V7"/></svg>;
 case 'file':return <svg {...common}><path d="M7 3h8l4 4v14H5V3h2Zm7 0v5h5M8 13h8m-8 4h8"/></svg>;
 case 'wallet':return <svg {...common}><rect x="3" y="6" width="18" height="15" rx="2"/><path d="M3 9V5a2 2 0 0 1 2-2h13m-1 10h4m-5 0h1"/></svg>;
 case 'support':return <svg {...common}><path d="M4 14v-3a8 8 0 0 1 16 0v3M4 14H2v5h4v-6H4Zm16 0h2v5h-4v-6h2ZM19 20a5 5 0 0 1-5 2h-2"/></svg>;
 case 'check':return <svg {...common}><path d="M12 22s9-4 9-11V5l-9-3-9 3v6c0 7 9 11 9 11Z"/><path d="m8 12 3 3 5-6"/></svg>;
 default:return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></svg>
 }
}
const links=[['Overview','/dashboard','home'],['Applications','/dashboard/applications','file'],['KYC','/dashboard/kyc','check'],['Properties','https://www.landshopnigeria.com/properties','search'],['Wallet','#referrals','wallet'],['Profile','/dashboard/account','users']];
export default async function Dashboard(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return <main><h1>Landshop</h1><p>Customer account configuration is incomplete.</p></main>;
 const store=await cookies();
 const db=createServerClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true},
  cookies:{getAll(){return store.getAll()},setAll(changes){try{changes.forEach(({name,value,options})=>store.set(name,value,options))}catch{}}}});
 const {data:{user},error}=await db.auth.getUser();
 if(error||!user)redirect('https://portal.landshopnigeria.com/');
 const [profileRes,appsRes,codeRes,summaryRes,walletRes,ticketsRes,propertyRes,referralActivityRes,rewardHistoryRes]=await Promise.all([
  db.from('profiles').select('full_name,kyc_status').eq('id',user.id).maybeSingle(),
  db.from('applications').select('id,kind,status,created_at',{count:'exact'}).eq('applicant_id',user.id).order('created_at',{ascending:false}).limit(4),
  db.from('referral_codes').select('code').eq('user_id',user.id).maybeSingle(),
  db.rpc('landshop_referral_summary'),
  db.from('referral_wallets').select('available_kobo,pending_kobo,lifetime_earned_kobo').eq('user_id',user.id).maybeSingle(),
  db.from('support_tickets').select('id,status',{count:'exact'}).eq('requester_id',user.id).limit(1),
  db.from('properties').select('id,title,slug,amount_kobo').eq('status','published').order('created_at',{ascending:false}).limit(1),
  db.rpc('landshop_referral_activity',{p_limit:15}),
  db.from('referral_reward_events').select('id,created_at,description,status,direction,amount_kobo').eq('user_id',user.id).order('created_at',{ascending:false}).limit(12)
 ]);
 const profile=profileRes.data;
 const firstname=(profile?.full_name||user.user_metadata?.full_name||user.email?.split('@')[0]||'Member').split(' ')[0];
 const kyc=profile?.kyc_status||'not_started',approved=kyc==='approved',applications=appsRes.data||[];
 const code=codeRes.data?.code||null,summary=Array.isArray(summaryRes.data)?summaryRes.data[0]||null:null;
 const wallet=walletRes.data,property=propertyRes.data?.[0]||null;
 const hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Africa/Lagos',hour:'2-digit',hour12:false}).format(new Date()));
 const greeting=hour<12?'Good morning':hour<17?'Good afternoon':'Good evening';
 const formatNaira=(kobo:number)=>new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0}).format(kobo/100);
 return <div className="dc-shell cd-v25">
  <aside className="dc-side cd-sidebar">
   <a className="dc-side-brand" href="https://www.landshopnigeria.com" aria-label="Landshop homepage"><img src="/media/logo.webp" alt="Landshop" width={128} height={60}/></a>
   <nav aria-label="Customer dashboard">{links.map(([label,to,icon])=><Link key={label} href={to} className={label==='Overview'?'active':''}><Icon name={icon}/><span>{label}</span></Link>)}</nav>
   <div className="cd-side-help"><strong>Landshop Support</strong><p>Questions about your property journey?</p><a href="https://portal.landshopnigeria.com/support">Contact our team →</a></div>
  </aside>
  <div className="dc-main">
   <header className="cd-topbar"><a href="https://www.landshopnigeria.com" className="cd-mobile-logo" aria-label="Landshop homepage"><img src="/media/logo.webp" alt="Landshop" width={98} height={43}/></a><span>My Landshop</span><div><Link href="/dashboard/account" aria-label="Account and profile" className="cd-avatar">{firstname.slice(0,1).toUpperCase()}</Link></div></header>
   <main className="cd-main">
    <section className="cd-welcome">
     <div className="cd-hello"><small>LANDSHOP CUSTOMER DASHBOARD</small><h1>{greeting},<br/><em>{firstname}</em></h1><p>Build your real estate future with Landshop.</p></div>
     <Link href="/dashboard/kyc" className={'cd-verified '+(approved?'approved':'pending')}><Icon name="check"/><span>{approved?'KYC Verified':'Complete KYC'}</span><span aria-hidden="true">›</span></Link>
    </section>
    <section className="cd-actions" aria-label="Quick customer actions">
     {[
      ['Invest in Property','https://www.landshopnigeria.com/properties','home'],
      ['Refer & Grow','#referrals','users'],
      ['Build Wealth','https://portal.landshopnigeria.com/applications/incubate-investment','chart'],
      ['My Applications','/dashboard/applications','file'],
      ['Referral Wallet','#referrals','wallet'],
      ['Support','https://portal.landshopnigeria.com/support','support']
     ].map(([label,to,icon])=><Link href={to} key={label} className="cd-action"><span className="cd-action-icon"><Icon name={icon}/></span><strong>{label}</strong><span className="cd-action-chevron" aria-hidden="true">›</span></Link>)}
    </section>
    <section className="cd-summary" aria-label="Customer account snapshot">
     <Link href="/dashboard/applications" className="cd-summary-card"><span>My Applications</span><strong>{appsRes.error?'—':appsRes.count||0}</strong><small>Track current submissions</small></Link>
     <Link href="/dashboard/kyc" className="cd-summary-card"><span>Identity Status</span><strong className="cd-status-label">{kyc.replaceAll('_',' ')}</strong><small>Review your verification</small></Link>
     <div className="cd-summary-card"><span>Referral Wallet</span><strong>{walletRes.error?'—':formatNaira(wallet?.available_kobo||0)}</strong><small>{wallet?.pending_kobo?formatNaira(wallet.pending_kobo)+' pending':'No approved referral payouts yet'}</small></div>
     <Link href="https://portal.landshopnigeria.com/support" className="cd-summary-card"><span>Support Cases</span><strong>{ticketsRes.error?'—':ticketsRes.count||0}</strong><small>Follow up on enquiries</small></Link>
    </section>
    <div style={{margin:'14px 0',padding:'16px 19px',background:'#fff',border:'1px solid #e0ede4',borderRadius:14,display:'flex',alignItems:'center',justifyContent:'space-between',gap:14,flexWrap:'wrap'}}><div><strong>Landshop Subscriptions</strong><p style={{fontSize:12,color:'#708779',margin:'6px 0 0'}}>Choose an approved plan, renew access and see Paystack-verified receipts.</p></div><a style={{color:'#087f64',fontWeight:800}} href="https://portal.landshopnigeria.com/billing">Manage subscription →</a></div>
    <ReferralToolkit code={code} summary={summary} activity={referralActivityRes.data||[]} rewards={rewardHistoryRes.data||[]}/>
    <div className="cd-bottom-grid">
     <section className="cd-panel"><div className="cd-section-head"><h2>My Applications</h2><Link href="/dashboard/applications">View all →</Link></div>
      {applications.length?<div className="cd-activity-list">{applications.map(a=><div key={a.id}><strong>{a.kind.replaceAll('_',' ')}</strong><span>{a.status.replaceAll('_',' ')} · {new Date(a.created_at).toLocaleDateString('en-NG')}</span></div>)}</div>:<div className="cd-empty"><p>No applications yet. Start exploring Landshop opportunities.</p><a href="https://portal.landshopnigeria.com/applications">Start an application →</a></div>}
     </section>
     <section className="cd-panel cd-feature"><div className="cd-section-head"><h2>Featured Property</h2><a href="https://www.landshopnigeria.com/properties">View all →</a></div>
      {property?<a href={'https://www.landshopnigeria.com/properties/'+encodeURIComponent(property.slug||property.id)} className="cd-feature-property"><img src="/media/brand-develop-house.webp" alt="Landshop property illustration" loading="lazy"/><strong>{property.title}</strong>{typeof property.amount_kobo==='number'&&<span>{formatNaira(property.amount_kobo)}</span>}</a>:<div className="cd-empty"><p>Explore Landshop’s published real estate opportunities and ask for the latest verified documentation.</p><a href="https://www.landshopnigeria.com/properties">Browse properties →</a></div>}
     </section>
    </div>
    <footer className="cd-footer"><span>© {new Date().getFullYear()} Landshop Nigeria</span><a href="https://www.landshopnigeria.com/contact">Contact</a></footer>
   </main>
   <nav className="cd-mobile-dock" aria-label="Mobile customer navigation">{links.filter(x=>['Overview','Properties','Applications','Wallet','Profile'].includes(x[0])).map(([label,to,icon])=><Link href={to} key={label} className={label==='Overview'?'current':''}><Icon name={icon}/><small>{label==='Overview'?'Home':label}</small></Link>)}</nav>
  </div>
 </div>;
}
