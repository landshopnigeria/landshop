import type {MetadataRoute} from 'next';
export default function robots():MetadataRoute.Robots{
 return {rules:[{userAgent:'*',allow:'/',disallow:['/api/','/admin/','/wp-admin/','/wp-json/','/wp-content/']}],
 sitemap:'https://www.landshopnigeria.com/sitemap.xml',
 host:'https://www.landshopnigeria.com'};
}
