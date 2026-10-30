# Landshop owner activation — staff portal (production)

The official owner signup deep link is **https://app.landshopnigeria.com/staff/sign-up?role=owner** (preselects Owner only; does not confer privileges). It uses the same approved form at https://app.landshopnigeria.com/staff/sign-up. It is the same approved responsive glass Staff Sign Up page, with **Company Owner (Verification Required)** included in the staff role dropdown.

## Owner registration through the staff portal

1. The intended owner opens https://app.landshopnigeria.com/staff/sign-up?role=owner, verifies **Company Owner (Verification Required)** is selected, completes all required fields, accepts the Terms and Conditions, and signs up.
2. The owner confirms the email message. If necessary, the staff sign-up or sign-in page can resend the confirmation email.
3. The owner lands at https://app.landshopnigeria.com/staff (not the customer portal), completes the staff-portal onboarding profile, and uploads an authentic personal portrait to private storage. The request remains **pending**; selecting Owner, confirming email, or uploading a portrait does not create any membership or privileged role.
4. An authorized GitHub administrator independently verifies the intended owner's identity **outside the signup form** and configures their exact approved email as the `LANDSHOP_OWNER_EMAIL` **environment variable** under GitHub Settings → Environments → `landshop-production`. Require protected environment reviewers and restrict who can modify this value.
5. The administrator opens GitHub Actions → **Activate Verified Landshop Owner Account** → Run workflow (main), entering **the same verified email address**. This is a controlled, manual action—not a sign-up callback.
6. The workflow checks the independent email allowlist, a unique active and email-confirmed Supabase user, staff-portal signup origin, owner-requested staff profile, private portrait submission, exactly one Landshop organization, no other active owner, and no previously revoked/suspended membership. It records the new membership and an audit event transactionally.
7. The activated owner signs in at **https://app.landshopnigeria.com/staff/sign-in** and lands on **https://app.landshopnigeria.com/staff** (Owner's Staff Dashboard). The server checks the active Landshop `organization_members.role='owner'` record and `landshop_is_management` independently of ordinary employee KYC.
8. The Owner dashboard displays a prominent **Open Global Command Center** panel and a persistent desktop/mobile navigation link. Both open **https://app.landshopnigeria.com/admin** using the same verified session. The Command Center has a **Staff Dashboard** link for returning without logging in again.
9. A verified owner is an enterprise-level administrator across every Command Center module (properties, applications, import/review, workforce, KYC, support, automation, reporting and customer operations), while nonowner roles remain department-restricted. Individual operations must still satisfy audited transaction rules, data integrity checks, and external integration prerequisites.
10. From the Command Center, the verified owner can review pending staff applications and assign department roles. The owner may not approve their own employee identity, and employee work/attendance access still requires its separate KYC/employment checks.

## Security and operations

- **Never auto-activate ownership on sign-up or email confirmation.** Public form input, `requested_role` and `raw_user_meta_data` are not authority. Owner elevation requires the independently controlled production allowlist plus the manual audited workflow.
- No signup password, OTP code, secret token, or API key should appear in chat, GitHub workflow inputs, logs, or the issue tracker.
- Existing employees and customer accounts are not automatically promoted.
- Only production `https://www.landshopnigeria.com`, `https://portal.landshopnigeria.com`, and `https://app.landshopnigeria.com` are used; do not create a staging site.
- If a genuine owner profile, confirmed email, or private portrait is missing, the activation workflow **must fail safely**. Its success establishes authorization but does not independently establish email deliverability or all browser-session functionality.

The workflow uses the configured `LANDSHOP_SUPABASE_DATABASE_URL` production secret and `LANDSHOP_OWNER_EMAIL` environment variable. No manual database edits are required.
