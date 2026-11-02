-- Landshop enterprise communication operations V3: private customer events, contacts,
-- review-only follow-ups, editable templates and import governance.
-- No provider dispatch or marketing sends are authorized by this migration.
create table if not exists public.landshop_comm_contacts (
 id uuid primary key default gen_random_uuid(),
 email text not null,
 full_name text,
 phone text,
 product_interest text,
 source text not null default 'staff_import',
 source_ref uuid,
 status text not null default 'active' check (status in ('active','suspended','archived')),
 marketing_consent boolean not null default false,
 whatsapp_opt_in boolean not null default false,
 sms_opt_in boolean not null default false,
 consent_at timestamptz,
 consent_evidence text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint landshop_comm_contacts_email_format check (email = lower(btrim(email)) and char_length(email) between 5 and 254 and email like '%@%.%'),
 constraint landshop_comm_contacts_provenance check (
  (not marketing_consent and not whatsapp_opt_in and not sms_opt_in)
  or (consent_at is not null and char_length(btrim(coalesce(consent_evidence,''))) between 12 and 500)
 )
);
create unique index if not exists landshop_comm_contacts_email_key on public.landshop_comm_contacts(email);
create index if not exists landshop_comm_contacts_status_idx on public.landshop_comm_contacts(status,updated_at desc);
create table if not exists public.landshop_comm_events (
 id uuid primary key default gen_random_uuid(),
 contact_id uuid references public.landshop_comm_contacts(id) on delete set null,
 customer_user_id uuid,
 event_type text not null check (char_length(event_type) between 3 and 80),
 product text,
 source_type text not null,
 source_id uuid not null,
 stage text,
 metadata jsonb not null default '{}'::jsonb,
 occurred_at timestamptz not null default now(),
 unique (source_type,source_id,event_type),
 constraint landshop_comm_event_meta_size check (pg_column_size(metadata) <= 4096)
);
create index if not exists landshop_comm_events_recent_idx on public.landshop_comm_events(occurred_at desc);
create index if not exists landshop_comm_events_contact_idx on public.landshop_comm_events(contact_id,occurred_at desc);
create table if not exists public.landshop_comm_tasks (
 id uuid primary key default gen_random_uuid(),
 event_id uuid not null references public.landshop_comm_events(id) on delete cascade,
 task_type text not null,
 status text not null default 'review_required' check(status in ('review_required','in_progress','completed','suspended','archived')),
 assigned_role text not null default 'customer_service',
 notes text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 updated_by uuid,
 unique(event_id,task_type)
);
create index if not exists landshop_comm_tasks_status_idx on public.landshop_comm_tasks(status,created_at desc);
create table if not exists public.landshop_comm_templates (
 id text primary key check (id ~ '^[A-Za-z][A-Za-z0-9_-]{1,30}$'),
 subject text not null check(char_length(subject) between 3 and 300),
 headline text not null check(char_length(headline) between 3 and 180),
 body text not null check(char_length(body) between 8 and 4000),
 whatsapp text not null default '',
 sms text not null default '',
 image_url text,
 state text not null default 'draft' check(state in ('draft','approved','suspended','archived')),
 change_note text,
 edited_by uuid,
 edited_at timestamptz not null default now(),
 constraint landshop_comm_template_photo check(image_url is null or (char_length(image_url) <= 400 and image_url ~ '^/media/[a-zA-Z0-9_./-]+[.]webp$'))
);
create table if not exists public.landshop_comm_import_audit (
 id uuid primary key default gen_random_uuid(),
 actor_id uuid not null,
 category text not null check(category in ('contacts','templates','workflow_drafts','exports')),
 action text not null,
 record_count integer not null default 0 check(record_count >= 0 and record_count <= 10000),
 created_at timestamptz not null default now()
);
-- All tables are private. Only verified management may read or change rows.
alter table public.landshop_comm_contacts enable row level security;
alter table public.landshop_comm_events enable row level security;
alter table public.landshop_comm_tasks enable row level security;
alter table public.landshop_comm_templates enable row level security;
alter table public.landshop_comm_import_audit enable row level security;
revoke all on public.landshop_comm_contacts,public.landshop_comm_events,
 public.landshop_comm_tasks,public.landshop_comm_templates,
 public.landshop_comm_import_audit from public,anon,authenticated;
