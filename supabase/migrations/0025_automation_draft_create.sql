-- Landshop V16: create new user-designed automation graph as governed DRAFT only.
-- Runtime delivery, publication and external provider activation are intentionally absent.
create or replace function public.landshop_automation_create(
 p_name text,p_description text,p_graph jsonb
) returns uuid
language plpgsql security definer set search_path=''
as $function$
declare
 v_user uuid := auth.uid();
 v_id uuid;
 v_slug text := 'draft-' || replace(gen_random_uuid()::text,'-','');
begin
 -- Membership is looked up in server-owned tables, never editable user metadata.
 if v_user is null or not exists (
  select 1 from public.organization_members m
  join public.organizations o on o.id=m.organization_id
  where m.user_id=v_user and m.status='active' and o.kind='landshop'
   and m.role in ('owner','admin','operations','legal')
 ) then
  raise exception 'Landshop automation author permission required';
 end if;
 if p_name is null or char_length(btrim(p_name)) not between 5 and 100 or
    char_length(coalesce(p_description,''))>1500 then
  raise exception 'Invalid workflow title or description';
 end if;
 if p_graph is null or jsonb_typeof(p_graph)<>'object'
    or jsonb_typeof(p_graph->'nodes')<>'array'
    or jsonb_typeof(p_graph->'edges')<>'array'
    or pg_column_size(p_graph)>65536 then
  raise exception 'Invalid workflow graph payload';
 end if;
 if jsonb_array_length(p_graph->'nodes') not between 2 and 100
    or jsonb_array_length(p_graph->'edges')>160 then
  raise exception 'Workflow size is not supported';
 end if;
 if exists (
  select 1 from jsonb_array_elements(p_graph->'nodes') n
  where jsonb_typeof(n)<>'object'
    or coalesce(n->>'type','') not in ('trigger','condition','notification','wait','approval','task','webhook','end')
    or char_length(coalesce(n->>'id','')) not between 1 and 80
    or char_length(coalesce(n->>'label','')) not between 1 and 80
 ) then
  raise exception 'Workflow contains invalid nodes';
 end if;
 if (select count(distinct n->>'id') from jsonb_array_elements(p_graph->'nodes') n)
     <> jsonb_array_length(p_graph->'nodes') then
  raise exception 'Workflow node identifiers must be unique';
 end if;
 if (select count(*) from jsonb_array_elements(p_graph->'nodes') n where n->>'type'='trigger') <> 1
    or (select count(*) from jsonb_array_elements(p_graph->'nodes') n where n->>'type'='end') < 1 then
  raise exception 'Workflow requires one trigger and at least one end';
 end if;
 if exists (
  select 1 from jsonb_array_elements(p_graph->'edges') edge
  where jsonb_typeof(edge)<>'object'
  or coalesce(edge->>'from','')=coalesce(edge->>'to','')
  or not exists(select 1 from jsonb_array_elements(p_graph->'nodes') node where node->>'id'=edge->>'from')
  or not exists(select 1 from jsonb_array_elements(p_graph->'nodes') node where node->>'id'=edge->>'to')
 ) then
  raise exception 'Workflow contains invalid connections';
 end if;
 insert into public.automation_workflows(
  slug,name,description,draft_graph,state,edited_by
 ) values(
  v_slug,btrim(p_name),nullif(btrim(coalesce(p_description,'')),''),p_graph,'draft',v_user
 ) returning id into v_id;
 insert into public.audit_events(actor_id,event_type,metadata)
 values(v_user,'automation.draft_created',jsonb_build_object('workflow_id',v_id,'nodes',jsonb_array_length(p_graph->'nodes')));
 return v_id;
end;
$function$;
revoke all on function public.landshop_automation_create(text,text,jsonb) from PUBLIC,anon;
grant execute on function public.landshop_automation_create(text,text,jsonb) to authenticated;
