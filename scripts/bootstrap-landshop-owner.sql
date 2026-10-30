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
  valid_owner_application boolean;
BEGIN
  IF requested IS NULL OR length(requested) NOT BETWEEN 6 AND 254 OR requested !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    THEN RAISE EXCEPTION 'Invalid pre-approved owner email'; END IF;
  SELECT count(*),(array_agg(id))[1] INTO matches,target_user_id FROM auth.users
    WHERE lower(email)=requested AND email_confirmed_at IS NOT NULL
      AND deleted_at IS NULL AND (banned_until IS NULL OR banned_until<now());
  IF matches<>1 THEN RAISE EXCEPTION 'Owner requires exactly one active, email-confirmed Supabase account; matches %',matches; END IF;
  SELECT count(*),(array_agg(id))[1] INTO orgs,org_id FROM public.organizations WHERE kind='landshop';
  IF orgs<>1 THEN RAISE EXCEPTION 'Expected exactly one parent Landshop organization, found %',orgs; END IF;
  -- The independent GitHub allowlist is the authorizing control. A user-picked
  -- role alone is NEVER sufficient; enforce staff-portal origin, a completed
  -- profile, and private portrait submission before owner activation.
  SELECT EXISTS(
    SELECT 1 FROM auth.users u
    JOIN public.landshop_staff_profiles p ON p.user_id=u.id
    WHERE u.id=target_user_id
      AND u.raw_user_meta_data->>'staff_signup'='true'
      AND p.organization_id=org_id AND p.requested_role='owner'
      AND p.kyc_state IN ('submitted','approved')
      AND p.employment_state IN ('pending','active')
      AND p.photo_path IS NOT NULL
      AND EXISTS(
        SELECT 1 FROM storage.objects s
        WHERE s.bucket_id='landshop-staff-private'
          AND s.name=p.photo_path
      )
  ) INTO valid_owner_application;
  IF NOT valid_owner_application THEN
    RAISE EXCEPTION 'Owner must register through Staff Sign Up, confirm email, complete owner profile and submit a private portrait before independent authorization';
  END IF;
  SELECT count(*) INTO other_owners FROM public.organization_members m
    WHERE m.organization_id=org_id AND m.role='owner' AND m.status='active' AND m.user_id<>target_user_id;
  IF other_owners>0 THEN RAISE EXCEPTION 'Another active Landshop owner exists; refuse ownership takeover'; END IF;
  IF EXISTS(SELECT 1 FROM public.organization_members m WHERE m.organization_id=org_id AND m.user_id=target_user_id AND m.status IN ('suspended','revoked')) THEN
    RAISE EXCEPTION 'Previously suspended or revoked membership requires manual security review';
  END IF;
  SELECT exists(SELECT 1 FROM public.organization_members m WHERE m.organization_id=org_id AND m.user_id=target_user_id AND m.role='owner' AND m.status='active') INTO already_owner;
  IF already_owner THEN RAISE NOTICE 'Matching owner already active'; RETURN; END IF;
  INSERT INTO public.organization_members(organization_id,user_id,role,status)
    VALUES(org_id,target_user_id,'owner','active')
    ON CONFLICT(organization_id,user_id) DO UPDATE SET role='owner',status='active';
  INSERT INTO public.audit_events(actor_id,event_type,metadata)
    VALUES(target_user_id,'landshop_owner_verified_bootstrap',
      jsonb_build_object('org_id',org_id,'source','manual_github_workflow','verification','confirmed_email_allowlist_and_submitted_staff_identity','recorded_at',now()));
  -- Assert the actual Command Center authorization gate before COMMIT.
  -- Failure here rolls back BOTH owner membership and audit entry atomically.
  IF NOT public.landshop_is_management(target_user_id) THEN
    RAISE EXCEPTION 'Owner membership is not recognized by the Command Center security gate; activation rolled back';
  END IF;
  RAISE NOTICE 'Verified owner activated with audit event';
END;
$landshop$;
COMMIT;
-- Ensure psql returns a nonzero failure if membership is not recognized
-- by the same authoritative management gate used by the Command Center.
SELECT set_config('landshop.verify_owner_email', :'owner_email', false);
DO $owner_verify$
BEGIN
 IF (SELECT count(*) FROM public.organization_members m
     JOIN public.organizations o ON o.id=m.organization_id
     JOIN auth.users u ON u.id=m.user_id
     WHERE o.kind='landshop' AND m.role='owner' AND m.status='active'
       AND u.email_confirmed_at IS NOT NULL
       AND lower(u.email)=lower(current_setting('landshop.verify_owner_email'))
       AND public.landshop_is_management(u.id))<>1
 THEN RAISE EXCEPTION 'Owner activation was not recognized by the production management authorization gate'; END IF;
END;
$owner_verify$;
SELECT 'LANDSHOP_OWNER_ACTIVE' AS verification;
