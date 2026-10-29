-- Applied to production Supabase as landshop_v22_starting_price_provenance / 20261029213050.
-- Only source-grounded draft records, never automatically published.
alter table public.properties add column if not exists price_is_starting_at boolean not null default false;
update public.properties set price_is_starting_at=true where source_url='https://ng.linkedin.com/company/landshoplimited' and status='draft' and title like 'Famous Gardens — %';
create or replace function public.landshop_property_mark_starting_price(p_property uuid,p_is_starting boolean)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();
begin
 if v_user is null or not public.landshop_property_editor(v_user,false) then raise exception 'Staff access required';end if;
 if not exists(select 1 from public.properties where id=p_property and status='draft') then raise exception 'Only draft prices can be reclassified';end if;
 update public.properties set price_is_starting_at=p_is_starting,price_last_confirmed_at=null,price_confirmed_by=null where id=p_property;
 insert into public.audit_events(actor_id,event_type,metadata) values(v_user,'property.price_presentation_changed',jsonb_build_object('property_id',p_property,'starting_at',p_is_starting));
 return true;
end $$;
revoke all on function public.landshop_property_mark_starting_price(uuid,boolean) from public,anon;
grant execute on function public.landshop_property_mark_starting_price(uuid,boolean) to authenticated;
