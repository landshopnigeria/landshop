-- Applied on production Supabase as landshop_v24_property_management_command_roles (20261030015641)
create or replace function public.landshop_property_editor(p_user uuid,p_approval boolean default false)
returns boolean language sql stable security definer set search_path='' as $$
 select public.landshop_is_management(p_user);
$$;
revoke all on function public.landshop_property_editor(uuid,boolean) from public,anon;
grant execute on function public.landshop_property_editor(uuid,boolean) to authenticated;
