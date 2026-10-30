# Landshop V24 — Workforce and Global Command Center

**Private workforce portal:** https://app.landshopnigeria.com/staff/sign-up → https://app.landshopnigeria.com/staff/sign-in → https://app.landshopnigeria.com/staff

**Owner and leadership:** https://app.landshopnigeria.com/admin → https://app.landshopnigeria.com/admin/workforce

## Role and access model
- Owner: separately authorized bootstrap with verified email and production allowlist, direct Command Center access; does not self-approve new identity records.
- CEO, Founder, Admin, Technology Officer, Technology Consultant: management-approved employment and photo KYC required. Only the owner can approve these privileged roles. They receive the Command Center and operational management access.
- HR Officer (HRO), Head of Finance, Customer Service Manager, Social Media Manager, Department Manager, Operations, Marketing, Sales, Legal, Youth Corps, Intern, Staff: individual work dashboards. No Command Center access merely from choosing a title.
- Management must manually approve a submitted portrait/identity before issuing staff ID `LS-XXXXXXXXXXXX`. Staff registration never grants permissions by itself.
- Passwords are handled by Supabase Auth only; never stored in workforce tables.

## Attendance
- Each clock-in and clock-out invokes fresh, **explicit browser geolocation permission**. Record server timestamp, latitude/longitude, device accuracy, place label and Google Maps link, with staff and authorized manager access only.
- Only office locations manually registered and verified by management produce a label like `Landshop Office`. Unknown coordinate pairs are not falsely described as street addresses.
- GPS coordinates can be spoofed. No background location surveillance, and legitimate disputes require management investigation.
- High-risk staff data, including location history, photo and demographics, must be governed by a documented privacy and retention policy.

## Tasks, work journals and scorecards
- Manager assigns documented task title, instructions, expected minutes, deadline and delay allowance.
- Staff opening the task records first-view; start and pause record work intervals; completion logs a timestamp and narrative; managers independently score on documented criteria or return for rework.
- Staff can file daily activity and blocker reports.
- Daily, weekly, monthly, annual performance is a weighted average of accepted human-scored work, with tracked and planned time reported separately.
- Below 70%: coaching/payroll **review flag only**; at 100% with at least 5 rated tasks: promotion **consideration only**. No automatic salary deduction, termination or promotion.
- Annual ranking must account for leave, task difficulty, different workloads and accommodations; unscored tasks are not silently treated as zero.
- All management writes use role checks and audit records. Sensitive archives/withdrawals are soft operations, not unlogged hard deletes.

## Production operations
- Production only: https://www.landshopnigeria.com, https://portal.landshopnigeria.com and https://app.landshopnigeria.com.
- Namecheap release workflow must pass build, backup, HTML/CSS asset and domain-parity checks. Do not claim production success from a passing CI validation alone.
- No user account was invented or granted owner access. The initial owner must be authorized through the protected workflow `.github/workflows/activate-verified-owner.yml`.
- Photo verification is **manual**. This release does not claim automated face match, government ID verification, payroll integrations, background GPS collection, or successful authenticated end-to-end tests without a real approved test account.
