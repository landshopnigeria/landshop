import {requireLandshopStaff} from '../../../lib/admin-access';
import SurveyManager from './SurveyManager';
export const dynamic='force-dynamic';
export default async function Page(){const {db}=await requireLandshopStaff(['owner','ceo','founder','admin','technology_officer','technology_consultant']);const [s,r]=await Promise.all([db.from('landshop_client_surveys').select('*').order('created_at',{ascending:false}).limit(100),db.from('landshop_survey_responses').select('*').order('created_at',{ascending:false}).limit(500)]);return <SurveyManager initial={s.data||[]} responses={r.data||[]}/>}
