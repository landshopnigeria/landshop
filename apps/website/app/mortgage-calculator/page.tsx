import FinancePlanner from '../../components/FinancePlanner';
import {cleanFilters,marketHref,type Params} from '../../lib/marketplace';
import '../calculators/finance-planner.css';
export const metadata={title:'Mortgage Calculator | Landshop Nigeria',description:'Calculate an illustrative mortgage payment with your property price, equity contribution, annual rate and repayment period.'};
export default async function MortgageCalculator({searchParams}:{searchParams:Promise<Params>}){
 const filters=cleanFilters(await searchParams);
 return <FinancePlanner kind="mortgage" state={filters.state} propertyType={filters.type} budget={filters.max} criteriaQuery={marketHref(filters).split('?')[1]||''}/>;
}
