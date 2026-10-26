'use client';
import {useMemo,useState} from 'react';
const fmt=(n:number)=>Number.isFinite(n)?new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0}).format(n):'—';
export default function MortgageCalculator(){
 const [price,setPrice]=useState('50000000'),[equity,setEquity]=useState('30'),[rate,setRate]=useState(''),[years,setYears]=useState('15'),[fees,setFees]=useState('0'),[annualInsurance,setAnnualInsurance]=useState('0'),[income,setIncome]=useState('');
 const [schedule,setSchedule]=useState(false);
 const data=useMemo(()=>{
  const p=Number(price),e=Number(equity),r=Number(rate),term=Number(years);
  if(!Number.isFinite(p)||p<=0||p>1e12||!Number.isFinite(e)||e<0||e>=100||rate.trim()===''||!Number.isFinite(r)||r<0||r>100||!Number.isInteger(term)||term<1||term>40)return null;
  const loan=p*(1-e/100),n=term*12,m=r/1200;
  const monthly=m===0?loan/n:loan*m/(1-Math.pow(1+m,-n));
  if(!Number.isFinite(monthly))return null;
  const deposit=p-loan;let balance=loan;const rows=[];
  for(let i=1;i<=n;i++){const interest=balance*m;const principal=Math.min(balance,monthly-interest);balance=Math.max(0,balance-principal);rows.push({month:i,payment:monthly,principal,interest,balance})}
  return {monthly,loan,deposit,interest:monthly*n-loan,paymentTotal:monthly*n,
   upfront:deposit+Math.max(0,Number(fees)||0),
   fullMonthly:monthly+Math.max(0,Number(annualInsurance)||0)/12,
   ratio:Number(income)>0?monthly/Number(income)*100:null,rows};
 },[price,equity,rate,years,fees,annualInsurance,income]);
 const field=(name:string,value:string,set:(v:string)=>void,min=0,max?:number)=><label style={{display:'grid',gap:7,fontSize:12,fontWeight:700,color:'#173e32'}}>{name}<input type="number" min={min} max={max} step="any" inputMode="decimal" value={value} onChange={e=>set(e.target.value)} style={{padding:14,border:'1px solid #d3e7da',borderRadius:12,fontSize:15,color:'#123c30',background:'#fff'}}/></label>;
 function download(){
  if(!data)return;
  const lines=['Month,Payment_NGN,Principal_NGN,Interest_NGN,Balance_NGN',...data.rows.map(x=>[x.month,x.payment.toFixed(2),x.principal.toFixed(2),x.interest.toFixed(2),x.balance.toFixed(2)].join(','))];
  const url=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/csv'}));const a=document.createElement('a');a.href=url;a.download='Landshop_Mortgage_Estimate.csv';a.click();URL.revokeObjectURL(url);
 }
 return <main style={{background:'#f2f9f5',minHeight:'100vh',padding:'clamp(20px,5vw,70px)',fontFamily:'Arial,sans-serif',color:'#113b30'}}>
 <a href="/" style={{color:'#008c6e'}}>← Landshop Customer Portal</a><header style={{maxWidth:1150,margin:'25px auto 30px'}}><span style={{letterSpacing:3,fontSize:11,fontWeight:900,color:'#098e73'}}>LANDSHOP · GROW</span><h1 style={{fontSize:'clamp(34px,4.5vw,58px)',margin:'10px 0'}}>Mortgage & repayment calculator</h1><p>Calculate an illustrative repayment using a disclosed annual rate, equity contribution and term. This is not a credit decision or lender quote.</p></header>
 <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,430px),1fr))',gap:24,maxWidth:1150,margin:'auto'}}>
  <section style={{background:'white',borderRadius:22,padding:'clamp(20px,4vw,32px)',border:'1px solid #deeee4',boxShadow:'0 20px 70px #073c2610'}}>
   <h2>Financing assumptions</h2><div style={{display:'grid',gap:16,gridTemplateColumns:'repeat(2,minmax(0,1fr))'}}>
    {field('Property value (₦)',price,setPrice)}
    {field('Equity contribution (%)',equity,setEquity,0,99)}
    {field('Annual rate (%) — enter verified APR',rate,setRate,0,100)}
    {field('Loan tenure (years)',years,setYears,1,40)}
    {field('Upfront fees (₦)',fees,setFees)}
    {field('Annual insurance (₦)',annualInsurance,setAnnualInsurance)}
    {field('Monthly household income (₦)',income,setIncome)}
   </div>
   <p style={{background:'#fff7e9',borderRadius:12,padding:15,color:'#886029',fontSize:12,lineHeight:1.6}}>Enter the current lender's rate. Source forms historically mention equity and NHF, but availability, fees, rates and qualifications must be confirmed with the financing partner.</p>
  </section>
  <section style={{background:'#063f35',color:'white',borderRadius:22,padding:'clamp(23px,4vw,38px)'}}>
   <span style={{textTransform:'uppercase',letterSpacing:2,fontSize:11}}>Illustrative monthly payment</span>
   <h2 style={{fontSize:'clamp(38px,5vw,64px)',margin:'12px 0 24px'}}>{data?fmt(data.fullMonthly):'Enter annual rate'}</h2>
   <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:15}}>
    {data?[['Loan principal',fmt(data.loan)],['Equity deposit',fmt(data.deposit)],['Interest over term',fmt(data.interest)],['Upfront costs + equity',fmt(data.upfront)],['Total loan repayment',fmt(data.paymentTotal)],['Loan to income ratio',data.ratio===null?'—':data.ratio.toFixed(1)+'%']].map(([k,v])=><div key={k} style={{padding:'13px 0',borderBottom:'1px solid #396e60'}}><small style={{display:'block',color:'#afd2c5'}}>{k}</small><strong>{v}</strong></div>):<p style={{gridColumn:'1/-1'}}>A verified annual percentage rate is required to show a repayment estimate.</p>}
   </div>
   <p style={{fontSize:12,color:'#b2d4c8',lineHeight:1.7}}>Calculated with monthly amortization and fixed nominal APR, excluding variable lender charges unless entered. Annual insurance is allocated monthly. Not an offer of financing.</p>
   <button disabled={!data} onClick={()=>setSchedule(x=>!x)} style={{background:'white',color:'#075a45',padding:13,border:0,borderRadius:12,marginRight:10}}>{schedule?'Hide':'Show'} amortization schedule</button>
   <button disabled={!data} onClick={download} style={{background:'#078f71',color:'white',padding:13,border:0,borderRadius:12}}>Export CSV</button>
  </section>
 </div>
 {data&&schedule&&<section style={{maxWidth:1150,margin:'25px auto',background:'white',borderRadius:20,padding:22}}>
 <h2>Monthly amortization schedule</h2><div style={{maxHeight:450,overflow:'auto'}}><table style={{borderCollapse:'collapse',width:'100%',minWidth:680}}><thead><tr>{['Month','Payment','Principal','Interest','Remaining balance'].map(h=><th key={h} style={{textAlign:'left',padding:13,borderBottom:'1px solid #dceae1'}}>{h}</th>)}</tr></thead><tbody>{data.rows.map(x=><tr key={x.month}>{[x.month,fmt(x.payment),fmt(x.principal),fmt(x.interest),fmt(x.balance)].map((v,i)=><td key={i} style={{padding:12,borderBottom:'1px solid #edf3ef'}}>{v}</td>)}</tr>)}</tbody></table></div></section>}
 </main>;
}