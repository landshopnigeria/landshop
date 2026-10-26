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
const personalStep:Step={name:'Applicant Information',fields:sharedPersonal};
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
 {key:'passport_photo',label:'Passport Photograph',type:'file'},
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
const payment:Step={name:'Payment Preference',fields:[
 {key:'property_amount',label:'Property Amount (NGN)',type:'number'},
 choice('payment_mode','Payment Option',['Outright','Instalment','Mortgage']),
 {key:'payment_plan',label:'Preferred Payment Plan'},{key:'estate_pro',label:'EstatePro / Construction Credit Request',type:'checkbox'}
]};
const mortgage:Step={name:'Mortgage Qualification',fields:[
 {key:'property_choice',label:'Property of Choice',required:true},
 {key:'employment_status',label:'Employment / Source of Income',required:true},
 {key:'work_address',label:'Work Address'},
 {key:'annual_income',label:'Annual Primary Income (NGN)',type:'number'},
 {key:'secondary_income',label:'Secondary Income (NGN)',type:'number'},
 {key:'dependents',label:'Number of Dependents',type:'number'},
 {key:'nhf_number',label:'NHF Number (optional)'},
 {key:'mortgage_bank_account',label:'Mortgage Bank Account Number (optional)'},
 {key:'mortgage_amount',label:'Mortgage Amount (NGN)',type:'number'},
 {key:'equity_contribution',label:'Equity Contribution (NGN)',type:'number'},
 choice('equity_plan','Equity Payment Preference',['Outright','Instalment','Pension Funds','Other'])
]};
const inspection:Step={name:'Inspection Details',fields:[
 {key:'estate_name',label:'Estate Name',required:true},{key:'estate_address',label:'Estate Location / Address'},
 {key:'property_size',label:'Property Size Needed'},
 {key:'property_type',label:'Property Type'},
 {key:'inspection_date',label:'Preferred Inspection Date',type:'date'},
 choice('client_interest','Client Interest',['Acquire Land','Acquire House','Just Browsing','Profiled and Approved','Requires More Information','Not Interested']),
 choice('prospect_source','Prospect Source',['Website','Social Media','Walk-In','Customer Experience','Campaign','Realtor Referral','Employee Referral','Board Member Referral','Offline']),
 {key:'inspection_notes',label:'Additional Comments',type:'textarea'}
]};
const reviewStep:Step={name:'Review & Submit',fields:[]};
export const formDefinitions:Record<string,{title:string;brand:string;steps:Step[];kind:string}>={
 'develop-land':{title:'LAND APPLICATION FORM',brand:'Develop',kind:'develop_land',steps:[personalStep,productChoice,payment,kin,referral,upload,declaration,reviewStep]},
 'develop-house':{title:'HOUSE APPLICATION FORM',brand:'Develop',kind:'develop_house',steps:[personalStep,productChoice,payment,kin,referral,upload,declaration,reviewStep]},
 'beta-mortgage':{title:'PRE-QUALIFICATION APPLICATION FORM',brand:'Beta Mortgage',kind:'beta_mortgage',steps:[personalStep,mortgage,kin,referral,upload,declaration,reviewStep]},
 'mortgage-xtra':{title:'PRE-QUALIFICATION APPLICATION FORM',brand:'Mortgage Xtra',kind:'mortgage_xtra',steps:[personalStep,mortgage,kin,referral,upload,declaration,reviewStep]},
 'develop-inspection':{title:'PROSPECT (DEVELOP) INSPECTION FORM',brand:'Develop',kind:'inspection',steps:[inspection,{name:'Client Details',fields:sharedPersonal.slice(0,7)},referral,declaration,reviewStep]},
 'mortgage-xtra-inspection':{title:'PROSPECT (MORTGAGE XTRA) INSPECTION FORM',brand:'Mortgage Xtra',kind:'inspection',steps:[inspection,{name:'Client Details',fields:sharedPersonal.slice(0,7)},referral,declaration,reviewStep]},
 'incubate-investment':{title:'PROPERTY INVESTMENT APPLICATION FORM',brand:'Incubate',kind:'incubate',steps:[personalStep,productChoice,payment,kin,referral,upload,declaration,reviewStep]}
};
