import FinancePlanner from '../../components/FinancePlanner';
import {cleanFilters,marketHref,type Params} from '../../lib/marketplace';
import '../calculators/finance-planner.css';
export const metadata={title:'Loan Calculator | Landshop Nigeria',description:'Estimate an illustrative loan instalment, total interest and repayment using your own rate and term.'};
export default async function LoanCalculator({searchParams}:{searchParams:Promise<Params>}){
 const filters=cleanFilters(await searchParams);
 return <FinancePlanner kind="loan" state={filters.state} propertyType={filters.type} budget={filters.max} criteriaQuery={marketHref(filters).split('?')[1]||''}/>;
}
