-- Existing GPS audit, geofences, task work sessions and scoring preserved.
-- Newly confirmed standard staff may clock and accept tasks immediately.
CREATE OR REPLACE FUNCTION public.landshop_staff_clock(p_action text, p_lat double precision, p_lng double precision, p_accuracy numeric, p_consent boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_user uuid:=auth.uid();v_org uuid;v_prev text;v_when timestamptz;v_id uuid;
v_loc extensions.geography;v_label text;v_office record;v_minutes integer;v_error text;
begin
 if v_user is null or not public.landshop_staff_can_work(v_user)
 then raise exception 'An active, email-verified staff account is required';end if;
 if p_action not in ('clock_in','clock_out') or p_consent is distinct from true then raise exception 'Explicit location consent is required at the clock action';end if;
 if p_lat is null or p_lng is null or p_lat not between -90 and 90 or p_lng not between -180 and 180
 or p_accuracy is null or p_accuracy<0 or p_accuracy>5000 then raise exception 'Reliable device GPS coordinates are required';end if;
 select organization_id into v_org from public.landshop_staff_profiles where user_id=v_user;
 perform pg_advisory_xact_lock(hashtext('ls_clock:'||v_user::text));
 select event_type,recorded_at into v_prev,v_when from public.attendance_events
 where staff_id=v_user order by recorded_at desc,id desc limit 1;
 if (p_action='clock_in' and v_prev='clock_in') or (p_action='clock_out' and v_prev is distinct from 'clock_in')
 then raise exception 'Clock sequence is invalid: check last clock status';end if;
 if v_when is not null and v_when>now()-interval '30 seconds' then raise exception 'Duplicate clock action; try later';end if;
 v_loc:=extensions.ST_SetSRID(extensions.ST_MakePoint(p_lng,p_lat),4326)::extensions.geography;
 select l.id,l.name,l.address into v_office from public.landshop_office_locations l
 where l.organization_id=v_org and l.active=true and
 extensions.ST_DWithin(l.location,v_loc,l.radius_m+least(p_accuracy::double precision,100))
 order by extensions.ST_Distance(l.location,v_loc) limit 1;
 v_label:=case when v_office.id is not null then v_office.name else 'External location (GPS recorded; address unverified)' end;
 insert into public.attendance_events(staff_id,organization_id,event_type,location,location_accuracy_m,location_label,permission_granted,source,status)
 values(v_user,v_org,p_action,v_loc,p_accuracy,v_label,true,'web','recorded') returning id into v_id;
 insert into public.audit_events(actor_id,event_type,metadata)
 values(v_user,'staff.attendance_clocked',jsonb_build_object('clock_event_id',v_id,'action',p_action,'place',v_label,'accuracy_m',p_accuracy));
 return jsonb_build_object('id',v_id,'action',p_action,'time',now(),'location_label',v_label,
 'latitude',p_lat,'longitude',p_lng,'accuracy_m',p_accuracy,
 'maps_url','https://www.google.com/maps/search/?api=1&query='||p_lat::text||','||p_lng::text,
 'geofence_match',v_office.id is not null,'warning','Browser coordinates may be spoofed; records require periodic management review');
end $function$
;
CREATE OR REPLACE FUNCTION public.landshop_staff_task_action(p_task uuid, p_action text, p_note text DEFAULT ''::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_user uuid:=auth.uid();v_task public.staff_tasks%rowtype;v_open uuid;
begin
 if v_user is null or not public.landshop_staff_can_work(v_user) then raise exception 'Active staff membership required';end if;
 perform pg_advisory_xact_lock(hashtext('ls_task:'||v_user::text));
 select * into v_task from public.staff_tasks where id=p_task for update;
 if not found or v_task.assignee_id<>v_user then raise exception 'Not your assigned task';end if;
 if p_action not in ('view','accept','start','pause','submit','blocked') then raise exception 'Unknown action';end if;
 if p_action='view' then
  update public.staff_tasks set viewed_at=coalesce(viewed_at,now()) where id=p_task;
 elsif p_action='accept' then
  if v_task.status<>'assigned' then raise exception 'Only a newly assigned task can be accepted';end if;
  update public.staff_tasks set accepted_at=coalesce(accepted_at,now()),viewed_at=coalesce(viewed_at,now()) where id=p_task;
 elsif p_action='start' then
  if v_task.status not in ('assigned','in_progress','returned','blocked') then raise exception 'Task is not startable';end if;
  if v_task.status='assigned' and v_task.accepted_at is null then raise exception 'Accept the task first';end if;
  insert into public.landshop_task_work_sessions(task_id,staff_id) values(p_task,v_user);
  update public.staff_tasks set status='in_progress',accepted_at=coalesce(accepted_at,now()),viewed_at=coalesce(viewed_at,now()),started_at=coalesce(started_at,now()) where id=p_task;
 elsif p_action='pause' then
  update public.landshop_task_work_sessions set ended_at=now() where staff_id=v_user and task_id=p_task and ended_at is null;
 elsif p_action='blocked' then
  if length(btrim(coalesce(p_note,'')))<10 then raise exception 'Describe the blocker';end if;
  update public.landshop_task_work_sessions set ended_at=now() where staff_id=v_user and task_id=p_task and ended_at is null;
  update public.staff_tasks set status='blocked',assignee_report=left(p_note,5000) where id=p_task;
 elsif p_action='submit' then
  if v_task.status not in ('assigned','in_progress','returned','blocked') or (v_task.status='assigned' and v_task.accepted_at is null)
   or length(btrim(coalesce(p_note,'')))<15
  then raise exception 'A 15-character completion report is required';end if;
  update public.landshop_task_work_sessions set ended_at=now() where staff_id=v_user and task_id=p_task and ended_at is null;
  update public.staff_tasks set status='submitted',submitted_at=now(),assignee_report=left(p_note,5000) where id=p_task;
 end if;
 insert into public.landshop_task_events(task_id,actor_id,event_type,note) values(p_task,v_user,p_action,left(p_note,5000));
 return true;
end $function$
;
