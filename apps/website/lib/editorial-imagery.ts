/**
 * Genuine Nigerian photography for LANDSHOP marketing/editorial use.
 * All URLs below point to individual photographs published under the Pexels License.
 * These are location-tagged images of Nigeria, NOT synthetic renders.
 *
 * Licensing: https://www.pexels.com/legal-pages/license/
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
  src:'https://images.pexels.com/photos/36622005/pexels-photo-36622005.jpeg?auto=compress&cs=tinysrgb&w=2000',
  alt:'Actual photograph of a contemporary residential development in Lagos, Nigeria; illustrative editorial photograph',
  credit:'Taiwo Samson / Pexels',
  source:'https://www.pexels.com/photo/modern-apartment-complex-under-construction-in-lagos-36622005/'
 },
 incubate:{
  src:'https://images.pexels.com/photos/27938900/pexels-photo-27938900.jpeg?auto=compress&cs=tinysrgb&w=2000',
  alt:'Genuine aerial photograph of the Osapa London neighborhood in Lagos, Nigeria; illustrative editorial photograph',
  credit:'Ben Iwara / Pexels',
  source:'https://www.pexels.com/photo/drone-view-osapa-london-lagos-state-27938900/'
 },
 grow:{
  src:'https://images.pexels.com/photos/30690402/pexels-photo-30690402.jpeg?auto=compress&cs=tinysrgb&w=2000',
  alt:'Real photograph of Nigerian women professionals with laptops in Lagos; illustrative models, not Landshop staff',
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
 skyline:{
  src:'https://images.pexels.com/photos/32656347/pexels-photo-32656347.jpeg?auto=compress&cs=tinysrgb&w=1600',
  alt:'Real Lagos, Nigeria city skyline near the Atlantic coast, photographed in daylight',
  credit:'onaopemipo Rufus / Pexels',
  source:'https://www.pexels.com/photo/aerial-view-of-lagos-cityscape-with-ocean-horizon-32656347/'
 }
} as const satisfies Record<string,EditorialPhoto>;
