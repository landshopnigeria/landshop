#!/usr/bin/env python3
"""Validate that marketing photos are separately licensed real Nigerian editorial assets.

Runs on the selected ten PHOTO IDs only; never scrapes social media or Pexels
catalogues. Fails before deployment for invalid/undeliverable image URLs.
"""
from pathlib import Path
from urllib.request import Request, urlopen
import re
import sys

source=Path('apps/website/lib/editorial-imagery.ts').read_text('utf-8')
photos=re.findall(r"src:'(https://images\.pexels\.com/photos/(\d+)/pexels-photo-(\d+)\.jpeg\?[^']+)'",source)
refs=re.findall(r"source:'(https://www\.pexels\.com/photo/[^']+)'",source)
if len(photos)<9 or len(photos)!=len(refs):
    raise SystemExit(f'Invalid photo provenance record: {len(photos)} assets / {len(refs)} source pages')
for url,first,second in photos:
    if first!=second or 'auto=compress' not in url or 'w=' not in url:
        raise SystemExit('Unverified or unoptimized photo URL in source catalog')
for url,photo_id,_ in photos:
    try:
        req=Request(url,method='HEAD',headers={'User-Agent':'LandshopImageVerification/1.0'})
        with urlopen(req,timeout=25) as response:
            code=response.status
            ctype=response.headers.get('content-type','')
            size=response.headers.get('content-length','')
            if code!=200 or 'image/' not in ctype.lower():
                raise ValueError(f'{photo_id}: HTTP {code}, Content-Type {ctype}')
            print(f'PASS real Nigerian editorial photo {photo_id}: {ctype}, bytes={size}',flush=True)
    except Exception as exc:
        print(f'Image verification failed for photo {photo_id}: {exc}',file=sys.stderr)
        raise SystemExit(1)
print(f'PASS: {len(photos)} curated real Nigerian editorial photos and provenance records verified.')
