/** Owner-supplied documentary photography for Landshop marketing.
 * These are archival photos, not live property availability or verified unit galleries.
 * Supplied imagery is used without fake renderings or invented locations.
 */
export type EditorialPhoto={src:string;alt:string;credit:string;source:string};
export const editorialImages={
 develop:{src:'/owner/2026/product-develop.webp',alt:"Aerial photograph of a land development and surrounding waterway in Nigeria",credit:'Landshop owner-provided imagery',source:'Uploaded by Landshop for site editorial use; specific location and current availability require verification'},
 incubate:{src:'/owner/2026/product-incubate.webp',alt:"Real estate entrance and completed buildings photographed in Nigeria",credit:'Landshop owner-provided imagery',source:'Uploaded by Landshop for site editorial use; specific location and current availability require verification'},
 grow:{src:'/owner/2026/product-grow.webp',alt:"Person standing outside a completed Nigerian residence",credit:'Landshop owner-provided imagery',source:'Uploaded by Landshop for site editorial use; specific location and current availability require verification'},
 team:{src:'/owner/2026/garden-site-team.webp',alt:"Landshop-branded staff member and construction crew in an archival site photograph",credit:'Landshop owner-provided imagery',source:'Uploaded by Landshop for site editorial use; specific location and current availability require verification'},
 portrait:{src:'/owner/2026/garden-field-update.webp',alt:"Landshop staff member documenting a Nigerian estate construction site",credit:'Landshop owner-provided imagery',source:'Uploaded by Landshop for site editorial use; specific location and current availability require verification'},
 planning:{src:'/owner/2026/site-client-inspection.webp',alt:"Visitors discussing a Nigerian property outside a completed building",credit:'Landshop owner-provided imagery',source:'Uploaded by Landshop for site editorial use; specific location and current availability require verification'},
 residential:{src:'/owner/2026/estate-residential.webp',alt:"Completed residential townhouses photographed in a Nigerian estate",credit:'Landshop owner-provided imagery',source:'Uploaded by Landshop for site editorial use; specific location and current availability require verification'},
 architecture:{src:'/owner/2026/estate-architecture.webp',alt:"Contemporary townhouse façades from the owner-supplied Nigerian property archive",credit:'Landshop owner-provided imagery',source:'Uploaded by Landshop for site editorial use; specific location and current availability require verification'},
 officeTower:{src:'/owner/2026/famous-building-progress.webp',alt:"Residential project building photographed during construction, not an office tower",credit:'Landshop owner-provided imagery',source:'Uploaded by Landshop for site editorial use; specific location and current availability require verification'},
 skyline:{src:'/owner/2026/slider-02.webp',alt:"Aerial view of estate access roads and waterway in a Nigerian property development",credit:'Landshop owner-provided imagery',source:'Uploaded by Landshop for site editorial use; specific location and current availability require verification'},
} as const satisfies Record<string,EditorialPhoto>;
