-- V38: supervisor's all-time task performance summary from the first assignment.
-- Returns aggregates only for tasks assigned by the verified supervisor.
create or replace function public.landshop_supervisor_task_summary()
returns table(
 total_tasks bigint,assigned_tasks bigint,in_progress_tasks bigint,
 submitted_tasks bigint,accepted_tasks bigint,returned_tasks bigint,
 blocked_tasks bigint,overdue_tasks bigint,average_accepted_score numeric
)
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.landshop_is_task_supervisor(auth.uid()) then
  raise exception 'Verified supervisor authorization required';
 end if;
 return query
 select
 count(*)::bigint,
 count(*) filter(where t.status='assigned')::bigint,
 count(*) filter(where t.status='in_progress')::bigint,
 count(*) filter(where t.status='submitted')::bigint,
 count(*) filter(where t.status='accepted')::bigint,
 count(*) filter(where t.status='returned')::bigint,
 count(*) filter(where t.status='blocked')::bigint,
 count(*) filter(where t.due_at<now() and t.status<>'accepted')::bigint,
 round(avg(t.score) filter(where t.status='accepted'),1)
 from public.staff_tasks t
 join public.organizations o on o.id=t.organization_id and o.kind='landshop'
 where t.assigned_by=auth.uid();
end $$;
revoke all on function public.landshop_supervisor_task_summary() from public,anon;
grant execute on function public.landshop_supervisor_task_summary() to authenticated;
