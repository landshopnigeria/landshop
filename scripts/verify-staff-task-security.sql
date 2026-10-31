-- Landshop staff task safety gate: read-only, no PII, no account mutation.
-- Returns exactly ready/not-ready with psql -XAt.
with funcs as (
 select
 pg_get_functiondef('public.landshop_team_directory()'::regprocedure) as directory_fn,
 pg_get_functiondef('public.landshop_staff_task_assign(uuid,text,text,integer,integer,timestamptz)'::regprocedure) as assign_fn,
 pg_get_functiondef('public.landshop_supervisor_task_summary()'::regprocedure) as summary_fn
), checks as (
 select
 not has_function_privilege('anon','public.landshop_team_directory()','EXECUTE') as no_anon_directory,
 not has_function_privilege('anon','public.landshop_staff_task_assign(uuid,text,text,integer,integer,timestamptz)','EXECUTE') as no_anon_assignment,
 not has_function_privilege('anon','public.landshop_supervisor_task_summary()','EXECUTE') as no_anon_summary,
 position('public.landshop_is_task_supervisor(auth.uid())' in directory_fn)>0 as directory_authorization,
 position('public.landshop_staff_can_work(p.user_id)' in directory_fn)>0 as verified_employee_directory,
 position('m.user_id<>auth.uid()' in directory_fn)>0 as hides_self_from_directory,
 position('public.landshop_is_task_supervisor(v_actor)' in assign_fn)>0 as assignment_authorization,
 position('p_assignee=v_actor' in assign_fn)>0 as blocks_self_assignment,
 position('public.landshop_staff_can_work(p_assignee)' in assign_fn)>0 as verifies_assignee,
 position('m.status=''active''' in assign_fn)>0 as active_membership_required,
 position('public.landshop_is_task_supervisor(auth.uid())' in summary_fn)>0 as summary_authorization,
 position('t.assigned_by=auth.uid()' in summary_fn)>0 as summary_scoped_to_supervisor
 from funcs
)
select case when (
 select bool_and(ok) from (
  select unnest(array[
   no_anon_directory,no_anon_assignment,no_anon_summary,
   directory_authorization,verified_employee_directory,hides_self_from_directory,
   assignment_authorization,blocks_self_assignment,verifies_assignee,
   active_membership_required,summary_authorization,summary_scoped_to_supervisor
  ]) as ok from checks
 ) x
) then 'ready' else 'not-ready' end;
