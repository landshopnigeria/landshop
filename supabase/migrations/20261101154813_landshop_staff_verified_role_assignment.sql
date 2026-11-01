-- Applied to production Supabase as migration 20261101154813.
-- A provider-verified staff member can receive a managerial role only after
-- a separate documented management decision; only owner controls Command Center.
create or replace function public.landshop_staff_assign_verified_role(
 p_user uuid,p_role text,p_reason text)
returns boolean language plpgsql security definer set search_path='' as $function$
declare
 v_actor uuid:=auth.uid();
 v_org uuid;
 v_actor_role text;
 v_current_role text;
 v_profile public.landshop_staff_profiles%rowtype;
begin
 if v_actor is null or v_actor=p_user or not public.landshop_is_management(v_actor)
 then raise exception 'Independent authorized management approval required';end if;
 if length(btrim(coalesce(p_reason,''))) not between 20 and 1000
 or p_role not in ('ceo','founder','admin','executive','operations','finance',
 'head_finance','hr','hr_officer','technology_officer','technology_consultant',
 'social_media_manager','customer_service_manager','department_manager',
 'sales','legal','surveyor','realtor','marketing','staff','security','viewer',
 'youth_corps','intern')
 then raise exception 'A valid role and a reason of 20 to 1000 characters are required';end if;
 select id into v_org from public.organizations where kind='landshop';
 select role into v_actor_role from public.organization_members
  where organization_id=v_org and user_id=v_actor and status='active';
 if v_actor_role is null then raise exception 'Management membership missing';end if;
 select * into v_profile from public.landshop_staff_profiles
  where user_id=p_user and organization_id=v_org for update;
 if not found or v_profile.kyc_state<>'approved' or v_profile.employment_state<>'active'
 then raise exception 'Verified, active staff identity is required before role assignment';end if;
 select role into v_current_role from public.organization_members
  where user_id=p_user and organization_id=v_org and status='active' for update;
 if v_current_role is null or v_current_role='owner'
 then raise exception 'Target role assignment is restricted';end if;
 if (p_role in ('ceo','founder','admin','technology_officer','technology_consultant')
   or v_current_role in ('ceo','founder','admin','technology_officer','technology_consultant'))
   and v_actor_role<>'owner'
 then raise exception 'Only the company owner can manage Command Center roles';end if;
 update public.organization_members set role=p_role
  where organization_id=v_org and user_id=p_user and status='active';
 insert into public.audit_events(actor_id,event_type,metadata)
 values(v_actor,'staff.verified_role_assigned',
  jsonb_build_object('staff_id',p_user,'old_role',v_current_role,
  'new_role',p_role,'reason',btrim(p_reason)));
 return true;
end $function$;
revoke all on function public.landshop_staff_assign_verified_role(uuid,text,text) from public,anon;
grant execute on function public.landshop_staff_assign_verified_role(uuid,text,text) to authenticated;
