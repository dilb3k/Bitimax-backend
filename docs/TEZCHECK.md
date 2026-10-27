# TezCheck payments

Contract source: merchant documentation supplied by the user, 2026-10-27.
Orbit did not return TezCheck. Postman owner mock discovery requires login;
the local mock will model the supplied contract. No live credentials are committed.

## Intended contract

- Backend only: Bearer API key + X-Cash-Desk-Code. Sign each request with
  HMAC-SHA256 of timestamp.METHOD.path+query.sha256(exact body bytes).
- POST /bills: amount_minor is price in UZS multiplied by 100, title,
  external_reference = local transaction ID. Persist the exact request before
  sending, use the same Idempotency-Key on recovery, and save payment_url.
  Never retry bill creation beyond the provider's 24-hour idempotency window.
- POST /bills/{bill}: only paid=true AND payment.state=succeeded AND live
  environment may fund escrow. Verify reference, bill ID, amount and currency.
  Unknown/processing results keep the reservation. Test payments never fund escrow.
- POST /bills/{bill}/cancel: cancel unpaid expired orders remotely before releasing
  local stock; re-read after cancellation to catch payment races.
- POST /api/tezcheck/webhook: raw JSON, signature v1=HMAC-SHA256(secret,
  timestamp.delivery_id.raw_body), 300s tolerance, accept any matching v1 during
  rotation. Deduplicate by BODY id. Persist the event, then reconcile by querying
  the provider. Acknowledgement means durable receipt, not payment confirmation.
- Existing purchase and owned transaction-status responses add paymentProvider,
  paymentUrl and paymentAmount. SMS behavior remains when PAYMENT_PROVIDER=sms.
- Escrow keeps the full order amount. Provider fee is borne by the platform;
  exact amount_minor, fee_minor and net_minor are retained for reconciliation.
  The existing whole-so'm ledger records gross escrow, not provider settlement;
  do not treat its external bank account as a net TezCheck bank statement.
- Provider refunds/disputes/chargebacks require operator review; freeze a holding
  escrow on receipt. Existing refunds still credit the internal balance, and
  payouts follow the existing payout process (no provider refund/payout API added).

## Setup (after local verification)

Set backend environment variables:

```
PAYMENT_PROVIDER=tezcheck
TEZCHECK_API_KEY=<full aps_ key, not the masked display>
TEZCHECK_CASH_DESK_CODE=<cdk_ code>
TEZCHECK_WEBHOOK_SECRET=<wbs_ secret from webhook registration>
TEZCHECK_BASE_URL=https://api.tezcheck.uz/api/merchant/v1
TEZCHECK_PROVIDER_CODES=click,payme
```

Register https://<backend-domain>/api/tezcheck/webhook in the TezCheck cabinet.
Replace example.com; it is not a working receiver. Enable JOBS_ENABLED on one
backend instance for durable recovery and periodic reconciliation. MongoDB must
support transactions (replica set). GET /me verifies key/desk pairing before launch.
No real keys, provider registration, deploy or live money movement is part of local verification.

## Local checks

`cd backend && npm run typecheck && npm test`

For full HTTP + database checks, start the Postman simulation and local MongoDB
replica set described in `postman/simulations/tezcheck/tezcheck.context.md`, then
run `npm run test:tezcheck` in backend. Frontend: `./node_modules/.bin/tsc --noEmit` from web/.

Operational review rows: Transaction.paymentReview and TezcheckEvent.review.
Test payments intentionally leave an order reserved for review; they never
release credentials or credit real balance. Creation failures retry the same
persisted body and idempotency key. After 23 hours without recovering the bill,
stop automatic creation and require operator reconciliation to avoid duplicates.
A TezCheck outage may extend the displayed payment window until cancellation is
confirmed. Buyer notifications retry until Telegram accepts them; a crash between
send and acknowledgement can repeat a message, but cannot repeat money movement.
