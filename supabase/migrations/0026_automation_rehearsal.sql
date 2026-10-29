-- Landshop V16.1: durable, audit-backed workflow rehearsal.
-- Rehearsals are NOT live workflow activations; they never send messages,
-- create appointments, call webhooks, approve loans or move funds.
-- Each advance is atomic, version-snapshotted and limited to one node.
create or replace function public.landshop_automation_rehearse(
 p_workflow uuid,p_expected_version integer
) returns uuid
language plpgsql security definer set search_path=''
as $body$
declare
 v_user uuid := auth.uid();
 v_flow public.automation_workflows%rowtype;
 v_graph jsonb;
 v_trigger text;
 v_run uuid;
begin
 if v_user is null or not public.landshop_property_editor(v_user,true) then
   raise exception 'Workflow rehearsal requires authorized Landshop staff';
 end if;
 if p_workflow is null or p_expected_version is null then
   raise exception 'Workflow and version are required';
 end if;
 select * into v_flow from public.automation_workflows
  where id=p_workflow for share;
 if not found or v_flow.version<>p_expected_version then
   raise exception 'Save the latest workflow version before rehearsal';
 end if;
 v_graph:=v_flow.draft_graph;
 if jsonb_typeof(v_graph->'nodes')<>'array'
    or jsonb_typeof(v_graph->'edges')<>'array'
    or jsonb_array_length(v_graph->'nodes') not between 2 and 100
    or jsonb_array_length(v_graph->'edges')>160
    or pg_column_size(v_graph)>65536 then
   raise exception 'Workflow is not ready for rehearsal';
 end if;
 if (select count(*) from jsonb_array_elements(v_graph->'nodes') n where n->>'type'='trigger')<>1
    or (select count(*) from jsonb_array_elements(v_graph->'nodes') n where n->>'type'='end')<1
    or (select count(distinct n->>'id') from jsonb_array_elements(v_graph->'nodes') n)
       <>jsonb_array_length(v_graph->'nodes') then
   raise exception 'Workflow requires unique nodes, one trigger and one end';
 end if;
 if exists (
  select 1 from jsonb_array_elements(v_graph->'edges') e
  where not exists(select 1 from jsonb_array_elements(v_graph->'nodes') n where n->>'id'=e->>'from')
     or not exists(select 1 from jsonb_array_elements(v_graph->'nodes') n where n->>'id'=e->>'to')
     or coalesce(e->>'from','')=coalesce(e->>'to','')
 ) then
  raise exception 'Workflow has invalid connections';
 end if;
 if (
  select count(*) from public.automation_runs
  where started_at>now()-interval '24 hours'
    and context->>'mode'='rehearsal'
    and context->>'started_by'=v_user::text
 )>=30 then
  raise exception 'Daily rehearsal quota reached';
 end if;
 select n->>'id' into v_trigger from jsonb_array_elements(v_graph->'nodes') n
  where n->>'type'='trigger' limit 1;
 insert into public.automation_runs(workflow_id,version,status,context)
 values(v_flow.id,v_flow.version,'running',
  jsonb_build_object(
   'mode','rehearsal','started_by',v_user,'graph_snapshot',v_graph,
   'current_node',v_trigger,'visited',jsonb_build_array(),
   'step_count',0,'external_actions_executed',0
  ))
 returning id into v_run;
 insert into public.automation_run_events(run_id,node_id,event_type,details)
 values(v_run,v_trigger,'rehearsal.started',jsonb_build_object(
  'version',v_flow.version,'actor',v_user,'external_actions_executed',0
 ));
 insert into public.audit_events(actor_id,event_type,metadata)
 values(v_user,'automation.rehearsal_started',jsonb_build_object('workflow_id',v_flow.id,'run_id',v_run));
 return v_run;
end;
$body$;

