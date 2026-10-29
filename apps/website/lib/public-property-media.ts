/**
 * Verified public listing photo gate.
 * Map only actual owner/developer photographs to the exact published property UUID.
 * Original files, title documents, and KYC evidence remain in private storage.
 *
 * The manifest is intentionally empty until individual photo-to-property identity,
 * publication rights and reviewer approval have been confirmed. Never use estate
 * archive or editorial images here as a generic fallback.
 */
const approvedByProperty: Readonly<Record<string, readonly string[]>> = {
  // "<published-property-uuid>": ["/media/verified-properties/<same-uuid>/front.webp"]
};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function getApprovedPublicPropertyImages(propertyId:string):readonly string[]{
  if(!uuid.test(propertyId))return [];
  const expected='/media/verified-properties/'+propertyId.toLowerCase()+'/';
  return (approvedByProperty[propertyId.toLowerCase()]||[]).filter(path=>
    path.startsWith(expected)&&/\.(?:webp|avif|jpe?g|png)$/.test(path)&&!path.includes('..')
  );
}
