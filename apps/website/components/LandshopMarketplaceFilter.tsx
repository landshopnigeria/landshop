'use client';
import {useState,type FormEvent} from 'react';
import {useRouter} from 'next/navigation';
import SiteIcon from './SiteIcon';
import type {Filters} from '../lib/marketplace';

/** Uses the exact homepage search UI, rather than a second competing marketplace filter. */
const locations=['Lagos','Federal Capital Territory','Ogun','Oyo','Delta','Edo','Akwa Ibom','Anambra'];
const fields=['query','state','city','lga','area','type','min','max','bedrooms','bathrooms','minsize','availability','collection'] as const;
export default function LandshopMarketplaceFilter({initial}:{initial:Filters}){
 const [purpose,setPurpose]=useState(initial.purpose);
 const router=useRouter();
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(purpose==='Sell'){window.location.assign('https://portal.landshopnigeria.com');return;}
  const data=new FormData(event.currentTarget),query=new URLSearchParams({purpose});
  for(const field of fields){const value=String(data.get(field)||'').trim();if(value)query.set(field,value)}
  router.push('/properties?'+query.toString());
 }
 return <div className="ls-v23-filter-holder ls26-market-filter">
 <form className="glass-search ls-v23-property-filter" onSubmit={submit} role="search" aria-label="Search Landshop estates and properties">
  <div className="ls-v23-filter-head"><div className="ls-v23-filter-intro"><span aria-hidden="true" className="ls-v23-filter-indicator"/>Ready to find your property? Start here.</div>
    <div className="search-tabs ls-v23-search-tabs" role="group" aria-label="Property transaction">
     {['Buy','Sell','Rent','Shortlet'].map(p=><button type="button" key={p} className={p===purpose?'active':''} aria-pressed={p===purpose} onClick={()=>setPurpose(p)}>{p}</button>)}
    </div>
  </div>
  {purpose==='Sell'?<div className="landshop-sell-panel ls-v23-sell-panel"><div><strong>Ready to sell or list a property?</strong><p>Sign in to the secure Landshop portal to submit a property for verification before publication.</p></div><a className="primary" href="https://portal.landshopnigeria.com">Start Selling →</a></div>:<>
  <div className="ls-v23-form-grid">
   <label>Location or keyword<input name="query" defaultValue={initial.query} placeholder="Estate, location or keyword" maxLength={80}/></label>
   <label>State / FCT<select name="state" defaultValue={initial.state}><option value="">Select a listed location</option>{locations.map(s=><option key={s} value={s}>{s}</option>)}</select></label>
   <label>City / Local Government<input name="city" defaultValue={initial.city} placeholder="City or town" maxLength={60}/></label>
   <label>Area / Estate<input name="area" defaultValue={initial.area} placeholder="Area or estate" maxLength={70}/></label>
   <label>Property type<select name="type" defaultValue={initial.type}><option value="">Any type</option><option value="land">Land</option><option value="apartment">Apartment</option><option value="house">House</option><option value="commercial">Commercial</option></select></label>
   <label>Minimum price (₦)<input type="number" name="min" defaultValue={initial.min||''} min="0" max="1000000000000" step="1" placeholder="Min" inputMode="numeric"/></label>
   <label>Maximum price (₦)<input type="number" name="max" defaultValue={initial.max||''} min="0" max="1000000000000" step="1" placeholder="Max" inputMode="numeric"/></label>
   <label>Bedrooms<select name="bedrooms" defaultValue={String(initial.bedrooms||'')}><option value="">Any</option>{[1,2,3,4,5].map(n=><option value={n} key={n}>{n}+</option>)}</select></label>
   <label>Bathrooms<select name="bathrooms" defaultValue={String(initial.bathrooms||'')}><option value="">Any</option>{[1,2,3,4].map(n=><option value={n} key={n}>{n}+</option>)}</select></label>
   <label>Min. property size<input name="minsize" type="number" defaultValue={initial.minsize||''} min="0" max="100000000" step="1" placeholder="m²" inputMode="numeric"/></label>
   <label>Availability<select name="availability" defaultValue={initial.availability}><option value="">Any status</option><option value="available">Available</option><option value="off_plan">Off-plan</option><option value="completed">Completed</option></select></label>
   <label>More Filters<select name="collection" defaultValue={initial.collection}><option value="">All collections</option><option value="Prime">Prime</option><option value="Luxury">Luxury</option></select></label>
  </div>
  <div className="ls-v23-search-bottom"><span>Verified listings only · Search results use current Landshop property records.</span><button type="submit" className="primary"><SiteIcon name="search" size={20}/> Search Properties</button></div>
  </>}
 </form>
 </div>;
}
