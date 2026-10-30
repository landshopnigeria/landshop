import {v22Guides} from './v22-guides';
export type Guide={
 tags?:string[];
 slug:string;category:string;title:string;summary:string;image:string;readingMinutes:number;
 sections:{heading:string;paragraph:string;points?:string[]}[];
};
import {editorialImages} from './editorial-imagery';
export const guides:Guide[]=[
 {slug:'property-due-diligence',category:'DEVELOP',title:'Before you subscribe to land or a house',summary:'A structured checklist for verifying land, housing and estate purchase decisions in Nigeria.',image:editorialImages.residential.src,readingMinutes:5,sections:[
  {heading:'Start with the property, not the brochure',paragraph:'Identify the exact project, developer or lawful seller, plot or unit, and location. Ask whether the current offer is for land, an off-plan unit or a completed property.',points:['Obtain the development name, location and unique plot or unit reference.','Confirm the legal seller and the person authorized to receive payments.','Request an up-to-date written schedule of price, fees and milestones.']},
  {heading:'Validate title and approvals independently',paragraph:'Before you commit funds, have a qualified independent professional inspect the survey, title documents and applicable planning information. The type of evidence required depends on the property and local land administration.',points:['Compare the survey and site boundaries.','Ask about any encumbrances, disputes or third-party claims.','Confirm whether promised infrastructure and approvals are documented.']},
  {heading:'Read the obligations and exit terms',paragraph:'Price is only one part of the total commitment. Payment deadlines, allocation procedures, service charges, construction timelines and refund or termination conditions should all be in writing.'},
  {heading:'Inspect and document the outcome',paragraph:'Visit the site where practical, keep a record of what was shown, and reconcile any differences with the written offer. Treat marketing photographs as supporting material, not proof of title or current availability.'}
 ]},
 {slug:'mortgage-prequalification',category:'GROW',title:'Understanding mortgage pre-qualification',summary:'How to prepare for an initial affordability review before proceeding with a home-financing application.',image:editorialImages.planning.src,readingMinutes:4,sections:[
  {heading:'What pre-qualification means',paragraph:'Pre-qualification is an indicative screening based on information available at the time. It is not a loan approval, binding rate quote or promise of eligibility.'},
  {heading:'Build an accurate affordability picture',paragraph:'Consider income stability, existing loans, planned equity contribution, recurring household commitments and all costs beyond the purchase price.',points:['Gather income evidence and information on existing debt.','Consider a payment buffer for unexpected costs and changes.','Compare repayment outcomes under more than one interest-rate assumption.']},
  {heading:'Understand the full cost',paragraph:'Ask the proposed lender for current pricing and disclosure of application fees, insurance, legal charges, valuation costs and applicable taxes. A longer loan term may reduce monthly payments while increasing total borrowing costs.'},
  {heading:'Move to documented assessment',paragraph:'A lender must independently evaluate credit, identity, affordability and the proposed property. Use Landshop Grow applications to organize the next steps, then rely on actual written lender documentation for final decisions.'}
 ]},
 {slug:'property-inspection',category:'INSPECTIONS',title:'How to prepare for a property inspection',summary:'A practical field checklist for comparing a property with its documents and marketing descriptions.',image:editorialImages.develop.src,readingMinutes:4,sections:[
  {heading:'Confirm the inspection arrangements',paragraph:'Ensure you know the exact project address, meeting point, authorized host and inspection appointment confirmation. Do not assume a requested booking is approved.'},
  {heading:'Observe more than the building',paragraph:'Check the surrounding roads, drainage, terrain, estate access, apparent utilities, site boundaries and neighborhood services.',points:['Take photos or notes where permission is granted.','Ask who is responsible for utility connections and ongoing maintenance.','For an existing building, consider a professional structural and services assessment.']},
  {heading:'Compare what you see with the documents',paragraph:'Record material differences between brochures, plans, plot descriptions, current progress and on-site conditions. Ask for written clarifications and verification of all outstanding commitments.'},
  {heading:'Before the final decision',paragraph:'Review the findings alongside title evidence, the proposed agreement and any professional reports. An inspection supports due diligence but does not substitute for legal verification.'}
 ]}
,...v22Guides
];
export function findGuide(slug:string){return guides.find(g=>g.slug===slug)}
