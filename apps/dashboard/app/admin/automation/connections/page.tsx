import Link from 'next/link';
import {requireLandshopStaff} from '../../../../lib/admin-access';
export const dynamic='force-dynamic';
export default async function Connections(){
 await requireLandshopStaff(['owner','ceo','founder','admin','technology_officer','technology_consultant']);
 const key=Boolean(process.env.LANDSHOP_OPENAI_API_KEY||process.env.OPENAI_API_KEY);
 const model=Boolean(process.env.LANDSHOP_WORKFLOW_AI_MODEL?.match(/^[a-zA-Z0-9._:-]{1,100}$/));
 return <main style={{padding:'clamp(18px,4vw,48px)',maxWidth:1100}}><Link href="/admin/automation">← Workflow studio</Link><h1>Automation connection status</h1><p>Current application server configuration. Credentials are never displayed.</p><section><h2>AI workflow planning</h2><p>API key: <strong>{key?'Configured':'Setup required'}</strong> · Model: <strong>{model?'Configured':'Setup required'}</strong></p><p>{key&&model?'AI drafting is available for provider verification when you generate a workflow.':'Configure LANDSHOP_OPENAI_API_KEY and LANDSHOP_WORKFLOW_AI_MODEL in the production server environment.'} Generated workflows require review and saving. This status does not verify provider quota.</p></section><section><h2>Email and messaging</h2><p>Templates, audience selection, approvals and delivery tracking are managed in Communications. Scheduled delivery runs in a separate worker; its credentials and enablement must be verified there.</p><Link href="/admin/communications">Open Communications →</Link></section><section><h2>Social publishing</h2><p>Social workflow steps can be planned and edited. Live publishing requires authorized channel connections and a deployed executor. Workflow rehearsal does not publish posts or send messages.</p></section></main>;
}
