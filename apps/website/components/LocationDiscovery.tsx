'use client';
import {useRef,useState,type FormEvent} from 'react';
import {useRouter} from 'next/navigation';
import ApprovedArrow from './ApprovedArrow';
import {landshopLocations} from '../lib/v22-locations';
import {NIGERIA_STATES} from '../lib/marketplace';

type Goal='browse'|'investment'|'mortgage'|'loan';
type Defaults={state:string;type:string;query:string;city:string;lga:string;area:string;min:number;max:number;bedrooms:number;bathrooms:number;minsize:number;availability:string;collection:string;purpose:string};
type Props={initial:Defaults;initialGoal?:Goal};
const fieldNames=['query','state','city','lga','area','type','min','max','bedrooms','bathrooms','minsize','availability','collection'] as const;
const goals:{value:Goal;label:string;note:string}[]=[
 {value:'browse',label:'Find properties',note:'Verified listings'},
 {value:'investment',label:'Investment',note:'Estimate returns'},
 {value:'mortgage',label:'Mortgage',note:'Estimate repayments'},
 {value:'loan',label:'Loan',note:'Estimate instalments'}
];
const destinations:Record<Exclude<Goal,'browse'>,string>={
 investment:'/investment-calculator',
 mortgage:'/mortgage-calculator',
 loan:'/loan-calculator'
};

