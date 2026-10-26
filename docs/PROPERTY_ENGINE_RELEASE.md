# Landshop Property Command Center: delivery state

## Committed to GitHub
- Staff-only `/admin/properties` route with organization membership and role checks.
- Property draft creator via role-checked PostgreSQL function.
- Draft → review → published → archived workflow, with published transition requiring a second authorized reviewer.
- Publication event history and audit records.
- Customer-facing marketplace displays **published** records only.
- `/admin/properties/import` accepts CSV previews in limited batches (maximum 100 rows, 200 KB file); queues normalized rows in PostgreSQL staging, with validation and duplicate warnings.
- Property evidence gate prevents publication until a separately authorized review records property title/marketing authority and original image evidence.

## Critical limitations
- **None of migrations 0008–0010 have been applied to live Supabase.**
- CSV import is staged only. No approved import-to-listing promotion exists yet.
- Excel, XML, DOCX, PDF, photos, and ZIP bulk processing are not yet operational.
- Property media/document upload APIs, evidence verification and signed object access are not yet implemented.
- The publication gate will intentionally block publication until evidence workflows are built and tested.
- No actual property dataset, approved owner photograph, or legal title documentation has been ingested.
- Web-build CI results and production email/SMS delivery are not verified.
- The current live Namecheap applications remain unchanged.

## Required tests
- Public user cannot call any property write RPC.
- Customer/realtor cannot view draft inventory or upload CSV.
- Staff can stage validated CSV; invalid rows cannot silently become properties.
- Editor cannot directly publish; only an approved second reviewer may publish after title, marketing authority and imagery checks.
- Same author cannot publish their own property.
- Concurrent workflow transitions do not bypass approval.
- Property pricing is consistently stored in kobo and rendered in naira.
- All protected server/browser routes return access-denied states for guests and nonmembers.
- Audit logging and rollback work for failed transactions.

## Next engineering milestone
Implement private property media/title-document storage and the evidence reviewer workflow. Then add safe approval of validated import rows, expand document parsing to Excel/XML/Word/PDF, and validate production build and migrations before deploying.
