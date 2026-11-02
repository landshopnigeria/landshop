import ProductDetailRedesign from './ProductDetailRedesign';
export type PlanName='develop'|'incubate'|'grow'|'devpro'|'estatepro';
export function isPlanName(value:string):value is PlanName{return ['develop','incubate','grow','devpro','estatepro'].includes(value)}
export default function LandshopPlanPage({product}:{product:PlanName}){return <ProductDetailRedesign page={product}/>;}
