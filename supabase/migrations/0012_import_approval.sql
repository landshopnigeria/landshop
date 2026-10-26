-- Import approval is separate from import staging; nothing auto-publishes.
alter table public.property_import_batches
 add column if not exists approved_by uuid references auth.users(id);
alter table public.property_import_batches
 add column if not exists approved_at timestamptz;
alter table public.property_import_batches
 add column if not exists decision_reason text;

create or replace function public.landshop_import_approve(p_batch uuid,p_approve boolean,p_reason text)
returns text language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=auth.uid(); v_batch public.property_import_batches%rowtype; v_status text;
begin
 if v_user is null or not public.landshop_property_editor(v_user,true) then
  raise exception 'Import approval permission denied';end if;
 if char_length(btrim(coalesce(p_reason,''))) not between 15 and 1000 then
  raise exception 'Review reason must contain 15–1000 characters';end if;
 select * into v_batch from public.property_import_batches where id=p_batch for update;
 if not found or v_batch.status<>'validated' then
  raise exception 'Batch must be validated before review';end if;
 if v_batch.created_by=v_user then raise exception 'Batch creator cannot approve import';end if;
 if p_approve and exists(
  select 1 from public.property_import_rows r
  where r.batch_id=p_batch and jsonb_array_length(r.errors)>0
 ) then raise exception 'Batch has validation errors';end if;
 if p_approve and exists(
  select 1 from public.property_import_rows r
  join public.properties p on lower(p.title)=lower(r.normalized->>'title')
  where r.batch_id=p_batch
 ) then raise exception 'Batch contains an existing property title';end if;
 v_status:=case when p_approve then 'approved' else 'rejected' end;
 update public.property_import_batches set status=v_status,approved_by=v_user,
   approved_at=now(),decision_reason=btrim(p_reason) where id=p_batch;
 insert into public.audit_events(actor_id,event_type,metadata) values
 (v_user,'property.import.reviewed',jsonb_build_object('batch_id',p_batch,'outcome',v_status));
 return v_status;
end $$;
revoke all on function public.landshop_import_approve(uuid,boolean,text) from public,anon;
grant execute on function public.landshop_import_approve(uuid,boolean,text) to authenticated;

create or replace function public.landshop_import_promote(p_batch uuid)
returns integer language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=auth.uid();v_batch public.property_import_batches%rowtype;
 v_row record;v_amount bigint;v_count integer:=0;v_price text;
begin
 if v_user is null or not public.landshop_property_editor(v_user,true) then
  raise exception 'Import permission denied';end if;
 select * into v_batch from public.property_import_batches where id=p_batch for update;
 if not found or v_batch.status <> 'approved' or v_batch.approved_by is null then
  raise exception 'Approved import batch required';end if;
 if v_batch.approved_by=v_user then
  raise exception 'Import must be promoted by a second authorized operator';end if;
 for v_row in select * from public.property_import_rows where batch_id=p_batch order by row_number loop
  if jsonb_array_length(v_row.errors)>0 then raise exception 'Invalid import row';end if;
  if exists(select 1 from public.properties p where lower(p.title)=lower(v_row.normalized->>'title'))
    then raise exception 'Duplicate property detected';end if;
  v_price:=coalesce(v_row.normalized->>'price','');
  if v_price <> '' then
    if v_price !~ '^[0-9]{1,12}([.][0-9]{1,2})?$' then raise exception 'Invalid price';end if;
    v_amount:=(v_price::numeric * 100)::bigint;
  else v_amount:=null;
  end if;
  insert into public.properties(title,property_type,amount_kobo,created_by,status)
  values(v_row.normalized->>'title',v_row.normalized->>'property_type',v_amount,
         v_batch.created_by,'draft');
  v_count:=v_count+1;
 end loop;
 update public.property_import_batches set status='imported' where id=p_batch;
 insert into public.audit_events(actor_id,event_type,metadata)
 values(v_user,'property.import.promoted',jsonb_build_object('batch_id',p_batch,'drafts',v_count));
 return v_count;
end $$;
revoke all on function public.landshop_import_promote(uuid) from public,anon;
grant execute on function public.landshop_import_promote(uuid) to authenticated;
