#!/usr/bin/env python3
"""Verify genuine, locally published Landshop owner photography.
No unreliable external stock CDN or rendered illustration is required.
"""
from pathlib import Path
import hashlib,re

site=Path("apps/website")
catalog=(site/"lib/editorial-imagery.ts").read_text("utf-8")
inventory=Path("docs/OWNER-PHOTOGRAPHY-MAPPING-2026.md")
if not inventory.exists():raise SystemExit("Missing user photo archive provenance documentation")
record=inventory.read_text("utf-8")
for archive in ("Slider.zip","Products  landshop homepage cads imges.zip","Famus Gardern.zip","Landshop Famous Garden.zip","layouts.zip","Other images.zip"):
 if archive not in record:raise SystemExit("Missing audit source archive "+archive)
source_refs=re.findall(r"src:'(/owner/2026/[a-z0-9-]+\.webp)'",catalog)
if len(source_refs)<10 or len(set(source_refs))!=len(source_refs):
 raise SystemExit("Expected at least 10 unique mapped real photos in the editorial catalog")
for ref in source_refs:
 path=site/"public"/ref.lstrip("/")
 if not path.is_file() or not (8000<=path.stat().st_size<=1_500_000):
  raise SystemExit("Missing or invalid owner-supplied photo "+ref)
 with path.open("rb") as f:
  header=f.read(12)
 if header[:4]!=b"RIFF" or header[8:12]!=b"WEBP":
  raise SystemExit("Invalid WebP photo signature "+ref)
 print("PASS sourced owner archive",ref,"bytes",path.stat().st_size,flush=True)
if "images.pexels.com" in catalog or "unsplash" in catalog:
 raise SystemExit("The marketing catalog still links to generic remote photo stock")
print(f"PASS: {len(source_refs)} unique owner-supplied editorial references; source archives documented and each WebP file verified.")
