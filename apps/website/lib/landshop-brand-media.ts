/** Owner-supplied and owner-directed marketing media for the 2026 Landshop refinement.
 * Collage artwork includes digital brand styling, not proof of employee identity
 * or completion of physical renovations.
 */
export const landshopAboutImages = [
 {src:'/owner/2026/garden-building-workers.webp', alt:'Archival on-site construction work at Famous Gardens, photographed in Nigeria'},
 {src:'/owner/2026/garden-site-team.webp', alt:'Landshop project staff and construction team photographed on site'},
 {src:'/owner/2026/estate-architecture.webp', alt:'Completed Nigerian estate townhouses from the supplied Landshop property photo archive'}
] as const;

export const landshopEditorialTeam={
 src:'/owner/2026/garden-field-update.webp',
 alt:'A Landshop-branded staff member giving a documented on-site Famous Gardens update'
} as const;

export const landshopProductCards=[
 {slug:'develop',name:'Develop',category:'PROPERTY ACQUISITION',description:'Prefer outright acquisition and instant ownership? Explore Prime and Luxury selections and future land opportunities.',logo:'/brand/develop-official.png',photo:'/owner/2026/product-develop.webp',photoAlt:'Owner-supplied aerial photo of land development beside a waterway',iconOnly:false,href:'/plans/develop'},
 {slug:'incubate',name:'Incubate',category:'SHARED OWNERSHIP',description:'Explore a shared ownership concept with others and understand future participation terms.',logo:'/brand/incubate-concept.png',photo:'/owner/2026/product-incubate.webp',photoAlt:'Real estate entrance and surrounding homes from the owner-supplied Nigerian photo archive',iconOnly:false,href:'/plans/incubate'},
 {slug:'grow',name:'Grow',category:'HOMEOWNERSHIP',description:'Explore Mortgage Xtra and Beta Mortgage pathways for approved completed and off-plan homes.',logo:'/brand/grow-official.png',photo:'/owner/2026/product-grow.webp',photoAlt:'Person standing outside a completed residential building in a Nigerian property development',iconOnly:false,href:'/plans/grow'},
 {slug:'devpro',name:'DevPro',category:'ESTATE INFRASTRUCTURE CREDIT',description:'Enquire about funding for eligible estate infrastructure levies, drainage, fencing and roads.',logo:'/brand/devpro-premium.png',photo:undefined,photoAlt:'',iconOnly:true,href:'/plans/devpro'},
 {slug:'estatepro',name:'EstatePro',category:'CONSTRUCTION FUNDING',description:'Explore construction finance enquiries for eligible subscribers ready to build.',logo:'/brand/estatepro-premium.png',photo:undefined,photoAlt:'',iconOnly:true,href:'/plans/estatepro'}
] as const;
