# Verification

Verified on 26 September 2026 against the local synthetic demonstration application.

- `node --test --test-concurrency=1 tests/*.test.js` — **41 passed, 0 failed**.
- The suite covers package arithmetic and limits, the original parser/comparator, five-provider deal persistence, event history, follow-ups, profile/matching snapshots, PDF content and authorised PDF download, provider history, and organisation isolation through API and row-level policies.
- Browser review at 1280×720 and 390×844 showed no page-level horizontal overflow. The NZ$30m funding screen displayed a single-provider option and the five-participant NZ$30m option. The provider explanation showed its recorded mandate evidence and brokerage history; it did not invent a numeric score where none was stored.
- The example provider report in `output/pdf/provider-explanation-example.pdf` was downloaded from the app's authenticated report route, checked as a two-page A4 PDF, and visually rendered for review.
- The original prototype and existing matching comparator still load through the documented adapter. The implementation adds an additive deterministic criteria catalogue and funding solver; it does not represent fictional catalogue data as verified lender appetite or an offer.

The browser and database used here are local development fixtures. Supabase credentials, a production PostgreSQL service, production deployment, and verified real lender mandates were not supplied, so those production integrations remain unverified. The demo account picker must not be exposed publicly.
