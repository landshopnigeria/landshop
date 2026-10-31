/** Owner-supplied and owner-directed marketing media for the 2026 Landshop refinement.
 * Collage artwork includes digital brand styling, not proof of employee identity
 * or completion of physical renovations.
 */
export const landshopAboutImages = [
 {src:'/media/landshop-about-roof.jpg', alt:'Construction worker on a roof at a Nigerian building site, supplied as Landshop editorial construction photography'},
 {src:'/media/landshop-about-site-team.jpg', alt:'Landshop-branded site discussion with three people in white branded hard hats and white shirts; digitally branded marketing image'},
 {src:'/media/landshop-about-headquarters.jpg', alt:'Landshop headquarters building concept with a digitally refurbished and painted front fence'}
] as const;

export const landshopEditorialTeam={
 src:'/media/landshop-editorial-team.jpg',
 alt:'Brand-styled Landshop corporate team portrait, digitally prepared for editorial use'
} as const;

export const landshopProductCards=[
 {slug:'develop',name:'Develop',category:'PROPERTY ACQUISITION',description:'Prefer outright acquisition and instant ownership? Explore Prime and Luxury selections and future land opportunities.',logo:'/brand/develop-official.png',iconOnly:false,href:'/plans/develop'},
 {slug:'incubate',name:'Incubate',category:'SHARED OWNERSHIP',description:'Explore a shared ownership concept with others and understand future participation terms.',logo:'/brand/incubate-concept.png',iconOnly:false,href:'/plans/incubate'},
 {slug:'grow',name:'Grow',category:'HOMEOWNERSHIP',description:'Explore Mortgage Xtra and Beta Mortgage pathways for approved completed and off-plan homes.',logo:'/brand/grow-official.png',iconOnly:false,href:'/plans/grow'},
 {slug:'devpro',name:'DevPro',category:'ESTATE INFRASTRUCTURE CREDIT',description:'Enquire about funding for eligible estate infrastructure levies, drainage, fencing and roads.',logo:'/brand/devpro-premium.png',iconOnly:true,href:'/plans/devpro'},
 {slug:'estatepro',name:'EstatePro',category:'CONSTRUCTION FUNDING',description:'Explore construction finance enquiries for eligible subscribers ready to build.',logo:'/brand/estatepro-premium.png',iconOnly:true,href:'/plans/estatepro'}
] as const;
