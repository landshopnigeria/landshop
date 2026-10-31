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
print(f"PASS {len(files)} publicly served owner photographs for release {sha[:12]}")
