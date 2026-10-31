import Link from 'next/link';
import {landshopProductCards} from '../lib/landshop-brand-media';
export default function LandshopProductCards(){
 return <div className="v22-products ls27-product-grid" aria-label="Five Landshop property products">
 {landshopProductCards.map(item=><article className="v22-product ls27-product-card" key={item.slug}>
  <Link href={item.href} className="ls27-product-brand" aria-label={'Explore '+item.name}>
   <img className={item.iconOnly?'ls27-product-logo ls27-icon-only':'ls27-product-logo'} src={item.logo} alt={item.name+' product identity'} loading="lazy" decoding="async"/>
  </Link>
  <div className="v22-product-body ls27-product-copy">
   <small>{item.category}</small><h3>{item.name}</h3><p>{item.description}</p>
   <Link href={item.href} className="v22-text-link">Explore More <span aria-hidden="true">↗</span></Link>
  </div>
 </article>)}
 </div>;
}
