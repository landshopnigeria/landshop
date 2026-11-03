#!/usr/bin/env python3
"""Prevent unsafe implicit permissions on privileged functions in future migrations.

This check does not change existing grants. Historic migrations, which already
have live dependencies, require a separately reviewed compatibility migration.
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
BASELINE = "20261102101029"
ALLOW_ANONYMOUS = {
    "landshop_assert_account_access",  # Read-only pre-request denial hook; returns no private data.
    "landshop_contact_submit",
    "landshop_inspection_request",
    "landshop_newsletter_subscribe",
    "landshop_newsletter_unsubscribe",
}
DECLARATION = re.compile(
    r"\bCREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+"
    r"(?:\"?public\"?\.)?\"?([a-z][a-z0-9_]*)\"?\s*\(",
    re.IGNORECASE,
)
DEFINER = re.compile(r"\bSECURITY\s+DEFINER\b", re.IGNORECASE)
PIN_SEARCH_PATH = re.compile(r"\bSET\s+search_path\s*(?:TO|=)\s*(?:''|\"\"|pg_catalog)", re.IGNORECASE)

def matches_function_permission(source: str, verb: str, function: str) -> bool:
    statement = (
        rf"\b{verb}\s+(?:ALL(?:\s+PRIVILEGES)?|EXECUTE)?\s*"
        rf"ON\s+FUNCTION\s+(?:\"?public\"?\.)?\"?{re.escape(function)}\"?\s*\("
    )
    return bool(re.search(statement, source, re.IGNORECASE))

def grants_anonymous(source: str, function: str) -> bool:
    pattern = (
        rf"\bGRANT\s+EXECUTE\s+ON\s+FUNCTION\s+"
        rf"(?:\"?public\"?\.)?\"?{re.escape(function)}\"?\s*\([^;]*?\)"
        rf"\s+TO\s+(?:PUBLIC|anon)\b"
    )
    return bool(re.search(pattern, source, re.IGNORECASE | re.DOTALL))

violations = []
tested = 0
for migration in sorted((ROOT / "supabase" / "migrations").glob("*.sql")):
    stamp = migration.name.split("_", 1)[0]
    if not (stamp.isdigit() and stamp > BASELINE):
        continue
    source = migration.read_text(encoding="utf-8")
    source = re.sub(r"/\*.*?\*/", "", source, flags=re.DOTALL)
    source = re.sub(r"(?m)^[ \t]*--[^\n]*$", "", source)
    functions = list(DECLARATION.finditer(source))
    for i, fn in enumerate(functions):
        segment = source[fn.start():functions[i+1].start() if i+1 < len(functions) else len(source)]
        if not DEFINER.search(segment):
            continue
        tested += 1
        name = fn.group(1).lower()
        if not PIN_SEARCH_PATH.search(segment):
            violations.append(f"{migration}: {name}: pin the function search_path")
        if not matches_function_permission(source, "REVOKE", name):
            violations.append(f"{migration}: {name}: explicitly REVOKE ALL/EXECUTE ON FUNCTION")
        if not matches_function_permission(source, "GRANT", name):
            violations.append(f"{migration}: {name}: explicitly GRANT EXECUTE to intended roles")
        if grants_anonymous(source, name) and name not in ALLOW_ANONYMOUS:
            violations.append(f"{migration}: {name}: unreviewed anonymous SECURITY DEFINER RPC")

if violations:
    raise SystemExit("FAIL: \n" + "\n".join(violations))
print(
    f"PASS: {tested} new SECURITY DEFINER functions checked. "
    "New functions require an explicit revoke, restricted grants and fixed search_path."
)
