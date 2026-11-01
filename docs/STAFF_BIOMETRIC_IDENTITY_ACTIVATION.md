# Landshop Staff Identity Verification: Production Integration

## Current deployment
The staff dashboard includes portrait upload, direct camera photography, and three-view guided capture. These images are **not** independent proof of liveness or legal identity. Verified email registrations receive **basic** staff access automatically, without HR approval; self-registration never grants management/owner roles.

An independent Veriff document-and-live-selfie integration has been implemented as a Supabase Edge Function `staff-identity` with an authenticated start/status method and a signed webhook. It is **fail-closed** until Landshop supplies a Veriff production account and configures its secrets. Do **not** claim the biometric check is live when `VERIFF_IDV_ENABLED` is not true and the required credentials are absent.

## Production activation prerequisites
1. A Veriff production integration activated for **document authenticity + live selfie matching + liveness** (not a liveness-only, age-estimation, or selfie-only product). Veriff lists Nigerian passports, national identity cards and driver's licences as supported ID documents; integration coverage should be checked with the provider.
2. Put the credentials in Supabase Edge Function secrets, never in a repository, public JavaScript bundle or chat: `VERIFF_API_KEY`, `VERIFF_SHARED_SECRET`, `VERIFF_BASE_URL` (normally `https://stationapi.veriff.com`), and `VERIFF_IDV_ENABLED=true`. No such credentials were present when this integration was developed.
3. Configure the Veriff **decision webhook** to `https://iwkfagzkogzidrbbezds.supabase.co/functions/v1/staff-identity?event=decision`. Only HTTPS is accepted. Enable a genuine identity-document-and-selfie product and appropriate result fields.
4. Complete the employer data-protection impact assessment, confirm cross-border biometric processing arrangements, finalize consent and retention practices under Nigeria's Data Protection Act, and provide a non-biometric alternative or manual review path where required.
5. Use provider sandbox to validate the same journey, then perform controlled production verification with a consenting authorized test employee. Confirm webhook HMAC and provider decision recheck, correct document evidence, atomic staff ID issuance, replay protection, suspended account rejection, and HR review fallback before calling it operational.

## Staff flow
- Verified staff signs in at `https://app.landshopnigeria.com/staff`.
- Basic access is active. A private portrait upload updates `kyc_state` to `submitted`.
- After the staff member separately consents, `StaffBiometricVerification` starts a Veriff session, recording only the opaque job, linked account, status, consent timestamp and snapshot of the private portrait path.
- The staff member uses Veriff's hosted verification link for document capture, selfie and liveness, then returns to the staff profile.
- A signed webhook is correlated to the exact stored session **and is independently rechecked via the Veriff decision API**. Only `approved` with result code `9001` and verified document type/country qualifies for automatic identity approval.
- Database function `landshop_staff_identity_provider_decision` requires service-role authorization, active email-confirmed staff membership, unchanged private portrait and current approved provider session. It updates identity status, issues the official staff ID and audit event atomically. It does not grant an elevated role.
- Non-approval, uncertain and provisional outcomes never automatically revoke employment; they remain eligible for independent manual review or appeal.
- Management can use `landshop_staff_assign_verified_role` to assign a role **after** verified KYC. Only an authorized owner can grant or change Command Center privileges.

## Security and privacy
- Never store Veriff API keys or shared secret in `NEXT_PUBLIC_` values.
- Hosted Veriff captures live document/selfie media. Staff profile photography remains inside the private `landshop-staff-private` Supabase bucket and is not independently compared to the provider's collected selfie. The independent identity check verifies the **provider-collected selfie against the official ID**, not the staff-uploaded avatar.
- Raw provider document numbers, biometric images and raw provider decision payloads are not stored in the workforce table; only decision codes, timestamps and session references.
- The provider webhook requires `x-auth-client` and HMAC over the raw body, then an authenticated GET of Veriff's decision record. Unauthorized start and unsigned callbacks fail closed.
- The Edge Function has `verify_jwt=false` solely to accept provider webhooks. Its staff start/status paths validate Supabase access tokens server-side and require email-confirmed active staff membership.
- A current profile, valid job state, and independently verified result are mandatory. A return-page URL or browser-submitted result is **never** accepted as identity verification.
- Human decisions and appeals remain available. An unsuccessful automated attempt is not grounds for payroll deduction or termination.

## Source of truth
- `supabase/functions/staff-identity/index.ts`
- `apps/dashboard/app/staff/StaffBiometricVerification.tsx`
- `supabase/migrations/20261101154242_landshop_staff_biometric_provider_verified_identity.sql`
- `supabase/migrations/20261101154813_landshop_staff_verified_role_assignment.sql`
- `scripts/check-landshop-biometric-guards.py`

The control-plane changes and database migrations are independent of Namecheap Next.js deployment. Production release can succeed while the vendor remains unconfigured; in that case the profile must show **awaiting provider configuration**, not a false verification success.
