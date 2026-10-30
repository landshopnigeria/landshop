-- Applied production landshop_v24_department_supervisors_task_scoping / 20261030020529

-- Approved departmental managers can assign and review their own teams' work
-- without gaining Global Command Center access.
create or replace function public.landshop_is_task_supervisor(p_user uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select public.landshop_is_management(p_user) or exists(
 select 1 from public.organization_members m
 join public.organizations o on o.id=m.organization_id
 join public.landshop_staff_profiles p on p.user_id=m.user_id
 where m.user_id=p_user and m.status='active' and o.kind='landshop'
 and m.role in ('hr_officer','head_finance','social_media_manager','customer_service_manager','department_manager','operations','hr','finance')
 and p.kyc_state='approved' and p.employment_state='active');
$$;
revoke all on function public.landshop_is_task_supervisor(uuid) from public,anon;
grant execute on function public.landshop_is_task_supervisor(uuid) to authenticated;
drop policy if exists ls_assigned_tasks_supervisor_read on public.staff_tasks;
create policy ls_assigned_tasks_supervisor_read on public.staff_tasks
for select to authenticated using(assigned_by=(select auth.uid()) and public.landshop_is_task_supervisor((select auth.uid())));
drop policy if exists ls_task_events_supervisor_read on public.landshop_task_events;
create policy ls_task_events_supervisor_read on public.landshop_task_events
for select to authenticated using (exists(select 1 from public.staff_tasks t where t.id=task_id and t.assigned_by=(select auth.uid()) and public.landshop_is_task_supervisor((select auth.uid()))));
drop policy if exists ls_task_sessions_supervisor_read on public.landshop_task_work_sessions;
create policy ls_task_sessions_supervisor_read on public.landshop_task_work_sessions for select to authenticated
using(exists(select 1 from public.staff_tasks t where t.id=task_id and t.assigned_by=(select auth.uid()) and public.landshop_is_task_supervisor((select auth.uid()))));
create or replace function public.landshop_team_directory()
returns table(staff_id uuid,username text,role text)
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.landshop_is_task_supervisor(auth.uid()) then raise exception 'Supervisor role required';end if;
 return query select p.user_id,p.username,m.role from public.landshop_staff_profiles p
 join public.organization_members m on m.user_id=p.user_id and m.organization_id=p.organization_id
 where p.kyc_state='approved' and p.employment_state='active' and m.status='active'
 order by p.username limit 500;
end $$;
revoke all on function public.landshop_team_directory() from public,anon;
grant execute on function public.landshop_team_directory() to authenticated;
CREATE OR REPLACE FUNCTION public.landshop_staff_task_assign(p_assignee uuid, p_title text, p_details text, p_minutes integer, p_delay integer, p_due timestamp with time zone)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_actor uuid:=auth.uid();v_org uuid;v_id uuid;
begin
 if v_actor is null or not public.landshop_is_task_supervisor(v_actor) then raise exception 'Manager authorization required';end if;
 if length(btrim(coalesce(p_title,''))) not between 5 and 180 or length(coalesce(p_details,''))>5000
 or p_minutes not between 5 and 20160 or p_delay not between 0 and 10080 or
 p_due is null or p_due<=now() or p_due>now()+interval '366 days'
 then raise exception 'Valid task title, estimated duration, delay allowance and future deadline required';end if;
 select organization_id into v_org from public.organizations where kind='landshop';
 if not exists(select 1 from public.organization_members where organization_id=v_org and user_id=p_assignee and status='active')
 then raise exception 'Assignee is not an active Landshop team member';end if;
 insert into public.staff_tasks(organization_id,assignee_id,assigned_by,title,details,starts_at,due_at,status,planned_minutes,delay_allowance_minutes,expected_outcome)
 values(v_org,p_assignee,v_actor,btrim(p_title),left(p_details,5000),now(),p_due,'assigned',p_minutes,p_delay,left(p_details,2000)) returning id into v_id;
 insert into public.landshop_task_events(task_id,actor_id,event_type,note) values(v_id,v_actor,'assigned','Planned '||p_minutes||' minutes; allowed delay '||p_delay||' minutes');
 insert into public.audit_events(actor_id,event_type,metadata) values(v_actor,'staff.task_assigned',jsonb_build_object('task_id',v_id,'assignee_id',p_assignee,'planned_minutes',p_minutes));
 return v_id;
end $function$
;
CREATE OR REPLACE FUNCTION public.landshop_staff_task_review(p_task uuid, p_approve boolean, p_score integer, p_comment text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_actor uuid:=auth.uid();v_task public.staff_tasks%rowtype;
begin
 if v_actor is null or not public.landshop_is_task_supervisor(v_actor) then raise exception 'Management review required';end if;
 if p_score not between 0 and 100 or length(btrim(coalesce(p_comment,'')))<20 then raise exception 'An evidence-based score and 20-character review are required';end if;
 select * into v_task from public.staff_tasks where id=p_task for update;
 if not found or v_task.status<>'submitted' or (v_actor=v_task.assignee_id or (v_actor<>v_task.assigned_by and not public.landshop_is_management(v_actor))) then raise exception 'Task not eligible for independent supervisor review';end if;
 update public.staff_tasks set status=case when p_approve then 'accepted' else 'returned' end,
 score=case when p_approve then p_score else null end,scored_by=case when p_approve then v_actor else null end,
 reviewed_at=now(),review_comment=left(p_comment,2000) where id=p_task;
 insert into public.landshop_task_events(task_id,actor_id,event_type,note) values(p_task,v_actor,case when p_approve then 'accepted' else 'returned' end,left(p_comment,2000));
 insert into public.audit_events(actor_id,event_type,metadata) values(v_actor,'staff.task_review',jsonb_build_object('task_id',p_task,'score',p_score,'approved',p_approve));
 return true;
end $function$
;
