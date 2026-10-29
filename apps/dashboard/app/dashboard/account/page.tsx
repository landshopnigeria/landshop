import {redirect} from 'next/navigation';
import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
import Link from 'next/link';
import SecureSignOut from './SecureSignOut';
import '../customer.css';

export const dynamic='force-dynamic';
export const metadata={title:'My Account & Security | Landshop'};

export default async function MyAccount(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return <main>Account services are not configured.</main>;
 const store=await cookies();
 const supabase=createServerClient(url,key,{
  cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true},
  cookies:{getAll(){return store.getAll()},setAll(changes){try{changes.forEach(({name,value,options})=>store.set(name,value,options))}catch{}}}
 });
 const {data:{user},error}=await supabase.auth.getUser();
 if(error||!user)redirect('https://portal.landshopnigeria.com/');
 const {data:profile,error:profileError}=await supabase.from('profiles')
  .select('full_name,phone,display_username,kyc_status,created_at')
  .eq('id',user.id).maybeSingle();
 const status=profile?.kyc_status||'not_started';
 return <div className="dc-shell" style={{display:'block'}}>
 <header className="dc-top"><Link href="/dashboard">← Customer Dashboard</Link><strong>Landshop Account & Security</strong><Link href="https://www.landshopnigeria.com">Website ↗</Link></header>
 <main className="dc-page" style={{maxWidth:1100,margin:'0 auto'}}>
  <section className="dc-hero"><div><small>ACCOUNT MANAGEMENT</small><h1>My Landshop account.</h1><p>Review your verified email, identity status and account details, and manage your active session securely.</p></div></section>
  <div className="dc-grid">
   <section className="dc-panel"><h2>Identity & Contact</h2>
    {profileError||!profile?<div className="dc-security" role="status"><strong>Account profile not available</strong><p>Your Supabase account is authenticated, but its customer profile could not be retrieved. Contact support; an owner may need to repair your profile record. KYC cannot be treated as approved.</p></div>:
    <dl style={{display:'grid',gap:16}}>
     <div><dt>Email address</dt><dd style={{fontWeight:700,margin:'5px 0'}}>{user.email||'Not provided'}</dd></div>
     <div><dt>Name</dt><dd style={{fontWeight:700,margin:'5px 0'}}>{profile.full_name||'Not provided'}</dd></div>
     <div><dt>Preferred username</dt><dd style={{fontWeight:700,margin:'5px 0'}}>{profile.display_username||'Not provided'}</dd><small>For display only; use your email to sign in.</small></div>
     <div><dt>Phone / WhatsApp</dt><dd style={{fontWeight:700,margin:'5px 0'}}>{profile.phone||'Not provided'}</dd></div>
    </dl>}
   </section>
   <section className="dc-panel"><h2>Account verification</h2>
    <div className="dc-security"><strong>Email: {user.email_confirmed_at?'Confirmed':'Not confirmed'}</strong>
    <p>{user.email_confirmed_at?'Your Supabase login email has been confirmed.':'Confirm your email through the secure verification message before accessing restricted services.'}</p></div>
    <p><strong>KYC status:</strong> {status.replaceAll('_',' ')}</p>
    <p>KYC is reviewed by authorized Landshop staff. Customers cannot self-approve verification.</p>
    <Link href="/dashboard/kyc" className="dc-cta">View KYC / Documents ↗</Link>
   </section>
  </div>
  <div className="dc-grid">
   <section className="dc-panel"><h2>Password & Session</h2><p>Use the authenticated password-recovery flow to update a forgotten password. Signing out revokes the current Supabase session and clears the shared Landshop browser session.</p><p><a href="https://portal.landshopnigeria.com/reset-password">Reset password ↗</a></p><SecureSignOut/></section>
   <section className="dc-panel"><h2>Additional account security</h2><p>Multi-factor authentication is never required during the initial Landshop sign-in. Optional verification settings will be offered here only after a recoverable enrollment and support process has been validated.</p><p>Never share an OTP, recovery token or security QR code with support agents.</p><Link href="https://portal.landshopnigeria.com/support">Contact account support →</Link></section>
  </div>
 </main></div>;
}
