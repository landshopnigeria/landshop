#!/usr/bin/env python3
"""Fail the build if owner photography or article-image mappings are incomplete."""
from pathlib import Path
import re,sys

site=Path("apps/website")
assets=site/"public/owner/2026"
photos=list(assets.glob("*.webp"))
if len(photos)!=31:raise SystemExit(f"Expected 31 reviewed owner WebP photographs, found {len(photos)}")
for photo in photos:
 data=photo.read_bytes()
 if len(data)<8_000 or len(data)>1_500_000 or data[:4]!=b"RIFF" or data[8:12]!=b"WEBP":
  raise SystemExit(f"Owner photograph invalid or unoptimized: {photo}")
source_files=[
 site/"components/LandshopHome.tsx",
 site/"app/contact/page.tsx",
 site/"components/V22HomeSections.tsx",
 site/"lib/editorial-imagery.ts",
 site/"lib/landshop-brand-media.ts",
 site/"lib/owner-article-media.ts",
 site/"app/projects/page.tsx",
 site/"app/projects/[slug]/page.tsx",
 site/"app/homes/famous-gardens/[unitType]/page.tsx",
]
for source in source_files:
 text=source.read_text()
 for filename in re.findall(r"/owner/2026/([a-z0-9-]+\.webp)",text):
  if not (assets/filename).is_file():
   raise SystemExit(f"Broken owner media reference in {source}: {filename}")
media=(site/"lib/owner-article-media.ts").read_text()
mapping=set(re.findall(r'"([a-z0-9-]+)":\{image:',media))
core=(site/"lib/guides.ts").read_text()
extra=(site/"lib/v22-guides.ts").read_text()
slugs=set(re.findall(r"slug:'([a-z0-9-]+)'",core+extra))
if mapping!=slugs:raise SystemExit(f"Articles missing media: {slugs-mapping}; orphaned maps: {mapping-slugs}")
if not all((assets/f"slider-0{i}.webp").exists() for i in range(1,4)):
 raise SystemExit("Missing one of the three owner-provided slider photographs")
if not all((assets/f"product-{p}.webp").exists() for p in ("develop","incubate","grow")):
 raise SystemExit("Missing one of the three owner-provided product-card photographs")
# The contact page must use a real owner image rather than the old tiny
# 6-KB reception placeholder. Historical media must have a matching project label.
contact=(site/"app/contact/page.tsx").read_text()
if '/media/landshop-contact-reception.webp' in contact:
 raise SystemExit("Outdated reception image still referenced on Contact")
if '/owner/2026/garden-site-team.webp' not in contact or 'archival' not in contact.lower():
 raise SystemExit("Contact photo lacks real owner-photo archival provenance")
historic=site/"public/media/maiyegun0.webp"
if not historic.is_file() or historic.stat().st_size<8000:
 raise SystemExit("Historical Maiyegun media is unavailable")
data=historic.read_bytes()
if data[:4]!=b'RIFF' or data[8:12]!=b'WEBP':
 raise SystemExit("Historical Maiyegun file is not a valid WebP")
for page in [site/"app/projects/page.tsx",site/"app/projects/[slug]/page.tsx"]:
 body=page.read_text()
 if '/media/maiyegun0.webp' not in body or 'archiv' not in body.lower():
  raise SystemExit(f"Maiyegun archival image and historical disclaimer missing in {page}")
# The Merit Park owner archive contains a legible historical billboard.
# Preserve its original match and prohibit attribution to an available plot.
import hashlib
historic=assets/"merit-park-archival-signage.jpg"
if not historic.is_file() or not 100000 <= historic.stat().st_size <= 950000:
 raise SystemExit("Missing approved historical Merit Park photo")
if hashlib.sha256(historic.read_bytes()).hexdigest()!="227450e4f813c5cc150e0aca0d42344f321f06cd981b1dec1725b194a1c3f42b":
 raise SystemExit("Merit Park archival photo differs from the verified owner-supplied original")
project_card=(site/"app/projects/page.tsx").read_text()
detail=(site/"app/projects/[slug]/page.tsx").read_text()
for body in (project_card,detail):
 if "/owner/2026/merit-park-archival-signage.jpg" not in body:
  raise SystemExit("Merit Park must display its verified owner-supplied historical photo")
 if "historical" not in body.lower() and "archiv" not in body.lower():
  raise SystemExit("Merit Park photo must be labelled historical")
if "nigeriapropertycentre.com/for-sale/land" not in detail:
 raise SystemExit("Green Island historical listing attribution missing")
if "'green-island':" not in project_card or "awaiting verification" not in project_card.lower():
 raise SystemExit("Green Island unverified imagery must remain unclaimed")
print(f"Owner photography verified: {len(photos)} WebP files, {len(slugs)} article mappings, 3 slides and 3 featured product cards")
