# Implementation and verification map

Scope: a working fictional application with server persistence. Hosted credentials, real provider verification and production operations remain deployment dependencies; they are not described as complete.

| Requested phase | Implementation | Verification |
| --- | --- | --- |
| Inspect and preserve architecture | Existing vanilla JS/CSS frontend retained; `server/analysis.js` wraps original CSV reader/comparator; no production engine found | Regression tests call original comparator and parser |
| Authentication and tenant boundary | Express sessions, localhost fictional identities, optional Supabase verified identity; PostgreSQL RLS and tenant FKs | HTTP and normal-role RLS tests; hosted configuration remains unverified |
| Drafts, review and immutable matching | Versioned canonical headline profile, private documents with facts/rows, field resolution, confirmation, run/result snapshots, idempotent save to same deal | Five-provider save; rematch/status preservation; source staleness; fresh session |
| Daily dashboard | Overview, searchable/filterable deals, provider directory, overdue follow-ups, activity; en-NZ/NZD/Auckland dates and two themes | Browser workflow and responsive review |
| Independent lender workflow | Eight statuses, structured decline reasons, notes, dates, follow-up note, assignment, shortlist; append-only events | Correct actor/previous status, independent states, no-op/retry, rollback and concurrency |
| Mandates and reports | Sourced immutable mandate versions; per-criterion compared evidence; snapshotted internal/shareable report and print stylesheet | Historical snapshots after change; cross-tenant report access; safe field whitelist |
| Multi-provider funding | Integer-cent lower-bound flow plus inclusion-set search; pins/exclusions/locks; shared and separate facilities; scenario snapshots and preferred selection | All 12 NZ$30m constraint cases and rounding/shortfalls |
| Terms, conditions and funding | Immutable indications/terms/commitments/funding and revisions; selected terms; checklist owner/date/evidence; manual closing | Stage-specific coverage tests and service validation |
| Provider intelligence | Distinct historical milestones, actual contact, defined rate denominators, industry/size groups, decline reasons, median/sample sizes | Repeat contacts, zero samples, current-deal exclusion and historical snapshots |
| Synthetic data and handover | Original CSV IDs; historical mandate reconstruction explicitly fictional; original Southern scores; older closure; NZ$30m participation catalogue; two tenants | Idempotent seed, provenance, chronological version tests; guide/API docs |

## Fixture repairs and assumptions

The existing eight providers' `min_deal_size` and `max_deal_size` remain ambiguous; the importer marks their amount scope unknown. It never converts those limits into participation sizes. The eight new package providers explicitly declare participation caps and fictitious co-lending/security assumptions. Seven can participate at up to NZ$6m each; the eighth is a NZ$30m single-provider example. The six-at-NZ$5m case is a dedicated test fixture and can also be reproduced by locking six club allocations at NZ$5m.

Historical synthetic matches predate the supplied 2026 mandate versions. The importer creates distinctly identified `-HISTORICAL` fictional versions effective in 2024 and labels them reconstructed; no claim of verified historical terms is made. Deal creation dates are moved no later than their first historical match, preserving original CSV records outside the database. The original Southern NZ$8m/EBITDA NZ$5.4m/five scores and statuses remain intact. Its CSV leverage is explicitly gross post-transaction, not compared to mandates with an unspecified leverage basis. A new fictional closed example adds explicit contact, interest, terms and closure events. Imported supporting records retain their original fields and IDs.

Source CSV files are parsed strictly. The importer does not relax column counts or silently drop broken references. All seed writes form one transaction; failure rolls back the seed. Administrative CSV imports and borrower document uploads remain distinct.

## Material limitations

- Real lender mandate verification, lender communications and production extraction/matching integrations have not been supplied. All new catalogue ordering and package assumptions are fictional.
- Hosted Supabase authentication/PostgreSQL, TLS, secrets management, roles, onboarding, private object storage, recovery, retention and load testing need configuration and production verification. The local account chooser must never be exposed publicly.
- Supported extraction is the existing borrower CSV format only. PDF/Word/Excel/OCR are not implemented.
- Search is bounded at 22 eligible edges and 65,536 inclusion sets, with explicit completeness disclosure. It does not model legal documentation or replace confirmation of intercreditor/security arrangements.
- No total borrowing-cost ranking is asserted for incomplete or incompatible terms. Received pricing is stored as sourced terms, not derived from target returns.
- This first application loads a brokerage's records for its dashboard; server pagination and retention operations need scale testing before large portfolios.

The test command is `pnpm test`. Actual final results and browser observations are recorded in `VERIFICATION.md`; tests are not considered passed merely because they exist.
