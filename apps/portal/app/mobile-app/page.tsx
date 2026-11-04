import type {Metadata} from 'next';
import MobileApp,{type Screen} from './MobileApp';
import './mobile-app.css';

export const metadata:Metadata={
 title:'Landshop Mobile App | Property, Mortgage & Referrals',
 description:'Mobile-first Landshop experience for property discovery, inspection requests, mortgage planning and secure accounts.',
 robots:{index:false,follow:false},
 manifest:'/mobile-app/manifest.webmanifest',
 appleWebApp:{capable:true,statusBarStyle:'default',title:'Landshop'},
 icons:{apple:'/apple-icon.png',icon:'/icon.png'}
};

const screens=new Set<Screen>(['onboarding','signup','signin','verify','reset','home','explore','property','inspection','mortgage','saved','referrals','notices','profile']);
export default async function Page({searchParams}:{searchParams:Promise<{screen?:string}>}){
 const {screen}=await searchParams;
 const initialScreen:Screen=screen&&screens.has(screen as Screen)?screen as Screen:'onboarding';
 return <MobileApp initialScreen={initialScreen}/>;
}
