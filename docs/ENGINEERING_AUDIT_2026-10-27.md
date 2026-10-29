# Landshop engineering audit — 27 October 2026

## Scope and evidence
- Source: existing `landshopnigeria/landshop` main branch at `4242593d29af45fc669ede862b056a2fd11af04e`, plus owner-supplied forms and media.
- Infrastructure: Namecheap Passenger/Apache with separately packaged Next.js website, portal, dashboard.
- Supabase project: `iwkfagzkogzidrbbezds`.
- Production-only policy: no separate publicly accessible staging website.
- Do not treat screenshots as evidence of completed backend operations.

## Observed release blocker — verified from logs
GitHub Actions run 40413886726 (last attempt 26 October, 23:12 UTC):
- Verify hosting parameters: passed.
- Build three Next.js packages: passed.
- Standalone release packaging: passed.
- SSH/rsync publication into the three configured app roots: passed.
- Public verification: failed, `curl: (22) The requested URL returned error: 404` at first tested `/api/release-health`.
- A 404 after successful file upload cannot distinguish wrong cPanel URL binding, wrong Apache document root, inactive Passenger application, or legacy routing by itself.
- No reliable evidence establishes the latest SHA is publicly served on ANY of the three domains. Do not publish a success claim.

### Deployment recovery sequence
1. Take verified backups of all production roots plus database restore point.
2. Use the read-only `diagnose-namecheap-runtime.yml` workflow to check current public HTTP responses, deployed standalone entry files, release SHA, and restart folders without logging secrets.
3. Review Namecheap **Setup Node.js App** entries against each subdomain, application root and **Application startup file `server.js`**. Verify Apache/Passenger mapping and document root.
4. Read server/Passenger startup exception logs in the hosting control panel; redact credentials and personal information.
5. Confirm that the deployment's packaged `server.js` launches its corresponding `apps/{website,portal,dashboard}/server.js` and that the Passenger-managed process survives restart.
6. Re-run the controlled release and assert `service`, `commit`, and `status=serving-nextjs` on each publicly reachable health route. Confirm HTTPS redirect behavior for root/WWW separately.
7. Exercise sign-in, property search, submitted application, permissions, export and notification paths only with authorized test accounts and controlled data.
8. Keep rollback executable until verification completes.

## Current repository inventory
### Present / partial
- Next.js website with Develop / Incubate / Grow pages and property marketplace route.
- Portal with email login and application forms; forms are distinct from authentication.
- Customer dashboard, application and KYC wizards.
- Command Center baseline, governed property management and import views.
- Workflow Automation Studio: interactive canvas, draft persistence, no production message-action execution.
- Python document ingestion and mortgage tests; standalone Next.js packaging.
- Original deck-derived, Famous Gardens, Maiyegun and drone image assets in each frontend media directory.
- Supabase public schema has **30** tables and **20** applied migrations; all enumerated public tables report RLS enabled.
- No evidence in the inspected live database of populated property inventory, customer applications, payment ledger, revenue dashboard or published content.

### Missing / not verified
- Actual public production Next.js routing on all three hostnames.
- Exact cPanel Passenger route assignment and active process logs.
- End-to-end Google OAuth, email delivery, KYC provider, upload review and transaction/finance records.
- Fully active event-triggered notification provider, retries, webhook receipts, consent engine and delivery dashboard.
- Production property publication and accurate pricing, title and image ownership evidence.
- Full role-gated CRM, HR, finance ledger, support, editorial studio and mobile binaries.
- Regulatory/legal validation for investment offers, refunds, mortgage rates and any funds custody.

## Source-document reconciliation
- Develop House and Develop Land PDFs include client details, passport, estate selection, property size and quantity, payment preference, next of kin, referral, declaration and official CX review.
- Beta Mortgage PDF includes mailing address, dependents, LGA, retirement years, employment/income, NHF details, equity and repayment preferences, and broker authorization.
- Develop Inspection PDF includes property/estate details, customer feedback, lead source, transport, staff notes and next actions. Internal official-use fields must be completed by staff, not trusted from public submissions.
- Uploaded Mortgage Xtra image is a workflow diagram, not a complete separate inspection-form PDF. Corresponding detailed field-by-field source requires additional authenticated business approval before claiming exact fidelity.
- Incubate FAQ mentions a guaranteed 70% investment return and specific payout assumptions; treat as unapproved historical marketing language, not a verified live offer.
- Develop FAQ includes historical ten-year instalment, refund, construction and estate policies; version/legally approve before using them as enforceable terms.
- NHF workbook contains an amortization schedule and thousands of populated formula cells; validate rates, financing assumptions, lender rules and edge cases before using its outputs as current offers.

## Media ingest
Uploaded archive `Landshop Famous Garden...`: 122 JPEGs.
Uploaded archive `Merit Park and Maiyegun Drone pictures...`: 20 JPEGs.
Total: **142 images**, no video files in these archives.
Assets already in repository include deck, Famous Gardens, Maiyegun and drone derivatives; never duplicate blindly, associate each media asset with the verified estate ID, license/provenance and approved publication status.

## Security attention
Supabase security advisor reports one table with RLS and no policies (`notification_outbox`), which can be correct for a private queue, plus 14 externally callable SECURITY DEFINER RPCs for authenticated users. **This is an advisory, not proof of privilege escalation**. Review each function's identity and permission checks, revoke unneeded EXECUTE, test negative access cases, and avoid granting public access to sensitive workflows.

## Phase-1 form changes in pull request
- Use separate subscription forms for Develop House/Land, Incubate, Beta Mortgage, Mortgage Xtra and inspection cases.
- Original-form-specific fields, required labels, placeholders and estates/sizes as historic reference options; property availability must be independently verified.
- Restore the authenticated account's own draft, autosave answer changes after first save, validate required uploads and declarations, preserve original private storage.
- Staff approval / inspection status transitions must remain server-authorized, never browser-controlled.
- Work remains on a draft PR pending CI, security review and live acceptance. It has **not** been published.

## Release gate
Do not merge this PR into production until CI and form functional tests pass, Namecheap routing is diagnosed, production backups and rollback are verified, and owner-approved financial/legal terms are configured.
