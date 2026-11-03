export type SiteEdit={id?:string;route:string;selector:string;kind:'text'|'link'|'image';node_index:number;original:string;replacement:string;state:'draft'|'published'|'archived';version:number;reason?:string;updated_at?:string};
export function safeContentURL(value:string,kind:'link'|'image'){
 if(value.startsWith('/')&&!value.startsWith('//')&&!/[\\\x00-\x20]/.test(value))return true;
 try{const u=new URL(value);if(kind==='image')return u.protocol==='https:'&&['www.landshopnigeria.com','landshopnigeria.com','iwkfagzkogzidrbbezds.supabase.co'].includes(u.hostname);return ['https:','mailto:','tel:'].includes(u.protocol)}catch{return false}
}
export function publicContentRoute(route:string){return /^\/(?:[a-zA-Z0-9_-]+\/?)*$/.test(route)&&!/^\/(api|auth|staff|admin|dashboard|sign|reset|account|newsletter)(?:[/-]|$)/.test(route)}
