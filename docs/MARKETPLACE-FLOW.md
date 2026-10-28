# Marketplace flow — 2026-10-28

## Seller

The bot resolves/registers the Telegram user before all scene handlers, including people who have not sent `/start`. “Akkaunt sotish” opens the listing wizard directly. Account information and optional photos are followed by a payout card and the cardholder's full name. The card is encrypted immediately in the wizard draft; the original card message is deleted when Telegram permits it. The final review shows only a masked number and the holder.

Confirmation stores the payout destination on the seller profile and publishes the listing as `active`. Public listings from the website use the same immediate-publication service. A stable draft ObjectId prevents concurrent retries of the bot confirmation from creating duplicate listings. The payout destination is a seller-profile setting, not a separate per-listing bank account; settlement still credits the wallet and existing withdrawal rules remain unchanged.

“My listings” is paged in groups of ten and opens an owner-only detail with a cancellation confirmation. Both public listings and private deals can be cancelled while active, draft, rejected or pending review. The atomic update matches owner and status; reserved, sold and disputed listings cannot be cancelled. Cancelled private codes are invalidated. Public IDs remain allocated and are never recycled.

## Listing identifiers

`listingCode` is an additional immutable six-character field; existing Mongo ObjectIds and links remain valid. An atomic Mongo counter allocates 100000…999999, then A00000…AZZZZZ, B00000…ZZZZZZ. Numeric gaps can occur on aborted writes; codes are never reused. A sparse unique index enforces uniqueness. Startup backfills legacy records, without changing their prices, status or credentials; concurrent startups are safe.

Public product responses, seller listing responses, and successful `POST /api/me/listings` responses include `listingCode`. `GET /api/products?search=100000` or `search=%23100000` matches the code inside the existing public/active filter. Alphabetic-only IDs can be searched with `#` to distinguish them from ordinary words. Private codes remain the existing eight-character deal codes and do not become public through short-ID lookup.

## Buyer

“Akkaunt sotib olish” sends one message with a website catalog link, up to ten title/price buttons, and previous/next controls. Pagination edits the same message. Telegram buttons have a plain text label, so title and price are separated by `·`; independently styled title/price rows are not available.

Selecting a listing opens details and purchase controls. Sold/reserved records can be viewed but have no purchase button. Long descriptions have a full-description button; photos are available through the web listing link. Detail back-navigation preserves the catalog page.

Outside a form, sending a numeric or mixed six-character ID opens public details. `/id 100000` or `#100000` works from a form, clears the draft and opens the listing. Bare numeric input within a form remains the price/password being entered. `/id` also accepts alphabetic-only codes, avoiding collisions with menu labels such as “Balans”. Archived and private listings cannot be resolved through this lookup, even by database ObjectId.

## Website

The marketplace uses compact product cards, a single restrained font family, visible prices/IDs and clear category/search controls. `/katalog` is the dedicated Telegram entry point. `/shartlar` holds payment/refund explanations; the home page prioritizes the catalog. Seller listings display copyable IDs and public/private cancellation controls with confirmation.

The frontend origin is `https://web-three-eosin-46.vercel.app`. The Render blueprint and local/example `SITE_URL` point there. Existing deployments must apply that setting; Vercel `NEXT_PUBLIC_SITE_URL` should match. No live deploy is performed by this code change.

## Validation

- `cd backend && npm test`: ID boundaries, normalization, keyboard shape, form/menu routing, and existing payment/refund tests.
- Start a disposable local Mongo on port 27920, then `npm run test:marketplace`: concurrent unique IDs, legacy backfill, real HTTP code search/cancellation, public/private visibility, pagination, and seller wizard through encrypted card capture and final publication. Only a generated `marketplace_test_*` database is created/dropped. Telegram responses are captured locally; no real notifications or payment-provider calls are made.
- Backend typecheck and web production build.
- No connected browser is available in this session; live Telegram rendering and visual browser review remain unverified.
