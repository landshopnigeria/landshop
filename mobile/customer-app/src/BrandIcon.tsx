import React from 'react';
import Svg,{Circle,Path,Rect,Polyline} from 'react-native-svg';
export type IconName='home'|'users'|'growth'|'file'|'wallet'|'support'|'shield'|'search'|'account'|'arrow';
export function BrandIcon({name,size=22,color='#087e63'}:{name:IconName;size?:number;color?:string}){
 const base={stroke:color,strokeWidth:1.8,strokeLinecap:'round' as const,strokeLinejoin:'round' as const,fill:'none'};
 return <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
  {name==='home'?<Path {...base} d="M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>:null}
  {name==='users'?<><Circle {...base} cx="9" cy="8" r="3"/><Path {...base} d="M3 20v-2a6 6 0 0 1 12 0v2m2-14a3 3 0 0 1 0 6m1 3a5 5 0 0 1 3 5"/></>:null}
  {name==='growth'?<><Path {...base} d="m3 17 6-6 4 4 8-9M15 6h6v6"/></>:null}
  {name==='file'?<><Path {...base} d="M7 3h8l4 4v14H5V3h2zM14 3v5h5M8 13h8M8 17h6"/></>:null}
  {name==='wallet'?<><Rect {...base} x="3" y="6" width="18" height="15" rx="2"/><Path {...base} d="M3 9V5a2 2 0 0 1 2-2h13m-1 10h4"/></>:null}
  {name==='support'?<><Path {...base} d="M4 14v-3a8 8 0 0 1 16 0v3M4 14H2v5h4v-6H4zm16 0h2v5h-4v-6h2zM19 20a5 5 0 0 1-5 2h-2"/></>:null}
  {name==='shield'?<><Path {...base} d="M12 22s9-4 9-11V5l-9-3-9 3v6c0 7 9 11 9 11z"/><Polyline {...base} points="8 12 11 15 16 9"/></>:null}
  {name==='search'?<><Circle {...base} cx="11" cy="11" r="7"/><Path {...base} d="m16 16 5 5"/></>:null}
  {name==='account'?<><Circle {...base} cx="12" cy="7.5" r="4"/><Path {...base} d="M4 21a8 8 0 0 1 16 0"/></>:null}
  {name==='arrow'?<Path {...base} d="m9 5 7 7-7 7"/>:null}
 </Svg>;
}
