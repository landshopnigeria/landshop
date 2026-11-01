#!/usr/bin/env python3
"""Fail the marketing-site release on mixed visible arrow glyphs or stale icon sizing."""
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
paths = re.findall(r"^\s*(arrow|external|chevron):'([^']+)'", icons, re.M)
if len(paths) != 3 or len(set(value for _, value in paths)) != 1:
    violations.append("SiteIcon arrow/external/dropdown shapes diverge")
if violations:
    print("FAIL: Mixed arrow/icon design detected")
    for violation in violations:
        print(violation)
    sys.exit(1)
print("PASS: 27px icons and one approved straight arrow across public pages")
