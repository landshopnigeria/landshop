# Landshop property-image integrity and archive matching

## Audit, 29 October 2026

- Connected Supabase `public.property_assets` table exists but returned **0 rows** during read-only audit.
- No property ZIP archives were available in the connected `landshopnigeria/landshop` repository tree or accessible Project file search.
- The website must NOT assign generic Nigerian editorial photos to real property records. Pending genuine approved media, the marketplace and property details show a designed camera icon and clear pending-status text.

## Required ingest for actual property media

1. Receive original ZIP or gallery from the owner/developer with named estate/property reference and permission to publish.
2. Extract in a secure upload worker with archive-bomb, size, file-type and malware checks; strip EXIF geolocation and never publish title deeds or IDs.
3. Match images against the **exact** approved property UUID/estate reference. Unmatched and ambiguous files remain in review.
4. Require staff approval before exposing a property photo. The approved property photo must be the actual listed property, unit or estate and not generically illustrative editorial media.
5. Generate responsive WebP/AVIF derivatives and originals in protected storage with clear authorization and no raw private-document path exposure.
6. Show property-specific approved images on the listing cards and property gallery. Keep audit trail for provenance, rights and property association.

**No actual property pictures were added in this change**, because the original ZIPs and verified asset mapping were unavailable. The shared header/icon overhaul does not invent media.
