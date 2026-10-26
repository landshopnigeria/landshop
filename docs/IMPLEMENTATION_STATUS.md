# Landshop foundation status — 26 October 2026

## Confirmed
- Namecheap hosting has three Node.js placeholder applications.
- User-confirmed GitHub Actions read-only SSH verification succeeded.
- Authenticated Landshop GitHub connection has write permissions.
- Supabase project reference is `iwkfagzkogzidrbbezds`.

## Completed locally in accompanying source bundle
- Next.js app starters: website, portal, customer dashboard.
- Supabase email/password registration, sign-in, Google OAuth initiation, callback prototype and reset-request page.
- NestJS and FastAPI health endpoints.
- PostgreSQL/PostGIS tenant/property/referral/application/outbox/audit foundation with RLS.
- Individual deck-image extractions and brand-aligned landing content.

## Blocking production release
- Supabase connector returns 'do not have permission', so migration not applied and authentication not verified.
- No production SMTP, SMS, Google OAuth callback, shared-session or KYC acceptance test.
- No generated and tested production Next.js build, backup/rollback workflow, or main-site preservation test.
- No payment-provider verification, mobile binaries, Temporal workers or bulk importer.

No live site was published by these changes.
