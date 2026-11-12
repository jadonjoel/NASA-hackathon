"""Project licensed equirectangular maps onto crisp, lit sphere sprites.

Requires numpy and Pillow. Usage: python tools/build_solar_maps.py --maps PATH
Source maps and attribution: ../dist/assets/solar/ASSET_CREDITS.md
"""
from pathlib import Path
import argparse
import numpy as np
from PIL import Image, ImageFilter

args=argparse.ArgumentParser();args.add_argument('--maps',type=Path,required=True);opts=args.parse_args()
out=Path(__file__).resolve().parents[1]/'dist/assets/solar'

def sample(source,u,v):
 h,w=source.shape[:2];xx=(u%1)*(w-1);yy=np.clip(v,0,1)*(h-1)
 x0=xx.astype(np.int32);y0=yy.astype(np.int32);fx=(xx-x0)[...,None];fy=(yy-y0)[...,None]
 x1=(x0+1)%w;y1=np.minimum(y0+1,h-1)
 return ((source[y0,x0]*(1-fx)+source[y0,x1]*fx)*(1-fy)+(source[y1,x0]*(1-fx)+source[y1,x1]*fx)*fy)/255

for name in ('moon','earth','mars','mercury','venus','jupiter','saturn','uranus','neptune','sun'):
 source=np.asarray(Image.open(opts.maps/(name+'.jpg')).convert('RGB'))
 clouds=np.asarray(Image.open(opts.maps/'clouds.jpg').convert('RGB')) if name=='earth' else None
 size=3072 if name in ('moon','earth','mars') else 1536
 rgba=np.zeros((size,size,4),dtype=np.uint8)
 a=(np.arange(size,dtype=np.float32)+.5-size/2)/(size*.497)
 # Show recognisable near-side lunar geography and Africa/Europe on Earth.
 longitude=np.deg2rad({'earth':20,'moon':0,'mars':-65,'jupiter':-25}.get(name,0))
 for row in range(0,size,96):
  x,y=np.meshgrid(a,a[row:row+96]);r=x*x+y*y;z=np.sqrt(np.maximum(0,1-r))
  u=.5+(np.arctan2(x,z)+longitude)/(2*np.pi);v=.5+np.arcsin(np.clip(y,-1,1))/np.pi
  rgb=sample(source,u,v)
  if clouds is not None:
   cloud=sample(clouds,u,v).mean(axis=-1)
   # Preserve coastline visibility beneath a separate satellite cloud layer.
   opacity=np.clip(cloud*.86,0,.9)[...,None]
   rgb=rgb*(1-opacity)+np.array([.97,.98,1])*opacity
  if name=='sun':
   rgb*= (.72+.28*z)[...,None]
  else:
   # Light in linear color space: surface detail survives the day/night falloff.
   diffuse=np.clip(-x*.43-y*.27+z*.861,0,1)
   light=.025+diffuse*.975
   rgb=np.clip(rgb,0,1)**2.2*light[...,None]
   if name in ('earth','venus','mars','uranus','neptune'):
    amount=(1-z)**4*diffuse*(.13 if name=='earth' else .035)
    tint=np.array([.08,.32,.8]) if name=='earth' else np.array([.4,.23,.12]) if name=='mars' else np.array([.35,.55,.65])
    rgb+=amount[...,None]*tint
   rgb=np.clip(rgb,0,1)**(1/2.2)
  rgba[row:row+len(y),:,:3]=np.clip(rgb*255,0,255).astype(np.uint8)
  rgba[row:row+len(y),:,3]=(np.clip((1-r)*size*.45,0,1)*255).astype(np.uint8)
 result=Image.fromarray(rgba)
 # Small-radius sharpening restores sampling contrast without invented relief.
 channels=result.split();sharp=Image.merge('RGB',channels[:3]).filter(ImageFilter.UnsharpMask(radius=.65,percent=45,threshold=3));sharp.putalpha(channels[3])
 sharp.save(out/(name+'.webp'),quality=96,method=6)
 for level in (128,1024):
  sharp.resize((level,level),Image.Resampling.LANCZOS).save(out/(name+f'-{level}.webp'),quality=93,method=6)
 print(f'{name}: {source.shape[1]}x{source.shape[0]} map -> {size}px sphere',flush=True)
