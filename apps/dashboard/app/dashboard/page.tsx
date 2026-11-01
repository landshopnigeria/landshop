import InvestorOverview from './InvestorOverview';
import CustomerNavigation from './CustomerNavigation';
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
  db.from('applications').select('id,kind,status,created_at,answers',{count:'exact'}).eq('applicant_id',user.id).order('created_at',{ascending:false}).limit(4),
  db.from('referral_codes').select('code').eq('user_id',user.id).maybeSingle(),
  db.rpc('landshop_referral_summary'),
  db.from('referral_wallets').select('available_kobo,pending_kobo,lifetime_earned_kobo').eq('user_id',user.id).maybeSingle(),
  db.from('support_tickets').select('id,status',{count:'exact'}).eq('requester_id',user.id).limit(1),
  db.from('properties').select('id,title,slug,amount_kobo').eq('status','published').order('created_at',{ascending:false}).limit(1),
  db.rpc('landshop_referral_activity',{p_limit:15}),
  db.from('referral_reward_events').select('id,created_at,description,status,direction,amount_kobo').eq('user_id',user.id).order('created_at',{ascending:false}).limit(12)
 ]);
 const [paymentsRes,documentsRes]=await Promise.all([
  db.from('landshop_payment_intents').select('id,amount_kobo,currency,purpose,purpose_reference,status,verified_at,created_at')
   .eq('customer_id',user.id).order('created_at',{ascending:false}).limit(40),
  db.from('application_documents').select('id,document_type,created_at,application_id')
   .eq('applicant_id',user.id).order('created_at',{ascending:false}).limit(30)
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
  <CustomerNavigation/>
  <div className="dc-main">
   <header className="cd-topbar"><a href="https://www.landshopnigeria.com" className="cd-mobile-logo" aria-label="Landshop homepage"><img src="/media/logo.webp" alt="Landshop" width={98} height={43}/></a><span>My Landshop</span><div><Link href="/dashboard/account" aria-label="Account and profile" className="cd-avatar">{firstname.slice(0,1).toUpperCase()}</Link></div></header>
   <main className="cd-main">
    <InvestorOverview
     firstname={firstname} kyc={kyc}
     applications={(appsRes.data||[]) as {id:string;kind:string;status:string;created_at:string;answers?:unknown}[]}
     payments={(paymentsRes.data||[]) as {id:string;amount_kobo:number;currency:string;purpose:string;purpose_reference:string|null;status:string;verified_at:string|null;created_at:string}[]}
     documents={(documentsRes.data||[]) as {id:string;document_type:string;created_at:string;application_id:string}[]}
     applicationCount={appsRes.error?null:appsRes.count||0}
     supportCount={ticketsRes.error?null:ticketsRes.count||0}
    />
    <section id="referrals" className="ls26-investor-referrals"><ReferralToolkit code={code} summary={summary} activity={referralActivityRes.data||[]} rewards={rewardHistoryRes.data||[]}/></section>
    <footer className="cd-footer"><span>© {new Date().getFullYear()} Landshop Nigeria</span><a href="https://www.landshopnigeria.com/contact">Contact</a></footer>
   </main>
   <nav className="cd-mobile-dock" aria-label="Mobile customer navigation">{links.filter(x=>['Overview','Properties','Applications','Wallet','Profile'].includes(x[0])).map(([label,to,icon])=><Link href={to} key={label} className={label==='Overview'?'current':''}><Icon name={icon}/><small>{label==='Overview'?'Home':label}</small></Link>)}</nav>
  </div>
 </div>;
}
