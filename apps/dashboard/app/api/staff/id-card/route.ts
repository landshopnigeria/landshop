import {cookies} from 'next/headers';
import {createServerClient} from '@supabase/ssr';
import {PDFDocument,StandardFonts,rgb,degrees} from 'pdf-lib';

export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return Response.json({error:'Identity service unavailable'},{status:503});
 const store=await cookies();
 const db=createServerClient(url,key,{
  cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true},
  cookies:{getAll(){return store.getAll()},setAll(changes){try{changes.forEach(x=>store.set(x.name,x.value,x.options))}catch{}}}
 });
 const {data:{user}}=await db.auth.getUser();
 if(!user||!user.email_confirmed_at)return Response.json({error:'Verified staff sign-in required'},{status:401});
 const [p,m]=await Promise.all([
  db.from('landshop_staff_profiles')
   .select('username,staff_number,employment_state,kyc_state,joined_at')
   .eq('user_id',user.id).maybeSingle(),
  db.from('organization_members')
   .select('role,status').eq('user_id',user.id).eq('status','active').limit(1).maybeSingle()
 ]);
 const staff=p.data;
 if(p.error||!staff||staff.employment_state!=='active'||!m.data)
  return Response.json({error:'An active staff account is required'},{status:403});
 const verified=staff.kyc_state==='approved';
 const doc=await PDFDocument.create(),page=doc.addPage([650,400]);
 const font=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold);
 const deep=rgb(0.027,0.247,0.204),green=rgb(0.1,0.62,0.44),orange=rgb(0.95,0.42,0.07);
 page.drawRectangle({x:0,y:0,width:650,height:400,color:rgb(0.978,0.991,0.979)});
 page.drawRectangle({x:0,y:310,width:650,height:90,color:deep});
 page.drawText('LANDSHOP',{x:36,y:346,size:29,font:bold,color:rgb(1,1,1)});
 page.drawText('PEOPLE & MANAGEMENT',{x:36,y:324,size:10,font,color:rgb(1,1,1)});
 page.drawRectangle({x:36,y:38,width:578,height:248,borderColor:rgb(0.85,0.92,0.86),borderWidth:1.1,color:rgb(1,1,1)});
 page.drawText(verified?'OFFICIAL STAFF IDENTIFICATION':'PROVISIONAL STAFF REGISTRATION',{x:55,y:259,size:15,font:bold,color:deep});
 page.drawText('Staff Number',{x:55,y:222,size:11,font,color:rgb(0.35,0.5,0.42)});
 page.drawText(String(staff.staff_number||'NOT ISSUED').slice(0,42),{x:55,y:197,size:24,font:bold,color:green});
 const clean=(s:unknown,max=50)=>String(s||'').replace(/[^\x20-\x7e]/g,'?').slice(0,max);
 page.drawText('Account: '+clean(staff.username),{x:55,y:163,size:13,font:bold,color:deep});
 page.drawText('Role: '+clean(m.data.role).replaceAll('_',' '),{x:55,y:138,size:12,font,color:deep});
 page.drawText('Joined: '+clean(staff.joined_at?new Date(staff.joined_at).toLocaleDateString('en-NG'):'Pending'),{x:55,y:114,size:12,font,color:deep});
 page.drawText('Identity: '+(verified?'Verified':'Identity review pending'),{x:55,y:90,size:12,font,color:verified?green:orange});
 if(!verified){
  page.drawText('PROVISIONAL',{x:268,y:121,size:39,font:bold,color:rgb(0.89,0.89,0.89),rotate:degrees(32),opacity:.65});
 }
 page.drawText('This card is valid only while the Landshop staff account is active. Contact HR to verify current status.',{x:39,y:17,size:8,font,color:rgb(0.3,0.46,0.37)});
 doc.setTitle('Landshop '+(verified?'Staff ID':'Provisional Staff Pass'));
 doc.setCreator('Landshop People & Management');
 const pdf=await doc.save();
 return new Response(new Uint8Array(pdf),{status:200,headers:{
  'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="landshop-staff-'+(verified?'id':'provisional')+'.pdf"',
  'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff'
 }});
}
