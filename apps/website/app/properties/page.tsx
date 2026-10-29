
import Link from 'next/link';
import {MarketHeader,MarketFooter} from '../../components/MarketChrome';
import {NIGERIA_STATES,PAGE_SIZE,cleanFilters,listPublished,marketHref,money,type Params} from '../../lib/marketplace';
import './property-market.css';
export const dynamic='force-dynamic';
export const metadata={title:'Property Marketplace | Landshop Nigeria',description:'Explore authentic, management-published Landshop property listings with location, type and price filters.'};
export default async function Properties({searchParams}:{searchParams:Promise<Params>}){
 const filters=cleanFilters(await searchParams),{rows,count,error}=await listPublished(filters);
 const pages=Math.max(1,Math.ceil(count/PAGE_SIZE)),page=filters.page;
 const start=count?((page-1)*PAGE_SIZE)+1:0,end=Math.min(count,page*PAGE_SIZE);
 const paginationStart=Math.max(1,Math.min(Math.max(1,pages-6),page-3));
 return <main className="mk-layout"><MarketHeader/>
  <section className="mk-hero"><div><small>HOME / PROPERTIES</small><h1><em>Property</em> Marketplace</h1><p>Explore approved land, housing and estate opportunities with transparent property information, current published prices and guided enquiries.</p></div></section>
  <div className="mk-wrap"><form className="mk-search" action="/properties" method="get">
   <div className="mk-tabs">{(['Buy','Rent','Shortlet'] as const).map(p=><Link key={p} className={filters.purpose===p?'active':''} href={marketHref(filters,{purpose:p,page:1,type:p==='Shortlet'?'shortlet':''})}>{p}</Link>)}</div>
   <input type="hidden" name="purpose" value={filters.purpose}/>

   <div className="mk-search-grid">
    <label>Location or property<input name="query" defaultValue={filters.query} placeholder="Estate, name or keyword" maxLength={80}/></label>
    <label>State / FCT<select name="state" defaultValue={filters.state}><option value="">All Nigerian states</option>{NIGERIA_STATES.map(s=><option key={s} value={s}>{s}</option>)}</select></label>
    <label>City / Town<input name="city" defaultValue={filters.city} placeholder="e.g. Lekki" maxLength={60}/></label>
    <label>Property type<select name="type" defaultValue={filters.type}><option value="">All property types</option>{['land','house','apartment','commercial','shortlet'].map(t=><option key={t} value={t}>{t[0].toUpperCase()+t.slice(1)}</option>)}</select></label>
    <label>Max budget (₦)<input name="max" type="number" min="1" max="1000000000000" placeholder="Any budget" defaultValue={filters.max||''}/></label>
    <button className="mk-btn" type="submit">Search Properties ↗</button>
   </div>
   <details className="mk-advanced" open={Boolean(filters.lga||filters.area||filters.beds||filters.baths||filters.min_size||filters.availability||filters.min)}>
    <summary>More filters — LGA, budget, bedrooms & measurements <span aria-hidden="true">⌄</span></summary>
    <div className="mk-advanced-grid">
     <label>Local government area<input name="lga" defaultValue={filters.lga} maxLength={70} placeholder="Choose or enter LGA"/></label>
     <label>Area / Estate<input name="area" defaultValue={filters.area} maxLength={70} placeholder="Neighborhood or estate"/></label>
     <label>Minimum price (₦)<input name="min" type="number" min="1" max="1000000000000" defaultValue={filters.min||''} placeholder="No minimum"/></label>
     <label>Minimum bedrooms<select name="beds" defaultValue={filters.beds||''}><option value="">Any</option>{[1,2,3,4,5,6,7,8].map(n=><option key={n} value={n}>{n}+</option>)}</select></label>
     <label>Minimum bathrooms<select name="baths" defaultValue={filters.baths||''}><option value="">Any</option>{[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n}+</option>)}</select></label>
     <label>Minimum property size (m²)<input name="min_size" type="number" min="1" max="100000000" defaultValue={filters.min_size||''} placeholder="Any size"/></label>
     <label>Verified availability<select name="availability" defaultValue={filters.availability}><option value="">Any verified status</option><option value="available">Available</option><option value="under_offer">Under Offer</option><option value="reserved">Reserved</option><option value="sold">Sold</option><option value="rented">Rented</option></select></label>
    </div>
   </details>
   <div className="mk-search-bottom"><span>Search only verified, published listing details.</span><Link href="/properties">Clear all filters ×</Link></div>
  </form>
  <div className="mk-title-row"><div><small>PUBLISHED INVENTORY</small><h2>Discover opportunities</h2><p>{count?'Showing '+start+'–'+end+' of '+count.toLocaleString('en-NG')+' published properties':'No matching published properties'}</p></div><div className="mk-tools"><span>Sort:</span><form action="/properties" method="get"><input type="hidden" name="purpose" value={filters.purpose}/>{filters.state&&<input type="hidden" name="state" value={filters.state}/>}<input type="hidden" name="type" value={filters.type}/><input type="hidden" name="city" value={filters.city}/><input type="hidden" name="query" value={filters.query}/><input type="hidden" name="lga" value={filters.lga}/><input type="hidden" name="area" value={filters.area}/><input type="hidden" name="beds" value={filters.beds||""}/><input type="hidden" name="baths" value={filters.baths||""}/><input type="hidden" name="min_size" value={filters.min_size||""}/><input type="hidden" name="availability" value={filters.availability}/><input type="hidden" name="min" value={filters.min||""}/><input type="hidden" name="max" value={filters.max||""}/><select name="sort" defaultValue={filters.sort} aria-label="Sort properties"><option value="newest">Latest</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option></select><button type="submit">Apply</button></form></div></div>
  <div className="mk-property-grid">{error||!rows.length?<div className="mk-blank"><h3>{error?'Listing information unavailable':'No properties match your filters'}</h3><p>{error||'Try another location, budget or property type. Only approved published listings appear here.'}</p><Link href="/properties" className="mk-btn">Explore all listings ↗</Link></div>:rows.map(v=><article className="mk-card" key={v.id}><div className="mk-photo"><span>PUBLISHED</span></div><div className="mk-card-body"><h3>{v.title}</h3><p>⌖ {[v.estates?.city,v.estates?.state].filter(Boolean).join(', ')||'Location on enquiry'}</p><p style={{textTransform:'capitalize'}}>{v.property_type} · {v.estates?.name||'Landshop'}{v.bedrooms!=null?' · '+v.bedrooms+' beds':''}{v.bathrooms!=null?' · '+v.bathrooms+' baths':''}{v.availability?' · '+v.availability.replaceAll('_',' '):''}</p><strong>{money(v.amount_kobo)}</strong><div className="mk-card-foot"><span>Ref: {v.id.slice(0,8).toUpperCase()}</span><Link href={'/properties/'+v.id}>View Property ↗</Link></div></div></article>)}</div>
  {count>PAGE_SIZE&&<nav className="mk-pagination" aria-label="Property pages">{page>1&&<Link href={marketHref(filters,{page:page-1})}>←</Link>}{Array.from({length:Math.min(7,pages)},(_,i)=>paginationStart+i).filter(p=>p<=pages).map(p=><Link key={p} href={marketHref(filters,{page:p})} className={p===page?'selected':''} aria-current={p===page?'page':undefined}>{p}</Link>)}{page<pages&&<Link href={marketHref(filters,{page:page+1})}>→</Link>}</nav>}
  <div className="mk-utility"><article><small>PROPERTY GUIDANCE</small><h2>Know your property before committing.</h2><p>Independently verify title, availability, pricing and authorized payment terms. Private legal evidence is never published through this marketplace.</p><Link href="/insights" className="mk-btn">Read property guides ↗</Link></article><article><small>LOCATION</small><h2>Find homes and land across Nigeria.</h2><p>Map markers will display when verified and approved coordinates are available. No fabricated property pins or addresses are shown.</p><Link href="/contact">Ask about an estate →</Link></article></div>
  <MarketFooter/></div></main>;
}
