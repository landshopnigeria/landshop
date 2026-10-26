# KYC acceptance and release gates

Implementation includes a browser KYC intake wizard, draft table, private bucket, applicant RLS and a staff-only read queue. It does not mean identity has been independently verified.

**Apply migrations in order**: 0001, 0002, 0003, 0004, 0005. Before executing against production, review migration compatibility and back up the Supabase database. No migration has been applied by this GitHub commit.

## User journey
1. Customer signs up and verifies their email.
2. Customer signs in and opens app.landshopnigeria.com/dashboard.
3. Pending KYC points to /dashboard/kyc.
4. Individual, realtor, company and staff applicants provide basic details.
5. Customer uploads portrait, government ID and utility bill. Company also requires CAC certificate.
6. Documents are saved in the private landshop-kyc bucket under user_id/submission_id/, with ownership RLS.
7. Submitted records cannot be edited by customers, and they do not approve themselves.
8. Authorized Landshop staff can view the read-only KYC queue at /admin/kyc.
9. Future secure inspection/approval service must validate verified staff roles, issue short-lived file access, log audits, update submission and profile in one transaction, notify applicants.

## Production verification tests outstanding
- New user and existing verified-user login on portal and app.
- KYC draft insert, metadata edit and submission from authenticated account.
- RLS: customer A must not see or upload to customer B's document paths.
- RLS: direct customer attempts to set kyc_status approved or update reviewer fields must fail.
- Storage: file type/size limits and path authorization.
- Submission with missing required file or missing explicit consent must fail.
- Submission with complete files and consent must succeed, then prevent edits.
- Staff-only queue access denies customers and unapproved staff.
- Approved KYC cannot be set without audit, verified supporting documents and role checks.
- Real delivery checks for email, SMS and support notifications; none claimed at this point.

**Privacy:** No biometric identification or face matching is activated. A user-provided selfie is a private identity photo, not an assertion of automated verification. Existing data retention/erasure policies require legal review.
