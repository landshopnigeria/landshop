import type {Metadata} from 'next';
import MobileApp from './MobileApp';
import './mobile-app.css';

export const metadata:Metadata={
 title:'Landshop Mobile App | Property, Mortgage & Referrals',
 description:'Mobile-first Landshop experience for property discovery, inspection requests, mortgage planning and secure accounts.',
 robots:{index:false,follow:false},
 manifest:'/mobile-app/manifest.webmanifest',
 appleWebApp:{capable:true,statusBarStyle:'default',title:'Landshop'},
 icons:{apple:'/apple-icon.png',icon:'/icon.png'}
};

export default function Page(){
 return <MobileApp/>;
}
