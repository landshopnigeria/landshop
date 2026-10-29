#!/usr/bin/env python3
"""Produce transparent PNGs from the approved Landshop logo for all three apps.

Uses the checked-in original WebP only. No AI, repainting or alternative artwork.
Run from any working directory. The deployment pipeline installs Pillow first.
"""
from pathlib import Path
from PIL import Image

root=Path(__file__).resolve().parents[1]

def convert(app: str) -> None:
    source=root/'apps'/app/'public/media/logo.webp'
    target=root/'apps'/app/'public/media/logo-transparent.png'
    if not source.is_file():
        raise SystemExit(f'Approved Landshop logo is missing: {source}')
    image=Image.open(source).convert('RGBA')
    if image.width < 60 or image.height < 30:
        raise SystemExit(f'Unexpected logo size: {source}')
    pixels=image.load()
    for y in range(image.height):
        for x in range(image.width):
            r,g,b,a=pixels[x,y]
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
        raise SystemExit(f'Empty transparent logo: {source}')
    left,top,right,bottom=bbox
    pad=6
    image=image.crop((max(0,left-pad),max(0,top-pad),min(image.width,right+pad),min(image.height,bottom+pad)))
    target.parent.mkdir(parents=True,exist_ok=True)
    image.save(target,'PNG',optimize=True)
    result=Image.open(target)
    assert result.mode=='RGBA' and result.getextrema()[3][0]==0, f'Transparency missing: {target}'
    print(f'{app}: created {target.relative_to(root)} ({image.width}x{image.height})')

for app_name in ('website','portal','dashboard'):
    convert(app_name)
