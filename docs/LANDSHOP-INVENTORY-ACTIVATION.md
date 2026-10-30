# Landshop V22 — Real Property Inventory Activation

## What is now in production database
Three **private drafts** for Famous Gardens, Ibeju-Lekki, advertised by the official Landshop LinkedIn company page (checked 2026-10-29):
- Two-bedroom flat — **from ₦85,000,000**
- Three-bedroom flat — **from ₦95,000,000**
- Three-bedroom terrace — **from ₦130,000,000**

Estates: Famous Gardens and Merit Park (both **draft**, not publicly approved).
Source: https://ng.linkedin.com/company/landshoplimited
The source says *from* and does not prove unit-specific availability or pricing validity today. **Do not automatically publish.**

## How to activate the first real Landshop staff owner securely
The production Supabase project contains a verified auth account but **zero active Landshop organization members**. The existing account has not been linked to an approved Landshop owner email; never grant it owner permissions merely because it is the only verified account.

1. The actual Landshop owner registers/signs in through https://portal.landshopnigeria.com, using their authorized official email, and confirms that email.
2. From the authorized **landshopnigeria** GitHub account, run the **Activate Verified Landshop Owner Account** workflow at https://github.com/landshopnigeria/landshop/actions/workflows/activate-verified-owner.yml.
3. In the protected `landshop-production` GitHub environment first configure variable `LANDSHOP_OWNER_EMAIL` to the independently approved owner email, and secret `LANDSHOP_SUPABASE_DATABASE_URL` as the production PostgreSQL connection string. The workflow will reject an input email that differs from the approved variable. Supply the exact verified email when running the workflow; no owner account is guessed or automatically promoted.
4. Sign back into the Landshop Command Center. Do not request multiple owner bootstraps.
5. Invite a separate reviewer from https://app.landshopnigeria.com/admin/properties/team after they have registered and confirmed their email. This is a pending invitation, **not** instant staff access.
6. The invited reviewer signs in at https://app.landshopnigeria.com/reviewer/accept, accepts the invitation, and opens https://app.landshopnigeria.com/admin/properties/readiness. The owner cannot approve their own evidence.

## Inventory and publishing
- Staff estate registry: https://app.landshopnigeria.com/admin/properties
- Private publication-readiness dashboard: https://app.landshopnigeria.com/admin/properties/readiness
- Draft property records: same page, then select each property's details to edit actual asking price, estate, unit specifications, verified coordinates, features and videos.
- Verified owner/developer photos and marketing/titles: upload through the private property evidence panel for review. Only separately reviewed public derivatives may appear in galleries.
- Import real CSV: https://app.landshopnigeria.com/admin/properties/import
- Template: https://app.landshopnigeria.com/templates/landshop-property-import.csv (required: title, property_type, price, estate, state, city; optional: lga, area, plot_number, size_sqm, sale_mode, bedrooms).
- Independent staff flow: draft -> review -> independently approved showcase, price confirmation within 30 days, verified estate and map pin, verified title & marketing authority, approved photo **or** supported property-specific video -> published.

Public homepage and marketplace automatically show the latest approved published records in three columns. Marketplace is paginated after 12 cards; no fake property cards or prices.

**Do not claim the inventory is live until source-based unit availability, exact address/map, and publication authority have been confirmed.**

## V23 review safety
A seeded estate has no owner/creator assigned; whoever submits it to review must be a **different person** from the publishing reviewer. Price confirmations must be performed by someone who neither created nor edited the price; the final publisher must differ from the approved price confirmer and showcase approver. Publishing remains locked unless all marketing, title, location and genuine media evidence passes review. The production database contains no approved real property media yet.
