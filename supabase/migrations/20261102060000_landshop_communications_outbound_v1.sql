-- Landshop communications outbound v1.
-- A durable, auditable outbox, isolated from public visitors and from draft NEXUS runs.
-- No provider request can be made by SQL. Only an authenticated server-side worker may claim.
create table if not exists public.landshop_comm_channels (
 channel text primary key check(channel in ('email','whatsapp','sms')),
 provider text not null,
 enabled boolean not null default false,
 updated_at timestamptz not null default now()
);
insert into public.landshop_comm_channels(channel,provider,enabled)
values ('email','postmark',false),('whatsapp','meta_cloud',false),('sms','termii',false)
on conflict(channel) do nothing;

create table if not exists public.landshop_comm_delivery_rules (
 id uuid primary key default gen_random_uuid(),
 event_type text not null,
 product text,
 template_id text not null references public.landshop_comm_templates(id) on delete restrict,
 channel text not null references public.landshop_comm_channels(channel),
 purpose text not null check(purpose in ('transactional','marketing')),
 enabled boolean not null default false,
 delay_seconds integer not null default 0 check(delay_seconds between 0 and 2592000),
 whatsapp_template_name text,
 whatsapp_language text not null default 'en',
 updated_at timestamptz not null default now(),
 unique(event_type,product,template_id,channel),
 constraint meta_template_name check(whatsapp_template_name is null or whatsapp_template_name ~ '^[a-z0-9_]{3,120}$')
);
create index if not exists landshop_comm_rule_event_idx on public.landshop_comm_delivery_rules(event_type,enabled);

create table if not exists public.landshop_comm_outbox (
 id uuid primary key default gen_random_uuid(),
 event_id uuid not null references public.landshop_comm_events(id) on delete restrict,
 contact_id uuid not null references public.landshop_comm_contacts(id) on delete restrict,
 rule_id uuid not null references public.landshop_comm_delivery_rules(id) on delete restrict,
 channel text not null references public.landshop_comm_channels(channel),
 template_id text not null references public.landshop_comm_templates(id) on delete restrict,
 purpose text not null check(purpose in ('transactional','marketing')),
 status text not null default 'queued' check(status in ('queued','leased','accepted','delivered','retry','failed','suppressed','uncertain','cancelled')),
 available_at timestamptz not null default now(),
 lease_token uuid,
 lease_expires_at timestamptz,
 attempts integer not null default 0 check(attempts between 0 and 10),
 provider_message_id text,
 last_error text,
 accepted_at timestamptz,
 delivered_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(event_id,rule_id),
 constraint landshop_comm_outbox_error_size check(last_error is null or length(last_error) <= 240)
);
create index if not exists landshop_comm_outbox_queue_idx on public.landshop_comm_outbox(channel,available_at)
 where status in ('queued','retry');
create index if not exists landshop_comm_outbox_contact_idx on public.landshop_comm_outbox(contact_id,created_at desc);
create index if not exists landshop_comm_outbox_provider_idx on public.landshop_comm_outbox(provider_message_id)
 where provider_message_id is not null;

create table if not exists public.landshop_comm_delivery_events (
 id uuid primary key default gen_random_uuid(),
 outbox_id uuid not null references public.landshop_comm_outbox(id) on delete cascade,
 event_name text not null check(event_name in ('accepted','delivered','bounced','complained','replied','opened','clicked','failed','unknown')),
 provider_event_id text,
 occurred_at timestamptz not null default now(),
 unique(outbox_id,event_name,provider_event_id)
);

alter table public.landshop_comm_channels enable row level security;
alter table public.landshop_comm_delivery_rules enable row level security;
alter table public.landshop_comm_outbox enable row level security;
alter table public.landshop_comm_delivery_events enable row level security;
revoke all on public.landshop_comm_channels,public.landshop_comm_delivery_rules,
 public.landshop_comm_outbox,public.landshop_comm_delivery_events from public,anon,authenticated;
grant select,update on public.landshop_comm_channels to authenticated;
grant select,insert,update,delete on public.landshop_comm_delivery_rules to authenticated;
grant select,update on public.landshop_comm_outbox to authenticated;
grant select on public.landshop_comm_delivery_events to authenticated;

create policy landshop_comm_channels_management_select on public.landshop_comm_channels
 for select to authenticated using(public.landshop_is_management((select auth.uid())));
