export default function Dashboard(){
return <main style={{fontFamily:'Arial,sans-serif',padding:45,color:'#063d35'}}>
<h1>Landshop Enterprise App</h1>
<p>This is an initial application shell; the protected dashboard must not be activated before cross-domain session validation and KYC/role enforcement.</p>
<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:18}}>
{['My Properties','Investments','Mortgage','Referrals','Staff & Attendance','Global Command Center'].map(t=><section key={t} style={{padding:25,border:'1px solid #dceae2',borderRadius:18}}><h2>{t}</h2><p>Access not yet enabled</p></section>)}
</div></main>}
