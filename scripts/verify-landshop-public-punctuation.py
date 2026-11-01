#!/usr/bin/env python3
"""Prevent long dash punctuation from returning to Landshop's public website.

Only inspect source text for the public website. Do not rewrite URL hyphens,
CSS identifiers, JavaScript subtraction, negative amounts or date arithmetic.
"""
from pathlib import Path
import re
import sys

root=Path("apps/website")
extensions={".ts",".tsx",".js",".jsx",".css",".json",".md",".html"}
forbidden=re.compile("[\u2014\u2013\u2212]")
errors=[]
checked=0

for path in sorted(root.rglob("*")):
    if not path.is_file() or path.suffix not in extensions:
        continue
    if any(part in {"node_modules",".next","dist","build"} for part in path.parts):
        continue
    checked+=1
    for lineno,line in enumerate(path.read_text(encoding="utf-8").splitlines(),1):
        found=forbidden.search(line)
        if found:
            errors.append(f"{path}:{lineno}: forbidden long dash punctuation U+{ord(found.group(0)):04X}")

if errors:
    print("\n".join(errors))
    raise SystemExit(f"FAIL: {len(errors)} long dash occurrences remain in public website source")
print(f"PASS: No long dash punctuation found in {checked} public website source files")