create policy landshop_comm_channels_management_update on public.landshop_comm_channels
 for update to authenticated using(public.landshop_is_management((select auth.uid())))
 with check(public.landshop_is_management((select auth.uid())));
create policy landshop_comm_rules_management_select on public.landshop_comm_delivery_rules
 for select to authenticated using(public.landshop_is_management((select auth.uid())));
create policy landshop_comm_rules_management_insert on public.landshop_comm_delivery_rules
 for insert to authenticated with check(public.landshop_is_management((select auth.uid())));
create policy landshop_comm_rules_management_update on public.landshop_comm_delivery_rules
 for update to authenticated using(public.landshop_is_management((select auth.uid())))
 with check(public.landshop_is_management((select auth.uid())));
create policy landshop_comm_rules_management_delete on public.landshop_comm_delivery_rules
 for delete to authenticated using(public.landshop_is_management((select auth.uid())));
create policy landshop_comm_outbox_management_select on public.landshop_comm_outbox
 for select to authenticated using(public.landshop_is_management((select auth.uid())));
create policy landshop_comm_outbox_management_update on public.landshop_comm_outbox
 for update to authenticated using(public.landshop_is_management((select auth.uid())))
 with check(public.landshop_is_management((select auth.uid())));
create policy landshop_comm_events_management_select on public.landshop_comm_delivery_events
 for select to authenticated using(public.landshop_is_management((select auth.uid())));

-- A verified source event only schedules rules explicitly approved by management.
-- Nothing is sent from triggers; provider credentials never enter SQL or browser bundles.
create or replace function public.landshop_comm_on_business_event()
returns trigger language plpgsql security definer set search_path=''
as $fn$
begin
 if NEW.contact_id is null then return NEW; end if;
 insert into public.landshop_comm_outbox(event_id,contact_id,rule_id,channel,template_id,purpose,available_at)
 select NEW.id,c.id,r.id,r.channel,r.template_id,r.purpose,
        greatest(now(),NEW.occurred_at) + make_interval(secs=>r.delay_seconds)
 from public.landshop_comm_contacts c
 join public.landshop_comm_delivery_rules r on r.event_type=NEW.event_type
   and (r.product is null or r.product=NEW.product) and r.enabled=true
 join public.landshop_comm_templates t on t.id=r.template_id and t.state='approved'
 join public.landshop_comm_channels ch on ch.channel=r.channel and ch.enabled=true
 where c.id=NEW.contact_id and c.status='active'
   and (r.purpose='transactional' or c.marketing_consent=true)
   and (r.channel<>'whatsapp' or c.whatsapp_opt_in=true)
   and (r.channel<>'sms' or c.sms_opt_in=true)
 on conflict(event_id,rule_id) do nothing;
 return NEW;
end;$fn$;
revoke all on function public.landshop_comm_on_business_event() from public,anon,authenticated;
create trigger landshop_comm_queue_verified_event after insert on public.landshop_comm_events
 for each row execute function public.landshop_comm_on_business_event();

-- Service-role-only atomic claims; uncertain network outcomes are never auto-retried.
create or replace function public.landshop_comm_claim_outbox(p_channels text[],p_limit integer default 10)
returns setof public.landshop_comm_outbox language plpgsql security definer
set search_path=''
as $fn$
begin
 if current_setting('request.jwt.claim.role',true) is distinct from 'service_role'
 then raise exception 'Service-role authorization required' using errcode='42501'; end if;
 if p_limit not between 1 and 30 or p_channels is null or
   not (p_channels <@ array['email','whatsapp','sms']::text[])
 then raise exception 'Invalid dispatcher scope'; end if;
 -- Never reclaim an expired lease automatically: the previous provider call may
 -- have succeeded. An operator must investigate and explicitly resolve it.
 return query
 with selected as (
  select o.id
  from public.landshop_comm_outbox o
  join public.landshop_comm_contacts c on c.id=o.contact_id and c.status='active'
  join public.landshop_comm_templates t on t.id=o.template_id and t.state='approved'
  join public.landshop_comm_delivery_rules r on r.id=o.rule_id and r.enabled=true
  join public.landshop_comm_channels h on h.channel=o.channel and h.enabled=true
  where o.status in ('queued','retry') and o.available_at<=now()
    and o.attempts<5 and o.channel=any(p_channels)
    and (o.purpose='transactional' or c.marketing_consent=true)
    and (o.channel<>'whatsapp' or (c.whatsapp_opt_in=true and r.whatsapp_template_name is not null))
    and (o.channel<>'sms' or c.sms_opt_in=true)
  order by o.available_at,o.created_at
  for update of o skip locked limit p_limit
 )
 update public.landshop_comm_outbox o
 set status='leased',lease_token=gen_random_uuid(),
     lease_expires_at=now()+interval '5 minutes',
     attempts=o.attempts+1,updated_at=now()
 from selected s where o.id=s.id
 returning o.*;