grant select,insert,update,delete on public.landshop_comm_contacts to authenticated;
grant select on public.landshop_comm_events to authenticated;
grant select,update on public.landshop_comm_tasks to authenticated;
grant select,insert,update,delete on public.landshop_comm_templates to authenticated;
grant select,insert on public.landshop_comm_import_audit to authenticated;

create policy "verified_management_contacts_read" on public.landshop_comm_contacts
 for select to authenticated using (public.landshop_is_management((select auth.uid())));
create policy "verified_management_contacts_add" on public.landshop_comm_contacts
 for insert to authenticated with check (public.landshop_is_management((select auth.uid())));
create policy "verified_management_contacts_edit" on public.landshop_comm_contacts
 for update to authenticated
 using (public.landshop_is_management((select auth.uid())))
 with check (public.landshop_is_management((select auth.uid())));
create policy "verified_management_contacts_remove" on public.landshop_comm_contacts
 for delete to authenticated using
 (public.landshop_is_management((select auth.uid())) and status='archived');
create policy "verified_management_events_read" on public.landshop_comm_events
 for select to authenticated using (public.landshop_is_management((select auth.uid())));
create policy "verified_management_tasks_read" on public.landshop_comm_tasks
 for select to authenticated using (public.landshop_is_management((select auth.uid())));
create policy "verified_management_tasks_update" on public.landshop_comm_tasks
 for update to authenticated
 using (public.landshop_is_management((select auth.uid())))
 with check (public.landshop_is_management((select auth.uid())));
create policy "verified_management_templates_read" on public.landshop_comm_templates
 for select to authenticated using (public.landshop_is_management((select auth.uid())));
create policy "verified_management_templates_add" on public.landshop_comm_templates
 for insert to authenticated with check (public.landshop_is_management((select auth.uid())));
create policy "verified_management_templates_edit" on public.landshop_comm_templates
 for update to authenticated using (public.landshop_is_management((select auth.uid())))
 with check (public.landshop_is_management((select auth.uid())));
create policy "verified_management_templates_remove" on public.landshop_comm_templates
 for delete to authenticated using (public.landshop_is_management((select auth.uid())));
create policy "verified_management_audit_read" on public.landshop_comm_import_audit
 for select to authenticated using (public.landshop_is_management((select auth.uid())));
create policy "verified_management_audit_insert" on public.landshop_comm_import_audit
 for insert to authenticated with check (public.landshop_is_management((select auth.uid())) and actor_id=(select auth.uid()));

-- Only an event from a completed, server-verified business action creates a task.
create or replace function public.landshop_comm_capture_source()
returns trigger language plpgsql security definer set search_path=''
as $fn$
declare
 v_contact uuid;
 v_event uuid;
 v_email text;
 v_kind text;
 v_product text;
 v_stage text;
 v_customer uuid;
 v_role text;
 v_task text;
 v_type text := TG_TABLE_NAME;
