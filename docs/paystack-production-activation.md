# Landshop Paystack production activation

The code includes a read-only customer payment-history RPC and a server-side Paystack webhook endpoint.

## Production URL
`https://portal.landshopnigeria.com/api/payments/paystack/webhook`

## Private environment values on the PORTAL Node application only
- `PAYSTACK_SECRET_KEY`: Paystack private secret key for the intended environment.
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase server-only service-role key for the Landshop project.
- `NEXT_PUBLIC_SUPABASE_URL`: existing project URL, not a secret.

Never add these secrets to Git, browser bundles, customer-facing forms, or ticket attachments. The webhook responds with HTTP 503 if the server secrets are not configured. `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is not an acceptable substitute for `SUPABASE_SERVICE_ROLE_KEY`.

## Security and reconciliation behavior
- Verify raw HTTP body using `x-paystack-signature` (HMAC SHA512).
- Accept only `charge.success`; other valid Paystack event types are acknowledged but ignored.
- Independently request `GET https://api.paystack.co/transaction/verify/:reference`.
- Confirm successful status, exact reference, integer kobo amount, NGN currency, numeric transaction ID, and Paystack live/test environment.
- Perform matching and idempotent transaction recording through the service-only `landshop_reconcile_gateway_payment` database RPC. Unknown references and mismatched amounts fail closed and return an error for investigation. Do not create entitlements from client redirects.
- No raw payment payloads or Paystack private keys are stored in the gateway events table.

## Not yet active
- Checkout initialization: intentionally not enabled until approved server-controlled product prices and payment purposes have been set up. Never accept a client-supplied price as authoritative.
- Subscriptions: no plans, renewals or entitlements can be activated by this webhook alone.
- Refund/reversal processing: requires a separate authenticated, reconciled workflow.
- Real transaction smoke tests and reconciliation to approved price catalog: pending.
- A successful CI build does not mean credentials are present or payment collection is live.

## Activation checks
1. Configure Paystack secret and Supabase service-role key securely for the production portal process.
2. Restart the cPanel Passenger app after updating secrets.
3. Configure the webhook URL in the Paystack business dashboard.
4. Confirm that missing/invalid signatures are rejected and valid test webhooks are independently verified.
5. Test duplicate delivery, wrong amount, wrong currency and unknown-reference rejection.
6. Run a genuine low-value test transaction against an authorized server-created payment intent; confirm the status is not successful until verified.
7. Review audit events and customer payment status before enabling checkout or subscription entitlements.

Paystack documentation: https://paystack.com/docs/payments/webhooks/ and https://paystack.com/docs/api/transaction/
