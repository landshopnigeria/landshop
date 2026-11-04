import {notFound} from 'next/navigation';
import LandshopEditorialPage,{hasEditorialPage,editorialMetadata} from '../../components/LandshopEditorialPage';
export async function generateMetadata({params}:{params:Promise<{parts:string[]}>}){const {parts}=await params;return editorialMetadata('/'+parts.join('/'));}
export default async function Editorial({params}:{params:Promise<{parts:string[]}>}){const {parts}=await params;const path='/'+parts.join('/');if(!hasEditorialPage(path))notFound();return <LandshopEditorialPage path={path}/>;}