begin
 if TG_OP='UPDATE' then
  if TG_TABLE_NAME='landshop_payment_intents' then
   if NEW.verified_at is null or OLD.verified_at is not distinct from NEW.verified_at then return NEW; end if;
  elsif TG_TABLE_NAME='property_inspection_requests' then
   if NEW.status is not distinct from OLD.status then return NEW; end if;
  else return NEW;
  end if;
 end if;
 if v_type='contact_enquiries' then
  v_email:=lower(nullif(btrim(NEW.email),''));
  v_kind:='contact_submitted';v_product:=NEW.topic;v_stage:=NEW.status;
  v_task:='customer_enquiry_followup';v_role:='customer_service';
 elsif v_type='property_inspection_requests' then
  v_email:=lower(nullif(btrim(NEW.email),''));
  v_kind:=case when NEW.status in ('confirmed','approved') then 'inspection_confirmed' else 'inspection_requested' end;
  v_product:='Property Inspection';v_stage:=NEW.status;
  v_customer:=NEW.customer_user_id;
  v_task:='inspection_coordination';v_role:='customer_service';
 elsif v_type='applications' then
  v_kind:='application_received';v_product:=NEW.kind;v_stage:=NEW.status;
  v_customer:=NEW.applicant_id;v_task:='application_review';v_role:='sales';
 elsif v_type='landshop_payment_intents' then
  if NEW.verified_at is null then return NEW; end if;
  v_kind:='payment_verified';v_product:=NEW.purpose;v_stage:='verified';
  v_customer:=NEW.customer_id;v_task:='finance_reconciliation';v_role:='finance';
 else return NEW;
 end if;
 if v_email is not null and v_email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then
  insert into public.landshop_comm_contacts(email,full_name,phone,product_interest,source,source_ref)
  values(v_email,
    case when v_type='contact_enquiries' then NEW.full_name else NEW.full_name end,
    NEW.phone,v_product,v_type,NEW.id)
  on conflict(email) do update set
    full_name=coalesce(nullif(public.landshop_comm_contacts.full_name,''),excluded.full_name),
    phone=coalesce(nullif(public.landshop_comm_contacts.phone,''),excluded.phone),
    product_interest=excluded.product_interest,
    updated_at=now()
  returning id into v_contact;
 end if;
 insert into public.landshop_comm_events(contact_id,customer_user_id,event_type,product,source_type,source_id,stage)
 values(v_contact,v_customer,v_kind,v_product,v_type,NEW.id,v_stage)
 on conflict(source_type,source_id,event_type) do update set stage=excluded.stage
 returning id into v_event;
 insert into public.landshop_comm_tasks(event_id,task_type,assigned_role)
 values(v_event,v_task,v_role)
 on conflict(event_id,task_type) do nothing;
 return NEW;
end;$fn$;
revoke all on function public.landshop_comm_capture_source() from public,anon,authenticated;
create trigger landshop_comm_capture_contact after insert on public.contact_enquiries
 for each row execute function public.landshop_comm_capture_source();
create trigger landshop_comm_capture_inspection after insert or update of status on public.property_inspection_requests
 for each row execute function public.landshop_comm_capture_source();
create trigger landshop_comm_capture_application after insert on public.applications
 for each row execute function public.landshop_comm_capture_source();
create trigger landshop_comm_capture_payment after insert or update of verified_at on public.landshop_payment_intents
 for each row execute function public.landshop_comm_capture_source();

-- A management-owned write is auditable without copying message text or personal data into the audit log.
create or replace function public.landshop_comm_audit_management()
returns trigger language plpgsql security definer set search_path='' as $fn$
begin
 if auth.uid() is not null then
  insert into public.audit_events(actor_id,event_type,metadata)
  values(auth.uid(),'communication.'||lower(TG_OP),
    jsonb_build_object('entity',TG_TABLE_NAME,'record_id',case when TG_OP='DELETE' then OLD.id::text else NEW.id::text end));
 end if;
 return case when TG_OP='DELETE' then OLD else NEW end;
end;$fn$;
revoke all on function public.landshop_comm_audit_management() from public,anon,authenticated;
create trigger landshop_comm_audit_contact after insert or update or delete on public.landshop_comm_contacts
 for each row execute function public.landshop_comm_audit_management();
create trigger landshop_comm_audit_template after insert or update or delete on public.landshop_comm_templates
 for each row execute function public.landshop_comm_audit_management();
create trigger landshop_comm_audit_tasks after update on public.landshop_comm_tasks
 for each row execute function public.landshop_comm_audit_management();
