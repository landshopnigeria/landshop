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
