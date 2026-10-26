# LANDSHOP — Multi-format property import / media release checklist (26 Oct 2026)

## Code now available
- Python parser: CSV, XLSX, XML, DOCX, text-readable PDF and safe bounded ZIP.
- Parser results always require human review. OCR is NOT active; scanned PDFs are not automatically read.
- Internal worker: Celery + Redis, dedicated Python service with token-restricted FastAPI endpoints.
- Staff upload UI: /admin/properties/import/advanced (20 MiB file ceiling).
- Worker returns review artifacts to a PRIVATE bucket. Document and spreadsheet data are not published.
- Reviewer review artifact UI: /admin/properties/import/results. Structured rows stage in batches of 100.
- Independent batch approval UI: /admin/properties/import/review.
- Authorized third operator promotes accepted batches into DRAFT properties.
- Private property image/title/authority/video uploader: /admin/properties/[id].
- Independent evidence verifier must inspect original files and record a 15–1000 character basis.
- Public listing publication remains gated by reviewed ownership/marketing authority evidence and original images.
- Framework security pins: Next.js 15.5.28, React 19.1.10.

## Supabase migration order
Apply 0001 to 0014 in numerical sequence, only after backup, review and compatibility tests.
0008 property governance
0009 staged CSV normalization (numeric casting guard fixed)
0010 publication evidence constraints
0011 private property media & review RPC
0012 import approval & draft promotion
0013 private import source / result buckets
0014 ownership ledger for queued import jobs

## Worker deployment — required secrets and services
The Python worker **must not run in the existing Namecheap shared Node apps**.
Provision managed/dedicated Python hosting and Redis with persistent storage and authenticated network access.
Set server-side ONLY:
- LANDSHOP_REDIS_URL
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- LANDSHOP_INTERNAL_WORKER_TOKEN

Set on the Next.js application server ONLY:
- LANDSHOP_INTERNAL_WORKER_URL
- LANDSHOP_INTERNAL_WORKER_TOKEN

Run Python worker in separate processes:
- uvicorn worker_api:app --host 127.0.0.1 --port 8080
- celery -A tasks worker --loglevel=INFO --concurrency=2

**The API must be accessible only through a private network or an access-controlled reverse proxy.** Use TLS, request logs, credential rotation, monitoring, health checks and worker rate limits. No real tokens belong in GitHub.

## Required acceptance tests
1. Run GitHub CI and ensure all three Next.js builds complete, plus Python unittest suite.
2. Validate SQL migrations and PostgreSQL RLS via actual Supabase test accounts.
3. Confirm non-staff and Realtors cannot upload, stage, approve or publish.
4. Verify ZIP traversal, archive ratio, content size, malformed XML, encrypted PDF and bogus MIME rejection.
5. Verify reviewed DOCX/PDF does not automatically create a listing, and scanned PDFs are marked for manual handling.
6. Upload genuine developer images to private storage; reject unsupported types and oversized files.
7. Ensure uploader cannot verify their own asset, import submitter cannot approve batch, and approver cannot promote their own approval.
8. Confirm duplicate titles fail atomically, failed imports do not partially write drafts, and replays cannot create duplicate properties.
9. Verify title or marketing authority evidence and an independently approved image are required for publication.
10. Test public listing RLS: published records visible, drafts invisible.
11. Confirm original property title documents cannot be accessed by public visitors or unapproved staff.
12. Test audit events for all import/asset verification steps, cross-user job-status isolation, secure signed URLs and expiration.
13. Test documented retention and deletion policy for private records and imported documents.
14. Deploy with an immutable artifact, website backup, health checks and rollback. Verify domain responses after deployment.

## Current release blockers
- Supabase connector returns permission denied for project iwkfagzkogzidrbbezds on both connected accounts.
- SQL migrations 0001–0014 have not been applied in the project's live database.
- A dedicated Celery/Redis worker has not been provisioned or started.
- Python tests exist in GitHub but **no complete CI success was observed through the current connector**.
- Namecheap production applications still have the original placeholder processes; no build was published.
- Product-deck image binaries are not all in the production repository.
- Postmark/SMS/Google OAuth/live delivery and authentication checks remain incomplete.

Do not call this production ready until every gate has passed.
