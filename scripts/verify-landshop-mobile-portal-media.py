#!/usr/bin/env python3
"""Fail the build if Landshop mobile PWA references unavailable portal imagery.

Checks actual owner-approved binary assets, not placeholders or remote stock
images. These paths are also checked byte-for-byte by the live Namecheap gate.
"""
from pathlib import Path
import re

root=Path("apps/portal/public")
mobile=Path("apps/portal/app/mobile-app/MobileApp.tsx").read_text(encoding="utf-8")
gate=Path("scripts/check-landshop-live-assets.py").read_text(encoding="utf-8")
paths={
 "/owner/2026/famous-gardens-homepage-2026-11-mobile.jpg",
 "/owner/2026/site-client-inspection.webp",
 "/owner/2026/famous-completed-homes.webp",
 "/owner/2026/product-grow.webp",
 "/estates/green-island/site-progress-1.webp",
 "/estates/blue-diamonds/entrance-concept.webp",
 "/media/maiyegun0.webp",
}
assert "/media/mobile/" not in mobile and "/media/mobile/" not in gate, "Outdated non-existent portal photo folder detected"
seen=set(re.findall(r"""['"](/(?:owner|estates|media)/[^'"]+\.(?:jpg|webp))['"]""",mobile))
assert paths.issubset(seen), "Mobile PWA references changed without updating approved photo inventory: "+str(paths-seen)
for item in sorted(paths):
 path=root / item.lstrip("/")
 assert path.is_file(), "Missing portal mobile photograph: "+item
 assert 30_000 <= path.stat().st_size <= 500_000, "Missing, empty or oversized original photograph: "+item
 raw=path.read_bytes()
 expected=raw.startswith(bytes.fromhex("ffd8ff")) if item.endswith(".jpg") else raw[:4]==b"RIFF" and raw[8:12]==b"WEBP"
 assert expected, "Invalid original photo format: "+item
 assert f'"{item}"' in gate, "The live byte-for-byte photo verifier does not cover: "+item
print("PASS: all 7 approved mobile PWA images exist locally, have valid file headers and stay under 500 KB")
print("PASS: every original portal photo has a byte-for-byte Namecheap release parity gate")
