# KYC reviewer workflow — implementation and release controls

**Implementation status:** Source code committed. Do not activate as live KYC approval until migrations, reviewer provisioning, validation tests and incident controls pass.

## Components
- `/admin/kyc`: Landshop staff-only queue, based on active membership in a Landshop organization, not user metadata.
- `/admin/kyc/[id]`: detailed applicant data, original private document links and reviewer decision controls.
- `POST /api/admin/kyc/document`: validates logged-in user, obtains audited 60-second signed private document link. Does not use a browser-side secret key.
- `POST /api/admin/kyc/decision`: validates authenticated request, same origin, input limits; invokes protected SQL RPC.
- `public.landshop_kyc_decide`: rechecks organization membership, prevents self-approval, locks the submission, requires valid status, all required docs, prior reviewer document accesses, and a reason of 15–1500 characters. In one transaction it updates submission and customer profile, writes decision history, audit event and notification outbox.
- `public.landshop_kyc_log_document_access`: validates reviewer, creates immutable audit record prior to signed URL issuance.

## Database migration order
`0001` → `0002` → `0003` → `0004` → `0005` → `0006` → `0007`.

## Production prerequisites
1. Supabase project access and SQL migration review/backup are required; current connector returns permission denied.
2. Confirm `auth.uid()` is correct for reviewer sessions, including actual cross-subdomain SSR cookies.
3. Provision the Landshop `organizations` and `organization_members` records using trusted administration, not public forms.
4. Verify RLS using test accounts: normal customer, unapproved employee, authorized reviewer and applicant-reviewer.
5. Verify unauthorized access to other people's private KYC documents is denied.
6. Test signed URL lifetime, audit failures, blank/invalid references, and storage policy behavior.
7. Validate SQL migration compatibility and TypeScript compilation in GitHub Actions.
8. Run transactional duplicate-decision tests: concurrent reviewers may never overwrite a recorded decision.
9. Confirm Postmark delivery and notification outbox processing before telling applicants that notices have been sent.
10. Establish document retention/deletion processes and privacy-law compliance before collecting live sensitive documents.

A reviewer opening the original document does not itself prove identity. The reviewer must independently inspect supporting evidence and explicitly attest to the decision. The status remains unverified until an authorized reviewer completes a transaction.

## Release invariant
No live deployment, email-delivery confirmation or successful KYC approval is asserted until production tests pass.
