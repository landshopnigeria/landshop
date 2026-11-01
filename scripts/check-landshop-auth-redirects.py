#!/usr/bin/env python3
"""Read-only production regression checks for guest authentication boundaries.

Never sends credentials, registers an account or modifies private records.
Checks redirects without following them so no cookies or sessions are exchanged.
"""
from __future__ import annotations

from urllib.error import HTTPError
from urllib.parse import urljoin
from urllib.request import HTTPRedirectHandler, Request, build_opener
import sys


class DoNotFollow(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


OPENER=build_opener(DoNotFollow())
CHECKS=(
    ("https://portal.landshopnigeria.com/auth/callback",
     "https://portal.landshopnigeria.com/?error=missing_code",True),
    ("https://app.landshopnigeria.com/auth/callback",
     "https://app.landshopnigeria.com/staff/sign-in?error=missing_confirmation",True),
    ("https://app.landshopnigeria.com/admin",
     "https://app.landshopnigeria.com/staff/sign-in",True),
    ("https://app.landshopnigeria.com/staff",
     "https://app.landshopnigeria.com/staff/sign-in",False),
    ("https://app.landshopnigeria.com/dashboard",
     "https://portal.landshopnigeria.com/",False),
)


def check(source:str,destination:str,requires_no_store:bool)->None:
    request=Request(source,headers={
        "User-Agent":"Landshop-Guest-Auth-Regression/1.0",
        "Cache-Control":"no-cache, no-store",
        "Pragma":"no-cache",
    })
    try:
        response=OPENER.open(request,timeout=30)
    except HTTPError as exc:
        response=exc
    with response:
        status=response.status
        target=urljoin(source,response.headers.get("Location",""))
        cache_control=response.headers.get("Cache-Control","").lower()
        if status not in (302,303,307,308):
            raise AssertionError(f"{source}: expected an auth redirect, got HTTP {status}")
        if target!=destination:
            raise AssertionError(f"{source}: wrong guest redirect {target!r}; expected {destination!r}")
        if requires_no_store and "no-store" not in cache_control:
            raise AssertionError(f"{source}: sensitive redirect lacks no-store: {cache_control!r}")
        if response.headers.get("Content-Type","").lower().startswith("application/json"):
            raise AssertionError(f"{source}: unexpected API JSON exposed on an auth route")
        print(f"PASS guest auth redirect: {source} -> {target} ({status}, {cache_control})",flush=True)


if __name__=="__main__":
    errors=0
    for source,destination,private in CHECKS:
        try:
            check(source,destination,private)
        except Exception as exc:
            errors+=1
            print(f"FAILED guest auth guard {source}: {exc}",file=sys.stderr,flush=True)
    if errors:
        raise SystemExit(f"Auth regression failed: {errors} of {len(CHECKS)} checks")
    print(f"PASS: {len(CHECKS)} signed-out auth, verification and management access guards")
