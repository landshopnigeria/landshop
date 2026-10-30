import Link from 'next/link';
import {requireLandshopStaff} from '../../../../lib/admin-access';
import InviteReviewer from './InviteReviewer';
export const dynamic='force-dynamic';
export const metadata={title:'Independent Reviewer Access | Landshop'};
export default async function Team(){
 await requireLandshopStaff(['owner']);
 return <main style={{minHeight:'100vh',background:'#f3faf5',padding:'clamp(20px,5vw,70px)',fontFamily:'Arial,sans-serif',color:'#124633'}}>
  <div style={{maxWidth:1040,margin:'auto'}}>
   <Link href="/admin/properties" style={{color:'#0b8864'}}>← Property Command Center</Link>
   <p style={{fontSize:12,fontWeight:800,color:'#e87313',letterSpacing:1.3}}>LANDSHOP PROPERTY GOVERNANCE</p>
   <h1 style={{fontSize:'clamp(28px,4vw,46px)',lineHeight:1.2}}>Invite a separate verified reviewer</h1>
   <p style={{maxWidth:750,lineHeight:1.75,color:'#5c7568'}}>Only the active Landshop owner can invite legal, operations or administrative reviewers. A reviewer must already have a confirmed Supabase Auth email, must not be the owner, and must sign in to accept. These roles can never be granted automatically from an email guessed or scraped online.</p>
   <InviteReviewer/>
   <p style={{marginTop:20,fontSize:13,color:'#5e7868'}}>After acceptance, assign different people to evidence upload, approval and final publication. An owner cannot self-approve every step.</p>
  </div>
 </main>;
}
