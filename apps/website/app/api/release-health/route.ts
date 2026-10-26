import {NextResponse} from 'next/server';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export function GET(){
 return NextResponse.json({service:'landshop-website',commit:process.env.NEXT_PUBLIC_LANDSHOP_RELEASE_SHA||'unversioned',status:'serving-nextjs'},{headers:{'Cache-Control':'no-store, max-age=0','X-Content-Type-Options':'nosniff'}});
}
