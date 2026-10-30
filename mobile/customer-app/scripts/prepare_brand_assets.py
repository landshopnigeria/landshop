#!/usr/bin/env python3
"""Derive native app artwork from the existing approved Landshop logo.

No generated marks, replacement wordmarks, or additional graphic elements.
Run before Expo config/Metro export or EAS build.
"""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[3]
OUTPUT = Path(__file__).resolve().parents[1] / "assets"
SOURCE = ROOT / "apps" / "portal" / "public" / "media" / "logo.webp"
RESAMPLING = Image.Resampling.LANCZOS

def contained(source: Image.Image, size: int, max_w: int, max_h: int) -> Image.Image:
    output = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    artwork = source.copy()
    # Trim only truly transparent padding. Preserve the approved logo itself.
    mask = artwork.getchannel("A")
    bounds = mask.getbbox()
    if bounds is None:
        raise ValueError("Approved Landshop logo contains no visible pixels")
    artwork = artwork.crop(bounds)
    artwork.thumbnail((max_w, max_h), RESAMPLING)
    x = (size - artwork.width) // 2
    y = (size - artwork.height) // 2
    output.alpha_composite(artwork, (x, y))
    return output

def build() -> None:
    if not SOURCE.is_file():
        raise SystemExit(f"Required approved source logo missing: {SOURCE}")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    with Image.open(SOURCE) as raw:
        image = raw.convert("RGBA")
        if min(image.size) < 30:
            raise ValueError("Official logo source resolution is unexpectedly low")
        # White app icon keeps the supplied Landshop wordmark legible.
        app_icon = Image.new("RGBA", (1024, 1024), "#ffffff")
        app_icon.alpha_composite(contained(image, 1024, 840, 410))
        app_icon.convert("RGB").save(OUTPUT / "icon.png", "PNG", optimize=True)
        # Foreground stays transparent; the adaptive background is configured separately.
        contained(image, 1024, 650, 350).save(OUTPUT / "adaptive-icon.png", "PNG", optimize=True)
        contained(image, 1024, 830, 420).save(OUTPUT / "splash-icon.png", "PNG", optimize=True)
    for name in ("icon.png", "adaptive-icon.png", "splash-icon.png"):
        with Image.open(OUTPUT / name) as result:
            result.verify()
        with Image.open(OUTPUT / name) as result:
            assert result.size == (1024, 1024)
        print(f"Prepared {name} from official Landshop logo")

if __name__ == "__main__":
    build()
