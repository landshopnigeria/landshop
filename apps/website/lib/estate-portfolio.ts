/** Owner-supplied estate portfolio. Media came from the three uploaded archives.
 * Distinguish current site photographs from renderings; no public offer is inferred. */
export type PortfolioImage={src:string;caption:string;kind:'archive-photo'|'architectural-visual'|'layout'};
export type PortfolioEstate={
 slug:string;name:string;strapline:string;category:string;location:string;developer:string;role:string;
 status:string;summary:string;overview:string;propertyType:string;plotSizes:string;
 titleInformation:string;access:string;amenities:string[];facts:[string,string][];
 pricing:[string,string,string][];images:PortfolioImage[];highlights:string[];
 milestones:[string,string][];videos:{url:string;title:string}[];disclaimer:string;
};
export const estatePortfolio:PortfolioEstate[]=[
 {
  slug:'green-island',name:'Green Island Estate',strapline:'Classic Living, Rare Value',
  category:'Land and residential community',location:'Iba-Oloja, Ibeju-Lekki, Lagos',
  developer:'Landshop',role:'Landshop development portfolio',
  status:'Historical project showcase · Current plot availability unconfirmed',
  summary:'A nature-inspired estate vision in Iba-Oloja, Ibeju-Lekki, combining an emerging residential community with access to the wider Lekki growth corridor.',
  overview:'Green Island Estate is a nature-inspired residential and investment development at Iba-Oloja in Ibeju-Lekki. The planned community combines residential plots, green areas and proposed neighborhood facilities. The wider corridor includes the Lekki Free Trade Zone, Dangote Refinery and Lekki Deep Sea Port. Archive site photographs and conceptual architectural illustrations document different aspects of the project; illustrated infrastructure is not proof of completion.',
  propertyType:'Residential land; any commercial use subject to approved layout',plotSizes:'Historical offers: 300 m² and 600 m²; current options on enquiry',
  titleInformation:'Excision via Lagos State Government Gazette claimed in historical marketing; request independently verified title and survey records.',
  access:'Iba-Oloja via the Lekki-Epe / Ibeju-Lekki road corridor',
  amenities:['Gated estate access (proposed)','Internal roads (planned)','Landscaping and green spaces (planned)','Recreation and community amenities (proposed)'],
  facts:[['Estate location','Iba-Oloja, Ibeju-Lekki'],['Plot sizes','300 m² / 600 m² historically'],['Developer','Landshop'],['Current availability','Confirm with Landshop'],['Title documentation','Independent verification required'],['Pricing','Current official quotation required']],
  pricing:[['600 m² · 2024 advertised offer','₦8,000,000','Expired historical advertisement; not a current Landshop offer'],['600 m² · Recent third-party listings','₦15,000,000-₦18,000,000','Indicative third-party asking prices; not confirmed Landshop inventory'],['Official Landshop selling price','On request','Obtain an authorized quotation and availability confirmation']],
  images:[
   {src:'/estates/green-island/site-progress-1.webp',caption:'Owner-supplied historical site view showing estate signage; current condition not established',kind:'archive-photo'},
   {src:'/estates/green-island/site-progress-2.webp',caption:'Owner-supplied aerial site archive; not a current land survey',kind:'archive-photo'},
   {src:'/estates/green-island/residential-concept.webp',caption:'Architectural visualization of a proposed residential streetscape; not completed-property photography',kind:'architectural-visual'},
   {src:'/estates/green-island/masterplan-render.webp',caption:'Illustrative masterplan rendering; infrastructure shown is conceptual',kind:'architectural-visual'},
   {src:'/estates/green-island/community-render.webp',caption:'Architectural illustration of possible community facilities',kind:'architectural-visual'}
  ],
  highlights:['Located in the Ibeju-Lekki growth corridor','Landshop development history and historical plot options','Proposed green spaces, estate access and community facilities','Project archive includes real site documentation and clearly marked renderings'],
  milestones:[['Historical project','Green Island entered the Landshop estate portfolio'],['2024 offer archive','Public advertisements referenced 600 m² plots at ₦8 million'],['2026 market references','Third-party resale asking prices vary; no official Landshop price verified'],['Next verification','Request title, survey, progress update and an approved sales schedule']],
  videos:[{url:'https://youtu.be/oObXJQPZG9o',title:'Green Island Estate  -  Owner-provided project video'}],
  disclaimer:'Pictures include dated site images and conceptual architectural renders. Planned features, title, allocation, exact location, selling price and current availability must be checked with Landshop and independent advisers before payment.'
 },
 {
  slug:'maiyegun-beach-estate',name:'Maiyegun Beach Estate',strapline:'Experience Exceptional Oceanfront Living',
  category:'Premium oceanfront residential estate',location:'Jakande, Lekki, Lagos',
  developer:'Sterling Realties Development Company',role:'Property marketing and enquiries: Landshop',
  status:'Partner development showcase · Current offerings subject to verification',
  summary:'A premium beachfront master-planned residential development on the Lekki coastline, designed around ocean views, shoreline protection and an elevated coastal lifestyle.',
  overview:'Maiyegun Beach Estate is an approximately 50-hectare luxury coastal development at Jakande in Lekki. Its master-plan vision combines private waterfront living with a beachfront promenade, protective coastal works, access roads, drainage and planned utilities. Landshop provides marketing and enquiries; the named developer is Sterling Realties Development Company. The estate is located near the Lagos-Calabar Coastal Road. The supplied photographs show site and coastal views, while architectural images depict proposed designs.',
  propertyType:'Serviced residential plots and planned luxury housing',plotSizes:'Historically 600 m² to 1,800 m²; confirm current inventory',
  titleInformation:'Global Certificate of Occupancy claimed by developer; request authenticated title documentation.',
  access:'Jakande, Lekki, close to the Lagos-Calabar Coastal Road',
  amenities:['Beachside promenade (master-plan feature)','Coastal protection works','Internal roads and drainage','Central utilities (planned)','Recreation and landscaped areas (planned)','Security infrastructure (planned)'],
  facts:[['Estate location','Jakande, Lekki, Lagos'],['Development size','Approximately 50 hectares'],['Developer','Sterling Realties Development Company'],['Marketing','Landshop'],['Plot options','600-1,800 m² historically'],['Title claim','Global C of O; verify']],
  pricing:[['600 m² · 2026 public asking reference','₦570m-₦630m','Third-party advertised range; not a Landshop-approved offer'],['1,020 m² · 2026 public asking reference','₦860m-₦950m','Third-party advertised range; subject to verification'],['Current Landshop quotation','On request','Confirm current price, plot identity, authority and applicable terms']],
  images:[
   {src:'/media/maiyegun0.webp',caption:'Original Landshop Maiyegun Beach Estate photograph from the documented project archive; historical site conditions only',kind:'archive-photo'},
   {src:'/estates/maiyegun-beach-estate/coastal-site.webp',caption:'Owner-supplied photograph of Maiyegun coastal development terrain',kind:'archive-photo'},
   {src:'/estates/maiyegun-beach-estate/oceanfront-development.webp',caption:'Owner-supplied aerial view of beachside roads and coastal estate development',kind:'archive-photo'},
   {src:'/estates/maiyegun-beach-estate/coastal-road.webp',caption:'Owner-supplied archive showing coastal road and shoreline infrastructure',kind:'archive-photo'},
   {src:'/estates/maiyegun-beach-estate/architectural-concept.webp',caption:'Illustrative modern home design; no assertion of finished or available stock',kind:'architectural-visual'}
  ],
  highlights:['Atlantic beachfront position in Jakande, Lekki','Coastal access near the Lagos-Calabar Coastal Road','Master-planned promenade, services and protected shoreline','Original coastal photographs provided alongside clearly labeled concepts'],
  milestones:[['Development vision','Coastal residential master plan introduced'],['Landshop archive','Original coastal and infrastructure photographs supplied'],['Current review','Confirm phase, exact plots, title, shoreline approvals and present-day infrastructure']],
  videos:[],
  disclaimer:'Landshop markets the development; it should not be described as the developer. Market prices shown are public third-party asking references, not active quotations. Verify shoreline works, estate title, plot identity, rights to market, fees and availability.'
 },
 {
  slug:'blue-diamonds',name:'Blue Diamonds Estate',strapline:'Own a Place in Tomorrow’s Lagos',
  category:'Land and proposed residential development',location:'Ibeju-Lekki corridor, Lagos',
  developer:'Landshop',role:'Landshop development portfolio',
  status:'Development concept showcase · Official plot release on enquiry',
  summary:'An emerging Landshop residential development concept featuring modern entrance, townhouse and apartment design studies within the Ibeju-Lekki corridor.',
  overview:'Blue Diamonds Estate is part of Landshop’s property development portfolio within the Ibeju-Lekki corridor. The owner-provided image set includes architectural impressions of the estate entrance, residences, townhouse concepts, multi-unit blocks and an illustrative layout. These are design representations and do not establish that the buildings shown have been constructed or that units are available. Prospective subscribers should request current survey, plot allocation, development stage, planning approval and pricing in writing.',
  propertyType:'Land development; residential design concepts',plotSizes:'Current plot sizes to be confirmed by Landshop',
  titleInformation:'Obtain verified survey, title and approval documents before acquisition.',
  access:'Via the Lekki-Epe corridor; exact estate entrance and coordinates on verification',
  amenities:['Planned estate entrance and access control','Contemporary townhouse concepts','Illustrative low-rise apartments','Conceptual building and layout designs'],
  facts:[['Location','Ibeju-Lekki, Lagos'],['Developer','Landshop'],['Property category','Land and planned residences'],['Plot sizes','Request verified schedule'],['Title and survey','Official documentation required'],['Current sales price','Official quotation required']],
  pricing:[['Historical promotional artwork','₦18m / plot','Owner-supplied older artwork; date, plot size and validity unconfirmed'],['Current approved selling price','On request','Written quotation from Landshop required']],
  images:[
   {src:'/estates/blue-diamonds/entrance-concept.webp',caption:'Architectural impression of proposed Blue Diamonds entrance; not site photography',kind:'architectural-visual'},
   {src:'/estates/blue-diamonds/entrance-drive-concept.webp',caption:'Alternative concept rendering of the proposed entrance and roadway',kind:'architectural-visual'},
   {src:'/estates/blue-diamonds/apartment-concept.webp',caption:'Illustrative residential block; not proof of construction or sale availability',kind:'architectural-visual'},
   {src:'/estates/blue-diamonds/townhouse-concept.webp',caption:'Proposed townhouse architectural visualization',kind:'architectural-visual'},
   {src:'/estates/blue-diamonds/residences-concept.webp',caption:'Residential design concept from the owner-supplied estate image set',kind:'architectural-visual'},
   {src:'/estates/blue-diamonds/apartment-block-concept.webp',caption:'Multi-unit block architectural design study',kind:'architectural-visual'},
   {src:'/estates/blue-diamonds/apartment-view-concept.webp',caption:'Alternative multi-unit concept elevation',kind:'architectural-visual'},
   {src:'/estates/blue-diamonds/architectural-layout.webp',caption:'Illustrative floor-plan layout, not a certified site survey',kind:'layout'}
  ],
  highlights:['Ibeju-Lekki growth-corridor location','Eight owner-provided architectural and layout visuals, clearly identified as concepts','Estate entrance, apartment and townhouse design studies','Inspection and documented title, plot and price verification available through Landshop enquiries'],
  milestones:[['Concept development','Entry gate and residential concepts prepared'],['Portfolio visuals','Architectural design studies and illustrative layout supplied by Landshop'],['Virtual tour','Blue Diamonds virtual-tour media has been supplied separately; a verified hosted link is required before embedding'],['Next verification','Confirm physical site progress, title, survey and officially approved offers']],
  videos:[],
  disclaimer:'Blue Diamonds imagery comprises architectural renderings and a conceptual layout, not photographs of completed buildings. Historical promotional pricing has not been validated as a current official offer.'
 }
];
export const additionalOwnerVideoLinks=[
 'https://youtu.be/bj4bwokLobU','https://youtu.be/yJCyX8OFt0I','https://youtu.be/BgVo9C2EX4U','https://youtu.be/noG1XiZVCfc'
]; // Unverified estate association: do not mislabel these four links.
export function getPortfolioEstate(slug:string){return estatePortfolio.find(x=>x.slug===slug)}
