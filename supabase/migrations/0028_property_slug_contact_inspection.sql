-- Applied live as 20261029183315 / landshop_v20_property_slugs_contact_inspections.
-- LANDSHOP V20 additive property slugs, contact references and inspection booking.
alter table public.properties add column if not exists slug text;
update public.properties set slug=lower(regexp_replace(regexp_replace(trim(title),'[^a-zA-Z0-9]+','-','g'),'^-|-$','','g'))||'-'||left(id::text,8) where slug is null;
create unique index if not exists properties_slug_unique on public.properties(slug);
create or replace function public.landshop_assign_property_slug()
returns trigger language plpgsql set search_path='' as $$
declare root text;
begin
 if new.slug is null or btrim(new.slug)='' then
  root:=trim(both '-' from regexp_replace(lower(coalesce(new.title,'property')),'[^a-z0-9]+','-','g'));
  new.slug:=left(coalesce(nullif(root,''),'property'),95)||'-'||left(new.id::text,8);
 end if;
 if new.slug !~ '^[a-z0-9][a-z0-9-]{2,120}$' then raise exception 'Invalid property slug';end if;
 return new;
end $$;
drop trigger if exists ls_property_slug on public.properties;
create trigger ls_property_slug before insert or update on public.properties
for each row execute function public.landshop_assign_property_slug();
alter table public.contact_enquiries add column if not exists department text not null default 'customer_care';
create index if not exists contact_department_queue on public.contact_enquiries(department,status,created_at desc);
create or replace function public.landshop_contact_submit(
 p_name text,p_email text,p_phone text,p_topic text,p_message text,p_consent boolean,p_fingerprint text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;v_department text;
begin
 if length(btrim(coalesce(p_name,''))) not between 2 and 120 or
    length(btrim(coalesce(p_email,'')))>254 or p_email !~* '^[^ @]+@[^ @]+\.[^ @]+$' or
    length(coalesce(p_phone,''))>30 or
    length(btrim(coalesce(p_message,''))) not between 20 and 3000 or
    p_consent is distinct from true or p_topic not in
    ('Develop','Incubate','Grow','Property Acquisition','Property Inspection','Mortgage Guidance','Customer Support','Property Updates','Other') or
    p_fingerprint !~ '^[0-9a-f]{64}$' then raise exception 'Invalid contact request';end if;
 if (select count(*) from public.contact_enquiries
     where email=lower(trim(p_email)) and created_at>now()-interval '1 hour')>=5
 then raise exception 'Hourly enquiry limit exceeded';end if;
 v_department:=case
  when p_topic in ('Develop','Property Acquisition','Property Inspection') then 'property'
  when p_topic='Incubate' then 'investment'
  when p_topic in ('Grow','Mortgage Guidance') then 'mortgage'
  when p_topic='Property Updates' then 'marketing'
  else 'customer_care' end;
 insert into public.contact_enquiries(full_name,email,phone,topic,message,consent,fingerprint,status,department)
 values(btrim(p_name),lower(trim(p_email)),nullif(trim(coalesce(p_phone,'')),''),p_topic,btrim(p_message),true,p_fingerprint,'new',v_department)
 returning id into v_id;
 insert into public.notification_outbox(event_type,payload)
 values('landshop.contact.received',jsonb_build_object('enquiry_id',v_id,'department',v_department));
 return v_id;
end $$;
revoke all on function public.landshop_contact_submit(text,text,text,text,text,boolean,text) from public;
grant execute on function public.landshop_contact_submit(text,text,text,text,text,boolean,text) to anon,authenticated;
create table if not exists public.property_inspection_requests(
 id uuid primary key default gen_random_uuid(),
 property_id uuid not null references public.properties(id),
 full_name text not null, email text not null,phone text not null,whatsapp text,
 preferred_date date not null,preferred_time text not null,
 inspection_type text not null check(inspection_type in ('physical','virtual')),
 attendees integer not null default 1 check(attendees between 1 and 20),
 message text,consent boolean not null default false,
 fingerprint text not null unique,
 status text not null default 'pending_confirmation' check(status in ('pending_confirmation','confirmed','rescheduled','completed','rejected','cancelled')),
 assigned_to uuid references auth.users(id),
 customer_user_id uuid references auth.users(id),
 staff_note text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 confirmed_at timestamptz
);
create index if not exists inspection_staff_queue_idx on public.property_inspection_requests(status,preferred_date,created_at desc);
create index if not exists inspection_property_idx on public.property_inspection_requests(property_id,preferred_date);
alter table public.property_inspection_requests enable row level security;
revoke all on public.property_inspection_requests from public,anon,authenticated;
grant select on public.property_inspection_requests to authenticated;
drop policy if exists ls_inspection_staff_read on public.property_inspection_requests;
create policy ls_inspection_staff_read on public.property_inspection_requests for select to authenticated
 using(public.landshop_property_editor((select auth.uid()),false) or customer_user_id=(select auth.uid()));
create or replace function public.landshop_inspection_request(
 p_property uuid,p_name text,p_email text,p_phone text,p_whatsapp text,
 p_date date,p_time text,p_type text,p_attendees integer,p_message text,p_consent boolean,p_fingerprint text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if not exists(select 1 from public.properties where id=p_property and status='published') then raise exception 'Property is not available for inspection requests';end if;
 if length(btrim(coalesce(p_name,''))) not between 2 and 120 or
  length(coalesce(p_email,''))>254 or p_email !~* '^[^ @]+@[^ @]+\.[^ @]+$' or
  length(btrim(coalesce(p_phone,''))) not between 7 and 30 or
  length(coalesce(p_whatsapp,''))>30 or
  length(coalesce(p_message,''))>1200 or
  p_date<current_date or p_date>current_date+interval '180 days' or
  p_time not in ('08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00') or
  (p_date=current_date and p_time::time<=localtime) or
  p_type not in ('physical','virtual') or p_attendees not between 1 and 20 or
  p_consent is distinct from true or p_fingerprint !~ '^[0-9a-f]{64}$'
 then raise exception 'Invalid inspection request or appointment window';end if;
 if (select count(*) from public.property_inspection_requests
   where email=lower(trim(p_email)) and created_at>now()-interval '1 hour')>=4
 then raise exception 'Hourly inspection request limit exceeded';end if;
 insert into public.property_inspection_requests(property_id,full_name,email,phone,whatsapp,preferred_date,preferred_time,
 inspection_type,attendees,message,consent,fingerprint,customer_user_id)
 values(p_property,btrim(p_name),lower(trim(p_email)),btrim(p_phone),nullif(btrim(coalesce(p_whatsapp,'')),''),
 p_date,p_time,p_type,p_attendees,nullif(btrim(coalesce(p_message,'')),''),true,p_fingerprint,auth.uid())
 returning id into v_id;
 insert into public.notification_outbox(event_type,payload)
 values('landshop.inspection.requested',jsonb_build_object('request_id',v_id,'property_id',p_property));
 return v_id;
end $$;
revoke all on function public.landshop_inspection_request(uuid,text,text,text,text,date,text,text,integer,text,boolean,text) from public;
grant execute on function public.landshop_inspection_request(uuid,text,text,text,text,date,text,text,integer,text,boolean,text) to anon,authenticated;
create or replace function public.landshop_inspection_review(p_id uuid,p_status text,p_note text)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_current text;
begin
 if v_user is null or not public.landshop_property_editor(v_user,true) then raise exception 'Inspection reviewer access denied';end if;
 if p_status not in ('confirmed','rescheduled','completed','rejected','cancelled') or length(trim(coalesce(p_note,''))) not between 15 and 1000
 then raise exception 'Invalid review state or note';end if;
 select status into v_current from public.property_inspection_requests where id=p_id for update;
 if not found or v_current not in ('pending_confirmation','confirmed','rescheduled') then raise exception 'Invalid inspection transition';end if;
 if p_status='completed' and v_current not in ('confirmed','rescheduled') then raise exception 'Inspection must be confirmed before completion';end if;
 update public.property_inspection_requests set status=p_status,staff_note=trim(p_note),
 assigned_to=coalesce(assigned_to,v_user),confirmed_at=case when p_status='confirmed' then now() else confirmed_at end,
 updated_at=now() where id=p_id;
 insert into public.audit_events(actor_id,event_type,metadata)
 values(v_user,'property.inspection.reviewed',jsonb_build_object('inspection_id',p_id,'status',p_status));
 insert into public.notification_outbox(event_type,payload)
 values('landshop.inspection.status_changed',jsonb_build_object('request_id',p_id,'status',p_status));
 return true;
end $$;
revoke all on function public.landshop_inspection_review(uuid,text,text) from public,anon;
grant execute on function public.landshop_inspection_review(uuid,text,text) to authenticated;

