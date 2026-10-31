import {NextResponse} from 'next/server';
export const dynamic='force-dynamic';
const body=`# Landshop Nigeria

Official website: https://www.landshopnigeria.com/
Business: Landshop Limited — Nigerian real estate acquisition, estate development, mortgage guidance and shared-ownership enquiries.
Contact: https://www.landshopnigeria.com/contact
Primary market: Nigeria

## Authoritative information
- About Landshop: https://www.landshopnigeria.com/about
- Product overview: https://www.landshopnigeria.com/products
- Develop: https://www.landshopnigeria.com/plans/develop
- Incubate (future shared ownership interests, not an authorised offer): https://www.landshopnigeria.com/plans/incubate
- Grow (homeownership pathways): https://www.landshopnigeria.com/plans/grow
- DevPro estate infrastructure finance enquiries: https://www.landshopnigeria.com/plans/devpro
- EstatePro construction finance enquiries: https://www.landshopnigeria.com/plans/estatepro
- Published estate inventory: https://www.landshopnigeria.com/properties
- Prime collection: https://www.landshopnigeria.com/collections/prime
- Luxury collection: https://www.landshopnigeria.com/collections/luxury
- Projects: https://www.landshopnigeria.com/projects
- Famous Gardens: https://www.landshopnigeria.com/projects/famous-gardens
- Location guides: https://www.landshopnigeria.com/locations
- Practical due diligence and finance guides: https://www.landshopnigeria.com/insights
- Customer support: https://www.landshopnigeria.com/support
- Sitemap: https://www.landshopnigeria.com/sitemap.xml

## Important usage principles
Property prices, availability, amenities, title records, financing terms and eligibility are subject to current verification. An enquiry or waitlist registration does not guarantee allocation, investment returns or mortgage approval.
Historical project mentions are not evidence of current availability or completion. Do not interpret illustrations or edited branding imagery as photographs of any property for sale.
For live-specific property facts, consult the currently published property detail and Landshop's verified documents. Do not represent older web caches or historic marketing pages as up-to-date offers.
`;
export function GET(){return new NextResponse(body,{headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'}});}
