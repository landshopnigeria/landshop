import {editorialImages} from './editorial-imagery';
/**
 * Verified historical testimonial excerpts from the original Landshop Product Deck.
 * Render as historical customer accounts. Do not identify editorial photography
 * as portraits of the named customers; only use portraits/videos with consent.
 */
export type LandshopTestimonial={
 id:string;name:string;location:string;quote:string;image:string;
 mediaUrl?:string;mediaType?:'image'|'video';status:'approved';source:'original-deck';
};
export const landshopTestimonials:LandshopTestimonial[]=[
 {id:'sanusi',name:'Emmanuel Sanusi',location:'Ikotun, Lagos',quote:'Landshop is authentic and experienced. And your customer service is 100%. From social media to follow up calls.',image:editorialImages.team.src,status:'approved',source:'original-deck'},
 {id:'adeleye',name:'Precious Oluwapelumi Adeleye',location:'Maryland, Lagos',quote:'I have confidence in Landshop because I’m always contacted whilst I’m far away. And of course, I will recommend Landshop to friends and family.',image:editorialImages.residential.src,status:'approved',source:'original-deck'},
 {id:'ojo',name:'Ojo Victor Oluwatimilehin',location:'Surulere, Lagos',quote:'You’ve made land purchase very easy and affordable for everyone, including me.',image:editorialImages.architecture.src,status:'approved',source:'original-deck'}
];
