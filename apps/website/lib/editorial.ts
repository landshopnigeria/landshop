
export type Guide={slug:string;category:string;title:string;description:string;image:string;sections:{heading:string;paragraphs:string[];points?:string[]}[];tags:string[];product:string;cta:string;ctaHref:string};
export const guides:Guide[]=[
 {slug:'before-you-subscribe-to-land-or-house',category:'Property Acquisition',
 title:'Before You Subscribe to Land or a House',
 description:'A practical checklist for reviewing property documentation, estate information and contractual commitments before paying.',
 image:'/media/deck-building.webp',tags:['Due diligence','Title','Inspection','Develop'],product:'Develop',cta:'Explore Develop',ctaHref:'/develop',
 sections:[
 {heading:'Start with verifiable property information',paragraphs:['Before making any commitment, request the developer’s legal name, the estate or property address, the relevant plot or unit details and the identity of the authorized marketing representative. Confirm exactly what is included in the price.'],points:['Request the current estate layout, available unit or plot identification and accurate location details.','Check the official documents against the same property being marketed.','Ask which fees and levies are included—and which are excluded.']},
 {heading:'Review the title and contract',paragraphs:['Have an independent Nigerian property lawyer examine the title, survey, contract terms and appropriate consents. Advertising a property is not a substitute for legal due diligence.'],points:['Confirm the applicable title and relevant planning approvals.','Get written payment, possession, development and refund conditions.','Avoid payments to personal accounts unless independently verified and expressly authorized.']},
 {heading:'Inspect before making a decision',paragraphs:['A guided visit helps compare marketing descriptions with the actual site, boundaries, roads, drainage and utilities. Where practical, use your own qualified surveyor or building professional.']},
 {heading:'Move forward with clear records',paragraphs:['Keep written copies of communications, offers, payment evidence and executed documents. Where details remain uncertain, request clarification before accepting contractual obligations.']}
 ]},
 {slug:'understanding-mortgage-prequalification',category:'Mortgage',
 title:'Understanding Mortgage Pre-qualification',
 description:'How to evaluate affordability, equity contributions, repayment schedules and lender eligibility before applying for a home loan.',
 image:'/media/deck-mortgage.webp',tags:['Mortgage','Affordability','Equity','Grow'],product:'Grow',cta:'Calculate your mortgage',ctaHref:'https://portal.landshopnigeria.com/calculator',
 sections:[
 {heading:'Understand what pre-qualification means',paragraphs:['Pre-qualification is an early estimate based on information you provide. It is not a lender commitment, approval or guarantee of funding. Final decisions depend on verified income, credit assessment, property security and the lender’s policies.']},
 {heading:'Calculate the complete monthly commitment',paragraphs:['A sound repayment estimate includes loan principal, equity contribution, rate assumptions, repayment tenure and any relevant insurance or fees. Comparing only advertised headline rates can be misleading.'],points:['Document the proposed property price and available deposit.','Enter the lender’s current annual rate into the calculator.','Check the repayment term, fees, income commitments and contingencies.']},
 {heading:'Prepare your application documents',paragraphs:['Lenders may request identity evidence, income records, bank statements, employment or business information, tax and title records. Requirements vary by institution. Submit sensitive records only through secure channels.']},
 {heading:'Proceed only on verified terms',paragraphs:['Use the Landshop calculator to compare illustrative scenarios, then obtain actual terms in writing from the relevant lender. An estimate is not a regulated lending offer.']}
 ]},
 {slug:'how-to-prepare-for-property-inspection',category:'Property Inspection',
 title:'How to Prepare for a Property Inspection',
 description:'A field-ready guide to estate viewings, construction checks, document questions and follow-up after an inspection.',
 image:'/media/deck-construction.webp',tags:['Inspection','Site visit','Checklist','Develop'],product:'Develop',cta:'View inspection applications',ctaHref:'/applications',
 sections:[
 {heading:'Confirm what you are viewing',paragraphs:['Make sure the estate, address, appointment details and representative all correspond to the property you are considering. Request confirmation of the meeting point in advance.']},
 {heading:'Inspect the wider environment',paragraphs:['Look beyond the building or plot. Access, roads, drainage, local infrastructure, land use and neighboring development can materially affect your decision.'],points:['Check the approximate site dimensions against supporting documents.','Observe access roads, drainage and utility availability.','For finished homes, ask about structure, services and maintenance obligations.']},
 {heading:'Record questions and discrepancies',paragraphs:['Take notes where permitted. If marketing information conflicts with what you observe, ask for clarification and documentary support. Never rely on verbal assurances alone.']},
 {heading:'Arrange independent professional review',paragraphs:['An inspection is useful but it does not replace a survey, title search, engineering assessment or independent legal advice. Ask Landshop about the correct guided application for the property.']}
 ]}
];
export const insightCategories=['All','Property Acquisition','Mortgage','Property Inspection'] as const;
export function findGuide(slug:string){return guides.find(g=>g.slug===slug)}
