# Landshop historical project photo intake and review

## Purpose
A photograph of an estate is not evidence of its current availability, legal title, present condition or construction completion. Landshop's historical project pages cover Green Island, Merit Park, Maiyegun Beach Estate and Famous Gardens, while current inventory requires separately verified records.

## Staff workflow
1. An active staff member or verified manager opens `/admin/properties/project-media` on the private staff application. The route is linked from the authorized staff dashboard and Property Command Center.
2. Select the correct historical project. Upload one original JPEG, PNG or WebP photograph, at most 10 MiB. The original is held in the **private** `landshop-project-evidence` bucket.
3. Record photographer or source organization, the date taken, exact site and location information, provenance details, and a written commercial-use rights reference. Tick the rights attestation only when truthful.
4. Submit the evidence for independent review. The upload remains private and is never displayed automatically as a current property listing.

## Reviewer workflow
1. A separately authorized Landshop management account must review the photograph. The uploader cannot approve their own photo.
2. Open the original through a short-lived, 60-second signed link. Verify site identity, date, the source document or rights release, and the estate location.
3. Record a finding of at least 30 characters and approve or reject. Actions are recorded in the audit event log.
4. A verified evidence record is **not** public media. Editorial publication requires a separate decision, safe derivative preparation, rights review and site-level changes with production verification. Do not expose the private original URL.

## Security and limits
- Upload requires the workforce access gate or verified management membership. The private storage path must begin with the authenticated user's UUID and an allowed project slug.
- Only the submitting user and verified management can read a private original. Database rows are protected by row-level security and role grants. Only privileged database RPCs can register or review evidence.
- Current property sales publication, legal-title approval and public portfolio image assignments are unaffected.
- Green Island remains without an estate-specific public photograph until the required evidence and editorial approval are complete.
- Files with missing identity/rights documentation should be rejected. External image libraries, AI renderings and historical billboards cannot be treated as proof of current units.
- A signed viewing URL must never be copied into public source, a public listing, or article media.
- Paystack and customer payment flows are outside this milestone and remain paused.
