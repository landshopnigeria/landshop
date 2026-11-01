'use client';
import {useMemo,useState} from 'react';
export default function MortgageCalculator(){
 const [principal,setPrincipal]=useState('12000000');
 const [years,setYears]=useState('15');
 const [rate,setRate]=useState('12');
 const [mode,setMode]=useState<'loan'|'mortgage'>('mortgage');
 const monthly=useMemo(()=>{
  const p=Number(principal),annual=Number(rate),n=Number(years)*12;
  if(!Number.isFinite(p)||!Number.isFinite(annual)||!Number.isFinite(n)||p<=0||annual<0||n<1||n>600)return null;
  const r=annual/1200;
  if(r===0)return p/n;
  return p*r/(1-Math.pow(1+r,-n));
 },[principal,rate,years]);
 const money=(n:number)=>new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0}).format(n);
 return <section className="ls26-panel ls26-mortgage" aria-labelledby="ls26-calc-title">
  <div className="ls26-panel-heading"><h3 id="ls26-calc-title"><span aria-hidden="true">▦</span> Mortgage Calculator</h3></div>
  <div className="ls26-switch" role="group" aria-label="Calculator type">
   <button type="button" aria-pressed={mode==='loan'} className={mode==='loan'?'active':''} onClick={()=>setMode('loan')}>Loan</button>
   <button type="button" aria-pressed={mode==='mortgage'} className={mode==='mortgage'?'active':''} onClick={()=>setMode('mortgage')}>Mortgage</button>
  </div>
  <label>Loan amount (₦)<input type="number" min="1" max="100000000000" value={principal} onChange={e=>setPrincipal(e.target.value)} inputMode="decimal"/></label>
  <label>Tenor (years)<select value={years} onChange={e=>setYears(e.target.value)}>{[1,2,3,5,10,15,20,25,30].map(n=><option key={n} value={n}>{n} years</option>)}</select></label>
  <label>Annual interest rate (%)<input type="number" min="0" max="100" step=".1" value={rate} onChange={e=>setRate(e.target.value)} inputMode="decimal"/></label>
  <div className="ls26-calculation" aria-live="polite"><small>Estimated monthly repayment</small><strong>{monthly===null?'Enter valid figures':money(monthly)}</strong></div>
  <p className="ls26-note">{mode==='mortgage'?'Mortgage':'Loan'} illustration only. The rate is an editable example, not a lender quote, approved facility, or investment return. Fees and affordability checks are excluded.</p>
 </section>;
}
