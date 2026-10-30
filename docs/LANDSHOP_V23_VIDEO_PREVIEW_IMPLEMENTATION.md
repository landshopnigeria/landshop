# LANDSHOP — V23 VIDEO-BASED APPROVED PREVIEW IMPLEMENTATION

## Source and exact design intent
Source: `LANDSHOP_VIDEO_BASED_V23_INTERACTIVE_PREVIEW.html`, approved by the user.
Video reference: `Recording Oct 30, 2026 - 2_53 AM.mp4`.
Video uses a REBS website as a **design reference only**, not an inventory, brand, company or property-data source.

The V23 preview differs from the approved V22 production site primarily in its homepage:
- a photographic three-slide Develop / Incubate / Grow hero with dark image gradient,
- large typography and transparent CTA,
- compact round arrow/pager controls,
- responsive, glass-surfaced 12-field property finder beneath the hero.
- all existing V22 interior pages, featured-property engine, dynamic details, articles, services and footer are retained.

## Implemented
1. `LandshopHome.tsx`: V23 cinematic hero with original Landshop deck photography already in the repo, product-specific copy, accessible slide arrows/pagers, pause-on-focus/hover, touch gestures and reduced-motion CSS.
2. 12 search fields: keyword, state/FCT, city, area/estate, type, minimum price, maximum price, bedrooms, bathrooms, minimum square metres, availability and collection. Four action tabs: Buy, Sell, Rent, Shortlet.
3. All supported filters are submitted to the existing `/properties` published-inventory backend. Sell routes safely to the portal for listing intake, not fake sale results.
4. `marketplace.ts` added validation, DB queries for bathrooms, floor or land area, and status, plus search over town/LGA or area/estate title where applicable.
5. Prime/Luxury collection data is **not part of the current live property/estate schema**. If selected, the system displays a clear verified-classification message rather than fabricating classification or ignoring the selection. Classification needs a separate authenticated property-admin data entry change.
6. A new `v23-video-preview.css` entirely scopes styling to the homepage hero and search; includes 1100px, 700px, 390px breakpoints, focus and reduced motion.
7. Existing `V22HomeSections` and `SiteFooter` remain in use; no modification to the global header/footer components or styling, and no changes to the approved property details.

## Protected exact files — DO NOT MODIFY
- `apps/website/components/SiteHeader.tsx`
- `apps/website/components/SiteFooter.tsx`
- `apps/website/components/MarketChrome.tsx`
- `apps/website/app/site-navigation.css`
- `apps/website/app/icon-treatments.css`

## QA and production acceptance
- Execute `node scripts/verify-v22-protected.cjs` in PR to reject any global header/footer drift.
- Execute the Next.js build and complete Foundation workflow and Python worker tests.
- Confirm live V23 hero selector `.ls-v23-hero`, exact release SHA, working public JavaScript/CSS on apex and www, and all 12 filter fields.
- Smoke-test Buy/Rent/Shortlet and portal Sell separately, keyboard/pointer/touch/ reduced-motion and mobile layouts.
- Confirm three publicly approved properties only and do not synthesize inventory.
- Use the existing Namecheap three-app backup, deployment, exact-release verification and automatic rollback pipeline on main.
- No new staging domain; production publication only after the release gates pass.

## Media fidelity
The approved design-preview images are bundled offline under `Landshop_Video_Reference_Interactive_V23/assets/`. This implementation uses the closest matching **existing approved original deck media** already committed under `apps/website/public/media/`; source binary images not committed to the repository cannot be silently declared identical. This is a source-asset distinction, not permission to generate unrelated property images. The layouts, interactions, and product structure are implemented on the existing real application.