export default function LocationDiscovery({initial,initialGoal='browse'}:Props){
 const router=useRouter();
 const formRef=useRef<HTMLFormElement>(null);
 const [goal,setGoal]=useState<Goal>(initialGoal);
 const [purpose,setPurpose]=useState(initial.purpose||'Buy');
 const [state,setState]=useState(initial.state);
 const [hint,setHint]=useState('');
 const [advanced,setAdvanced]=useState(false);
 function destination(chosenState?:string){
  const form=formRef.current;
  if(!form)return;
  const data=new FormData(form);
  const query=new URLSearchParams();
  for(const name of fieldNames){
   const value=String(data.get(name)||'').trim();
   if(value)query.set(name,value);
  }
  if(chosenState){query.set('state',chosenState);setState(chosenState);}
  if(purpose!=='Buy')query.set('purpose',purpose);
  else query.delete('purpose');
  if(purpose==='Sell'){window.location.assign('https://portal.landshopnigeria.com');return;}
  // Location refines the request but never blocks an illustrative calculator.
  // Users may estimate costs before deciding which state to explore.
  setHint('');
  const path=goal==='browse'?'/properties':destinations[goal];
  router.push(path+'?'+query.toString());
 }
 const submit=(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();destination();};
 return <main className="lsloc-page">
  <div className="lsloc-shell">
   <form ref={formRef} onSubmit={submit} className="lsloc-filter" role="search" aria-label="Find Landshop properties by location">
    <div className="lsloc-heading"><span className="lsloc-eyebrow">PROPERTY FILTER</span><h1>Find your property.</h1></div>
    <div className="lsloc-tabs" role="group" aria-label="Property transaction">
     {['Buy','Sell','Rent','Shortlet'].map(item=><button type="button" key={item} className={purpose===item?'active':''} aria-pressed={purpose===item} onClick={()=>setPurpose(item)}>{item}</button>)}
    </div>
    <div className="lsloc-fields">
     <label>Location or keyword<input name="query" defaultValue={initial.query} maxLength={80} placeholder="Estate, city or landmark"/></label>
     <label>State / FCT<select name="state" value={state} onChange={e=>{setState(e.target.value);setHint('');}}><option value="">Select a state</option>{NIGERIA_STATES.map(item=><option key={item} value={item}>{item}</option>)}</select></label>
     <label>Property type<select name="type" defaultValue={initial.type}><option value="">All property types</option><option value="land">Land</option><option value="apartment">Apartment</option><option value="house">House</option><option value="commercial">Commercial</option></select></label>
     <label>Minimum price (₦)<input type="number" name="min" min="0" max="1000000000000" step="1" inputMode="numeric" defaultValue={initial.min||''} placeholder="Minimum budget"/></label>
     <label>Maximum price (₦)<input type="number" name="max" min="0" max="1000000000000" step="1" inputMode="numeric" defaultValue={initial.max||''} placeholder="Maximum budget"/></label>
    </div>
    <button type="button" className="lsloc-advanced-toggle" aria-expanded={advanced} onClick={()=>setAdvanced(x=>!x)}>{advanced?'Hide advanced filters':'More property filters'} <span aria-hidden="true">{advanced?'↑':'↓'}</span></button>
    <div className={'lsloc-advanced'+(advanced?' is-open':'')} hidden={!advanced}>
     <label>City<input name="city" defaultValue={initial.city} maxLength={60} placeholder="City or town"/></label>
     <label>Local government<input name="lga" defaultValue={initial.lga} maxLength={60} placeholder="LGA"/></label>
     <label>Area / Estate<input name="area" defaultValue={initial.area} maxLength={70} placeholder="Area or estate"/></label>
     <label>Bedrooms<select name="bedrooms" defaultValue={String(initial.bedrooms||'')}><option value="">Any</option>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n}+</option>)}</select></label>
     <label>Bathrooms<select name="bathrooms" defaultValue={String(initial.bathrooms||'')}><option value="">Any</option>{[1,2,3,4].map(n=><option key={n} value={n}>{n}+</option>)}</select></label>
     <label>Minimum size (m²)<input name="minsize" type="number" min="0" step="1" max="100000000" defaultValue={initial.minsize||''}/></label>
     <label>Availability<select name="availability" defaultValue={initial.availability}><option value="">Any status</option><option value="available">Available</option><option value="off_plan">Off-plan</option><option value="completed">Completed</option></select></label>
     <label>Collection<select name="collection" defaultValue={initial.collection}><option value="">All collections</option><option value="Prime">Prime</option><option value="Luxury">Luxury</option></select></label>
    </div>
    <div className="lsloc-goal-title">What would you like to do next?</div>
    <div className="lsloc-goals" role="group" aria-label="Select the next step">
     {goals.map(item=><button key={item.value} type="button" className={goal===item.value?'selected':''} aria-pressed={goal===item.value} onClick={()=>{setGoal(item.value);setHint('');}}><strong>{item.label}</strong><small>{item.note}</small></button>)}
    </div>
    <div className="lsloc-bottom">
     <span>Continue directly, or choose a state below to include its location in your next step.</span>
     <button type="submit" className="lsloc-submit">{goal==='browse'?'Search properties':goal==='investment'?'Open investment calculator':goal==='mortgage'?'Open mortgage calculator':'Open loan calculator'} <span aria-hidden="true"><ApprovedArrow/></span></button>
    </div>
    {hint&&<p className="lsloc-hint" role="status">{hint}</p>}
   </form>
   <section className="lsloc-states" aria-labelledby="lsloc-states-title">
    <div className="lsloc-state-heading"><h2 id="lsloc-states-title">Locations.</h2><span>Choose a state to continue with your selected criteria.</span></div>
    <div className="lsloc-state-grid">
     {landshopLocations.map(location=><button type="button" className={'lsloc-state'+(state===location.state?' chosen':'')} key={location.slug} onClick={()=>destination(location.state)} aria-label={'Use selected filters for '+location.name}>
      <small>PROPERTY LOCATION</small><strong>{location.name}</strong><span>{goal==='browse'?'View matching properties':goal==='investment'?'Investment estimate':goal==='mortgage'?'Mortgage estimate':'Loan estimate'} <b aria-hidden="true"><ApprovedArrow/></b></span>
     </button>)}
    </div>
    <p className="lsloc-note">Search results include only approved published properties. Calculator estimates use your assumptions and are not financing offers or guaranteed returns.</p>
   </section>
  </div>
 </main>;
}
