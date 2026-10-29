
'use client';
import {useMemo,useState} from 'react';
import {money} from '../lib/marketplace';
export default function MortgageEstimator({priceKobo}:{priceKobo:number|null}){
 const [deposit,setDeposit]=useState(20),[rate,setRate]=useState(12),[term,setTerm]=useState(15);
 const amount=priceKobo&&priceKobo>0?priceKobo/100:0;
 const calc=useMemo(()=>{const principal=amount*(1-deposit/100),months=term*12,monthly=rate/1200;return months>0&&principal>0?(monthly>0?principal*monthly/(1-Math.pow(1+monthly,-months)):principal/months):0},[amount,deposit,rate,term]);
 return <div className="mk-calc"><label>Initial equity (%)<input type="number" min={0} max={95} value={deposit} onChange={e=>setDeposit(Math.max(0,Math.min(95,Number(e.target.value)||0)))}/></label><label>Illustrative annual interest (%)<input type="number" min={0} max={50} step=".5" value={rate} onChange={e=>setRate(Math.max(0,Math.min(50,Number(e.target.value)||0)))}/></label><label>Repayment term (years)<input type="number" min={1} max={35} value={term} onChange={e=>setTerm(Math.max(1,Math.min(35,Number(e.target.value)||1)))}/></label><div><small>Estimated monthly payment</small><div className="mk-calc-output">{amount?money(Math.round(calc*100)):'Price required'}</div></div><p className="mk-legal-note">Illustration only. Rates, fees, equity requirements and actual loan approval depend on an approved lending institution. This is not a credit offer.</p></div>
}
