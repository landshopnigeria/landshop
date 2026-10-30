import {notFound} from 'next/navigation';
import LandshopPlanPage,{isPlanName} from '../../../components/LandshopPlanPage';
export async function generateMetadata({params}:{params:Promise<{product:string}>}){const {product}=await params;return {title:isPlanName(product)?product[0].toUpperCase()+product.slice(1)+' | Landshop Nigeria':'Landshop Products',robots:isPlanName(product)?undefined:{index:false}};}
export default async function Plan({params}:{params:Promise<{product:string}>}){const {product}=await params;if(!isPlanName(product))notFound();return <LandshopPlanPage product={product}/>;}
