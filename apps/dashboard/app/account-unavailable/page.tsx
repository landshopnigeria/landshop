import Link from 'next/link';
import SecureSignOut from '../dashboard/account/SecureSignOut';
export default function Page(){return <main style={{maxWidth:650,margin:'80px auto',padding:24}}><h1>Account access unavailable</h1><p>This account may be suspended or archived, or its access could not be verified. Contact Landshop management for assistance.</p><p><Link href="https://www.landshopnigeria.com/contact">Contact Landshop</Link></p><SecureSignOut/></main>}
