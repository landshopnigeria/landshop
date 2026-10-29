#!/usr/bin/env python3
"""Check that Landshop's real public UI is visible, not a stale recovery page.

Run after Namecheap publication. Pure HTTP reads: never creates accounts,
mutates records, or displays personal customer data.
"""
from __future__ import annotations

from html import unescape
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
    ("website", "/", "Everyone Deserves Affordable Property."),
    ("www", "/", "Everyone Deserves Affordable Property."),
    ("website", "/develop", "Own Your Future"),
    ("website", "/incubate", "Build Wealth Through Property"),
    ("website", "/grow", "A Smarter Path to Homeownership"),
    ("website", "/properties", "Discover Landshop Properties"),
    ("website", "/applications", "Your property journey"),
    ("website", "/about", "Building wealth through real estate"),
    ("website", "/contact", "Your next property decision starts with a conversation"),
    ("website", "/insights", "Better property decisions start with better questions"),
    ("website", "/company/team", "The work behind every decision"),
    ("website", "/thrift", "Build towards property goals, together"),
    ("website", "/services/property-acquisition", "From a property enquiry"),
    ("website", "/services/advisory", "Independent questions deserve clear answers"),
    ("website", "/services/mortgage", "Understand the full cost"),
    ("website", "/services/construction-credit", "Plan your development financing"),
    ("website", "/grow/beta-mortgage", "Explore a structured route"),
    ("website", "/grow/mortgage-xtra", "Plan a financing journey"),
    ("portal", "/", "Create your Landshop account"),
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
    parser = VisibleHTML()
    parser.feed(html)
    visible = " ".join(" ".join(parser.words).split())
    if expected and expected.casefold() not in unescape(visible).casefold():
        raise AssertionError(f"expected visible page heading missing: {expected}")
    for legacy in RECOVERY:
        if legacy.casefold() in visible.casefold():
            raise AssertionError("obsolete static recovery-page content is visible")
    return len(html)


def main() -> int:
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
