import UnsubscribeForm from '../../../components/UnsubscribeForm';
export const metadata={title:'Newsletter Preferences | Landshop',description:'Control your Landshop property newsletter subscription.',robots:{index:false,follow:false}};
export default async function UnsubscribePage({searchParams}:{searchParams:Promise<{token?:string}>}){
 const {token}=await searchParams;
 return <main><UnsubscribeForm token={typeof token==='string'?token:''}/></main>;
}