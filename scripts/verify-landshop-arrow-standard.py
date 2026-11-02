#!/usr/bin/env python3
"""Check 27px general icons, 22px directional arrows and compact V-only navbar carets."""
from pathlib import Path
import re
import sys

site = Path("apps/website")
arrow_glyphs = re.compile(r"[→←↗↖↘↙➔➜➝⟶⇢⇠›‹»«❯❮⟩⟨➤⇒⇨⇦]")
violations = []
for folder in (site / "app", site / "components"):
    for path in folder.rglob("*.tsx"):
        for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            if arrow_glyphs.search(line):
                violations.append(f"{path}:{number}: legacy arrow glyph")

# CSS-generated text arrows also violate the single SVG treatment.
for path in (site / "app").rglob("*.css"):
    for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if re.search(r"content\s*:\s*['\"]\s*[→←↗➔➜➝⟶⇢⇠›‹»«❯❮]", line):
            violations.append(f"{path}:{number}: CSS-generated arrow")

css = (site / "app/public-icon-27.css").read_text(encoding="utf-8")
layout = (site / "app/layout.tsx").read_text(encoding="utf-8")
icons = (site / "components/SiteIcon.tsx").read_text(encoding="utf-8")
approved = (site / "components/ApprovedArrow.tsx").read_text(encoding="utf-8")
if "import './public-icon-27.css';" not in layout:
    violations.append("Website layout is not loading 27px final icon stylesheet")
if "public-icon-35.css" in layout:
    violations.append("Legacy 35px icon stylesheet is still imported")
if "width:27px!important;height:27px!important" not in css:
    violations.append("Missing 27px size enforcement")
if "size={22}" not in approved or 'name="arrow"' not in approved:
    violations.append("Approved arrow is not the canonical 22px SiteIcon")
if "ls-icon-directional" not in icons:
    violations.append("Directional SVG arrow class is missing")
if "body svg.ls-icon-directional" not in css:
    violations.append("22px directional arrow styling is missing")
if not re.search(r"body svg\.ls-icon-directional[^}]*?width:22px!important", css, re.S):
    violations.append("Directional arrows are not constrained to 22px")
if "body .ls24-carousel-arrows svg" not in css:
    violations.append("Carousel directional arrows are not included in the 22px standard")
paths = dict(re.findall(r"^\s*(arrow|external|chevron):'([^']+)'", icons, re.M))
if set(paths) != {"arrow", "external", "chevron"} or paths["arrow"] != paths["external"]:
    violations.append("Action arrow and external arrow must use the same approved short arrow")
if paths.get("chevron") != "M5.5 9l6.5 6.5L18.5 9":
    violations.append("Navbar dropdown indicators must use the approved V-shaped chevron")
if "ls-nav-toggle .ls-icon-chevron" not in css:
    violations.append("Navbar chevrons must remain compact and distinct from 27px action icons")
header = (site / "components/SiteHeader.tsx").read_text(encoding="utf-8")
if '<SiteIcon name="search" size={22}/>' not in header or '<SiteIcon name="arrow" size={22}/></button>' not in header:
    violations.append("Header search magnifier and submit arrow must both be 22px")
if "body .ls-site-chrome .ls-global-search svg.ls-icon" not in css or "font-size:22px!important" not in css:
    violations.append("Header search icons must be constrained to 22px in the global stylesheet")
if violations:
    print("FAIL: Mixed arrow/icon design detected")
    for violation in violations:
        print(violation)
    sys.exit(1)
print("PASS: 27px general icons, 22px directional arrows and compact V navbar chevrons")
