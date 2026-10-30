import {NextResponse} from 'next/server';
import {guides} from '../../../../lib/guides';

/** Public article metadata from the same source as live Insights pages.
 * This never exposes subscriber records or unpublished property listings.
 */
export const dynamic='force-dynamic';
export async function GET(){
 const articles=guides.filter(g=>/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(g.slug))
  .map(g=>({
   slug:g.slug,
   title:g.title,
   category:g.category,
   summary:g.summary,
   readingMinutes:g.readingMinutes,
   href:'/insights/'+g.slug,
   image:g.image
  }));
 return NextResponse.json({articles,count:articles.length},{
  headers:{'Cache-Control':'public, max-age=60, s-maxage=300','X-Content-Type-Options':'nosniff'}
 });
}
