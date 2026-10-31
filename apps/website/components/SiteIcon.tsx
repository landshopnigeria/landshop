import type {SVGProps} from 'react';
export type SiteIconName='home'|'building'|'land'|'chart'|'briefcase'|'users'|'shield'|'document'|'wallet'|'key'|'compass'|'calendar'|'help'|'mail'|'phone'|'pin'|'search'|'menu'|'close'|'chevron'|'arrow'|'external'|'book'|'heart'|'sparkles'|'clock'|'grid'|'list'|'camera'|'check'|'calculator'|'settings'|'share'|'copy';
const paths:Record<SiteIconName,string>={
 home:'m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z',
 building:'M3 21h18 M5 21V7l7-4 7 4v14 M9 10h.01 M15 10h.01 M9 14h.01 M15 14h.01 M10 21v-4h4v4',
 land:'M3 17l6-7 4 4 7-9 M3 21h18 M17 5h3v3',
 chart:'M3 3v18h18 M7 16l5-5 4 3 4-7 M17 7h3v3',
 briefcase:'M4 7h16a1 1 0 0 1 1 1v11H3V8a1 1 0 0 1 1-1z M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2 M3 12c4 2 14 2 18 0',
 users:'M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 20v-2a4 4 0 0 0-3-3.87 M16 2.13a4 4 0 0 1 0 7.75',
 shield:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z m-4-10 3 3 5-6',
 document:'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h8 M8 17h7',
 wallet:'M3 6a2 2 0 0 1 2-2h14v16H5a2 2 0 0 1-2-2z M3 9h18 M15 14h3',
 key:'M21 2l-2 2 m-1 4 3-3 M10 14a6 6 0 1 1 4 4l-3 3H7v-4l3-3z',
 compass:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z m3-13-2 6-4 1 1-5z',
 calendar:'M3 5h18v16H3z M7 3v4 M17 3v4 M3 10h18 M8 15h3',
 help:'M9.1 9a3 3 0 1 1 5.8 1c-1.1 1.2-2.9 1.6-2.9 3 M12 17h.01 M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
 mail:'M3 5h18v14H3z m0 1 9 7 9-7',
 phone:'M22 16.9v3a2 2 0 0 1-2.2 2A19 19 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.6 3a2 2 0 0 1-.6 1.8l-2 2A15 15 0 0 0 13.5 17l2-2a2 2 0 0 1 1.8-.6l3 .6a2 2 0 0 1 1.7 1.9z',
 pin:'M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0z M12 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5',
 search:'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z m6-2 5 5',
 menu:'M4 7h16 M4 12h16 M4 17h16',
 close:'M5 5l14 14 M19 5 5 19',
 chevron:'m6 9 6 6 6-6',
 arrow:'M4 12h16 m-6-6 6 6-6 6',
 external:'M4 12h16 m-6-6 6 6-6 6',
 book:'M4 4h7a3 3 0 0 1 3 3v14a3 3 0 0 0-3-3H4z M20 4h-4a3 3 0 0 0-3 3v14a3 3 0 0 1 3-3h4z',
 heart:'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z',
 sparkles:'m12 2 2.2 6.8L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.2z M19 17l.8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8z',
 clock:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2',
 grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
 list:'M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01',
 camera:'M3 7h4l2-3h6l2 3h4v13H3z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
 check:'m4 12 5 5L20 6',
 calculator:'M5 2h14v20H5z M8 6h8 M8 11h2 M14 11h2 M8 15h2 M14 15h2',
 share:'M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M8.7 11.4l6.6-4.1 M8.7 12.6l6.6 4.1',
 copy:'M8 4h12v16H8z M4 8v12a2 2 0 0 0 2 2h10',
 settings:'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19 13v-2l2-2-2-4-3 1-2-3h-4L8 6 5 5 3 9l2 2v2l-2 2 2 4 3-1 2 3h4l2-3 3 1 2-4z'
};
export default function SiteIcon({name,size=24,className='',...props}:{name:SiteIconName,size?:number,className?:string}&Omit<SVGProps<SVGSVGElement>,'name'>){
 return <svg aria-hidden="true" focusable="false" className={'ls-icon '+className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.15" strokeLinecap="round" strokeLinejoin="round" {...props}><path d={paths[name]}/></svg>;
}
export function IconChip({name}:{name:SiteIconName}){return <span className="ls-icon-chip"><SiteIcon name={name} size={27}/></span>}
