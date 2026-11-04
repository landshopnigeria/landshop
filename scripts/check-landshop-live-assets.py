#!/usr/bin/env python3
"""Fail production release when website HTML or its CSS/JS is stale or not served.

Unlike /api/release-health, this follows an ordinary browser's actual HTML asset
references on both public domain variants. Pure GET; no customer records modified.
"""
from __future__ import annotations
from hashlib import sha256
from pathlib import Path
import os
import time
from functools import lru_cache
import re
import json
import socket
import sys
from html.parser import HTMLParser
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen

EXPECTED=os.environ.get("LANDSHOP_EXPECTED_SHA", "").strip()
HOSTS=("landshopnigeria.com","www.landshopnigeria.com")
APPLICATIONS=(("portal.landshopnigeria.com","/",'class="authGlass"'),("portal.landshopnigeria.com","/mobile-app",'class="lm-stage"'),("app.landshopnigeria.com","/staff/sign-in",'class="lsa-card signin"'),("app.landshopnigeria.com","/staff/sign-up",'class="lsa-card signup"'))
PAGES=(
    ("/","cinematic-property-video-preview",".ls-v23-hero"),
    ("/develop","lsp-luxury",".lsp-luxury .lsp-actions"),
    ("/incubate","lsp-luxury",".lsp-luxury .lsp-actions"),
    ("/grow","lsp-luxury",".lsp-luxury .lsp-actions"),
    ("/projects/famous-gardens","lde-gallery",".lde-thumbs"),
    ("/projects/merit-park","lde-gallery",".lde-thumbs"),
    ("/projects/maiyegun-beach-estate","lde-gallery",".lde-thumbs"),
    ("/projects/green-island","lde-gallery",".lde-thumbs"),
    ("/projects/blue-diamonds","lde-gallery",".lde-thumbs"),
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

def request(url, *, static=False):
    # HTML must bypass caches. Immutable hashed CSS/JS and versioned PNG
    # are deliberately fetched with browser-standard headers to avoid
    # forcing uncached LiteSpeed work for each repeated stylesheet URL.
    headers={"User-Agent":UA,"Accept-Encoding":"identity"}
    if not static:
        headers.update({"Cache-Control":"no-cache, no-store","Pragma":"no-cache"})
    req=Request(url,headers=headers)
    # Shared-host protection: do not burst hundreds of new TLS connections.
    # Keep every original assertion; retries apply only to transport failures.
    for attempt in range(2):
        time.sleep(2 if attempt == 0 else 15)
        try:
            with urlopen(req,timeout=24 if static else 35) as resp:
                status=resp.status
                response_headers=dict(resp.headers.items())
                content=resp.read(3_000_000)
                return status,response_headers,content,resp.geturl()
        except HTTPError:
            raise
        except (URLError,TimeoutError,OSError) as exc:
            if attempt:
                raise
            print(f"RETRY transport: {url} ({type(exc).__name__})",flush=True)

@lru_cache(maxsize=96)
def request_static(url):
    """Verify identical immutable assets once per host, retrying a transient timeout."""
    return request(url,static=True)

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
        status,ch,content,_=request_static(asset)
        if status!=200 or "css" not in get_header(ch,"Content-Type").lower():
            raise AssertionError(f"CSS resource not available: {asset}")
        css_ok+=1
        css_text=content.decode("utf-8","replace")
        if css_class in css_text:
            found=True
        if "--ls-public-icon-size:19px" in css_text:
            correct_icon_css_found=True
        if "ls-icon-directional" in css_text and "width:18.5px!important" in css_text:
            correct_arrow_css_found=True
        if ".mk-tools form>.ls-branded-select" in css_text and "148px" in css_text:
            marketplace_toolbar_found=True
        if ".ls24-glass-area" in css_text and "landshop-footer-cris6882.svg" in css_text:
            footer_css_found=True
    if not found:
        raise AssertionError(f"New CSS selector {css_class} absent from live stylesheets on {host}{path}")
    if path in ("/develop","/incubate","/grow"):
        if 'class="lsp-product lsp-luxury"' not in html:
            raise AssertionError(f"{host}{path} is not serving the redesigned luxury product layout")
        if 'class="lsp-compact-pathways"' not in html or 'class="lsp-compact-secure"' not in html:
            raise AssertionError(f"{host}{path} is missing the preserved product pathways and application handoff")
    if path=="/" and not correct_icon_css_found:
        raise AssertionError("Current 19px public icon stylesheet absent from fresh HTML asset links")
    if path=="/" and not correct_arrow_css_found:
        raise AssertionError("Current 18.5px directional arrow CSS absent from fresh HTML asset links")
    if path=="/properties" and not marketplace_toolbar_found:
        raise AssertionError("Current compact marketplace toolbar CSS absent from live build")
    if not footer_css_found:
        raise AssertionError("V24 global glass-footer CSS or approved photo background absent from compiled styles")
    if 'class="ls24-global-footer"' not in html or 'class="ls24-newsletter-section"' not in html:
        raise AssertionError("approved global newsletter/footer not rendered with the page")
    if path=="/":
        photo_status,photo_headers,photo_bytes,_=request_static(f"https://{host}/media/landshop-footer-cris6882.svg")
        photo_type=get_header(photo_headers,"Content-Type").lower()
        if photo_status!=200 or "svg" not in photo_type or len(photo_bytes)<6000 or b"data:image/webp;base64," not in photo_bytes:
            raise AssertionError("user-approved photo background missing from website assets")

    for relative in parser.js[:2]:
        asset=urljoin(f"https://{host}",relative)
        js_status,jh,_,_=request_static(asset)
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
        asset_status,asset_headers,asset_body,_=request_static(asset)
        if asset_status!=200 or "css" not in get_header(asset_headers,"Content-Type").lower() or len(asset_body)<50:
            raise AssertionError(f"{host}{path} CSS missing: {asset}")
    for relative in parser.js[:2]:
        asset=urljoin(url,relative)
        asset_status,asset_headers,asset_body,_=request_static(asset)
        if asset_status!=200 or not any(x in get_header(asset_headers,"Content-Type").lower() for x in ("javascript","ecmascript","text/plain")) or not asset_body:
            raise AssertionError(f"{host}{path} JavaScript missing: {asset}")
    print(f"  VERIFIED dynamic HTML + exact release + {len(parser.css)} CSS refs + {len(parser.js)} JS refs",flush=True)

def check_transparent_brand_logo(host, app):
    """Require the exact original-artwork RGBA PNG to be served by every public hostname."""
    name = "/media/logo-transparent.png"
    url = f"https://{host}{name}?release={EXPECTED[:12]}"
    status, headers, blob, final = request_static(url)
    local = Path("apps") / app / "public" / "media" / "logo-transparent.png"
    if status != 200 or not blob.startswith(bytes((137,80,78,71,13,10,26,10))):
        raise AssertionError(f"{host}: transparent logo missing or not PNG")
    if not local.exists():
        raise AssertionError(f"{app}: original transparent release file not found")
    if sha256(blob).digest() != sha256(local.read_bytes()).digest():
        raise AssertionError(f"{host}: live logo differs from the exact approved transparent release asset")
    if "image/png" not in get_header(headers, "Content-Type").lower():
        raise AssertionError(f"{host}: expected image/png, got {get_header(headers, 'Content-Type')}")
    if len(blob) < 10000 or blob[25] != 6:
        raise AssertionError(f"{host}: missing valid RGBA logo content")
    print(f"BRAND_OK {host}{name}: exact logo digest {sha256(blob).hexdigest()[:12]}",flush=True)

def check_installable_mobile_app():
    """A green release must actually serve the approved installable mobile UI, never a 404."""
    host="portal.landshopnigeria.com"
    prefix=f"https://{host}"
    url=prefix+"/mobile-app/manifest.webmanifest"
    status,headers,data,_=request(url)
    if status != 200 or "json" not in get_header(headers,"Content-Type").lower():
        raise AssertionError("Mobile manifest is not publicly served as JSON")
    manifest=json.loads(data.decode("utf-8"))
    if manifest.get("start_url")!="/mobile-app?screen=home" or manifest.get("display")!="standalone":
        raise AssertionError("Landshop mobile install manifest is invalid")
    for size in ("192","512"):
        path=f"/mobile-app/icons/{size}"
        if not any(x.get("src")==path for x in manifest.get("icons",[])):
            raise AssertionError(f"Missing approved Landshop {size}px app icon reference")
        code,icon_headers,icon_data,_=request_static(prefix+path)
        if code != 200 or not icon_data.startswith(bytes((137,80,78,71,13,10,26,10))):
            raise AssertionError(f"Landshop mobile {size}px app icon is not a served PNG")
        if "image/png" not in get_header(icon_headers,"Content-Type").lower():
            raise AssertionError(f"Wrong mobile app icon content type: {size}")
    print("MOBILE_APP_OK: production screen, manifest and both official brand icons verified",flush=True)

def check_mobile_app_local_media():
    """Verify the actual mobile PWA loads its owner assets from the portal origin."""
    host="portal.landshopnigeria.com"
    paths=(
        "/media/landshop-mobile-famous-gardens.jpg",
        "/media/landshop-mobile-site-client-inspection.webp",
        "/media/landshop-mobile-famous-completed-homes.webp",
        "/media/landshop-mobile-product-grow.webp",
        "/media/landshop-mobile-green-island-site-progress.webp",
        "/media/landshop-mobile-blue-diamonds-concept.webp",
        "/media/maiyegun0.webp",
    )
    for path in paths:
        local=Path("apps/portal/public") / path.lstrip("/")
        if not local.is_file() or local.stat().st_size>500_000:
            raise AssertionError(f"Missing or oversized portal mobile image: {path}")
        url=f"https://{host}{path}?release={EXPECTED[:12]}"
        status,headers,blob,_=request_static(url)
        content_type=get_header(headers,"Content-Type").lower()
        is_jpeg=path.endswith(".jpg")
        valid=blob.startswith(bytes.fromhex("ffd8ff")) if is_jpeg else blob[:4]==b"RIFF" and blob[8:12]==b"WEBP"
        if status!=200 or not valid or ("image/jpeg" if is_jpeg else "image/webp") not in content_type:
            raise AssertionError(f"Mobile PWA local photograph not served: {path}")
        if sha256(blob).digest()!=sha256(local.read_bytes()).digest():
            raise AssertionError(f"Mobile PWA image differs from approved asset: {path}")
        print(f"MOBILE_MEDIA_OK {path}: exact asset digest",flush=True)

def check_famous_gardens_hero_photo(host):
    """Check both optimized owner-approved hero photos on actual production."""
    variants=(
        ("/owner/2026/famous-gardens-homepage-2026-11-desktop.jpg", 300_000),
        ("/media/landshop-mobile-famous-gardens.jpg", 140_000),
    )
    for name,max_size in variants:
        local=Path("apps/website/public") / name.lstrip("/")
        if not local.is_file() or local.stat().st_size>max_size:
            raise AssertionError(f"Missing or oversized Famous Gardens photo: {name}")
        url=f"https://{host}{name}?release={EXPECTED[:12]}"
        status,headers,live_bytes,_=request_static(url)
        if status!=200 or not live_bytes.startswith(bytes.fromhex("ffd8ff")):
            raise AssertionError(f"{host}: Famous Gardens slider image missing or not JPEG: {name}")
        if "image/jpeg" not in get_header(headers,"Content-Type").lower():
            raise AssertionError(f"{host}: Famous Gardens photo served with wrong Content-Type: {name}")
        if sha256(live_bytes).digest()!=sha256(local.read_bytes()).digest():
            raise AssertionError(f"{host}: Famous Gardens photo differs from approved source: {name}")
        print(f"FAMOUS_GARDENS_IMAGE_OK {host}{name}: exact owner-photo digest",flush=True)

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
    try:
        check_installable_mobile_app()
    except (AssertionError,URLError,HTTPError,OSError,TimeoutError,ValueError) as exc:
        failures.append(("portal.landshopnigeria.com","/mobile-app",str(exc)))
        print(f"FAILED installable mobile app: {exc}",file=sys.stderr,flush=True)
    try:
        check_mobile_app_local_media()
    except (AssertionError,URLError,HTTPError,OSError,TimeoutError,ValueError) as exc:
        failures.append(("portal.landshopnigeria.com","/mobile-app/owner-media",str(exc)))
        print(f"FAILED local mobile app owner media: {exc}",file=sys.stderr,flush=True)
    # Website, portal and dashboard have independent public/media folders.
    for host,app in (
        ("landshopnigeria.com","website"),
        ("www.landshopnigeria.com","website"),
        ("portal.landshopnigeria.com","portal"),
        ("app.landshopnigeria.com","dashboard"),
    ):
        try:
            check_transparent_brand_logo(host,app)
        except (AssertionError,URLError,HTTPError,OSError,TimeoutError,ValueError) as exc:
            failures.append((host,"/media/logo-transparent.png",str(exc)))
            print(f"FAILED live brand logo {host}: {exc}",file=sys.stderr,flush=True)
    for host in HOSTS:
        try:
            check_famous_gardens_hero_photo(host)
        except (AssertionError,URLError,HTTPError,OSError,TimeoutError,ValueError) as exc:
            failures.append((host,"/owner/2026/famous-gardens-homepage-2026-11-{desktop,mobile}.jpg",str(exc)))
            print(f"FAILED live Famous Gardens slider image on {host}: {exc}",file=sys.stderr,flush=True)
    for host,path,error in failures:
        print(f"FAILURE SUMMARY {host}{path}: {error}",file=sys.stderr)
    if failures:
        raise SystemExit(1)
    print("PASS: Both website variants and portal/staff entry points serve exact-commit HTML + fresh CSS and JavaScript.")
if __name__=="__main__":
    main()
