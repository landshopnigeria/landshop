#!/usr/bin/env python3
"""Deterministically convert the approved Landshop WebP logo to transparent PNG.

No AI/regeneration, no changes to lettering, roof mark or palette.
Feathers pixels near the white substrate to remove white outlines, retains
colored source artwork, and crops only excess white outer canvas.
"""
from pathlib import Path
from PIL import Image

source=Path('apps/website/public/media/logo.webp')
target=Path('apps/website/public/media/logo-transparent.png')
if not source.exists():
    raise SystemExit('Approved original brand logo not found: '+str(source))
image=Image.open(source).convert('RGBA')
if image.width<60 or image.height<30:
    raise SystemExit('The approved Landshop source logo is unexpectedly small')
pixels=image.load()
for y in range(image.height):
    for x in range(image.width):
        r,g,b,a=pixels[x,y]
        # Convert near-white source backdrop into transparency without altering
        # the orange/teal logo marks, black type or other saturated pixels.
        white=min(r,g,b)
        if white>=253 and max(r,g,b)-white<8:
            pixels[x,y]=(r,g,b,0)
        elif white>=233 and max(r,g,b)-white<17:
            alpha=max(0,min(255,round((253-white)*255/20)))
            if alpha:
                nr=max(0,min(255,round((r-255*(1-alpha/255))/(alpha/255))))
                ng=max(0,min(255,round((g-255*(1-alpha/255))/(alpha/255))))
                nb=max(0,min(255,round((b-255*(1-alpha/255))/(alpha/255))))
                pixels[x,y]=(nr,ng,nb,min(a,alpha))
            else:
                pixels[x,y]=(r,g,b,0)
bbox=image.getbbox()
if not bbox:
    raise SystemExit('The transparent logo conversion produced an empty image')
pad=6
left,top,right,bottom=bbox
image=image.crop((max(0,left-pad),max(0,top-pad),min(image.width,right+pad),min(image.height,bottom+pad)))
target.parent.mkdir(parents=True,exist_ok=True)
image.save(target,'PNG',optimize=True)
assert Image.open(target).mode=='RGBA'
assert Image.open(target).getextrema()[3][0]==0, 'Expected transparent pixels were not created'
print(f'Approved Landshop logo: {source} -> {target} ({image.width}x{image.height}, transparent PNG)')
