#!/usr/bin/env python3
"""Check that Landshop's real public UI is visible, not a stale recovery page.

Run after Namecheap publication. Pure HTTP reads: never creates accounts,
mutates records, or displays personal customer data.
"""
from __future__ import annotations

from html import unescape
from pathlib import Path
from html.parser import HTMLParser
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
import sys
import time

SITES = {
    "website": "https://landshopnigeria.com",
    "www": "https://www.landshopnigeria.com",
    "portal": "https://portal.landshopnigeria.com",
    "dashboard": "https://app.landshopnigeria.com",
}
# Each expected heading must exist in visible server-rendered text, not only
# buried in Next.js hydration payloads or metadata.
PUBLIC_PAGES = [
    ("website", "/", "Own Your Future."),
    ("www", "/", "Own Your Future."),
    ("website", "/develop", "Own Your Future"),
    ("www", "/develop", "Own Your Future"),
    ("website", "/incubate", "Invest in Possibilities."),
    ("website", "/grow", "Make Homeownership Possible."),
    ("website", "/properties", "Property Marketplace"),
    ("website", "/applications", "Your property journey"),
    ("website", "/search", "Search Landshop"),
    ("website", "/about", "About Us."),
    ("website", "/contact", "Contact Us"),
    ("website", "/insights", "Insights for better property decisions."),
    ("website", "/company/team", "The work behind every decision"),
    ("website", "/thrift", "Build towards property goals, together"),
    ("website", "/services/property-acquisition", "From a property enquiry"),
    ("website", "/services/advisory", "Independent questions deserve clear answers"),
    ("website", "/services/mortgage", "Understand the full cost"),
    ("website", "/services/construction-credit", "Plan your development financing"),
    ("website", "/grow/beta-mortgage", "Explore a structured route"),
    ("website", "/grow/mortgage-xtra", "Plan a financing journey"),
    ("portal", "/", "One Account."),
    ("portal", "/applications", None),
    ("portal", "/applications/develop-land", None),
    ("portal", "/applications/develop-house", None),
    ("portal", "/applications/incubate-investment", None),
    ("portal", "/applications/beta-mortgage", None),
    ("portal", "/applications/mortgage-xtra", None),
    ("portal", "/applications/develop-inspection", None),
    ("portal", "/applications/mortgage-xtra-inspection", None),
    ("portal", "/calculator", None),
    ("portal", "/support", None),
]
RECOVERY = (
    "Property ownership starts with possibility.",
    "We are preparing secure account registration",
    "registration and account verification are being prepared",
    "sign-in and registration are temporarily unavailable",
)

class VisibleHTML(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.hidden = 0
        self.words = []

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "noscript", "template"):
            self.hidden += 1

    def handle_endtag(self, tag):
        if tag in ("script", "style", "noscript", "template") and self.hidden:
            self.hidden -= 1

    def handle_data(self, data):
        if not self.hidden:
            self.words.append(data)


def fetch_html(url: str) -> str:
    request = Request(url, headers={"Cache-Control": "no-cache", "User-Agent": "Landshop-Release-Visible-Content/1"})
    last_error = None
    for attempt in range(3):
        try:
            with urlopen(request, timeout=22) as response:
                if response.status != 200:
                    raise ValueError(f"unexpected status {response.status}")
                typ = response.headers.get("Content-Type", "")
                if "text/html" not in typ:
                    raise ValueError(f"not an HTML page: {typ}")
                content = response.read(4_000_000)
                return content.decode("utf-8", errors="replace")
        except (HTTPError, URLError, ValueError, TimeoutError) as exc:
            last_error = exc
            if attempt < 2:
                time.sleep(2)
    raise RuntimeError(f"page fetch failed: {last_error}")


