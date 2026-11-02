import FinancePlanner from '../../components/FinancePlanner';
import {cleanFilters,type Params} from '../../lib/marketplace';
import '../calculators/finance-planner.css';
export const metadata={title:'Investment Calculator | Landshop Nigeria',description:'Estimate rental yields and scenario returns using your own assumptions, property budget and selected Nigerian location.'};
export default async function InvestmentCalculator({searchParams}:{searchParams:Promise<Params>}){
 const filters=cleanFilters(await searchParams);
 return <FinancePlanner kind="investment" state={filters.state} propertyType={filters.type} budget={filters.max}/>;
}
