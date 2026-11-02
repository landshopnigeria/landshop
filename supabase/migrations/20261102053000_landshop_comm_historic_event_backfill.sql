-- Restore historic, verified customer actions to Landshop's private
-- communications ledger. No marketing permissions are inferred and
-- no outgoing message is enqueued. Idempotent and reversible from backups.
insert into public.landshop_comm_contacts
 (email,full_name,phone,product_interest,source,source_ref,marketing_consent,whatsapp_opt_in,sms_opt_in)
select lower(btrim(c.email)),nullif(btrim(c.full_name),''),
 nullif(btrim(c.phone),''),c.topic,'contact_enquiries',c.id,false,false,false
from public.contact_enquiries c
where c.consent is true and lower(btrim(c.email)) ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
on conflict (email) do nothing;

insert into public.landshop_comm_contacts
 (email,full_name,phone,product_interest,source,source_ref,marketing_consent,whatsapp_opt_in,sms_opt_in)
select lower(btrim(i.email)),nullif(btrim(i.full_name),''),
 nullif(btrim(i.phone),''),'Property Inspection','property_inspection_requests',i.id,false,false,false
from public.property_inspection_requests i
where i.consent is true and lower(btrim(i.email)) ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
on conflict (email) do nothing;

insert into public.landshop_comm_events
 (contact_id,event_type,product,source_type,source_id,stage,occurred_at)
select c.id,'contact_submitted',e.topic,'contact_enquiries',e.id,e.status,e.created_at
from public.contact_enquiries e
left join public.landshop_comm_contacts c on c.email=lower(btrim(e.email))
where e.consent is true
on conflict(source_type,source_id,event_type) do nothing;

insert into public.landshop_comm_events
 (contact_id,customer_user_id,event_type,product,source_type,source_id,stage,occurred_at)
select c.id,i.customer_user_id,'inspection_requested','Property Inspection',
 'property_inspection_requests',i.id,i.status,i.created_at
from public.property_inspection_requests i
left join public.landshop_comm_contacts c on c.email=lower(btrim(i.email))
where i.consent is true
on conflict(source_type,source_id,event_type) do nothing;

insert into public.landshop_comm_events
 (customer_user_id,event_type,product,source_type,source_id,stage,occurred_at)
select a.applicant_id,'application_received',a.kind,'applications',a.id,a.status,a.created_at
from public.applications a
on conflict(source_type,source_id,event_type) do nothing;

insert into public.landshop_comm_events
 (customer_user_id,event_type,product,source_type,source_id,stage,occurred_at)
select p.customer_id,'payment_verified',p.purpose,'landshop_payment_intents',p.id,'verified',p.verified_at
from public.landshop_payment_intents p
where p.verified_at is not null
on conflict(source_type,source_id,event_type) do nothing;

insert into public.landshop_comm_tasks(event_id,task_type,assigned_role)
select id,case event_type
 when 'contact_submitted' then 'customer_enquiry_followup'
 when 'inspection_requested' then 'inspection_coordination'
 when 'application_received' then 'application_review'
 else 'finance_reconciliation' end,
case event_type
 when 'application_received' then 'sales'
 when 'payment_verified' then 'finance'
 else 'customer_service' end
from public.landshop_comm_events
where event_type in ('contact_submitted','inspection_requested','application_received','payment_verified')
on conflict(event_id,task_type) do nothing;

create index if not exists landshop_comm_events_customer_idx
 on public.landshop_comm_events(customer_user_id,occurred_at desc)
 where customer_user_id is not null;
