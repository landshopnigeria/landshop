-- Applied on production Supabase as landshop_v24_management_property_archive_audit (20261030015744)

create or replace function public.landshop_management_archive_property(p_id uuid,p_reason text)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid();v_old text;
begin
 if v_actor is null or not public.landshop_is_management(v_actor) then raise exception 'Management account required';end if;
 if length(btrim(coalesce(p_reason,''))) not between 20 and 1500 then raise exception 'Record a specific compliance or inventory withdrawal reason';end if;
 select status into v_old from public.properties where id=p_id for update;
 if not found or v_old='archived' then raise exception 'Property is absent or already archived';end if;
 update public.properties set status='archived' where id=p_id;
 insert into public.property_publication_events(property_id,actor_id,from_status,to_status,reason)
 values(p_id,v_actor,v_old,'archived',btrim(p_reason));
 insert into public.audit_events(actor_id,event_type,metadata)
 values(v_actor,'property.archived_from_command_center',jsonb_build_object('property_id',p_id,'previous_status',v_old,'reason',btrim(p_reason)));
 return true;
end $$;
revoke all on function public.landshop_management_archive_property(uuid,text) from public,anon;
grant execute on function public.landshop_management_archive_property(uuid,text) to authenticated;

