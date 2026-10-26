import { requireApprovedUser } from '../../../../lib/auth';
import ApplicationWizard from './wizard';

export const dynamic='force-dynamic';
export default async function NewApplication(){
  await requireApprovedUser();
  return <ApplicationWizard/>;
}
