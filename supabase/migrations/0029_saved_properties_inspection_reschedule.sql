-- Reproduces additive Supabase migrations already applied to Landshop production.
-- 20261029183725: landshop_inspection_reschedule_v20
-- V20.1: authorized staff can reschedule a persisted inspection without changing customer identity.
create or replace function public.landshop_inspection_reschedule(p_id uuid,p_date date,p_time text,p_note text)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_current text;
begin
 if v_user is null or not public.landshop_property_editor(v_user,true) then raise exception 'Inspection reviewer access denied';end if;
 if p_date<current_date or p_date>current_date+interval '180 days'
 or p_time not in ('08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00')
 or (p_date=current_date and p_time::time<=localtime)
 or length(trim(coalesce(p_note,''))) not between 15 and 1000
 then raise exception 'Invalid reschedule window or note';end if;
 select status into v_current from public.property_inspection_requests where id=p_id for update;
 if not found or v_current not in ('pending_confirmation','confirmed','rescheduled') then raise exception 'This request cannot be rescheduled';end if;
 update public.property_inspection_requests set preferred_date=p_date,preferred_time=p_time,status='rescheduled',
 staff_note=trim(p_note),assigned_to=coalesce(assigned_to,v_user),updated_at=now() where id=p_id;
 insert into public.audit_events(actor_id,event_type,metadata)
 values(v_user,'property.inspection.rescheduled',jsonb_build_object('inspection_id',p_id,'date',p_date,'time',p_time));
 insert into public.notification_outbox(event_type,payload)
 values('landshop.inspection.rescheduled',jsonb_build_object('request_id',p_id));
 return true;
end $$;
revoke all on function public.landshop_inspection_reschedule(uuid,date,text,text) from public,anon;
grant execute on function public.landshop_inspection_reschedule(uuid,date,text,text) to authenticated;


-- 20261029183918: landshop_property_saved_listings_v20
-- Add customer-owned saved property bookmarks to the existing Supabase Auth estate inventory.
create table if not exists public.property_saved_listings(
 user_id uuid not null references auth.users(id) on delete cascade,
 property_id uuid not null references public.properties(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(user_id,property_id)
);
create index if not exists property_saved_by_property on public.property_saved_listings(property_id,created_at);
alter table public.property_saved_listings enable row level security;
revoke all on public.property_saved_listings from public,anon,authenticated;
grant select,insert,delete on public.property_saved_listings to authenticated;
drop policy if exists ls_bookmarks_read on public.property_saved_listings;
create policy ls_bookmarks_read on public.property_saved_listings for select to authenticated
 using(user_id=(select auth.uid()));
drop policy if exists ls_bookmarks_insert on public.property_saved_listings;
create policy ls_bookmarks_insert on public.property_saved_listings for insert to authenticated
 with check(user_id=(select auth.uid()) and exists(select 1 from public.properties p
 where p.id=property_id and p.status='published'));
drop policy if exists ls_bookmarks_delete on public.property_saved_listings;
create policy ls_bookmarks_delete on public.property_saved_listings for delete to authenticated
 using(user_id=(select auth.uid()));

