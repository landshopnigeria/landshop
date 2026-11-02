'use client';
import {useMemo,useState} from 'react';
import Link from 'next/link';
import ApprovedArrow from './ApprovedArrow';
type Kind='investment'|'mortgage'|'loan';
type Props={kind:Kind;state?:string;propertyType?:string;budget?:number;criteriaQuery?:string};
const money=(n:number)=>new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0}).format(n);
const percent=(n:number)=>n.toLocaleString('en-NG',{maximumFractionDigits:2})+'%';
const finite=(s:string)=>s.trim()!==''&&Number.isFinite(Number(s))?Number(s):null;
const safeMoney=(value:string)=>{const n=finite(value);return n!==null&&n>=0&&n<=1e12?n:null};
function monthlyRepayment(principal:number,annualRate:number,months:number){
 const r=annualRate/1200;
 return r===0?principal/months:principal*r/(1-Math.pow(1+r,-months));
}
export default function FinancePlanner({kind,state='',propertyType='',budget,criteriaQuery=''}:Props){
 const [purchase,setPurchase]=useState(budget&&budget>0?String(budget):'');
 const [equity,setEquity]=useState('20');
 const [principal,setPrincipal]=useState(budget&&budget>0?String(budget):'');
 const [rate,setRate]=useState('');
 const [term,setTerm]=useState(kind==='loan'?'36':'180');
 const [upfront,setUpfront]=useState('0');
 const [monthlyExtra,setMonthlyExtra]=useState('0');
 const [annualRent,setAnnualRent]=useState('');
 const [annualCosts,setAnnualCosts]=useState('0');
 const [resale,setResale]=useState('');
 const [years,setYears]=useState('5');
 const [buyCosts,setBuyCosts]=useState('0');
 const [sellCosts,setSellCosts]=useState('0');
 const data=useMemo(()=>{
  if(kind==='investment'){
   const price=safeMoney(purchase),rent=safeMoney(annualRent),cost=safeMoney(annualCosts);
   const buy=safeMoney(buyCosts),sell=safeMoney(sellCosts);
   const exit=safeMoney(resale),hold=finite(years);
   if(price===null||price<=0)return null;
   const netIncome=rent===null||cost===null?null:rent-cost;
   const grossYield=rent===null?null:100*rent/price;
   const netYield=netIncome===null?null:100*netIncome/price;
   const validHold=hold!==null&&Number.isInteger(hold)&&hold>=1&&hold<=50;
   const roi=validHold&&exit!==null&&exit>0&&netIncome!==null&&buy!==null&&sell!==null?
    100*(netIncome*(hold||0)+exit-price-buy-sell)/(price+buy):null;
   return {kind,price,grossYield,netYield,netIncome,roi,hold:validHold?hold:null};
  }
  const base=kind==='mortgage'?safeMoney(purchase):safeMoney(principal);
  const annual=finite(rate),months=finite(term),fees=safeMoney(upfront),extras=safeMoney(monthlyExtra),depositPct=finite(equity);
  if(base===null||base<=0||annual===null||annual<0||annual>100||months===null||!Number.isInteger(months)||months<1||months>480||fees===null||extras===null)return null;
  if(kind==='mortgage'&&(depositPct===null||depositPct<0||depositPct>=100))return null;
  const deposit=kind==='mortgage'?base*(depositPct||0)/100:0;
  const amount=base-deposit;
  const installment=monthlyRepayment(amount,annual,months);
  if(!Number.isFinite(installment)||installment<0)return null;
  return {kind,amount,deposit,installment,totalMonthly:installment+extras,totalInterest:installment*months-amount,repayment:installment*months,fees,extras,months};
 },[kind,purchase,equity,principal,rate,term,upfront,monthlyExtra,annualRent,annualCosts,resale,years,buyCosts,sellCosts]);
 const title=kind==='investment'?'Investment calculator':kind==='mortgage'?'Mortgage calculator':'Loan calculator';
 const description=kind==='investment'?'Model rental yield and a possible holding-period return using only the assumptions you enter.':kind==='mortgage'?'Estimate the equity contribution and monthly repayment for a property purchase.':'Estimate repayment instalments, total interest and overall loan costs.';
 const locationLabel=[state,propertyType&&propertyType.charAt(0).toUpperCase()+propertyType.slice(1)].filter(Boolean).join(' · ');
 const back=new URLSearchParams(criteriaQuery);
 if(state)back.set('state',state);
 if(propertyType)back.set('type',propertyType);
 if(budget)back.set('max',String(budget));
 back.set('goal',kind);
 const listingQuery=new URLSearchParams(back);
 listingQuery.delete('goal');
 const input=(label:string,value:string,set:(v:string)=>void,opts:{placeholder?:string;min?:number;max?:number;step?:string}={})=>
  <label key={label}>{label}<input type="number" inputMode="decimal" min={opts.min??0} max={opts.max??1000000000000} step={opts.step||'any'} placeholder={opts.placeholder||''} value={value} onChange={event=>set(event.target.value)}/></label>;
 return <main className="lsfin-page"><div className="lsfin-shell">
  <div className="lsfin-intro"><Link href={'/locations?'+back.toString()} className="lsfin-back"><ApprovedArrow direction="left"/> Back to property filter</Link><span className="lsfin-kicker">PROPERTY FINANCIAL PLANNING</span><h1>{title}</h1><p>{description}</p>{locationLabel&&<div className="lsfin-context">Property search: <strong>{locationLabel}</strong>{budget?<> · Working budget: <strong>{money(budget)}</strong></>:null}</div>}</div>
  <div className="lsfin-tabs" aria-label="Available calculators"><Link className={kind==='investment'?'active':''} href={'/investment-calculator?'+back.toString()}>Investment</Link><Link className={kind==='mortgage'?'active':''} href={'/mortgage-calculator?'+back.toString()}>Mortgage</Link><Link className={kind==='loan'?'active':''} href={'/loan-calculator?'+back.toString()}>Loan</Link></div>
  <div className="lsfin-layout">
   <section className="lsfin-panel"><h2>{kind==='investment'?'Investment assumptions':kind==='mortgage'?'Mortgage assumptions':'Loan assumptions'}</h2>
    <div className="lsfin-fields">
     {kind==='investment'?<>
      {input('Acquisition price (₦)',purchase,setPurchase,{placeholder:'Actual purchase price'})}
      {input('Annual rental income (₦)',annualRent,setAnnualRent,{placeholder:'Your annual rent estimate'})}
      {input('Annual running costs (₦)',annualCosts,setAnnualCosts)}
      {input('Holding period (years)',years,setYears,{min:1,max:50,step:'1'})}
      {input('Assumed resale price (₦)',resale,setResale,{placeholder:'Optional resale scenario'})}
      {input('Acquisition costs (₦)',buyCosts,setBuyCosts)}
      {input('Selling costs (₦)',sellCosts,setSellCosts)}
     </>:kind==='mortgage'?<>
      {input('Property price (₦)',purchase,setPurchase,{placeholder:'Enter property price'})}
      {input('Equity contribution (%)',equity,setEquity,{min:0,max:99.99})}
      {input('Annual interest rate (%)',rate,setRate,{placeholder:'Enter verified lender rate',min:0,max:100})}
      {input('Repayment term (months)',term,setTerm,{min:1,max:480,step:'1'})}
      {input('Upfront lender fees (₦)',upfront,setUpfront)}
      {input('Monthly additional costs (₦)',monthlyExtra,setMonthlyExtra)}
     </>:<>
      {input('Loan principal (₦)',principal,setPrincipal,{placeholder:'Loan amount'})}
      {input('Annual interest rate (%)',rate,setRate,{placeholder:'Enter a quoted annual rate',min:0,max:100})}
      {input('Repayment term (months)',term,setTerm,{min:1,max:480,step:'1'})}
      {input('Upfront loan fees (₦)',upfront,setUpfront)}
      {input('Monthly additional costs (₦)',monthlyExtra,setMonthlyExtra)}
     </>}
    </div>
    <p className="lsfin-assumption">{kind==='investment'?'No appreciation or investment return is assumed. Enter an optional resale price only if you want to model a hypothetical exit scenario.':'Enter a real quoted interest rate to calculate. Fees and extra charges are included only when you enter them. The calculation assumes a fixed annual nominal rate and monthly reducing-balance payments.'}</p>
   </section>
   <section className="lsfin-results" aria-live="polite"><span>ILLUSTRATIVE ESTIMATE</span>
    {kind==='investment'?data&&data.kind==='investment'?<>
     <div className="lsfin-primary"><small>Net annual rental yield</small><strong>{data.netYield===null?'Enter annual rent and costs':percent(data.netYield)}</strong></div>
     <div className="lsfin-stat"><span>Gross rental yield</span><strong>{data.grossYield===null?'Not entered':percent(data.grossYield)}</strong></div>
     <div className="lsfin-stat"><span>Annual net rental income</span><strong>{data.netIncome===null?'Not entered':money(data.netIncome)}</strong></div>
     <div className="lsfin-stat"><span>Holding period ROI, with resale</span><strong>{data.roi===null?'Enter an assumed resale price and annual income':percent(data.roi)}</strong></div>
    </>:<div className="lsfin-empty">Enter a valid acquisition price to start.</div>
    :data&&data.kind!=='investment'?<>
     <div className="lsfin-primary"><small>Estimated monthly outlay</small><strong>{money(data.totalMonthly)}</strong></div>
     <div className="lsfin-stat"><span>{kind==='mortgage'?'Mortgage principal':'Loan principal'}</span><strong>{money(data.amount)}</strong></div>
     {kind==='mortgage'&&<div className="lsfin-stat"><span>Equity contribution</span><strong>{money(data.deposit)}</strong></div>}
     <div className="lsfin-stat"><span>Interest over term</span><strong>{money(data.totalInterest)}</strong></div>
     <div className="lsfin-stat"><span>Principal + interest repayment</span><strong>{money(data.repayment)}</strong></div>
     <div className="lsfin-stat"><span>Upfront fees (excluded from monthly)</span><strong>{money(data.fees)}</strong></div>
    </>:<div className="lsfin-empty">Enter a valid amount, annual rate and repayment period to calculate.</div>}
    <p className="lsfin-disclaimer">{kind==='investment'?'Scenario only. Actual income, occupancy, expenses, resale prices and capital values may differ. No returns are guaranteed.':'Planning estimate only. This is not a lending offer, interest-rate quotation or eligibility decision. Confirm all terms directly with the lender.'}</p>
    <Link href={'/properties'+(listingQuery.size?'?'+listingQuery.toString():'')} className="lsfin-search">View verified properties <ApprovedArrow/></Link>
   </section>
  </div>
  {kind==='mortgage'&&<p className="lsfin-portal">For a detailed amortisation schedule, use the <a href="https://portal.landshopnigeria.com/calculator">existing Landshop customer portal calculator</a>.</p>}
 </div></main>;
}