end;$fn$;
revoke all on function public.landshop_comm_claim_outbox(text[],integer) from public,anon,authenticated;
grant execute on function public.landshop_comm_claim_outbox(text[],integer) to service_role;

create or replace function public.landshop_comm_resolve_outbox(
 p_id uuid,p_lease uuid,p_status text,p_message_id text default null,p_error text default null,
 p_delay_seconds integer default null
) returns boolean language plpgsql security definer set search_path=''
as $fn$
declare v_count integer;
begin
 if current_setting('request.jwt.claim.role',true) is distinct from 'service_role'
 then raise exception 'Service-role authorization required' using errcode='42501'; end if;
 if p_status not in ('accepted','failed','retry','uncertain','suppressed') or
    (p_status='retry' and (p_delay_seconds is null or p_delay_seconds not between 60 and 86400))
 then raise exception 'Invalid delivery outcome'; end if;
 update public.landshop_comm_outbox
 set status=p_status,
     provider_message_id=case when p_status='accepted' then left(p_message_id,180) else provider_message_id end,
     last_error=case when p_error is not null then left(p_error,240) else null end,
     accepted_at=case when p_status='accepted' then now() else accepted_at end,
     available_at=case when p_status='retry' then now()+make_interval(secs=>p_delay_seconds) else available_at end,
     lease_token=null,lease_expires_at=null,updated_at=now()
 where id=p_id and lease_token=p_lease and status='leased'
   and (p_status<>'retry' or attempts<5);
 get diagnostics v_count=row_count;
 return v_count=1;
end;$fn$;
revoke all on function public.landshop_comm_resolve_outbox(uuid,uuid,text,text,text,integer)
 from public,anon,authenticated;
grant execute on function public.landshop_comm_resolve_outbox(uuid,uuid,text,text,text,integer) to service_role;

-- Initial rules are installed as off. Management can approve exact provider
-- templates and enable individual channels only after sender verification.
-- Never enqueue historical events retroactively.
insert into public.landshop_comm_templates
(id,subject,headline,body,whatsapp,sms,state,change_note)
values
('T00','We received your Landshop enquiry','Thank you for reaching out.',
 'Hello {{first_name}},' || chr(10) || chr(10) ||
 'Thank you for contacting Landshop. Your enquiry has been received by our customer service team.' ||
 chr(10) || chr(10) ||
 'We will review your request and respond through our official channels. You can reach us at care@landshopnigeria.com.',
 'Thank you for contacting Landshop. We received your enquiry and will reply through our official support channels.',
 'LANDSHOP: We received your enquiry. Our team will respond. Support: care@landshopnigeria.com.',
 'approved','Approved neutral response for a confirmed customer enquiry'),
('T01','Your Landshop inspection request','Your request is with us.',
 'Hello {{first_name}},' || chr(10) || chr(10) ||
 'We received your property inspection request. Our team will confirm the location, date and time with you before the visit.' ||
 chr(10) || chr(10) || 'Please do not travel until the booking is confirmed.',
 'Landshop received your inspection request. We will confirm the appointment details before your visit.',
 'LANDSHOP: Inspection request received. Await official confirmation before visiting.',
 'approved','Request acknowledgement, not a false booking confirmation')
on conflict(id) do nothing;

insert into public.landshop_comm_delivery_rules(event_type,template_id,channel,purpose,enabled)
values
 ('contact_submitted','T00','email','transactional',false),
 ('inspection_requested','T01','email','transactional',false),
 ('inspection_confirmed','C03','email','transactional',false),
 ('application_received','C01','email','transactional',false),
 ('payment_verified','C05','email','transactional',false),
 ('contact_submitted','T00','whatsapp','transactional',false),
 ('inspection_requested','T01','whatsapp','transactional',false),
 ('contact_submitted','T00','sms','transactional',false),
 ('inspection_requested','T01','sms','transactional',false)
on conflict(event_type,product,template_id,channel) do nothing;
