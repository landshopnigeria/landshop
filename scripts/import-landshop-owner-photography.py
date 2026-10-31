#!/usr/bin/env python3
"""Import selected owner-provided photographic evidence; strip EXIF and resize.

Only explicit archive members below are accepted. No bulk unreviewed image
publication and no archive path extraction to disk.
"""
from io import BytesIO
from pathlib import Path
from zipfile import ZipFile
from PIL import Image, ImageOps, UnidentifiedImageError
import os

ROOT=Path('apps/website/public/owner/2026')
MAX_PIXELS=60_000_000
Image.MAX_IMAGE_PIXELS=MAX_PIXELS

# archive key, exact internal filename, public filename, longest dimension
ASSETS=[
 ('SLIDER','Slider/Slide 1.jpg','slider-01.webp',2000),
 ('SLIDER','Slider/Slide 2.jpg','slider-02.webp',2000),
 ('SLIDER','Slider/Slde 3.jpg','slider-03.webp',2000),
 ('PRODUCTS','Products  landshop homepage cads imges/Develop.jpg','product-develop.webp',1500),
 ('PRODUCTS','Products  landshop homepage cads imges/Incubate.jpg','product-incubate.webp',1500),
 ('PRODUCTS','Products  landshop homepage cads imges/Grow.jpg','product-grow.webp',1500),
 ('LAYOUTS','layouts/231.jpg','site-client-inspection.webp',1400),
 ('LAYOUTS','layouts/234.jpg','site-entrance.webp',1500),
 ('LAYOUTS','layouts/24.jpg','estate-architecture.webp',1500),
 ('LAYOUTS','layouts/26.jpg','estate-residential.webp',1500),
 ('LAYOUTS','layouts/Page details.jpg','project-building-detail.webp',1500),
 ('FAMOUS','Famus Gardern/23.jpg','famous-exterior.webp',1500),
 ('FAMOUS','Famus Gardern/25.jpg','famous-completed-homes.webp',1500),
 ('FAMOUS','Famus Gardern/34.jpg','famous-gate.webp',1500),
 ('FAMOUS','Famus Gardern/18.jpg','famous-access.webp',1500),
 ('FAMOUS','Famus Gardern/1.jpg','famous-bedroom.webp',1400),
 ('FAMOUS','Famus Gardern/7.jpg','famous-living.webp',1400),
 ('FAMOUS','Famus Gardern/30.jpg','famous-kitchen.webp',1400),
 ('FAMOUS','Famus Gardern/27.jpg','famous-suite.webp',1400),
 ('FAMOUS','Famus Gardern/17.jpg','famous-dining.webp',1400),
 ('FAMOUS','Famus Gardern/36.jpg','famous-building-progress.webp',1500),
 ('FAMOUS','Famus Gardern/232.jpg','famous-project-visitors.webp',1400),
 ('FAMOUS','Famus Gardern/251.jpg','famous-site-visit.webp',1400),
 ('GARDEN','Landshop Famous Garden/2021chrisonah-13.jpg','garden-site-team.webp',1500),
 ('GARDEN','Landshop Famous Garden/2021chrisonah-39.jpg','garden-gate-progress.webp',1500),
 ('GARDEN','Landshop Famous Garden/2021chrisonah-64.jpg','garden-building-workers.webp',1400),
 ('GARDEN','Landshop Famous Garden/2021chrisonah-67.jpg','garden-construction.webp',1400),
 ('GARDEN','Landshop Famous Garden/2021chrisonah-86.jpg','garden-field-update.webp',1400),
 ('GARDEN','Landshop Famous Garden/2021chrisonah-102.jpg','garden-property-filming.webp',1400),
 ('GARDEN','Landshop Famous Garden/2021chrisonah-108.jpg','garden-inspection-filming.webp',1400),
 ('GARDEN','Landshop Famous Garden/2021chrisonah-118.jpg','garden-entrance-progress.webp',1500),
]

def main():
 ROOT.mkdir(parents=True,exist_ok=True)
 sources={key:ZipFile(os.environ['LANDSHOP_ZIP_'+key]) for key in ['SLIDER','PRODUCTS','LAYOUTS','FAMOUS','GARDEN']}
 created=[]
 try:
  for key,name,output,max_side in ASSETS:
   archive=sources[key]
   entry=archive.getinfo(name)
   if entry.file_size>15_000_000:raise ValueError('Oversized photo: '+name)
   data=archive.read(entry)
   try:
    image=Image.open(BytesIO(data))
    image=ImageOps.exif_transpose(image)
    image.load()
    if image.width*image.height>MAX_PIXELS:raise ValueError('Too many pixels: '+name)
    image.thumbnail((max_side,max_side),Image.Resampling.LANCZOS)
    if image.mode!='RGB':image=image.convert('RGB')
    dest=ROOT/output
    image.save(dest,'WEBP',quality=82,method=6)
    if dest.stat().st_size<8_000:raise ValueError('Bad output: '+str(dest))
    created.append((str(dest),dest.stat().st_size))
   except (UnidentifiedImageError,OSError) as exc:raise ValueError('Bad image: '+name) from exc
 finally:
  for z in sources.values():z.close()
 for name,size in created:print(f'OWNER_MEDIA_OK {name} {size}')
 print(f'IMPORTED {len(created)} owner-supplied images; EXIF removed and dimensions constrained')

if __name__=='__main__':main()
