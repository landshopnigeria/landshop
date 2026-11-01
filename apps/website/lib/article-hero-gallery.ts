/**
 * Owner-supplied editorial photography for each article hero.
 * These are documentary archive images, not exact-unit or current-offer proof.
 */
export type ArticleHeroSlide={src:string;alt:string};
const owner='/owner/2026/';
const photoAlt:Record<string,string>={
 'garden-property-filming.webp':'Landshop property photography crew documenting a real Nigerian estate site',
 'garden-inspection-filming.webp':'Camera crew filming an authentic Landshop property inspection',
 'garden-site-team.webp':'Landshop staff and construction team on site',
 'famous-completed-homes.webp':'Completed Nigerian residential homes from the Landshop photo archive',
 'famous-living.webp':'Photographed living room of a completed residence',
 'famous-bedroom.webp':'Actual finished bedroom in the owner-supplied Nigerian property archive',
 'famous-dining.webp':'Completed dining area inside a Nigerian home',
 'famous-kitchen.webp':'Real fitted kitchen from the owner-supplied residential archive',
 'famous-exterior.webp':'Completed townhouse exterior at a Nigerian estate',
 'famous-gate.webp':'Archival photograph of a residential estate entrance',
 'famous-access.webp':'Access roads inside a Nigerian residential development',
 'famous-site-visit.webp':'Landshop team and visitors inspecting an estate site',
 'site-entrance.webp':'Original photograph of a Nigerian estate entrance',
 'site-client-inspection.webp':'People discussing a residential property during an inspection',
 'estate-residential.webp':'Completed Nigerian residential estate buildings',
 'estate-architecture.webp':'Contemporary Nigerian residential townhouses',
 'project-building-detail.webp':'Actual photographed building details from the Landshop estate archive',
 'product-grow.webp':'Person standing outside a completed Nigerian residence',
 'product-incubate.webp':'Residential estate photographed for a Landshop product',
 'product-develop.webp':'Land development photographed from above in Nigeria',
 'slider-02.webp':'Aerial view of Nigerian estate roads and waterways',
 'garden-building-workers.webp':'Workers at a Landshop estate construction site',
 'garden-construction.webp':'Genuine construction activity in the Landshop archive',
 'famous-building-progress.webp':'Nigerian residential building photographed during construction',
 'garden-field-update.webp':'Landshop field presenter documenting construction progress'
};
/** Explicit image sequence avoids cycling unrelated stock photos between stories. */
const bySlug:Record<string,[string,string,string]>={
 'marketing-property-online':['garden-property-filming.webp','garden-inspection-filming.webp','garden-site-team.webp'],
 'first-home-nigeria':['famous-completed-homes.webp','famous-living.webp','famous-bedroom.webp'],
 'property-due-diligence':['site-entrance.webp','famous-gate.webp','site-client-inspection.webp'],
 'mortgage-prequalification':['product-grow.webp','estate-residential.webp','famous-completed-homes.webp'],
 'property-inspection':['site-client-inspection.webp','garden-inspection-filming.webp','famous-site-visit.webp'],
 'nigerian-property-titles-explained':['famous-gate.webp','site-entrance.webp','famous-access.webp'],
 'prime-vs-luxury':['estate-architecture.webp','famous-exterior.webp','famous-completed-homes.webp'],
 'property-instalment-plans':['famous-completed-homes.webp','famous-dining.webp','product-grow.webp'],
 'rent-to-own-versus-purchase':['famous-living.webp','famous-bedroom.webp','famous-exterior.webp'],
 'construction-cost-nigeria':['garden-building-workers.webp','garden-construction.webp','famous-building-progress.webp'],
 'real-estate-investment-risk':['product-develop.webp','slider-02.webp','garden-field-update.webp'],
 'fractional-property-investing':['product-incubate.webp','famous-completed-homes.webp','estate-architecture.webp'],
 'evaluate-property-investment-offer':['garden-field-update.webp','site-client-inspection.webp','product-develop.webp'],
 'choosing-investment-location':['slider-02.webp','famous-access.webp','famous-gate.webp'],
 'property-decisions-lagos':['site-entrance.webp','famous-site-visit.webp','estate-residential.webp'],
 'property-decisions-abuja':['estate-residential.webp','estate-architecture.webp','project-building-detail.webp'],
 'lekki-epe-corridor':['famous-gate.webp','famous-access.webp','famous-site-visit.webp'],
 'family-friendly-home':['famous-dining.webp','famous-living.webp','famous-bedroom.webp'],
 'low-maintenance-home':['famous-kitchen.webp','famous-living.webp','famous-exterior.webp'],
 'virtual-tours-and-portals':['garden-inspection-filming.webp','garden-property-filming.webp','garden-site-team.webp']
};
export function articleHeroSlides(slug:string,primary:string,primaryAlt?:string):ArticleHeroSlide[]{
 const files=bySlug[slug];
 if(!files)return [
  {src:primary,alt:primaryAlt||'Owner-provided Nigerian real estate documentary photograph'},
  {src:owner+'estate-residential.webp',alt:photoAlt['estate-residential.webp']},
  {src:owner+'garden-site-team.webp',alt:photoAlt['garden-site-team.webp']}
 ];
 return files.map(file=>({src:owner+file,alt:photoAlt[file]||'Owner-provided Nigerian real estate archive photograph'}));
}
