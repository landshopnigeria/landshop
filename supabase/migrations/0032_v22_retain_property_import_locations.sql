-- Applied to production Supabase as landshop_v22_retain_imported_estate_location_price_data / 20261029212611.
-- Only source-grounded draft records, never automatically published.

-- V22.1: retain the exact estate, state, town, plot reference, size and price from reviewed CSV imports.
create or replace function public.landshop_property_import_stage(p_filename text,p_rows jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_batch uuid;v_record jsonb;v_index integer:=0;
v_errors jsonb;v_title text;v_type text;v_price text;v_estate text;v_state text;v_city text;
v_size text;v_raw jsonb;v_house integer;
begin
 if v_user is null or not public.landshop_property_editor(v_user,false) then raise exception 'Property import access denied';end if;
 if length(btrim(coalesce(p_filename,''))) not between 5 and 180 or right(lower(p_filename),4)<>'.csv'
 then raise exception 'A valid CSV filename is required';end if;
 if jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows) not between 1 and 100 or pg_column_size(p_rows)>262144 then
 raise exception 'Maximum 100 CSV rows and 256 KB per upload';end if;
 insert into public.property_import_batches(created_by,source_filename) values(v_user,btrim(p_filename)) returning id into v_batch;
 for v_record in select value from jsonb_array_elements(p_rows) loop
  v_index:=v_index+1;v_errors:='[]'::jsonb;
  if jsonb_typeof(v_record)<>'object' then raise exception 'CSV record is not an object';end if;
  v_title:=btrim(coalesce(v_record->>'title',''));
  v_type:=lower(btrim(coalesce(v_record->>'property_type','')));
  v_price:=btrim(coalesce(v_record->>'price',''));
  v_estate:=btrim(coalesce(v_record->>'estate',''));
  v_state:=btrim(coalesce(v_record->>'state',''));
  v_city:=btrim(coalesce(v_record->>'city',''));
  v_size:=btrim(coalesce(v_record->>'size_sqm',''));
  if length(v_title) not between 5 and 180 then v_errors:=v_errors||jsonb_build_array('Title must be 5-180 characters');end if;
  if v_type not in ('land','house','apartment','commercial','shortlet') then v_errors:=v_errors||jsonb_build_array('Invalid property type');end if;
  if length(v_estate) not between 4 and 180 then v_errors:=v_errors||jsonb_build_array('Estate is required for location matching');end if;
  if length(v_state) not between 3 and 50 then v_errors:=v_errors||jsonb_build_array('Nigerian state or FCT is required');end if;
  if length(v_city) not between 2 and 100 then v_errors:=v_errors||jsonb_build_array('City/town is required');end if;
  if v_price='' or v_price !~ '^[0-9]{1,12}([.][0-9]{1,2})?$' then
    v_errors:=v_errors||jsonb_build_array('Current NGN price is required');
  elsif v_price::numeric<=0 or v_price::numeric>900000000000 then
    v_errors:=v_errors||jsonb_build_array('NGN price is out of range');
  end if;
  if v_size<>'' then
    if v_size !~ '^[0-9]{1,10}([.][0-9]{1,3})?$' then v_errors:=v_errors||jsonb_build_array('Invalid property size');
    elsif v_size::numeric<=0 or v_size::numeric>100000000 then v_errors:=v_errors||jsonb_build_array('Property size outside expected bounds');end if;
  end if;
  if length(coalesce(v_record->>'plot_number',''))>90 or length(coalesce(v_record->>'lga',''))>100 or length(coalesce(v_record->>'area',''))>120 then v_errors:=v_errors||jsonb_build_array('Plot, LGA or area is too long');end if;
  if exists(select 1 from public.properties p join public.estates e on e.id=p.estate_id where lower(p.title)=lower(v_title) and lower(e.name)=lower(v_estate) and lower(e.state)=lower(v_state))
   then v_errors:=v_errors||jsonb_build_array('Potential duplicate listing for this estate');end if;
  if exists(select 1 from public.property_import_rows r where r.batch_id=v_batch and lower(r.normalized->>'title')=lower(v_title) and lower(r.normalized->>'estate')=lower(v_estate))
   then v_errors:=v_errors||jsonb_build_array('Duplicate listing in current CSV batch');end if;
  v_raw:=jsonb_build_object('title',v_title,'property_type',v_type,'price',v_price,'estate',v_estate,'state',v_state,'city',v_city,
    'lga',left(coalesce(v_record->>'lga',''),100),'area',left(coalesce(v_record->>'area',''),120),
    'plot_number',left(coalesce(v_record->>'plot_number',''),90),'size_sqm',v_size,
    'sale_mode',left(coalesce(v_record->>'sale_mode','Buy'),15),'bedrooms',left(coalesce(v_record->>'bedrooms',''),4));
  insert into public.property_import_rows(batch_id,row_number,raw_data,normalized,errors) values(v_batch,v_index,v_record,v_raw,v_errors);
 end loop;
 update public.property_import_batches set status='validated' where id=v_batch;
 insert into public.audit_events(actor_id,event_type,metadata) values(v_user,'property.import.staged',jsonb_build_object('batch_id',v_batch,'rows',v_index));
 return v_batch;
