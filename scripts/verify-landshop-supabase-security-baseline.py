#!/usr/bin/env python3
"""Prevent regression of the applied Landshop FK-index and password UI baseline.

This is a source-level CI check, not a replacement for live Supabase advisors,
provider Auth settings, penetration testing, or server-side password enforcement.
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / "supabase/migrations/20261102101029_landshop_foreign_key_indexes_november_2026.sql"
REVIEW = ROOT / "docs/LANDSHOP_SUPABASE_SECURITY_REVIEW_2026-11-02.md"

sql = MIGRATION.read_text(encoding="utf-8")
statements = [
    line.strip() for line in sql.splitlines()
    if line.strip() and not line.lstrip().startswith("--")
]
indexes = re.compile(
    r'^CREATE INDEX IF NOT EXISTS "lsfk_[0-9]{3}_[a-z0-9_]+" '
    r'ON "public"\."[a-z0-9_]+" \("[a-z0-9_]+"(?:, "[a-z0-9_]+")*\);$'
)
assert len(statements) == 74, (
    "The verified set of 74 foreign-key indexes has changed; "
    "rerun the live Supabase advisor before modifying this baseline"
)
assert all(indexes.fullmatch(stmt) for stmt in statements), (
    "Index migration must contain only validated, non-destructive CREATE INDEX statements"
)
assert len(set(statements)) == 74, "Duplicate foreign-key index statements found"
assert REVIEW.exists(), "Supabase privileged-RPC review must remain documented"

password_checks = {
    "apps/portal/app/page.tsx": ("password.length<12", "minLength={12}"),
    "apps/dashboard/app/staff/sign-up/page.tsx": ("v.password.length<12", "minLength={12}"),
    "apps/portal/app/update-password/page.tsx": ("password.length<12", "minLength={12}"),
}
for path, patterns in password_checks.items():
    source = (ROOT / path).read_text(encoding="utf-8")
    for pattern in patterns:
        assert pattern in source, f"{path}: 12-character signup/reset safeguard missing: {pattern}"

# These checks protect the public UI baseline; callers can still address Supabase
# Auth directly. Native leaked-password checks require Supabase Pro or higher.
print("PASS: All 74 tracked FK indexes remain intact and non-destructive")
print("PASS: Signup and reset screens retain the 12-character password minimum")
print("NOTE: Supabase leaked-password protection remains an account-level Pro feature")
