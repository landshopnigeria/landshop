#!/usr/bin/env python3
"""Source-level invariant: anonymous staff/customer requests redirect in middleware.

Prevents an RSC stream from yielding HTTP 200 before server-side redirect().
This does not bypass the existing Supabase getUser() or role authorization.
"""
from pathlib import Path

source=Path("apps/dashboard/middleware.ts").read_text(encoding="utf-8")
anchor="const {data:{user},error}=await supabase.auth.getUser();"
staff="return privateRedirect(request,'/staff/sign-in');"
customer="return privateRedirect(request,'https://portal.landshopnigeria.com/');"
admin="if(request.nextUrl.pathname==='/admin'||request.nextUrl.pathname.startsWith('/admin/'))"
for token in (anchor,staff,customer,admin):
    assert token in source, f"Missing guest authentication safeguard: {token}"

guard_start=source.index(anchor)
staff_at=source.index(staff,guard_start)
customer_at=source.index(customer,staff_at)
admin_at=source.index(admin,customer_at)
assert guard_start < staff_at < customer_at < admin_at, "Guest checks must run before protected render"
segment=source[guard_start:admin_at]
assert "if(error||!user){" in segment, "Anonymous routes must explicitly gate on Supabase getUser"
assert "path==='/staff'||path.startsWith('/staff/')" in segment, "Missing private staff descendants"
assert "path==='/dashboard'||path.startsWith('/dashboard/')" in segment, "Missing private customer descendants"
assert "if(user){" in segment, "Authorized session state check was removed"
assert "landshop_my_account_state" in segment, "Suspended account check must remain intact"
assert "getUser()" in segment, "User must be verified rather than inferred from editable metadata"
print("PASS: Supabase-verifiable staff and customer guest HTTP redirects precede streamed route content.")
