#!/usr/bin/env python3
"""Check 27px action icons and the approved compact V-only navbar dropdown exception."""
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
if "size={27}" not in approved or 'name="arrow"' not in approved:
    violations.append("Approved arrow is not the canonical 27px SiteIcon")
paths = dict(re.findall(r"^\s*(arrow|external|chevron):'([^']+)'", icons, re.M))
if set(paths) != {"arrow", "external", "chevron"} or paths["arrow"] != paths["external"]:
    violations.append("Action arrow and external arrow must use the same approved short arrow")
if paths.get("chevron") != "M5.5 9l6.5 6.5L18.5 9":
    violations.append("Navbar dropdown indicators must use the approved V-shaped chevron")
if "ls-nav-toggle .ls-icon-chevron" not in css:
    violations.append("Navbar chevrons must remain compact and distinct from 27px action icons")
if violations:
    print("FAIL: Mixed arrow/icon design detected")
    for violation in violations:
        print(violation)
    sys.exit(1)
print("PASS: 27px action icons, approved short arrows and compact navbar V chevrons")
