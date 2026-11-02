import LandshopPlanPage from './LandshopPlanPage';
type Product='develop'|'incubate'|'grow';
export default function ProductPage({product}:{product:Product}){return <LandshopPlanPage product={product}/>;}
