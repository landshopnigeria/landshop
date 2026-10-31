#!/usr/bin/env python3
"""Validate sourced Pexels photographs and independently packaged editorial assets.

Checks selected Pexels source images and user-provided low-rise property references.
Editorial assets are never substitutes for verified property listing photographs.
"""
from pathlib import Path
from urllib.request import Request, urlopen
import re
import sys

source=Path('apps/website/lib/editorial-imagery.ts').read_text('utf-8')
photos=re.findall(r"src:'(https://images\.pexels\.com/photos/(\d+)/pexels-photo-(\d+)\.jpeg\?[^']+)'",source)
refs=re.findall(r"source:'(https://www\.pexels\.com/photo/[^']+)'",source)
if len(photos)<4 or len(photos)!=len(refs):
    raise SystemExit(f'Invalid photo provenance record: {len(photos)} assets / {len(refs)} source pages')
# Self-hosted user-provided assets have a separate provenance and media-integrity check.
# This does not assert that third-party distribution rights were obtained.
local_refs=re.findall(r"src:'(/editorial/2026/[^']+\.jpg)'",source)
if len(local_refs)<5:
    raise SystemExit('Missing approved editorial replacement image references')
for local in sorted(set(local_refs)):
    p=Path('apps/website/public') / local.lstrip('/')
    if not p.is_file() or p.stat().st_size<10000:
        raise SystemExit(f'Missing or undersized self-hosted image: {local}')
    with p.open('rb') as file:
        header=file.read(3)
    if header[:3]!=b'\\xff\\xd8\\xff':
        raise SystemExit(f'Invalid JPEG image header for {local}')
    print(f'PASS self-hosted editorial reference {local}: {p.stat().st_size} bytes',flush=True)
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
print(f'PASS: {len(photos)} sourced Nigerian editorial photos plus {len(set(local_refs))} packaged marketing reference assets validated.')
