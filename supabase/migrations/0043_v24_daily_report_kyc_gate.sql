-- Applied on production Supabase as landshop_v24_require_current_identity_for_daily_work_reports (20261030015932)
CREATE OR REPLACE FUNCTION public.landshop_staff_daily_report(p_summary text, p_blockers text DEFAULT ''::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_user uuid:=auth.uid();v_day date:=(now() at time zone 'Africa/Lagos')::date;
begin
 if v_user is null or not public.landshop_staff_can_work(v_user) then raise exception 'Current approved staff identity required';end if;
 if length(btrim(coalesce(p_summary,''))) not between 20 and 6000 or length(coalesce(p_blockers,''))>3000 then raise exception 'Daily report should contain 20-6000 characters';end if;
 insert into public.landshop_staff_daily_reports(staff_id,report_date,summary,blockers)
 values(v_user,v_day,btrim(p_summary),left(p_blockers,3000))
 on conflict(staff_id,report_date) do update set summary=excluded.summary,blockers=excluded.blockers,updated_at=now();
 insert into public.audit_events(actor_id,event_type,metadata) values(v_user,'staff.daily_report_submitted',jsonb_build_object('date',v_day));
 return true;
end $function$
;
