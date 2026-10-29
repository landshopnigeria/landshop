/**
 * Genuine Nigerian photography for LANDSHOP marketing/editorial use.
 * Product hero photography comes from the official Landshop product deck. Other editorial photos are licensed Pexels images.
 * These are location-tagged images of Nigeria, NOT synthetic renders.
 *
 * Editorial licensing: https://www.pexels.com/legal-pages/license/; deck media remains Landshop source material.
 * Important: marketing images are illustrative. Do not describe their subjects as
 * Landshop staff, clients or endorsers. Never use an illustrative photograph as a
 * photographed listing for a specific Landshop estate/property.
 *
 * Individual original photo pages, photographers and location notes appear in
 * docs/EDITORIAL-PHOTOGRAPHY-SOURCES.md. These should be reviewed on each renewal.
 */
export type EditorialPhoto={src:string;alt:string;credit:string;source:string};
export const editorialImages={
 develop:{
  src:'/media/deck-develop.webp',
  alt:'Original Landshop Develop product-deck image illustrating land and home ownership; not a particular listed property',
  credit:'Landshop product deck',
  source:'Landshop Product Deck'
 },
 incubate:{
  src:'/media/deck-investment.webp',
  alt:'Original Landshop Incubate product-deck image illustrating property-linked investment; not a listed offer',
  credit:'Landshop product deck',
  source:'Landshop Product Deck'
 },
 grow:{
  src:'/media/deck-mortgage.webp',
  alt:'Original Landshop Grow mortgage product-deck image illustrating a home-financing pathway; not an approved loan or listing',
  credit:'Landshop product deck',
  source:'Landshop Product Deck'
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
  src:'https://images.pexels.com/photos/34557960/pexels-photo-34557960.jpeg?auto=compress&cs=tinysrgb&w=1600',
  alt:'Real apartment tower in Lagos, Nigeria; illustrative architecture, not a Landshop property listing',
  credit:'Zacky Dare / Pexels',
  source:'https://www.pexels.com/photo/modern-high-rise-building-in-lagos-nigeria-34557960/'
 },
 architecture:{
  src:'https://images.pexels.com/photos/34189426/pexels-photo-34189426.jpeg?auto=compress&cs=tinysrgb&w=1600',
  alt:'Real contemporary urban building photographed in Lagos, Nigeria; editorial architecture photograph',
  credit:'Faith Stephen / Pexels',
  source:'https://www.pexels.com/photo/modern-urban-building-with-clear-sky-34189426/'
 },
 officeTower:{
  src:'https://images.pexels.com/photos/20430713/pexels-photo-20430713.jpeg?auto=compress&cs=tinysrgb&w=1600',
  alt:'Actual contemporary office building facade photographed in Lagos, Nigeria; editorial photograph',
  credit:'Ebenezer Idowu / Pexels',
  source:'https://www.pexels.com/photo/exterior-of-a-glass-office-building-20430713/'
 },
 skyline:{
  src:'https://images.pexels.com/photos/32656347/pexels-photo-32656347.jpeg?auto=compress&cs=tinysrgb&w=1600',
  alt:'Real Lagos, Nigeria city skyline near the Atlantic coast, photographed in daylight',
  credit:'onaopemipo Rufus / Pexels',
  source:'https://www.pexels.com/photo/aerial-view-of-lagos-cityscape-with-ocean-horizon-32656347/'
 }
} as const satisfies Record<string,EditorialPhoto>;
