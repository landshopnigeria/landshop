'use client';
import {useState} from 'react';
export default function LoanIllustrator({kind}:{kind:'devpro'|'estatepro'}){
 const [principal,setPrincipal]=useState('5000000');
 const [rate,setRate]=useState('');
 const [months,setMonths]=useState(kind==='devpro'?'36':'');
 const p=Number(principal),r=Number(rate)/1200,n=Number(months);
 const valid=Number.isFinite(p)&&p>0&&p<=10000000000&&rate.trim()!==''&&Number.isFinite(r)&&r>=0&&r<=0.1&&Number.isInteger(n)&&n>=1&&n<=360;
 const monthly=valid?(r===0?p/n:p*r/(1-Math.pow(1+r,-n))):null;
 const currency=(v:number)=>new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0}).format(v);
 return <aside className="ls26-loan" aria-labelledby="ls26-loan-title">
 <span className="ls26-eyebrow">PLANNING TOOL</span><h2 id="ls26-loan-title">Explore an illustrative repayment.</h2><p>Enter a possible loan amount, annual interest rate and repayment period. These are your assumptions, not approved lending terms.</p>
 <label>Loan amount (₦)<input type="number" min="1000" max="10000000000" step="1000" inputMode="numeric" value={principal} onChange={e=>setPrincipal(e.target.value)}/></label>
 <label>Annual interest rate (%)<input type="number" min="0" max="120" step="0.1" value={rate} placeholder="Enter a quoted rate" onChange={e=>setRate(e.target.value)}/></label>
 <label>Repayment term (months)<input type="number" min="1" max="360" step="1" value={months} placeholder="Enter loan term" onChange={e=>setMonths(e.target.value)}/></label>
 <div className="ls26-loan-result"><small>Illustrative monthly instalment</small><strong>{monthly!==null&&Number.isFinite(monthly)?currency(monthly):'Enter valid terms'}</strong>{monthly!==null&&Number.isFinite(monthly)&&<span>Estimated total: {currency(monthly*n)} · Interest: {currency(monthly*n-p)}</span>}</div>
 <p className="ls26-note">Illustration uses reducing-balance monthly amortisation. Actual eligibility, rates, fees, security, disbursement and repayment terms depend on the lender's written offer. This calculation is not a loan offer or approval.</p>
 </aside>;
}
