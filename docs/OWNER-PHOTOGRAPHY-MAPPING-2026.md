# Landshop owner-photography refresh — 2026-10-31

## Original user-supplied source ZIPs
- `Slider.zip`: 3 photographs with explicit slide names.
- `Products  landshop homepage cads imges.zip`: 3 product photographs named Develop, Incubate and Grow.
- `Famus Gardern.zip`: 23 real exterior/interior/visitor photographs from the user's Famous Gardens archive.
- `Landshop Famous Garden.zip`: 122 documented site, construction, staff and field-visit photographs.
- `layouts.zip`: 5 building, estate entrance and on-site visit photos (not certified architectural floor plans).
- `Other images.zip`: 85 numbered real property photos. Examined; many duplicate the five smaller named sets. The >360 MB archive was not imported wholesale. Relevant overlapping imagery was sourced from the smaller photo ZIPs instead. Do not infer unlabelled locations or project identities.

## Asset handling
31 curated photographs were converted into optimized WebP and committed under `apps/website/public/owner/2026/`. Embedded EXIF and location metadata were removed. The 3 hero slides and 3 homepage product cards use the exact source archive names, in the intended sequence. The site has no dependency on Adobe temporary transfer links. A temporary import workflow was deleted after successful asset commitment.

## Mapping and editorial authenticity
- Home slides: `slider-01`, `slider-02`, `slider-03`.
- Product cards: `product-develop`, `product-incubate`, `product-grow`. The homepage features these three; the About/product pages retain the two other brand product links.
- Famous Gardens: archive of completed houses, gate, bedroom, living room, kitchen, site team and construction across the Projects page, Famous Gardens project page, and unit-level reference galleries.
- Articles: all 20 existing published articles have individual real photographic coverage and a context-specific explanatory note. Article content remains educational and is not a substitute for current pricing or property due diligence.
- About, property collection and general editorial sections: owner-provided site and architectural photography replaces generic stock/illustration references.

## Accuracy restrictions
- User-supplied project images are archival. Do not represent a 2021 construction photograph as real-time progress in November 2026.
- Do not claim a unit type from a project-wide photo unless the specific unit was verified; unit pages visibly disclose this.
- Do not assign unlabelled photos to the legacy Merit Park, Green Island or Maiyegun projects. Continue requesting project-specific originals.
- Do not use photos to imply guaranteed income, mortgage approval, available inventory, ownership rights or construction completion.
- No faces are identified by name solely from photographs. Images are owner-provided for public website use; confirm photographer and model permissions where applicable.

## QA and production gates
`python3 scripts/verify-landshop-owner-media.py` verifies file signatures, file sizes, asset references, all 20 article slug mappings, and 3+3 homepage visuals. It is a mandatory step in validation and production release workflows. Existing header, footer, property filter, and property-details page structure are intentionally unchanged.

## November 1 follow-up: Contact page and past-project provenance

- The old `/media/landshop-contact-reception.webp` was a tiny legacy placeholder, and its caption asserted it depicted the actual Landshop reception without adequate provenance. Contact now displays `/owner/2026/garden-site-team.webp`, an original on-site photo from the owner ZIPs, with an explicit archival caption. **This is not represented as a photograph of the Lagos office.**
- The original Landshop archive already includes `/media/maiyegun0.webp`, whose project association is documented in `docs/EDITORIAL-PHOTOGRAPHY-SOURCES.md`. It may show historical Maiyegun project activity, but it is not evidence of current construction completion, units, pricing, occupation or land-title status. It appears on the Maiyegun portfolio card and historical project page with plain-language notices.
- Merit Park and Green Island have no new image assignments in this update. The legacy archive's naming is not sufficient to independently confirm both project identities. The current media placeholders are retained until exact estate-specific images and publication rights are approved.
- The public Contact and Maiyegun page photo references, as well as original WebP file headers, are checked by CI and the Namecheap post-deployment validation.

## November 1 verification of Merit Park and Green Island

An additional photograph was located inside the owner-provided `Other images.zip` archive, at `Other images/268.jpg`. The real on-site billboard visibly contains the project names **Merit Park** and **Famous Garden**, with a historical property marketing visual. It is not a photograph of an independently verified Merit Park property parcel or completed development. To preserve this distinction, the new site asset is labelled as historical branding and displayed on the Merit Park portfolio card and history page only.

The derivative `/owner/2026/merit-park-archival-signage.jpg` is a 1600 by 1200 pixel JPEG without retained camera metadata, 656119 bytes. Its expected SHA256 is `227450e4f813c5cc150e0aca0d42344f321f06cd981b1dec1725b194a1c3f42b`, checked in CI. The original owner archive is the source of the photograph; temporary Adobe transfer links are deleted from the release branch.

Independent period source: [The Nation, February 2, 2020](https://thenationonlineng.net/firm-unveils-affordable-purchase-of-land-and-property/) reported historical Landshop activity at a Merit Park and Famous Garden allocation event. This historical reporting does not confirm current project availability, title or allocations.

Green Island has no securely attributed site photograph in the six user-supplied ZIP archives, the current public media files or the matching Supabase storage objects. [Nigeria Property Centre historical listing, December 2024](https://nigeriapropertycentre.com/for-sale/land/mixed-use-land/lagos/lekki-ibeju/2622661-prime-plots-of-land) names Landshop LTD as advertiser of a Green Island plot listing at Iba-Oloja, Ibeju-Lekki. The listing is no longer on the market. Its former price and proposed development features are not current facts and must not be advertised as such.

The production estate registry currently contains Merit Park as a draft historical record, not an approved active listing. Green Island does not have a verified live estate record. Current estate imagery must only be published when project identity, rights of publication and date/context are confirmed.

**Site policy:** Real owner-supplied photographic evidence is welcome; a period marketing banner is labelled as historical advertising, not current construction. No unverified Green Island photograph is published. Product payments, new unit availability and title claims remain independently gated.
