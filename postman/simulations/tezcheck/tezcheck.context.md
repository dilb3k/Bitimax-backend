# TezCheck local verification

Contract: docs/TEZCHECK.md, based on user-supplied merchant documentation (2026-10-27).
The provider was absent from Orbit results; owner mock search was unavailable
without a Postman login. The local mock is ours, not provider-certified.

Start the dependency from repository root:

```
postman simulation run postman/simulations/tezcheck/tezcheck.sim.yaml --port 4919 --output ndjson
```

Start an isolated MongoDB replica set on 127.0.0.1:27919 named tezchecktest,
then run `npm run test:tezcheck` from backend/. The test creates and deletes
only its own timestamp-named database. It overrides payment credentials and
bot settings with local fixtures; it never calls TezCheck or Telegram.

The mock reads raw request bytes to verify signatures. Its path includes the
simulation's /tezcheck prefix when verifying HMAC. Do not deploy this fixture:
/__control, /__failure, /__html and /__hang are test-only routes.

Verified 2026-10-27: real HTTP requests observed in simulation logs; bill creation,
lookup and cancellation; raw webhook authentication and body-ID deduplication;
MongoDB escrow/ledger settlement and concurrent confirmation;
lost creation-response recovery with the same idempotency key; rejection of test/mismatched payments;
unknown payment preserving reservation; chargeback holding-escrow freeze;
JSON/HTML errors, unreachable dependency and 15-second client timeout.

Remaining live verification: GET /me with the merchant's key and cash desk,
provider-issued payment URL, actual webhook delivery, and real Click/Payme checkout.
No live payment or deployment was performed.
