#!/usr/bin/env python3
"""Check 19px interface icons and 18.5px approved arrows and V carets."""
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

css = (site / "app/compact-public-ui.css").read_text(encoding="utf-8")
layout = (site / "app/layout.tsx").read_text(encoding="utf-8")
icons = (site / "components/SiteIcon.tsx").read_text(encoding="utf-8")
approved = (site / "components/ApprovedArrow.tsx").read_text(encoding="utf-8")
if "import './compact-public-ui.css';" not in layout:
    violations.append("Website layout is not loading the compact icon standard")
if "width:19px!important;height:19px!important" not in css:
    violations.append("Missing 19px icon enforcement")
if "size={18.5}" not in approved or 'name="arrow"' not in approved:
    violations.append("Approved arrow must be the canonical 18.5px SiteIcon")
if "ls-icon-directional" not in icons or "width:18.5px!important;height:18.5px!important" not in css:
    violations.append("18.5px directional arrow styling is missing")
paths = dict(re.findall(r"^\s*(arrow|external|chevron):'([^']+)'", icons, re.M))
if set(paths) != {"arrow", "external", "chevron"} or paths["arrow"] != paths["external"]:
    violations.append("Action arrow and external arrow must use the same approved short arrow")
if paths.get("chevron") != "M5.5 9l6.5 6.5L18.5 9":
    violations.append("Navbar dropdown indicators must use the approved V-shaped chevron")
header = (site / "components/SiteHeader.tsx").read_text(encoding="utf-8")
if '<SiteIcon name="search" size={19}/>' not in header or '<SiteIcon name="arrow" size={18.5}/></button>' not in header:
    violations.append("Search must use a 19px magnifier and an 18.5px arrow")
if "Clear choices. More room to explore." in header or "No internal scrolling" in header:
    violations.append("Preview-only footer text must not ship in navigation")
if violations:
    print("FAIL: Mixed arrow/icon design detected")
    for violation in violations:
        print(violation)
    sys.exit(1)
print("PASS: 19px interface icons, 18.5px arrows and V chevrons, no preview footer copy")
