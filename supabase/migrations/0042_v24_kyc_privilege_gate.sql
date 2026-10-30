-- Applied on production Supabase as landshop_v24_kyc_required_for_privileged_workflow_access (20261030015900)

-- Command Center roles require approved employment KYC; separately verified initial owner is exempt.
create or replace function public.landshop_is_management(p_user uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.organization_members m join public.organizations o on o.id=m.organization_id
 where m.user_id=p_user and m.status='active' and o.kind='landshop'
 and m.role in ('owner','ceo','founder','admin','technology_officer','technology_consultant')
 and (m.role='owner' or exists(
  select 1 from public.landshop_staff_profiles p where p.user_id=m.user_id
  and p.organization_id=m.organization_id and p.kyc_state='approved' and p.employment_state='active'
 )));
$$;
revoke all on function public.landshop_is_management(uuid) from public,anon;
grant execute on function public.landshop_is_management(uuid) to authenticated;
-- Staff performance actions require a current approved identity.
create or replace function public.landshop_staff_can_work(p_user uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select public.landshop_is_staff(p_user) and exists(
 select 1 from public.landshop_staff_profiles p where p.user_id=p_user and p.kyc_state='approved' and p.employment_state='active')
$$;
revoke all on function public.landshop_staff_can_work(uuid) from public,anon;
grant execute on function public.landshop_staff_can_work(uuid) to authenticated;
-- Ensure work assignment/reports cannot be activated during KYC re-verification.
create or replace function public.landshop_staff_work_guard()
returns trigger language plpgsql set search_path='' as $$
begin
 if new.status in ('in_progress','submitted','accepted') and not public.landshop_staff_can_work(new.assignee_id)
 then raise exception 'Assignee employment identity is not currently verified';end if;
 return new;
end $$;
drop trigger if exists ls_staff_work_guard on public.staff_tasks;
create trigger ls_staff_work_guard before update of status on public.staff_tasks
 for each row execute function public.landshop_staff_work_guard();

