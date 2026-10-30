-- Landshop production release gate — READ ONLY.
-- Do not create accounts, update roles, manipulate approval state or select PII.
-- Run with psql -XAt: outputs exactly ready / not-ready for CI.
WITH source AS (
 SELECT
 (SELECT pg_get_functiondef(p.oid) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='landshop_staff_review' LIMIT 1) AS review_fn,
 (SELECT pg_get_functiondef(p.oid) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='landshop_staff_onboard' LIMIT 1) AS onboard_fn,
 (SELECT pg_get_functiondef(p.oid) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='landshop_staff_can_work' LIMIT 1) AS work_fn
), checks AS (
 SELECT
 (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relname IN ('landshop_staff_profiles','organization_members','staff_tasks')
  AND c.relrowsecurity)=3 AS protected_tables,
 (SELECT count(*) FROM pg_policies
  WHERE schemaname='public' AND tablename IN ('landshop_staff_profiles','organization_members')
  AND cmd IN ('INSERT','UPDATE','DELETE','ALL'))=0 AS no_client_staff_writes,
 (SELECT pg_get_expr(d.adbin,d.adrelid) FROM pg_attrdef d JOIN pg_attribute a
  ON a.attrelid=d.adrelid AND a.attnum=d.adnum
  WHERE d.adrelid='public.landshop_staff_profiles'::regclass AND a.attname='employment_state')='''pending''::text' AS pending_by_default,
 (SELECT pg_get_expr(d.adbin,d.adrelid) FROM pg_attrdef d JOIN pg_attribute a
  ON a.attrelid=d.adrelid AND a.attnum=d.adnum
  WHERE d.adrelid='public.landshop_staff_profiles'::regclass AND a.attname='kyc_state')='''not_submitted''::text' AS unverified_by_default,
 (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname IN
   ('landshop_staff_onboard','landshop_staff_review','landshop_staff_clock','landshop_staff_submit_photo')
  AND NOT has_function_privilege('anon',p.oid,'EXECUTE'))=4 AS no_anonymous_staff_mutations,
 coalesce(position('v_actor=p_user' IN review_fn)>0,false)
  AND coalesce(position('landshop_is_management(v_actor)' IN review_fn)>0,false) AS reviewer_checked,
 coalesce(position('role=''owner'' and status=''active''' IN review_fn)>0,false)
  AND coalesce(position('Only the active owner may grant a Command Center role' IN review_fn)>0,false) AS privileged_roles_owner_only,
 coalesce(position('v_record.photo_path is null' IN review_fn)>0,false)
  AND coalesce(position('v_record.kyc_state<>''submitted''' IN review_fn)>0,false) AS verified_portrait_gate,
 coalesce(position('email_confirmed_at' IN onboard_fn)>0,false)
  AND coalesce(position('on conflict(user_id) do nothing' IN onboard_fn)>0,false) AS confirmed_onboarding,
 coalesce(position('landshop_is_staff(p_user)' IN work_fn)>0,false)
  AND coalesce(position('kyc_state=''approved''' IN work_fn)>0,false)
  AND coalesce(position('employment_state=''active''' IN work_fn)>0,false) AS verified_work_gate
 FROM source
)
SELECT CASE WHEN (
 SELECT bool_and(ok) FROM (
  SELECT unnest(ARRAY[
   protected_tables,no_client_staff_writes,pending_by_default,unverified_by_default,
   no_anonymous_staff_mutations,reviewer_checked,privileged_roles_owner_only,
   verified_portrait_gate,confirmed_onboarding,verified_work_gate
  ]) AS ok FROM checks
 ) results
) THEN 'ready' ELSE 'not-ready' END;
