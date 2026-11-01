#!/usr/bin/env python3
"""Prevent the retired staff department label from returning to the website or apps."""
from pathlib import Path
import re
import sys

pattern=re.compile(r'people\s*(?:&|and)\s*management',re.IGNORECASE)
bad=[]
for root in (Path('apps/website'),Path('apps/dashboard'),Path('apps/portal'),Path('packages/shared')):
    for path in root.rglob('*'):
        if path.suffix not in ('.tsx','.ts','.jsx','.js','.css','.html'):
            continue
        if any(part in ('node_modules','.next','dist','build') for part in path.parts):
            continue
        try:
            content=path.read_text(encoding='utf-8')
        except (OSError,UnicodeError):
            continue
        for lineno,line in enumerate(content.splitlines(),1):
            if pattern.search(line):
                bad.append(f'{path}:{lineno}')
if bad:
    print('FAIL: Retired Landshop personnel label remains in these files:',*bad,sep='\n')
    sys.exit(1)
print('PASS: Retired staff-department phrase absent across website, portal and enterprise UI')
