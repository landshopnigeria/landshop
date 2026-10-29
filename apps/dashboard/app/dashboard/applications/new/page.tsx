import {redirect} from 'next/navigation';
import {requireApprovedUser} from '../../../../lib/auth';
export const dynamic='force-dynamic';
export default async function NewApplication(){
 await requireApprovedUser();
 redirect('https://portal.landshopnigeria.com/applications');
}