create or replace function public.landshop_automation_rehearsal_step(
 p_run uuid,p_next_node text default null
) returns jsonb
language plpgsql security definer set search_path=''
as $body$
declare
 v_user uuid:=auth.uid();
 v_run public.automation_runs%rowtype;
 v_graph jsonb;
 v_current text;
 v_node jsonb;
 v_type text;
 v_targets jsonb;
 v_next text;
 v_steps integer;
 v_completed boolean:=false;
begin
 if v_user is null or not public.landshop_property_editor(v_user,true) then
  raise exception 'Workflow rehearsal requires authorized Landshop staff';
 end if;
 select * into v_run from public.automation_runs where id=p_run for update;
 if not found or v_run.status<>'running'
    or v_run.context->>'mode'<>'rehearsal' then
  raise exception 'No running rehearsal was found';
 end if;
 if v_run.context->>'started_by'<>v_user::text then
  raise exception 'Only the creator may advance this rehearsal';
 end if;
 v_steps:=coalesce((v_run.context->>'step_count')::integer,0);
 if v_steps>=100 then
  raise exception 'Rehearsal step limit reached';
 end if;
 v_graph:=v_run.context->'graph_snapshot';
 v_current:=v_run.context->>'current_node';
 select n into v_node from jsonb_array_elements(v_graph->'nodes') n
 where n->>'id'=v_current limit 1;
 if v_node is null then
  raise exception 'Saved rehearsal step is unavailable';
 end if;
 v_type:=v_node->>'type';
 select coalesce(jsonb_agg(e->>'to' order by e->>'to'),'[]'::jsonb)
 into v_targets from jsonb_array_elements(v_graph->'edges') e
 where e->>'from'=v_current;
 if v_type<>'end' and jsonb_array_length(v_targets)=0 then
  raise exception 'This step has no next connection. Edit and save the diagram';
 end if;
 if v_type='end' then
  v_completed:=true;
  v_next:=null;
 elsif p_next_node is not null then
  if not v_targets ? p_next_node then
   raise exception 'Chosen next step is not connected to the current node';
  end if;
  v_next:=p_next_node;
 elsif jsonb_array_length(v_targets)=1 then
  v_next:=v_targets->>0;
 else
  raise exception 'Select a valid next branch before continuing';
 end if;
 if v_next is not null and (v_run.context->'visited') ? v_next then
  raise exception 'Cycle detected in rehearsal; edit the workflow before retrying';
 end if;
 insert into public.automation_run_events(run_id,node_id,event_type,details)
 values(
  p_run,v_current,
  case when v_type in ('notification','webhook') then 'rehearsal.external_action_skipped'
       when v_type='approval' then 'rehearsal.approval_not_granted'
       when v_type='wait' then 'rehearsal.wait_not_scheduled'
       when v_type='end' then 'rehearsal.completed'
       else 'rehearsal.step_reviewed' end,
  jsonb_build_object('node_type',v_type,'next_node',v_next,'actor',v_user,
                     'external_actions_executed',0)
 );
 update public.automation_runs
 set status=case when v_completed then 'completed' else 'running' end,
     completed_at=case when v_completed then now() else null end,
     context=jsonb_set(
       jsonb_set(
         jsonb_set(v_run.context,'{current_node}',to_jsonb(v_next),true),
         '{visited}',coalesce(v_run.context->'visited','[]'::jsonb)||to_jsonb(v_current),true),
       '{step_count}',to_jsonb(v_steps+1),true
     )
 where id=p_run;
 return jsonb_build_object(
  'run_id',p_run,'status',case when v_completed then 'completed' else 'running' end,
  'processed_node',v_current,'next_node',v_next,
  'step_count',v_steps+1,'node_type',v_type,'external_actions_executed',0
 );
end;
$body$;

revoke all on function public.landshop_automation_rehearse(uuid,integer) from public,anon;
revoke all on function public.landshop_automation_rehearsal_step(uuid,text) from public,anon;
grant execute on function public.landshop_automation_rehearse(uuid,integer) to authenticated;
grant execute on function public.landshop_automation_rehearsal_step(uuid,text) to authenticated;
