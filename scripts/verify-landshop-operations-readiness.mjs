import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=(path)=>readFileSync(path,'utf8');
const screen=read('apps/dashboard/app/admin/operations/readiness/page.tsx');
const nav=read('apps/dashboard/app/admin/navigation.ts');
const migration=read('supabase/migrations/20261104074415_reconcile_resolved_internal_contact_notification_nov4.sql');

assert(screen.includes("requireLandshopStaff(['owner','ceo','founder','admin','technology_officer','technology_consultant'])"),
 'Only verified management members may read the consolidated readiness screen');
assert(screen.includes("index:false,follow:false"),'Private operational metrics must not be indexed');
for(const table of ['properties','estates','property_assets','property_showcase_media','property_showcase','automation_workflows','applications','contact_enquiries','audit_events']){
 assert(screen.includes("db.from('"+table+"')"),'Missing live evidence dataset: '+table);
}
assert(screen.includes('Internal notification reconciliation'),'Contact queue status must be shown');
assert(screen.includes('external'),'External messaging must not be falsely represented as delivered');
assert(screen.includes('/admin/properties/readiness'),'Property checklist must remain accessible');
assert(screen.includes('/admin/automation'),'Draft workflow authoring must remain accessible');
assert(screen.includes('https://portal.landshopnigeria.com/applications'),'Genuine customer application intake must remain accessible');
assert(nav.includes("['Operational readiness','/admin/operations/readiness','▥']"),'Readiness route must be reachable from the private Command Center');
assert(!/supabaseServiceRole|SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY/.test(screen),'Do not expose privileged credentials in the dashboard');
assert(!/\.insert\(|\.update\(|\.delete\(|\.rpc\(/.test(screen),'Readiness screen must be read-only');

for(const text of [
 "n.status='pending'",
 "n.event_type='landshop.contact.received'",
 'n.user_id IS NULL',
 'n.attempts=0',
 "c.status='resolved'",
 'c.assigned_to IS NOT NULL',
 "SET status='cancelled'",
 "'notification.internal_contact_cancelled'",
 "'external_delivery_occurred',false"
]) assert(migration.includes(text),'Outbox reconciliation must preserve safety predicate: '+text);
assert(!/SET status='delivered'|SEND|http_post|net\.http|TRUNCATE|DELETE FROM/i.test(migration),
 'Cancelled internal event must not be falsely delivered, deleted or sent');
console.log('PASS: Protected live operations screen, actual evidence links and read-only application/automation status.');
console.log('PASS: Superseded contact event is auditable, attempted zero deliveries and never claims external delivery.');
