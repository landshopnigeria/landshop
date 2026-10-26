# Landshop production release gates

The user selected **direct production** deployment (no staging subdomain). All release safeguards still apply.

## Technical
- [ ] CI Next.js website, portal and dashboard builds pass.
- [ ] Dependency vulnerability scan, TypeScript and accessibility checks pass.
- [ ] Source media extracted individually from product deck, checked for text overlays and approved usage.
- [ ] Backup current Namecheap main website and verify restore.
- [ ] Atomic deployment with health checks and rollback.
- [ ] Test all three domain routes and HTTPS headers.

## Supabase
- [ ] Authorized operator reviews and applies migrations 0001/0002.
- [ ] RLS tests confirm public users cannot create/modify property listings.
- [ ] Cross-subdomain SSR cookie behavior and logout tested.
- [ ] Google OAuth, email signup confirmation and recovery callback tested.
- [ ] A logged-in user cannot change KYC status or role to administrator.
- [ ] Company membership isolation tests performed.
- [ ] Referral upline cycle/duplicate/concurrent registration tests pass.

## Communications
- [ ] Approved SMTP, DKIM, SPF and DMARC operational.
- [ ] Branded signup confirmation received in a real mailbox.
- [ ] Password reset email received and reset flow works.
- [ ] WhatsApp/SMS provider approved and OTP tests show successful delivery receipts.
- [ ] Operational notifications delivered to support@landshopnigeria.com.
- [ ] Consent/opt-out/bounce handling verified for marketing campaigns.

No production completion claim is permissible until specific tests pass.
