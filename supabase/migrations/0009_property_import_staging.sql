-- Staff-only staged CSV imports. Does not auto-create or publish properties.
-- An approved ingestion worker must later revalidate accepted rows.
create or replace function public.landshop_property_import_stage(
 p_filename text,p_rows jsonb
) returns uuid language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=auth.uid(); v_batch uuid; v_record jsonb;
 v_index integer:=0;v_errors jsonb; v_title text;v_type text;v_price text;
begin
 if v_user is null or not public.landshop_property_editor(v_user,false)
  then raise exception 'Property import access denied';end if;
 if char_length(btrim(coalesce(p_filename,'')))<1 or char_length(p_filename)>180
    or lower(right(p_filename,4))<>'.csv' then
   raise exception 'A CSV filename is required'; end if;
 if jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows)<1
    or jsonb_array_length(p_rows)>100 then
   raise exception 'Import batches require 1–100 records'; end if;
 if pg_column_size(p_rows)>262144 then
   raise exception 'Import payload exceeds 256KB';end if;
 insert into public.property_import_batches(created_by,source_filename)
 values(v_user,btrim(p_filename)) returning id into v_batch;
 for v_record in select value from jsonb_array_elements(p_rows) loop
   v_index:=v_index+1; v_errors:='[]'::jsonb;
   if jsonb_typeof(v_record)<>'object' then raise exception 'Invalid row';end if;
   v_title:=btrim(coalesce(v_record->>'title',''));
   v_type:=lower(btrim(coalesce(v_record->>'property_type','')));
   v_price:=btrim(coalesce(v_record->>'price',''));
   if char_length(v_title)<5 or char_length(v_title)>180 then
      v_errors:=v_errors || '"Invalid title"'::jsonb;end if;
   if v_type not in ('land','house','apartment','commercial','shortlet') then
      v_errors:=v_errors || '"Invalid property type"'::jsonb;end if;
   if v_price<>'' then
     if v_price !~ '^[0-9]{1,12}([.][0-9]{1,2})?
   if exists(select 1 from public.properties p where lower(p.title)=lower(v_title)) then
      v_errors:=v_errors || '"Potential duplicate title"'::jsonb;end if;
   insert into public.property_import_rows(batch_id,row_number,raw_data,normalized,errors)
    values(v_batch,v_index,v_record,jsonb_build_object(
      'title',v_title,'property_type',v_type,'price',v_price,
      'state',left(coalesce(v_record->>'state',''),100),
      'city',left(coalesce(v_record->>'city',''),100)),v_errors);
 end loop;
 update public.property_import_batches set status='validated' where id=v_batch;
 insert into public.audit_events(actor_id,event_type,metadata)
 values(v_user,'property.import.staged',jsonb_build_object('batch_id',v_batch,'row_count',v_index));
 return v_batch;
end $$;
revoke all on function public.landshop_property_import_stage(text,jsonb) from public,anon;
grant execute on function public.landshop_property_import_stage(text,jsonb) to authenticated;
 then
       v_errors:=v_errors || '"Invalid NGN price"'::jsonb;
     elsif v_price::numeric>900000000000 then
       v_errors:=v_errors || '"Invalid NGN price"'::jsonb;
     end if;
   end if;
   if exists(select 1 from public.properties p where lower(p.title)=lower(v_title)) then
      v_errors:=v_errors || '"Potential duplicate title"'::jsonb;end if;
   insert into public.property_import_rows(batch_id,row_number,raw_data,normalized,errors)
    values(v_batch,v_index,v_record,jsonb_build_object(
      'title',v_title,'property_type',v_type,'price',v_price,
      'state',left(coalesce(v_record->>'state',''),100),
      'city',left(coalesce(v_record->>'city',''),100)),v_errors);
 end loop;
 update public.property_import_batches set status='validated' where id=v_batch;
 insert into public.audit_events(actor_id,event_type,metadata)
 values(v_user,'property.import.staged',jsonb_build_object('batch_id',v_batch,'row_count',v_index));
 return v_batch;
end $$;
revoke all on function public.landshop_property_import_stage(text,jsonb) from public,anon;
grant execute on function public.landshop_property_import_stage(text,jsonb) to authenticated;
