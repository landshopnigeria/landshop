#!/usr/bin/env python3
"""Post-deployment checks for every owner photo in public/owner/2026.

The release is not successful unless every optimized real photograph can be
fetched from the actual Landshop website, not just found in Git.
"""
from pathlib import Path
from urllib.request import Request,urlopen
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.error import HTTPError, URLError
import os,time
root=Path("apps/website/public/owner/2026")
files=sorted(root.glob("*.webp"))
if len(files)!=31:raise SystemExit("Unexpected owner media count")
sha=os.environ.get("LANDSHOP_EXPECTED_SHA","unversioned")
base="https://www.landshopnigeria.com/owner/2026/"
def checked_get(url, *, limit=22, attempts=3):
 """Retry transient network failures without accepting missing or invalid assets."""
 last=None
 for attempt in range(attempts):
  try:
   req=Request(url,headers={"User-Agent":"Landshop-Owner-Media-Release-Check","Cache-Control":"no-store"})
   with urlopen(req,timeout=limit) as response:
    if response.status!=200:
     raise RuntimeError(f"Unexpected HTTP {response.status} for {url}")
    return response.read(1_600_000)
  except (TimeoutError,URLError,OSError) as exc:
   last=exc
   print(f"RETRY {attempt+1}/{attempts} {url.split('?')[0]}: {type(exc).__name__}",flush=True)
   if attempt+1<attempts: time.sleep(2*(attempt+1))
  except HTTPError as exc:
   # Do not treat missing media as a network timeout.
   raise RuntimeError(f"HTTP {exc.code} for {url}") from exc
 raise RuntimeError(f"Unreachable after {attempts} attempts: {url.split('?')[0]} ({type(last).__name__})") from last

def check_photo(photo):
 data=checked_get(base+photo.name+"?release="+sha[:12],limit=16)
 if data[:4]!=b"RIFF" or data[8:12]!=b"WEBP":
  raise RuntimeError(f"Invalid WebP content: {photo.name}")
 return photo.name

failures=[]
# Requests to shared hosting are deliberately bounded to avoid overload.
with ThreadPoolExecutor(max_workers=4) as pool:
 futures={pool.submit(check_photo,photo):photo for photo in files}
 for future in as_completed(futures):
  photo=futures[future]
  try: print("IMAGE_OK",future.result(),flush=True)
  except Exception as exc:
   failures.append(photo.name)
   print(f"IMAGE_ERR {photo.name}: {exc}",flush=True)
if failures:raise SystemExit("Missing or incorrect live owner media: "+", ".join(sorted(failures)))
# Maiyegun's original project archive sits outside the curated 31 new photos.
# Check its actual binary and page placements on the same production release.
archive_url="https://www.landshopnigeria.com/media/maiyegun0.webp?release="+sha[:12]
header=checked_get(archive_url)[:12]
if header[:4]!=b"RIFF" or header[8:12]!=b"WEBP":
 raise SystemExit("Original Maiyegun project photo does not load as WebP")
for route,reference in [
 ("/contact","/owner/2026/garden-site-team.webp"),
 ("/projects","/media/maiyegun0.webp"),
 ("/projects/maiyegun-beach-estate","/media/maiyegun0.webp")
]:
 html=checked_get("https://www.landshopnigeria.com"+route+"?release="+sha[:12]).decode("utf-8","replace")
 if reference not in html:
  raise SystemExit(f"New photo not present on live page: {route}")
 print("PAGE_IMAGE_OK",route,reference,flush=True)
# The separate 2026 owner archive includes documentary Merit Park signage.
# This archive is distinct from the 31 previously approved marketing photos.
url="https://www.landshopnigeria.com/owner/2026/merit-park-archival-signage.jpg?release="+sha[:12]
first=checked_get(url)[:3]
if first!=bytes.fromhex("ffd8ff"):
 raise SystemExit("Approved historical Merit Park JPEG missing or corrupted on live website")
print("IMAGE_OK merit-park-archival-signage.jpg",flush=True)
for route in ("/projects","/projects/merit-park"):
 html=checked_get("https://www.landshopnigeria.com"+route+"?release="+sha[:12]).decode("utf-8","replace")
 if "/owner/2026/merit-park-archival-signage.jpg" not in html:
  raise SystemExit("Historical Merit Park photo not visible in HTML at "+route)
 print("PAGE_IMAGE_OK",route,flush=True)
print(f"PASS {len(files)} publicly served owner photographs for release {sha[:12]}")