end $$;
revoke all on function public.landshop_property_import_stage(text,jsonb) from public,anon;
grant execute on function public.landshop_property_import_stage(text,jsonb) to authenticated;
create or replace function public.landshop_import_promote(p_batch uuid)
returns integer language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_batch public.property_import_batches%rowtype;v_row record;
v_price text;v_estate_name text;v_state text;v_city text;v_estate uuid;v_new uuid;
v_count integer:=0;v_size numeric;v_bedrooms integer;v_mode text;
begin
 if v_user is null or not public.landshop_property_editor(v_user,true) then raise exception 'Import promoter permission denied';end if;
 select * into v_batch from public.property_import_batches where id=p_batch for update;
 if not found or v_batch.status<>'approved' or v_batch.approved_by is null then raise exception 'Batch must be approved';end if;
 if v_batch.approved_by=v_user then raise exception 'Separate authorized promoter required';end if;
 for v_row in select * from public.property_import_rows where batch_id=p_batch order by row_number loop
  if jsonb_array_length(v_row.errors)>0 then raise exception 'Import contains validation errors';end if;
  v_price:=btrim(coalesce(v_row.normalized->>'price',''));
  v_state:=btrim(coalesce(v_row.normalized->>'state',''));
  v_city:=btrim(coalesce(v_row.normalized->>'city',''));
  v_estate_name:=btrim(coalesce(v_row.normalized->>'estate',''));
  if length(v_estate_name)<4 or length(v_state)<3 or length(v_city)<2
    or v_price !~ '^[0-9]{1,12}([.][0-9]{1,2})?$' or v_price::numeric<=0
    then raise exception 'Estate, state, city and actual price required before promotion';end if;
  select id into v_estate from public.estates where lower(name)=lower(v_estate_name) and lower(state)=lower(v_state) for update;
  if v_estate is null then
   insert into public.estates(name,state,city,lga,area,status,created_by,source_note)
   values(v_estate_name,v_state,v_city,nullif(v_row.normalized->>'lga',''),nullif(v_row.normalized->>'area',''),'draft',v_batch.created_by,
   'Created from staff-reviewed import: '||v_batch.source_filename||'; verify estate identity, location and publication rights')
   returning id into v_estate;
  end if;
  if exists(select 1 from public.properties where estate_id=v_estate and lower(title)=lower(v_row.normalized->>'title')) then raise exception 'Duplicate property within estate';end if;
  v_size:=nullif(v_row.normalized->>'size_sqm','')::numeric;
  v_bedrooms:=nullif(v_row.normalized->>'bedrooms','')::integer;
  v_mode:=nullif(v_row.normalized->>'sale_mode','');
  if v_mode is not null and v_mode not in ('Buy','Rent','Shortlet') then raise exception 'Unsupported sale mode';end if;
  if v_bedrooms is not null and v_bedrooms not between 0 and 100 then raise exception 'Bedrooms out of range';end if;
  insert into public.properties(title,property_type,amount_kobo,created_by,status,estate_id,sale_mode,bedrooms,land_area_sqm,floor_area_sqm,source_price_note)
  values(v_row.normalized->>'title',v_row.normalized->>'property_type',(v_price::numeric*100)::bigint,v_batch.created_by,'draft',v_estate,
   coalesce(v_mode,'Buy'),v_bedrooms,
   case when v_row.normalized->>'property_type'='land' then v_size else null end,
   case when v_row.normalized->>'property_type'<>'land' then v_size else null end,
   'Staff-imported asking price from '||v_batch.source_filename||'; must be reconfirmed before publication.')
  returning id into v_new;
  insert into public.property_showcase_drafts(property_id,payload,edited_by)
  values(v_new,jsonb_build_object('city',v_city,'state',v_state,'lga',coalesce(v_row.normalized->>'lga',''),
   'import_plot_reference',coalesce(v_row.normalized->>'plot_number',''),
   'import_area',coalesce(v_row.normalized->>'area',''),
   'source_batch_id',p_batch),v_batch.created_by);
  v_count:=v_count+1;
 end loop;
 update public.property_import_batches set status='imported' where id=p_batch;
 insert into public.audit_events(actor_id,event_type,metadata) values(v_user,'property.import.promoted',jsonb_build_object('batch_id',p_batch,'drafts',v_count));
 return v_count;
end $$;
revoke all on function public.landshop_import_promote(uuid) from public,anon;
grant execute on function public.landshop_import_promote(uuid) to authenticated;

