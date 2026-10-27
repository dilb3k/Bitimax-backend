# Bitmax web experience

The website and Telegram bot share the same payment, escrow and ledger services. The project directory stays `Bitimax`; the product label is `Bitmax` and the Telegram account remains `bitimax_bot`.

## User journeys

- Catalog → product → deliberate reservation → payment → order → reveal → final confirmation or refund.
- Private deal → share code → code lookup → same payment/order flow.
- Telegram pairing → return to the original internal page, including seller forms.
- Cabinet: orders (active/history), listings/sales, wallet, account settings. Desktop sidebar and mobile bottom navigation share routes.

Product status disables unavailable purchases. Prices for TezCheck come from the base price; SMS payments retain their exact matching amount. Payment status is authoritative on the server; the client never infers success from a redirect or countdown. A timeout warns that a write may have completed and does not automatically repeat mutations.

## API additions

`GET /api/products/policy` is public, with no auth or secrets. Response fields:

| Field | Type | Meaning |
| --- | --- | --- |
| commission | number | Platform commission percent |
| paymentProvider | sms / tezcheck | Active payment flow |
| paymentWindowMinutes | number | Reservation payment window |
| autoReleaseHours | number | Review period after credential reveal |
| unrevealedGraceHours | number | Grace period before unopened orders are refunded |
| refundTiers | array | Configured tiers with id, label, withinMinutes, penaltyPercent, allowed |

The web proxy caches policy for 60 seconds. If unavailable, the interface directs users to authoritative order terms instead of inventing fallback percentages.

`GET /api/me/orders` pending entries additionally return `paymentAmount`, `paymentProvider`, and boolean `paymentReview`. Existing fields remain compatible. No changes to settlement arithmetic.

Logout reports failure when the backend cannot revoke sessions; it no longer silently claims all devices were signed out.

## Validation

- Backend `npm test`: refund arithmetic, TezCheck signatures/settlement checks, credentials, SMS matching and sessions.
- Web `npm test`: internal redirect preservation and malicious URL rejection.
- Backend `npm run test:web`: real API routes + Next proxy, local disposable `web_test_*` database only. Run local Mongo on 27919 with replica set `tezchecktest`, and Next dev on 3000 with `BACKEND_URL=http://localhost:3001`. The test starts API port3001; no Telegram bot or external payment provider starts. Fixtures are removed in finally.
- Public policy contract: `postman request https://bitimax-bot.onrender.com/api/products/policy --script-post-request @postman/tests/public-policy.js`.
- Production build checks all routes and TypeScript.

Browser visual verification requires a connected browser; HTTP tests do not establish visual correctness. Provider test payment and real money payment are separate from local regression coverage.
