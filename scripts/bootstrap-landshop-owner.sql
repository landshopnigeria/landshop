\set ON_ERROR_STOP on
BEGIN;
SELECT set_config('landshop.bootstrap_owner_email', :'owner_email', true);
SELECT pg_advisory_xact_lock(hashtext('landshop-owner-bootstrap-v1'));
DO $landshop$
DECLARE
  requested text := lower(btrim(current_setting('landshop.bootstrap_owner_email', true)));
  matches integer; target_user_id uuid;
  orgs integer; org_id uuid;
  other_owners integer; already_owner boolean;
BEGIN
  IF requested IS NULL OR length(requested) NOT BETWEEN 6 AND 254 OR requested !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    THEN RAISE EXCEPTION 'Invalid pre-approved owner email'; END IF;
  SELECT count(*),max(id) INTO matches,target_user_id FROM auth.users
    WHERE lower(email)=requested AND email_confirmed_at IS NOT NULL
      AND deleted_at IS NULL AND (banned_until IS NULL OR banned_until<now());
  IF matches<>1 THEN RAISE EXCEPTION 'Owner requires exactly one active, email-confirmed Supabase account; matches %',matches; END IF;
  SELECT count(*),max(id) INTO orgs,org_id FROM public.organizations WHERE kind='landshop';
  IF orgs<>1 THEN RAISE EXCEPTION 'Expected exactly one parent Landshop organization, found %',orgs; END IF;
  SELECT count(*) INTO other_owners FROM public.organization_members m
    WHERE m.organization_id=org_id AND m.role='owner' AND m.status='active' AND m.user_id<>target_user_id;
  IF other_owners>0 THEN RAISE EXCEPTION 'Another active Landshop owner exists; refuse ownership takeover'; END IF;
  SELECT exists(SELECT 1 FROM public.organization_members m WHERE m.organization_id=org_id AND m.user_id=target_user_id AND m.role='owner' AND m.status='active') INTO already_owner;
  IF already_owner THEN RAISE NOTICE 'Matching owner already active'; RETURN; END IF;
  INSERT INTO public.organization_members(organization_id,user_id,role,status)
    VALUES(org_id,target_user_id,'owner','active')
    ON CONFLICT(organization_id,user_id) DO UPDATE SET role='owner',status='active';
  INSERT INTO public.audit_events(actor_id,event_type,metadata)
    VALUES(target_user_id,'landshop_owner_verified_bootstrap',
      jsonb_build_object('org_id',org_id,'source','manual_github_workflow','verification','confirmed_email_and_allowlist','recorded_at',now()));
  RAISE NOTICE 'Verified owner activated with audit event';
END;
$landshop$;
COMMIT;
SELECT CASE WHEN count(*)=1 THEN 'LANDSHOP_OWNER_ACTIVE' ELSE 'OWNER_NOT_ACTIVE' END AS verification
FROM public.organization_members m JOIN public.organizations o ON o.id=m.organization_id JOIN auth.users u ON u.id=m.user_id
WHERE o.kind='landshop' AND m.role='owner' AND m.status='active'
 AND u.email_confirmed_at IS NOT NULL AND lower(u.email)=lower(:'owner_email');