def check(kind: str, route: str, expected: str | None):
    url = SITES[kind] + route
    html = fetch_html(url)
    if "/_next/" not in html:
        raise AssertionError("response is not a Next.js rendered document")
    if kind in ("website","www"):
        if 'class="ls-glass-header"' not in html:
            raise AssertionError("unified glass navigation is missing from public page")
        if '/media/logo-transparent.png' not in html:
            raise AssertionError("approved transparent logo PNG is not mounted in the shared header")
        if 'class="ls-utility-bar"' not in html:
            raise AssertionError("shared desktop/mobile utility navigation is missing")
    parser = VisibleHTML()
    parser.feed(html)
    visible = " ".join(" ".join(parser.words).split())
    if expected and expected.casefold() not in unescape(visible).casefold():
        raise AssertionError(f"expected visible page heading missing: {expected}")
    if kind in ("website", "www") and route == "/":
        # A successful Next.js page must not show stock estate photo archives as live properties.
        if "Explore genuine photographs from Landshop estate archives" in visible:
            raise AssertionError("obsolete estate archive is still substituted for public property listings")
        if ('class="v22-feature"' not in html and 'class="v22-inventory-empty"' not in html):
            raise AssertionError("V22 database-backed featured-property cards or an explicit approved-inventory empty state are missing")
        if "Verified opportunities, not placeholder listings." in visible and "Only approved, published properties appear here." not in visible:
            raise AssertionError("empty inventory state must explain the independently reviewed publication policy")
        if 'data-landshop-hero="v16-separated-product-slides"' not in html:
            raise AssertionError("approved V16 distinct-slide homepage is missing")
        if 'data-active-product="DEVELOP"' not in html:
            raise AssertionError("initial Develop slide is not rendered separately")
        if "Develop. Incubate. Grow." in unescape(visible):
            raise AssertionError("obsolete combined three-product hero remains visible")
        for label in ("Show DEVELOP slide","Show INCUBATE slide","Show GROW slide",
                      "Previous slide","Next slide","Buy</button>","Sell</button>",
                      "Rent</button>","Shortlet</button>"):
            if label not in html:
                raise AssertionError(f"required V16 slider control/action missing: {label}")
    if kind in ("website","www") and route in ("/develop","/incubate","/grow"):
        if 'data-product-journey=' not in html:
            raise AssertionError("V16 premium product page template is missing")
        if "portal.landshopnigeria.com/applications/" not in html:
            raise AssertionError("secure guided product forms are not linked")
    if kind == "website" and route == "/contact":
        if 'class="lc-v24-photo"' not in html or 'class="contact-enquiry-form"' not in html:
            raise AssertionError("approved Landshop reception image or secure enquiry form is missing")
        if 'class="lc-v24-info-inner"' not in html or 'class="lc-v24-details"' not in html or 'class="lc-v24-form"' not in html:
            raise AssertionError("Contact Us details and the full-width enquiry form must be visible")
        if 'class="lc-map-landscape"' not in html or 'www.google.com/maps' not in html:
            raise AssertionError("Landshop Google Maps landscape embed must be present before the footer")
        if 'maps.app.goo.gl/GLiNo6LfYWhWvJV1A' not in html:
            raise AssertionError("Supplied official Google Maps listing link is missing")
    if kind == "website" and route == "/properties":
        if 'class="mk-property-grid"' not in html and 'mk-property-grid ' not in html:
            raise AssertionError("database-backed marketplace grid is not rendered")
        if 'name="state"' not in html or 'name="sort"' not in html:
            raise AssertionError("marketplace filters and sorting controls are missing")
        if "title=\"Sign in to list property for sale\"" not in html:
            raise AssertionError("the marketplace Sell route is missing")
    for legacy in RECOVERY:
        if legacy.casefold() in visible.casefold():
            raise AssertionError("obsolete static recovery-page content is visible")
    return len(html)


def verify_source() -> None:
    """Check routes for client-only carousel slides in source, not SSR initial-slide HTML."""
    homepage = Path("apps/website/components/LandshopHome.tsx").read_text(encoding="utf-8")
    product = Path("apps/website/components/ProductPage.tsx").read_text(encoding="utf-8")
    required = (
        "href:'https://portal.landshopnigeria.com/applications/incubate-investment'",
        "['Buy','Sell','Rent','Shortlet']",
    )
    for marker in required:
        if marker not in homepage:
            raise AssertionError("Approved homepage source marker missing: " + marker)
    for slug in ("develop-land","develop-house","develop-inspection",
                 "incubate-investment","beta-mortgage","mortgage-xtra",
                 "mortgage-xtra-inspection"):
        if "portal+'/applications/"+slug+"'" not in product:
            raise AssertionError("Product pathway has no approved secure form: " + slug)


def main() -> int:
    try:
        verify_source()
    except (AssertionError, OSError) as error:
        print(f"FAILED: Local homepage/product release source validation: {error}", file=sys.stderr)
        return 1
    errors = 0
    for kind, path, heading in PUBLIC_PAGES:
        try:
            size = check(kind, path, heading)
            print(f"PASS {kind}{path}: visible Next.js HTML, {size} bytes", flush=True)
        except Exception as e:
            errors += 1
            print(f"FAIL {kind}{path}: {e}", file=sys.stderr, flush=True)
    if errors:
        print(f"FAILED: {errors}/{len(PUBLIC_PAGES)} public route checks", file=sys.stderr)
        return 1
    print(f"PASS: {len(PUBLIC_PAGES)} public routes visibly render Next.js (not a substitute for authenticated functional tests)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
