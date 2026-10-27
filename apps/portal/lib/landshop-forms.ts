export type Field={key:string;label:string;type?:'text'|'email'|'tel'|'date'|'number'|'select'|'textarea'|'checkbox'|'file';required?:boolean;choices?:string[];placeholder?:string};
export type Step={name:string;fields:Field[]};
export const sharedPersonal:Field[]=[
 {key:'first_name',label:'First Name',required:true},{key:'middle_name',label:'Middle Name'},
 {key:'last_name',label:'Last Name (Surname)',required:true},{key:'phone',label:'Phone Number',type:'tel',required:true},
 {key:'whatsapp',label:'WhatsApp Number',type:'tel'},{key:'email',label:'Email',type:'email',required:true},
 {key:'gender',label:'Gender',type:'select',choices:['Female','Male','Prefer not to say']},
 {key:'date_of_birth',label:'Date of Birth',type:'date'},{key:'marital_status',label:'Marital Status',type:'select',choices:['Single','Married','Divorced','Widowed']},
 {key:'residential_address',label:'Residential Address',type:'textarea'},
 {key:'state_of_residence',label:'State of Residence'},
 {key:'local_government',label:'Local Government'},{key:'occupation',label:'Occupation'},{key:'designation',label:'Designation'}
];
const choice=(key:string,label:string,choices:string[]):Field=>({key,label,type:'select',choices});
// The source paper forms are customer subscription/application documents, not registration.
const requiredPersonalKeys=new Set(['gender','date_of_birth','marital_status','residential_address','state_of_residence','occupation','designation']);
const personalStep:Step={name:'Client Details',fields:[
 {key:'client_file_number',label:'Client File Number (if issued)',placeholder:'Assigned by Landshop after onboarding'},
 ...sharedPersonal.map(field=>({...field,required:field.required||requiredPersonalKeys.has(field.key)})),
 {key:'passport_photo',label:'Passport Photograph',type:'file',required:true}
]};
const developPersonalStep:Step={...personalStep,fields:personalStep.fields.map(field=>
 field.key==='middle_name'||field.key==='whatsapp'?{...field,required:true}:field
)};
const kin:Step={name:'Next of Kin',fields:[
 {key:'kin_name',label:'Full Name'},{key:'kin_address',label:'Residential Address',type:'textarea'},
 {key:'kin_email',label:'Email',type:'email'},{key:'kin_phone',label:'Phone',type:'tel'},
 {key:'kin_whatsapp',label:'WhatsApp',type:'tel'},{key:'kin_relationship',label:'Relationship'}
]};
const referral:Step={name:'Referral',fields:[
 {key:'referral_code',label:'Referrer Code',placeholder:'LANDSHOP01'},
 {key:'referrer_name',label:'Referrer Name'},{key:'referrer_email',label:'Referrer Email',type:'email'},
 {key:'referrer_phone',label:'Referrer Phone',type:'tel'}
]};
const declaration:Step={name:'Declaration',fields:[
 {key:'applicant_signature',label:'Typed Signature / Full Name',required:true},
 {key:'declaration_date',label:'Date',type:'date',required:true},
 {key:'declaration_accepted',label:'I confirm my information is accurate and agree to the applicable terms.',type:'checkbox',required:true}
]};
const upload:Step={name:'Documents',fields:[
 {key:'government_id',label:'Government ID',type:'file'},
 {key:'address_proof',label:'Proof of Address',type:'file'},
 {key:'income_statement',label:'Income Statement',type:'file'},
 {key:'mortgage_document',label:'Mortgage Documents',type:'file'},
 {key:'supporting_document',label:'Other Supporting Documents',type:'file'}
]};
const productChoice:Step={name:'Property Choice',fields:[
 choice('estate_name','Estate / Property of Choice',['Merit Mews','Famous Gardens','Merit Park','Maiyegun Beach','Harris Drive','The Pearl','Other']),
 {key:'property_location',label:'Property Location'},
 choice('property_type','Property Type',['Land','Apartment','Terrace','Duplex','Bungalow','Other']),
 choice('property_format','Property Format',['Prime','Luxury','Other']),
 choice('property_use','Property Use',['Residential','Commercial','Mixed Use']),
 {key:'property_size',label:'Property Size'},{key:'quantity',label:'Quantity',type:'number'}
]};
const developHouseChoice:Step={name:'Property Choice',fields:[
 choice('estate_name','Estate / House of Choice',['Merit Mews','Famous Gardens','Blue Diamonds Mews','Green Island Mews','Mayflower Mews','The Groove','Heritage Court','Zenith Gardens','Angels Court','Prestige Court','Yellow Diamond','Luxiar Apartments','Peace Haven','Other']),
 {key:'property_location',label:'Property Location',required:true,placeholder:'e.g., Lekki Phase 1, Lagos'},
 choice('property_type','Property Type',['Block of Flats','Terrace','Duplex','Apartment','Other']),
 choice('property_format','Property Format',['Prime','Luxury','Other']),
 choice('property_use','Property Use',['Residential','Commercial','Dual Purpose']),
 choice('property_size','Property Size / Configuration',['2 Bedroom Block of Flats + BQ','3 Bedroom Terrace + BQ & Study','4 Bedroom Block of Flats','Other']),
 {key:'quantity',label:'Number of Units',type:'number',required:true,placeholder:'e.g., 1'}
]};
const developLandChoice:Step={name:'Property Choice',fields:[
 choice('estate_name','Estate / Land of Choice',['Green Island','Mayflower Gardens','Country Home','Dominion Park','Merit Park','Zenith Gardens','Famous Gardens','Blue Diamonds','The Water Brooks','Goshen Park','Angels Court',"Shepherd's Garden I","Shepherd's Garden II",'The Pearl','Maiyegun Beach','Prestige Court','Merit Mews','Oasis','Eko Atlantic City','Alacrity City','Heritage Court','Peace Haven','Yellow Diamond','Tranquility Court','Other']),
 {key:'property_location',label:'Property Location',required:true,placeholder:'State, town and estate location'},
 choice('property_type','Property Type',['Land','Residential Plot','Commercial Plot','Other']),
 choice('property_format','Property Format',['Prime','Luxury','Other']),
 choice('property_use','Property Use',['Residential','Commercial','Dual Purpose']),
 choice('property_size','Land Size',['300 sqm','400 sqm','450 sqm','500 sqm','600 sqm','800 sqm','1000 sqm','1200 sqm','1600 sqm','1800 sqm','Other']),
 {key:'quantity',label:'Number of Plots',type:'number',required:true,placeholder:'e.g., 1'}
]};
const payment:Step={name:'Payment Preference',fields:[
 {key:'property_amount',label:'Property Amount (NGN)',type:'number',placeholder:'e.g., 35000000'},
 choice('payment_mode','Payment Option',['Outright','Instalment','Mortgage']),
 {key:'payment_plan',label:'Preferred Payment Plan',placeholder:'e.g., 12 monthly instalments'},{key:'interest_rate',label:'Approved Interest Rate (%) — if supplied',type:'number',placeholder:'Leave blank until Landshop confirms a rate'},{key:'estate_pro',label:'EstatePro / Construction Credit Request',type:'checkbox'}
]};
const mortgage:Step={name:'Mortgage Qualification',fields:[
 {key:'mailing_address',label:'Mailing Address (if different)',type:'textarea',placeholder:'Leave blank if same as residential address'},
 {key:'years_until_retirement',label:'Years Until Retirement',type:'number',placeholder:'e.g., 20'},
 {key:'employer_name',label:'Employer / Business Name',placeholder:'e.g., Company or business name'},
 {key:'work_designation',label:'Position at Work',placeholder:'e.g., Manager'},
 {key:'property_location',label:'Property Location',required:true,placeholder:'Estate, town and state'},

 {key:'property_choice',label:'Property of Choice',required:true},
 {key:'employment_status',label:'Employment / Source of Income',required:true},
 {key:'work_address',label:'Work Address'},
 {key:'annual_income',label:'Annual Primary Income (NGN)',type:'number',required:true,placeholder:'e.g., 12000000'},
 {key:'secondary_income',label:'Secondary Income (NGN)',type:'number'},
 {key:'dependents',label:'Number of Dependents',type:'number'},
 {key:'nhf_number',label:'NHF Number (optional)'},
 {key:'mortgage_bank_account',label:'Mortgage Bank Account Number (optional)'},
 {key:'mortgage_amount',label:'Mortgage Amount (NGN)',type:'number'},
 {key:'equity_contribution',label:'Equity Contribution (NGN)',type:'number'},
 choice('equity_plan','Equity Payment Preference',['Outright','Instalment — 2 months','Instalment — 3 months','Instalment — 4 months','Instalment — 5 months','Instalment — 6 months','Pension Funds','Other'])
]};
const inspection:Step={name:'Estate & Inspection',fields:[
 {key:'estate_name',label:'Estate Name',required:true},{key:'estate_address',label:'Estate Location / Address'},
 {key:'property_size',label:'Property Size Needed'},
 {key:'property_type',label:'Property Type'},
 {key:'inspection_date',label:'Preferred Inspection Date',type:'date'},
 choice('client_interest','Client Interest',['Acquire Land','Acquire House','Just Browsing','Profiled and Approved','Requires More Information','Not Interested']),
 choice('prospect_source','Prospect Source',['Website','Social Media','Walk-In','Customer Experience','Campaign','Realtor Referral','Employee Referral','Board Member Referral','Offline']),
 {key:'inspection_notes',label:'Additional Comments',type:'textarea'}
]};
const inspectionFeedback:Step={name:'Prospect Feedback',fields:[
 choice('prospect_feedback','Inspection Outcome',['Interested — Yet to Decide','Ready to Pay','Not Interested','Requires More Information','Will Get Back to You']),
 {key:'feedback_context',label:'Prospect Comments / Elaboration',type:'textarea',placeholder:'Describe the prospect’s feedback and questions'},
 choice('lead_source','Original Lead Source',['Website','Customer Experience','Social Media','Campaign','Walk-In','Referrer','Offline / Radio / Billboard / Event / Flyer / Word of Mouth']),
 {key:'inspection_transport',label:'Inspection Travel Preference',placeholder:'e.g., Personal vehicle or arranged transport'},
 {key:'follow_up_request',label:'Requested Next Action',type:'textarea',placeholder:'e.g., Send additional property information'}
]};
const investment:Step={name:'Investment Subscription',fields:[
 choice('investment_asset_type','Investment Property Type',['Land','House']),
 {key:'investment_option',label:'Investment Opportunity / Property of Choice',required:true,placeholder:'Enter the approved investment product'},
 {key:'investment_amount',label:'Proposed Investment (NGN)',type:'number',required:true,placeholder:'e.g., 1000000'},
 {key:'investment_quantity',label:'Bundles / Slots',type:'number',required:true,placeholder:'e.g., 1'},
 {key:'investment_duration',label:'Preferred Investment Duration (Years)',type:'number',required:true,placeholder:'e.g., 1'},
 {key:'payout_preference',label:'Preferred Payout Schedule',placeholder:'Subject to the investment agreement'},
 {key:'beneficiary_bank_name',label:'Bank Name',placeholder:'Your verified personal bank'},
 {key:'beneficiary_account_name',label:'Bank Account Name',placeholder:'Name must match verified identity'},
 {key:'beneficiary_account_number',label:'Bank Account Number',placeholder:'Enter your account number'}
]};
const reviewStep:Step={name:'Review & Submit',fields:[]};
export const formDefinitions:Record<string,{title:string;brand:string;steps:Step[];kind:string}>={
 'develop-land':{title:'LAND SUBSCRIPTION APPLICATION',brand:'Develop',kind:'develop_land',steps:[developPersonalStep,developLandChoice,payment,kin,referral,upload,declaration,reviewStep]},
 'develop-house':{title:'HOUSE SUBSCRIPTION APPLICATION',brand:'Develop',kind:'develop_house',steps:[developPersonalStep,developHouseChoice,payment,kin,referral,upload,declaration,reviewStep]},
 'beta-mortgage':{title:'BETA MORTGAGE PRE-QUALIFICATION',brand:'Beta Mortgage',kind:'beta_mortgage',steps:[personalStep,mortgage,kin,referral,upload,declaration,reviewStep]},
 'mortgage-xtra':{title:'MORTGAGE XTRA PRE-QUALIFICATION',brand:'Mortgage Xtra',kind:'mortgage_xtra',steps:[personalStep,mortgage,kin,referral,upload,declaration,reviewStep]},
 'develop-inspection':{title:'PROSPECT DEVELOP INSPECTION',brand:'Develop',kind:'inspection',steps:[inspection,{name:'Client Details',fields:sharedPersonal.slice(0,7)},inspectionFeedback,referral,declaration,reviewStep]},
 'mortgage-xtra-inspection':{title:'PROSPECT MORTGAGE XTRA INSPECTION',brand:'Mortgage Xtra',kind:'inspection',steps:[inspection,{name:'Client Details',fields:sharedPersonal.slice(0,7)},inspectionFeedback,referral,declaration,reviewStep]},
 'incubate-investment':{title:'INCUBATE INVESTMENT SUBSCRIPTION',brand:'Incubate',kind:'incubate',steps:[personalStep,investment,kin,referral,upload,declaration,reviewStep]}
};
