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
2. From the authorized **landshopnigeria** GitHub account, run the **Activate verified Landshop owner (manual, security-gated)** workflow at https://github.com/landshopnigeria/landshop/actions/workflows/activate-landshop-owner.yml.
3. Supply that exact verified email and confirmation `ACTIVATE_VERIFIED_LANDSHOP_OWNER`. The `landshop-production` environment and database guard must approve the request.
4. Sign back into the Landshop Command Center. Do not request multiple owner bootstraps. Use Landshop's standard audited member process for a separate independent reviewer.

## Inventory and publishing
- Staff estate registry: https://app.landshopnigeria.com/admin/properties
- Draft property records: same page, then select each property's details to edit actual asking price, estate, unit specifications, verified coordinates, features and videos.
- Verified owner/developer photos and marketing/titles: upload through the private property evidence panel for review. Only separately reviewed public derivatives may appear in galleries.
- Import real CSV: https://app.landshopnigeria.com/admin/properties/import
- Template: https://app.landshopnigeria.com/templates/landshop-property-import.csv (required: title, property_type, price, estate, state, city; optional: lga, area, plot_number, size_sqm, sale_mode, bedrooms).
- Independent staff flow: draft -> review -> independently approved showcase, price confirmation within 30 days, verified estate and map pin, verified title & marketing authority, approved photo **or** supported property-specific video -> published.

Public homepage and marketplace automatically show the latest approved published records in three columns. Marketplace is paginated after 12 cards; no fake property cards or prices.

**Do not claim the inventory is live until source-based unit availability, exact address/map, and publication authority have been confirmed.**
