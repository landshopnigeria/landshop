# Landshop Enterprise Platform

Production infrastructure: Namecheap Node.js runtimes for `landshopnigeria.com`, `portal.landshopnigeria.com`, and `app.landshopnigeria.com`. Database/Auth: Supabase project `iwkfagzkogzidrbbezds`.

## Architecture
- Next.js + TypeScript for website, portal and app
- NestJS enterprise API, Python FastAPI document processing
- PostgreSQL/PostGIS with RLS, private KYC storage
- React Native mobile client (planned)
- Temporal workflow orchestration and Postmark notifications (planned)
- GitHub Actions verified read-only SSH access to Namecheap

## Deployment safety
**Do not deploy this repository to production yet.** The existing Node.js processes are placeholder servers; no application build has passed CI. The next releases require complete session handoff, RLS review, working backups, verified SMTP/SMS, and deployment health tests.

Development files and individual deck photographs are available as the accompanying Landshop Production Foundation source package. Nothing in this repo grants public property uploads or unrestricted admin signup.

## Brand rules
Keep **Landshop**, never 'Landshop Group'. Product order: Develop → Incubate → Grow. Header: Home, Product, Company, Services, Properties, Insights / Blog, Contact Us. Authentication: portal domain only. Property publishing: Landshop authorized staff only. Historical mortgage rates and returns are not authorized current financial offers.
