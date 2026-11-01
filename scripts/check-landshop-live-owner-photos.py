#!/usr/bin/env python3
"""Post-deployment checks for every owner photo in public/owner/2026.

The release is not successful unless every optimized real photograph can be
fetched from the actual Landshop website, not just found in Git.
"""
from pathlib import Path
from urllib.request import Request,urlopen
import os,time
root=Path("apps/website/public/owner/2026")
files=sorted(root.glob("*.webp"))
if len(files)!=31:raise SystemExit("Unexpected owner media count")
sha=os.environ.get("LANDSHOP_EXPECTED_SHA","unversioned")
base="https://www.landshopnigeria.com/owner/2026/"
failures=[]
for photo in files:
 url=base+photo.name+"?release="+sha[:12]
 success=False
 for attempt in range(4):
  try:
   req=Request(url,headers={"User-Agent":"Landshop-Owner-Media-Release-Check","Cache-Control":"no-store"})
   with urlopen(req,timeout=22) as response:
    header=response.read(12)
    if response.status==200 and header[:4]==b"RIFF" and header[8:12]==b"WEBP":
     success=True
     break
  except Exception as exc:
   if attempt==3:print(f"IMAGE_ERR {photo.name}: {type(exc).__name__}")
  if attempt<3:time.sleep(3)
 if not success:failures.append(photo.name)
 else:print("IMAGE_OK",photo.name,flush=True)
if failures:raise SystemExit("Missing or incorrect live owner media: "+", ".join(failures))
# Maiyegun's original project archive sits outside the curated 31 new photos.
# Check its actual binary and page placements on the same production release.
archive_url="https://www.landshopnigeria.com/media/maiyegun0.webp?release="+sha[:12]
with urlopen(Request(archive_url,headers={"Cache-Control":"no-store"}),timeout=22) as response:
 header=response.read(12)
 if response.status!=200 or header[:4]!=b"RIFF" or header[8:12]!=b"WEBP":
  raise SystemExit("Original Maiyegun project photo does not load as WebP")
for route,reference in [
 ("/contact","/owner/2026/garden-site-team.webp"),
 ("/projects","/media/maiyegun0.webp"),
 ("/projects/maiyegun-beach-estate","/media/maiyegun0.webp")
]:
 with urlopen(Request("https://www.landshopnigeria.com"+route+"?release="+sha[:12],
    headers={"Cache-Control":"no-store"}),timeout=25) as response:
  html=response.read(1_600_000).decode("utf-8","replace")
  if response.status!=200 or reference not in html:
   raise SystemExit(f"New photo not present on live page: {route}")
 print("PAGE_IMAGE_OK",route,reference,flush=True)
print(f"PASS {len(files)} publicly served owner photographs for release {sha[:12]}")
