import {notFound} from 'next/navigation';
import LandshopPlanPage,{isPlanName} from '../../../components/LandshopPlanPage';
const descriptions:Record<string,string>={
 develop:'Explore Landshop Develop property acquisition options, available estates and the steps to owning land or a home in Nigeria.',
 incubate:'Explore Landshop Incubate property participation options, understand the structure and review terms before registering interest.',
 grow:'Compare Landshop Grow home financing pathways, including Beta Mortgage and Mortgage Xtra, and request an eligibility review.',
 devpro:'Explore Landshop DevPro estate infrastructure finance enquiries for eligible drainage, roads, fencing and infrastructure levies in Nigeria.',
 estatepro:'Explore Landshop EstatePro construction finance enquiries for eligible property subscribers ready to build in Nigeria.'
};
export async function generateMetadata({params}:{params:Promise<{product:string}>}){
 const {product}=await params;
 if(!isPlanName(product))return {title:'Landshop Products',robots:{index:false}};
 const title=product[0].toUpperCase()+product.slice(1)+' | Landshop Nigeria';
 const description=descriptions[product];
 const canonical='/plans/'+product;
 return {title,description,alternates:{canonical},openGraph:{title,description,url:'https://www.landshopnigeria.com'+canonical}};
}
export default async function Plan({params}:{params:Promise<{product:string}>}){const {product}=await params;if(!isPlanName(product))notFound();return <LandshopPlanPage product={product}/>;}
