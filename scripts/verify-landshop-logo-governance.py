#!/usr/bin/env python3
"""Release guard for authentic transparent, homepage-linked Landshop corporate logos.

Product brand marks and icons remain linked to their respective products.
Original WebP stays checked in solely as the approved source artwork.
"""
from hashlib import sha256
from pathlib import Path
from PIL import Image
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
APPS = ("website", "portal", "dashboard")
HOME = "https://www.landshopnigeria.com"
issues = []
digests = set()
for app in APPS:
    file = ROOT / "apps" / app / "public/media/logo-transparent.png"
    if not file.is_file():
        issues.append(f"{app}: missing transparent corporate PNG at {file}")
        continue
    digests.add(sha256(file.read_bytes()).hexdigest())
    with Image.open(file) as original:
        image = original.convert("RGBA")
        alpha = image.getchannel("A")
        low, high = alpha.getextrema()
        ratio = sum(a == 0 for a in alpha.getdata()) / (image.width * image.height)
        if low != 0 or high != 255 or ratio < 0.10:
            issues.append(f"{app}: logo alpha channel is not genuinely transparent ({low}, {high}; {ratio:.0%} clear)")
        for xy in ((0, 0), (image.width - 1, 0), (0, image.height - 1), (image.width - 1, image.height - 1)):
            if image.getpixel(xy)[3] != 0:
                issues.append(f"{app}: white-background remnant at PNG corner {xy}")
        print(f"PASS: {app} Landshop logo uses transparent RGBA ({image.width}x{image.height}; {ratio:.1%} clear)")
if len(digests) != 1:
    issues.append("Website, customer portal and staff application use different company logo PNG files")

scanned = 0
logo_placements = []
extensions = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".css", ".html"}
roots = [ROOT / "apps", ROOT / "packages", ROOT / "services"]
for base in roots:
    if not base.exists():
        continue
    for path in base.rglob("*"):
        if path.suffix.lower() not in extensions:
            continue
        if any(p in {"node_modules", ".next", "dist", "build", "coverage"} for p in path.parts):
            continue
        try:
            value = path.read_text(encoding="utf-8")
        except (UnicodeError, OSError):
            continue
        scanned += 1
        for no, line in enumerate(value.splitlines(), 1):
            if re.search(r"(?:/media/)?logo\.webp\b", line, re.IGNORECASE):
                issues.append(f"Retired white-backed logo reference: {path.relative_to(ROOT)}:{no}")
            if "/media/logo-transparent.png" in line:
                logo_placements.append(f"{path.relative_to(ROOT)}:{no}")

# These are customer-facing brand placements, not navigation to internal dashboards.
required = {
 "apps/website/components/SiteHeader.tsx": ['href="/" className="ls-brand"', '/media/logo-transparent.png'],
 "apps/website/components/SiteFooter.tsx": ['href="/" aria-label="Landshop home"', '/media/logo-transparent.png'],
 "apps/portal/app/page.tsx": [HOME, "const logo='/media/logo-transparent.png'"],
 "apps/dashboard/app/admin/CommandSideNavigation.tsx": [HOME, 'className="command-home-logo"', '/media/logo-transparent.png'],
 "apps/dashboard/app/admin/CommandWorkspace.tsx": [HOME, 'className="cc-brand"', '/media/logo-transparent.png'],
 "apps/dashboard/app/dashboard/CustomerNavigation.tsx": [HOME, '/media/logo-transparent.png'],
 "apps/dashboard/app/dashboard/page.tsx": [HOME, '/media/logo-transparent.png'],
 "apps/dashboard/app/staff/StaffAuthShell.tsx": [HOME, '/media/logo-transparent.png'],
 "apps/dashboard/app/staff/BasicStaffWorkspace.tsx": [HOME, '/media/logo-transparent.png'],
 "apps/dashboard/app/staff/StaffWorkspace.tsx": [HOME, '/media/logo-transparent.png'],
 "apps/dashboard/app/admin/communications/CommunicationCenter.tsx": [HOME, '/media/logo-transparent.png'],
 "apps/dashboard/app/admin/communications/PremiumMessagePreview.tsx": [HOME, '/media/logo-transparent.png'],
}
for relative, needles in required.items():
    path = ROOT / relative
    if not path.exists():
        issues.append(f"Required brand surface not found: {relative}")
        continue
    text = path.read_text(encoding="utf-8")
    for needle in needles:
        if needle not in text:
            issues.append(f"Missing official corporate brand or home link in {relative}: {needle}")

# White tiles explicitly created by CSS reproduce the user's screenshot even with a PNG.
css_guards = {
 "apps/dashboard/app/staff/staff-dashboard.css": r"\.ls25-logo\{[^}]*background\s*:\s*(?:#fff(?:fff)?|white)\s*;",
 "apps/dashboard/app/staff/basic-staff-dashboard.css": r"\.ls-basic-brand img\{[^}]*background\s*:\s*(?:#fff(?:fff)?|white)\s*[;}]" ,
 "apps/dashboard/app/enterprise-showcase.css": r"\.command-side \.command-brand\{[^}]*background\s*:\s*(?:#fff(?:fff)?|white)\s*!important",
}
for relative, pattern in css_guards.items():
    file = ROOT / relative
    if file.exists() and re.search(pattern, file.read_text(encoding="utf-8"), re.IGNORECASE | re.DOTALL):
        issues.append(f"White logo tile persists in {relative}")

print(f"Audited {scanned} source files. Found {len(logo_placements)} transparent corporate logo references.")
for item in logo_placements:
    print("LOGO", item)
if issues:
    for problem in issues:
        print("FAIL:", problem, file=sys.stderr)
    sys.exit(1)
print("PASS: all three apps use the identical transparent logo; branded UI links return to the Landshop homepage")
