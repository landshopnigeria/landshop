#!/usr/bin/env python3
"""Fail production release when website HTML or its CSS/JS is stale or not served.

Unlike /api/release-health, this follows an ordinary browser's actual HTML asset
references on both public domain variants. Pure GET; no customer records modified.
"""
from __future__ import annotations
import os
import re
import socket
import sys
from html.parser import HTMLParser
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen

EXPECTED=os.environ.get("LANDSHOP_EXPECTED_SHA", "").strip()
HOSTS=("landshopnigeria.com","www.landshopnigeria.com")
APPLICATIONS=(("portal.landshopnigeria.com","/",'class="authGlass"'),("app.landshopnigeria.com","/staff/sign-in",'class="lsa-card signin"'),("app.landshopnigeria.com","/staff/sign-up",'class="lsa-card signup"'))
PAGES=(
    ("/","cinematic-property-video-preview",".ls-v23-hero"),
    ("/develop","data-product-journey",".lp-pathway-card"),
    ("/incubate","data-product-journey",".lp-pathway-card"),
    ("/grow","data-product-journey",".lp-pathway-card"),
    ("/properties","mk-property-grid",".mk-tools"),
)
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/156.0.0.0 Safari/537.36"

class Assets(HTMLParser):
    def __init__(self):
        super().__init__()
        self.css=[]
        self.js=[]
        self.meta_sha=None
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=="link" and a.get("rel")=="stylesheet" and a.get("href"):
            self.css.append(a["href"])
        if tag=="script" and a.get("src","").startswith("/_next/static/"):
            self.js.append(a["src"])
        if tag=="meta" and a.get("name")=="landshop-release":
            self.meta_sha=a.get("content")

def request(url):
    req=Request(url,headers={"User-Agent":UA,"Cache-Control":"no-cache, no-store","Pragma":"no-cache","Accept-Encoding":"identity"})
    with urlopen(req,timeout=35) as resp:
        status=resp.status
        headers=dict(resp.headers.items())
        content=resp.read(3_000_000)
        return status,headers,content,resp.geturl()

def get_header(headers,key):
    return next((v for k,v in headers.items() if k.lower()==key.lower()),"-")

def addresses(host):
    try:
        return sorted({p[4][0] for p in socket.getaddrinfo(host,443,proto=socket.IPPROTO_TCP)})
    except OSError as exc:
        return ["DNS lookup failed: "+str(exc)]

def check(host,path,marker,css_class):
    # Verify both the URL a real visitor types and an explicitly cache-busted request.
    # A successful cache-busted request is not proof the ordinary URL is fresh.
    url=f"https://{host}{path}"
    status,h,body,final=request(url)
    html=body.decode("utf-8","replace")
    parser=Assets()
    parser.feed(html)
    print(f"HTTP {host}{path}: {status} final={final} bytes={len(body)}",flush=True)
    print(f"  cache-control={get_header(h,'Cache-Control')} age={get_header(h,'Age')} via={get_header(h,'Via')} x-cache={get_header(h,'X-Cache')} cf-cache-status={get_header(h,'CF-Cache-Status')}",flush=True)
    print(f"  server={get_header(h,'Server')} content-type={get_header(h,'Content-Type')} build-meta={parser.meta_sha} css-count={len(parser.css)} js-count={len(parser.js)}",flush=True)
    if status!=200 or "/_next/" not in html or marker not in html:
        raise AssertionError(f"{host}{path} not serving the approved real Next.js page")
    if parser.meta_sha!=EXPECTED:
        raise AssertionError(f"{host}{path} HTML release {parser.meta_sha!r} does not match deployed commit")
    cache_control=get_header(h,"Cache-Control").lower()
    if "no-store" not in cache_control:
        raise AssertionError(f"{host}{path} HTML can be cached stale: {cache_control}")
    # The same route with a cache-busting query must also be the identical release.
    fresh_url=url+("?landshop_probe="+EXPECTED[:12])
    fresh_status,_,fresh_data,_=request(fresh_url)
    if fresh_status!=200 or f'content="{EXPECTED}"' not in fresh_data.decode("utf-8","replace"):
        raise AssertionError(f"{host}{path} cache-busted response does not match the active build")
    if not parser.css or not parser.js:
        raise AssertionError(f"{host}{path} lacks Next.js stylesheet or JavaScript references")
    found=False
    footer_css_found=False
    marketplace_toolbar_found=False
    correct_icon_css_found=False
    correct_arrow_css_found=False
    css_ok=0
    for relative in parser.css[:10]:
        asset=urljoin(f"https://{host}",relative)
        status,ch,content,_=request(asset)
        if status!=200 or "css" not in get_header(ch,"Content-Type").lower():
            raise AssertionError(f"CSS resource not available: {asset}")
        css_ok+=1
        css_text=content.decode("utf-8","replace")
        if css_class in css_text:
            found=True
        if "--ls-public-icon-size:27px" in css_text:
            correct_icon_css_found=True
        if "ls-icon-directional" in css_text and "width:23px!important" in css_text:
            correct_arrow_css_found=True
        if ".mk-tools form>.ls-branded-select" in css_text and "148px" in css_text:
            marketplace_toolbar_found=True
        if ".ls24-glass-area" in css_text and "landshop-footer-cris6882.svg" in css_text:
            footer_css_found=True
    if not found:
        raise AssertionError(f"New CSS selector {css_class} absent from live stylesheets on {host}{path}")
    if path=="/" and not correct_icon_css_found:
        raise AssertionError("Current 27px public icon stylesheet absent from fresh HTML asset links")
    if path=="/" and not correct_arrow_css_found:
        raise AssertionError("Current 23px directional arrow CSS absent from fresh HTML asset links")
    if path=="/properties" and not marketplace_toolbar_found:
        raise AssertionError("Current compact marketplace toolbar CSS absent from live build")
    if not footer_css_found:
        raise AssertionError("V24 global glass-footer CSS or approved photo background absent from compiled styles")
    if 'class="ls24-global-footer"' not in html or 'class="ls24-newsletter-section"' not in html:
        raise AssertionError("approved global newsletter/footer not rendered with the page")
    if path=="/":
        photo_status,photo_headers,photo_bytes,_=request(f"https://{host}/media/landshop-footer-cris6882.svg")
        photo_type=get_header(photo_headers,"Content-Type").lower()
        if photo_status!=200 or "svg" not in photo_type or len(photo_bytes)<6000 or b"data:image/webp;base64," not in photo_bytes:
            raise AssertionError("user-approved photo background missing from website assets")

    for relative in parser.js[:2]:
        asset=urljoin(f"https://{host}",relative)
        js_status,jh,_,_=request(asset)
        if js_status!=200 or not any(x in get_header(jh,"Content-Type").lower() for x in ("javascript","ecmascript","text/plain")):
            raise AssertionError(f"New JavaScript bundle cannot be loaded: {asset}")
    print(f"  VERIFIED page markup + release meta + {css_ok} CSS files + JS references",flush=True)

