-- Production-applied migration landshop_v24_performance_metrics_and_human_only_payroll, version 20261030014752.
-- Never run this automatically on an already-migrated production database.

-- V24 evidence-based report card; payroll is NOT modified by scores.
create or replace function public.landshop_staff_performance(p_staff uuid,p_period text default 'month')
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_actor uuid:=auth.uid();v_start timestamptz;v_end timestamptz:=now();
v_scored integer;v_total integer;v_avg numeric;v_work numeric;v_planned numeric;
begin
 if v_actor is null or (v_actor<>p_staff and not public.landshop_is_management(v_actor))
 then raise exception 'Performance report is private';end if;
 if p_period not in ('day','week','month','year') then raise exception 'Choose day, week, month or year';end if;
 v_start:=(date_trunc(p_period,now() at time zone 'Africa/Lagos') at time zone 'Africa/Lagos');
 select count(*) filter(where t.status='accepted' and t.score is not null),
 count(*),round(sum(t.score*coalesce(t.planned_minutes,60)) filter(where t.status='accepted' and t.score is not null)/
 nullif(sum(coalesce(t.planned_minutes,60)) filter(where t.status='accepted' and t.score is not null),0),1),
 coalesce(sum(t.planned_minutes),0)
 into v_scored,v_total,v_avg,v_planned
 from public.staff_tasks t where t.assignee_id=p_staff
 and t.created_at>=v_start and t.created_at<=v_end;
 select round(coalesce(sum(extract(epoch from (coalesce(s.ended_at,now())-s.started_at)))/60,0),1) into v_work
 from public.landshop_task_work_sessions s where s.staff_id=p_staff and s.started_at>=v_start and s.started_at<=v_end;
 return jsonb_build_object('period',p_period,'start_at',v_start,'end_at',v_end,
 'assigned_tasks',v_total,'reviewed_tasks',v_scored,'score_percent',v_avg,
 'planned_minutes',v_planned,'tracked_work_minutes',v_work,
 'recommendation',case when v_scored<1 then 'insufficient_reviewed_tasks'
 when v_avg<70 then 'manager_coaching_review'
 when v_avg>=100 and v_scored>=5 then 'consider_promotion_after_human_review'
 else 'good_progress' end,
 'payroll_action','none; no automatic pay deduction allowed',
 'limitations','Human-set scores and planned minutes are context-sensitive; workload, delays, leave, accommodations and task difficulty require management consideration');
end $$;
revoke all on function public.landshop_staff_performance(uuid,text) from public,anon;
grant execute on function public.landshop_staff_performance(uuid,text) to authenticated;
create or replace function public.landshop_staff_annual_ranking(p_year integer)
returns table(staff_id uuid,staff_number text,username text,tasks_scored bigint,score_percent numeric,rank_position bigint,recommendation text)
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.landshop_is_management(auth.uid()) then raise exception 'Command Center only';end if;
 if p_year not between 2020 and 2100 then raise exception 'Invalid report year';end if;
 return query
 with scores as (
 select t.assignee_id as sid,count(*) as reviewed,
 round(sum(t.score*coalesce(t.planned_minutes,60))/nullif(sum(coalesce(t.planned_minutes,60)),0),1) as avg_score
 from public.staff_tasks t
 where t.status='accepted' and t.score is not null
 and t.reviewed_at>=make_timestamptz(p_year,1,1,0,0,0,'Africa/Lagos')
 and t.reviewed_at<make_timestamptz(p_year+1,1,1,0,0,0,'Africa/Lagos')
 group by t.assignee_id
 )
 select p.user_id,p.staff_number,p.username,coalesce(s.reviewed,0),
 s.avg_score,dense_rank() over(order by s.avg_score desc nulls last),
 case when s.reviewed is null or s.reviewed<5 then 'insufficient_reviewed_tasks'
 when s.avg_score<70 then 'manager_coaching_review'
 when s.avg_score>=100 then 'consider_promotion_after_human_review'
 else 'good_progress' end
 from public.landshop_staff_profiles p
 left join scores s on s.sid=p.user_id
 where p.employment_state='active'
 order by s.avg_score desc nulls last,p.username;
end $$;
revoke all on function public.landshop_staff_annual_ranking(integer) from public,anon;
grant execute on function public.landshop_staff_annual_ranking(integer) to authenticated;

