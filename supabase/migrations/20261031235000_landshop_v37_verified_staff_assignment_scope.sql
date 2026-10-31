-- V37: align supervisor assignments with verified basic staff automatic onboarding.
-- Requested_role and user-editable auth metadata NEVER authorize managerial rights.
create or replace function public.landshop_team_directory()
returns table(staff_id uuid,username text,role text)
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.landshop_is_task_supervisor(auth.uid()) then
   raise exception 'Supervisor role required';
 end if;
 return query
 select p.user_id,p.username,m.role
 from public.landshop_staff_profiles p
 join public.organization_members m
   on m.user_id=p.user_id and m.organization_id=p.organization_id
 join public.organizations o on o.id=m.organization_id and o.kind='landshop'
 where p.employment_state='active'
   and m.status='active'
   and m.user_id<>auth.uid()
   and public.landshop_staff_can_work(p.user_id)
 order by p.username
 limit 500;
end $$;
revoke all on function public.landshop_team_directory() from public,anon;
grant execute on function public.landshop_team_directory() to authenticated;

create or replace function public.landshop_staff_task_assign(
 p_assignee uuid,p_title text,p_details text,p_minutes integer,p_delay integer,p_due timestamptz
) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid();v_org uuid;v_id uuid;
begin
 if v_actor is null or not public.landshop_is_task_supervisor(v_actor) then
   raise exception 'Manager authorization required';
 end if;
 if p_assignee is null or p_assignee=v_actor then
   raise exception 'A supervisor cannot assign a task to themselves';
 end if;
 if length(btrim(coalesce(p_title,''))) not between 5 and 180
   or length(coalesce(p_details,''))>5000
   or p_minutes not between 5 and 20160
   or p_delay not between 0 and 10080
   or p_due is null or p_due<=now() or p_due>now()+interval '366 days'
 then raise exception 'Valid task title, estimated duration, delay allowance and future deadline required';end if;
 select id into v_org from public.organizations where kind='landshop';
 if v_org is null then raise exception 'Landshop organization unavailable';end if;
 if not exists(
   select 1 from public.organization_members m
   join public.landshop_staff_profiles p
     on p.user_id=m.user_id and p.organization_id=m.organization_id
   where m.organization_id=v_org and m.user_id=p_assignee and m.status='active'
     and p.employment_state='active'
     and public.landshop_staff_can_work(p_assignee)
 ) then raise exception 'Assignee must be a verified active Landshop staff member';end if;
 insert into public.staff_tasks(
   organization_id,assignee_id,assigned_by,title,details,starts_at,due_at,
   status,planned_minutes,delay_allowance_minutes,expected_outcome
 ) values(
   v_org,p_assignee,v_actor,btrim(p_title),left(p_details,5000),now(),p_due,
   'assigned',p_minutes,p_delay,left(p_details,2000)
 ) returning id into v_id;
 insert into public.landshop_task_events(task_id,actor_id,event_type,note)
 values(v_id,v_actor,'assigned','Planned '||p_minutes||' minutes; allowed delay '||p_delay||' minutes');
 insert into public.audit_events(actor_id,event_type,metadata)
 values(v_actor,'staff.task_assigned',jsonb_build_object(
   'task_id',v_id,'assignee_id',p_assignee,'planned_minutes',p_minutes
 ));
 return v_id;
end $$;
revoke all on function public.landshop_staff_task_assign(uuid,text,text,integer,integer,timestamptz) from public,anon;
grant execute on function public.landshop_staff_task_assign(uuid,text,text,integer,integer,timestamptz) to authenticated;