def check_application(host,path,marker):
    """Detect stale portal/staff HTML even when all three health endpoints are fresh."""
    url=f"https://{host}{path}"
    status,headers,data,final=request(url)
    html=data.decode("utf-8","replace")
    parser=Assets()
    parser.feed(html)
    print(f"APP HTTP {host}{path}: {status} final={final} release={parser.meta_sha} cache-control={get_header(headers,'Cache-Control')}",flush=True)
    if status!=200 or marker not in html or "/_next/" not in html:
        raise AssertionError(f"{host}{path} does not serve the approved Next.js sign-in page")
    if parser.meta_sha!=EXPECTED:
        raise AssertionError(f"{host}{path} stale HTML release: {parser.meta_sha!r}")
    if "no-store" not in get_header(headers,"Cache-Control").lower():
        raise AssertionError(f"{host}{path} sign-in HTML is cacheable")
    busted=url+("?landshop_probe="+EXPECTED[:12])
    status,_,fresh_body,_=request(busted)
    fresh=Assets();fresh.feed(fresh_body.decode("utf-8","replace"))
    if status!=200 or fresh.meta_sha!=EXPECTED:
        raise AssertionError(f"{host}{path} cache-busted HTML is out of date")
    if not parser.css or not parser.js:
        raise AssertionError(f"{host}{path} does not reference fresh compiled assets")
    for relative in parser.css[:6]:
        asset=urljoin(url,relative)
        asset_status,asset_headers,asset_body,_=request(asset)
        if asset_status!=200 or "css" not in get_header(asset_headers,"Content-Type").lower() or len(asset_body)<50:
            raise AssertionError(f"{host}{path} CSS missing: {asset}")
    for relative in parser.js[:2]:
        asset=urljoin(url,relative)
        asset_status,asset_headers,asset_body,_=request(asset)
        if asset_status!=200 or not any(x in get_header(asset_headers,"Content-Type").lower() for x in ("javascript","ecmascript","text/plain")) or not asset_body:
            raise AssertionError(f"{host}{path} JavaScript missing: {asset}")
    print(f"  VERIFIED dynamic HTML + exact release + {len(parser.css)} CSS refs + {len(parser.js)} JS refs",flush=True)

def main():
    if not re.fullmatch("[0-9a-f]{40}",EXPECTED):
        raise RuntimeError("LANDSHOP_EXPECTED_SHA must be the exact Git commit")
    for host in HOSTS:
        print(f"DNS {host}: {', '.join(addresses(host))}",flush=True)
    failures=[]
    for host in HOSTS:
        for path,marker,css_class in PAGES:
            try:
                check(host,path,marker,css_class)
            except (AssertionError,URLError,HTTPError,OSError,TimeoutError,ValueError) as exc:
                failures.append((host,path,str(exc)))
                print(f"FAILED {host}{path}: {exc}",file=sys.stderr,flush=True)
    for host,path,marker in APPLICATIONS:
        try:
            check_application(host,path,marker)
        except (AssertionError,URLError,HTTPError,OSError,TimeoutError,ValueError) as exc:
            failures.append((host,path,str(exc)))
            print(f"FAILED {host}{path}: {exc}",file=sys.stderr,flush=True)
    for host,path,error in failures:
        print(f"FAILURE SUMMARY {host}{path}: {error}",file=sys.stderr)
    if failures:
        raise SystemExit(1)
    print("PASS: Both website variants and portal/staff entry points serve exact-commit HTML + fresh CSS and JavaScript.")
if __name__=="__main__":
    main()
