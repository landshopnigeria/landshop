/** The main website layout owns the single global V24 newsletter and footer.
 * Do not render duplicates in marketplace routes.
 * Header remains the unchanged SiteHeader from the website root layout.
 */
export function MarketHeader(){return null}
export function MarketFooter({includeUpdates:_includeUpdates=true}:{includeUpdates?:boolean}={}){return null}
