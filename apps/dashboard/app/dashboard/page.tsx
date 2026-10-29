
import {redirect} from 'next/navigation';
import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
import Link from 'next/link';
import './customer.css';
export const dynamic='force-dynamic';
export const metadata={title:'My Landshop | Customer Dashboard'};
const nav=[
 ['Overview','/dashboard','⌂'],['My Applications','/dashboard/applications','▣'],['KYC & Documents','/dashboard/kyc','◈'],
 ['Properties','https://www.landshopnigeria.com/properties','▦'],['Mortgage Calculator','https://portal.landshopnigeria.com/calculator','▤'],
 ['Product Forms','https://portal.landshopnigeria.com/applications','♧'],['Profile & Security','/dashboard/account','◉'],['Customer Support','https://portal.landshopnigeria.com/support','☏']
];
export default async function Dashboard(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return <main><h1>Landshop</h1><p>Dashboard configuration is incomplete.</p></main>;
 const store=await cookies();
 const db=createServerClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true},cookies:{getAll(){return store.getAll()},setAll(changes){try{changes.forEach(({name,value,options})=>store.set(name,value,options))}catch{}}}});
 const {data:{user},error}=await db.auth.getUser();
 if(error||!user)redirect('https://portal.landshopnigeria.com/');
 const [profileResult,appsResult,refResult,ticketResult]=await Promise.all([
  db.from('profiles').select('kyc_status,full_name').eq('id',user.id).maybeSingle(),
  db.from('applications').select('id,kind,status,created_at',{count:'exact'}).eq('applicant_id',user.id).order('created_at',{ascending:false}).limit(5),
  db.from('referral_codes').select('code').eq('user_id',user.id).maybeSingle(),
  db.from('support_tickets').select('id,subject,status,created_at',{count:'exact'}).eq('requester_id',user.id).order('created_at',{ascending:false}).limit(4)
 ]);
 const profile=profileResult.data,applications=appsResult.data||[],tickets=ticketResult.data||[];
 const kyc=profile?.kyc_status||'not started',approved=kyc==='approved',name=profile?.full_name?.trim().split(' ')[0]||user.email?.split('@')[0]||'Landshop member';
 const code=refResult.data?.code||null;
 return <div className="dc-shell">
  <aside className="dc-side"><div className="dc-side-brand"><Link href="/dashboard"><img src="/media/logo.webp" alt="Landshop" width={124} height={52}/></Link></div><nav aria-label="Customer dashboard">{nav.map(([label,url,icon])=><Link key={url} href={url} className={url==='/dashboard'?'active':''}><span aria-hidden="true">{icon}</span>{label}</Link>)}</nav><div className="dc-side-note"><strong>Own. Grow. Earn.</strong><p>Property opportunities with Landshop.</p><a href="https://www.landshopnigeria.com/properties">Explore Properties ↗</a></div></aside>
  <div className="dc-main"><header className="dc-top"><div className="dc-top-search">⌕ &nbsp; Search approved properties, applications and resources</div><div><Link href="https://www.landshopnigeria.com/properties">Browse Properties ↗</Link><span style={{margin:'0 12px',color:'#c2d9cf'}}>│</span><strong>{name}</strong></div></header>
   <main className="dc-page">
    <section className="dc-hero"><div><small>WELCOME TO LANDSHOP</small><h1>Welcome back,<br/>{name} 👋</h1><p>Your property journey continues here. View applications, complete identity verification and explore documented opportunities.</p><div className="dc-actions"><a className="dc-cta" href="https://www.landshopnigeria.com/properties">Browse Properties ↗</a><a className="dc-cta secondary" href="https://portal.landshopnigeria.com/applications">New Application ↗</a></div></div></section>
    <section className="dc-kpis" aria-label="Your account overview">
     <div className="dc-tile"><span className="dc-tile-icon">▣</span><small>My Applications</small><strong>{appsResult.error?'—':appsResult.count||0}</strong><p>Submitted or saved application records</p></div>
     <div className="dc-tile"><span className="dc-tile-icon">◈</span><small>Identity Verification</small><strong style={{fontSize:22,textTransform:'capitalize'}}>{kyc.replaceAll('_',' ')}</strong><p>Actual KYC status</p></div>
     <div className="dc-tile"><span className="dc-tile-icon">♧</span><small>Referral Code</small><strong style={{fontSize:20}}>{code||'Not issued'}</strong><p>Referral earnings require approved transaction records</p></div>
     <div className="dc-tile"><span className="dc-tile-icon">☏</span><small>Support Tickets</small><strong>{ticketResult.error?'—':ticketResult.count||0}</strong><p>Cases submitted under your account</p></div>
    </section>
    <div className="dc-grid">
     <section className="dc-panel"><div className="dc-head"><h2>My Properties & Applications</h2><Link href="/dashboard/applications">View all →</Link></div>{applications.length?<div className="dc-list">{applications.map(a=><div className="dc-list-item" key={a.id}><div><strong>{a.kind.replaceAll('_',' ')}</strong><small>Ref: {a.id.slice(0,8).toUpperCase()} · {new Date(a.created_at).toLocaleDateString('en-NG')}</small></div><span className={'dc-status '+(a.status==='approved'?'':'pending')}>{a.status}</span></div>)}</div>:<div className="dc-empty">No customer property applications are recorded yet. Ownership and investment balances will only appear after documented transactions are connected to your account.<p><a className="dc-cta" href="https://portal.landshopnigeria.com/applications">Start an application ↗</a></p></div>}</section>
     <section className="dc-panel"><h2>Wallet & Account</h2><div className="dc-security"><strong>Wallet services are not active</strong><p>Landshop has not enabled a verified payment wallet or settlement provider. No balance, deposit or withdrawal is displayed.</p></div><h2 style={{marginTop:22}}>KYC & Identity</h2><span className={'dc-status '+(approved?'':'pending')}>{approved?'Verified':'Not yet approved'}</span><p>{approved?'Your account is marked approved by the Landshop review process.':'Complete the documented identity review to unlock protected features.'}</p><Link href="/dashboard/kyc" className="dc-cta">View KYC Details ↗</Link></section>
    </div>
    <div className="dc-grid">
     <section className="dc-panel"><div className="dc-head"><h2>Investment Performance</h2><Link href="https://www.landshopnigeria.com/incubate">Explore Incubate →</Link></div><div className="dc-empty">No verified investment ledger is connected. Investment values, returns and performance charts are displayed only when approved financial records are available.</div><div className="dc-stat-strip" style={{marginTop:15}}><span>Property-linked investment enquiries</span><span>No fictional returns</span></div></section>
     <section className="dc-panel"><h2>Referral Programme</h2><p>Your referral identity is protected. Any rewards must be calculated from approved eligible business records.</p><div className="dc-security"><strong>{code||'No referral code assigned yet'}</strong><p>{code?'You may share your issued referral code with interested applicants.':'A referral code appears after it has been issued to your verified account.'}</p></div></section>
    </div>
    <div className="dc-grid">
     <section className="dc-panel"><div className="dc-head"><h2>Documents & Mortgage</h2><Link href="/dashboard/kyc">Manage documents →</Link></div><p>Identity documents remain in private access-controlled storage. Current verification is <strong>{kyc.replaceAll('_',' ')}</strong>.</p><div className="dc-support"><a href="https://portal.landshopnigeria.com/calculator">Calculate mortgage →</a><a href="https://portal.landshopnigeria.com/applications/beta-mortgage">Beta Mortgage →</a><a href="https://portal.landshopnigeria.com/applications/mortgage-xtra">Mortgage Xtra →</a></div></section>
     <section className="dc-panel"><div className="dc-head"><h2>Recent Support & Notifications</h2><a href="https://portal.landshopnigeria.com/support">View tickets →</a></div>{tickets.length?<div className="dc-list">{tickets.map(t=><div key={t.id} className="dc-list-item"><strong>{t.subject}</strong><span className="dc-status">{t.status}</span></div>)}</div>:<p>No support cases have been opened in this account. Notification delivery requires configured providers.</p>}</section>
    </div>
    <section className="dc-bottom"><div><small>MORE OPPORTUNITIES AWAIT</small><h2>Discover exceptional property opportunities across Nigeria.</h2><p>Choose a verified property, request current documentation and start a guided application.</p></div><a className="dc-cta secondary" href="https://www.landshopnigeria.com/properties">Browse Published Properties ↗</a></section>
    <footer className="dc-foot"><span>© {new Date().getFullYear()} Landshop. All rights reserved.</span><a href="https://www.landshopnigeria.com/contact">Contact support</a></footer>
   </main>
  </div>
 </div>;
}
