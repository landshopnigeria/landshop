/** Editorial media used by Landshop marketing. User-provided references are illustrative and must never be represented as current Landshop property inventory. Property listing galleries continue to use original verified, owner-approved photos. The building images rejected on 31 Oct 2026 are removed from these shared slots. */
export type EditorialPhoto={src:string;alt:string;credit:string;source:string};
export const editorialImages={
 develop:{
  src:'/editorial/2026/ikate-exterior.jpg',
  alt:'Modern black-and-white duplex photographed in the user-supplied Nigerian property reference collection; illustrative, not a Landshop listing',
  credit:'User-supplied reference / Landshop creative',
  source:'User-provided marketing reference — rights for public marketing to be confirmed'
 },
 incubate:{
  src:'/editorial/2026/incubate-reference.jpg',
  alt:'Photograph of completed white duplex homes from the user-supplied Nigerian real estate reference collection; not a Landshop listing',
  credit:'User-supplied reference / Landshop creative',
  source:'User-provided marketing reference — rights for public marketing to be confirmed'
 },
 grow:{
  src:'https://images.pexels.com/photos/30690402/pexels-photo-30690402.jpeg?auto=compress&cs=tinysrgb&w=2000',
  alt:'Real photograph of Nigerian professionals in a Lagos office, illustrating mortgage and home-financing guidance; not Landshop employees',
  credit:'Ninthgrid / Pexels',
  source:'https://www.pexels.com/photo/confident-african-businesswomen-collaborating-in-lagos-office-30690402/'
 },
 team:{
  src:'https://images.pexels.com/photos/30688593/pexels-photo-30688593.jpeg?auto=compress&cs=tinysrgb&w=1600',
  alt:'Genuine photograph of a professional group in Lagos; illustrative models, not Landshop personnel',
  credit:'Ninthgrid / Pexels',
  source:'https://www.pexels.com/photo/casual-office-meeting-in-lagos-nigeria-30688593/'
 },
 portrait:{
  src:'https://images.pexels.com/photos/30675541/pexels-photo-30675541.jpeg?auto=compress&cs=tinysrgb&w=1600',
  alt:'Real portrait photograph of a stylish adult Nigerian woman in Lagos; illustrative model, not a Landshop representative',
  credit:'Ninthgrid / Pexels',
  source:'https://www.pexels.com/photo/stylish-african-woman-in-lagos-smiling-30675541/'
 },
 planning:{
  src:'https://images.pexels.com/photos/30688908/pexels-photo-30688908.jpeg?auto=compress&cs=tinysrgb&w=1600',
  alt:'Real photograph of a Nigerian woman working with a laptop in a Lagos café; illustrative editorial photography',
  credit:'Ninthgrid / Pexels',
  source:'https://www.pexels.com/photo/professional-woman-working-in-lagos-cafe-30688908/'
 },
 residential:{
  src:'/editorial/2026/modern-duplex.jpg',
  alt:'Contemporary residential duplex with white facade and black roof photographed for the user-supplied reference collection; illustrative, not a listed Landshop property',
  credit:'User-supplied reference / Landshop creative',
  source:'User-provided marketing reference — rights for public marketing to be confirmed'
 },
 architecture:{
  src:'/editorial/2026/townhouse.jpg',
  alt:'Modern two-storey white and charcoal duplex in the user-supplied property reference collection, not a Landshop listing',
  credit:'User-supplied reference / Landshop creative',
  source:'User-provided marketing reference — rights for public marketing to be confirmed'
 },
 officeTower:{
  src:'/editorial/2026/ikate-exterior.jpg',
  alt:'Modern residential property exterior in Nigeria from the user-provided editorial reference collection',
  credit:'User-supplied reference / Landshop creative',
  source:'User-provided marketing reference — rights for public marketing to be confirmed'
 },
 skyline:{
  src:'/editorial/2026/estate-parking.jpg',
  alt:'Illustrative modern estate architectural concept with parked cars and no palm trees; not an actual Landshop estate photo',
  credit:'User-supplied reference / Landshop creative',
  source:'User-provided marketing reference — rights for public marketing to be confirmed'
 }
} as const satisfies Record<string,EditorialPhoto>;
