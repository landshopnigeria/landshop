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
PAGES=(
    ("/","v16-separated-product-slides",".hero-v16-title"),
    ("/develop","data-product-journey",".lp-pathway-card"),
    ("/incubate","data-product-journey",".lp-pathway-card"),
    ("/grow","data-product-journey",".lp-pathway-card"),
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
    css_ok=0
    for relative in parser.css[:10]:
        asset=urljoin(f"https://{host}",relative)
        status,ch,content,_=request(asset)
        if status!=200 or "css" not in get_header(ch,"Content-Type").lower():
            raise AssertionError(f"CSS resource not available: {asset}")
        css_ok+=1
        if css_class in content.decode("utf-8","replace"):
            found=True
    if not found:
        raise AssertionError(f"New CSS selector {css_class} absent from live stylesheets on {host}{path}")
    for relative in parser.js[:2]:
        asset=urljoin(f"https://{host}",relative)
        js_status,jh,_,_=request(asset)
        if js_status!=200 or not any(x in get_header(jh,"Content-Type").lower() for x in ("javascript","ecmascript","text/plain")):
            raise AssertionError(f"New JavaScript bundle cannot be loaded: {asset}")
    print(f"  VERIFIED page markup + release meta + {css_ok} CSS files + JS references",flush=True)

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
    for host,path,error in failures:
        print(f"FAILURE SUMMARY {host}{path}: {error}",file=sys.stderr)
    if failures:
        raise SystemExit(1)
    print("PASS: Both domain variants serve current HTML + matching CSS and JS for all four principal pages.")
if __name__=="__main__":
    main()
