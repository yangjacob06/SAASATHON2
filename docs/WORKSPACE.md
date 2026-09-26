# Mandate persistent workspace

This additive application retains the static HTML/CSS/JavaScript prototype. It adds an Express API, PostgreSQL migrations, a durable local PGlite database, authenticated organisation context, and a vanilla JavaScript adviser workspace. The public `/prototype/index.html` remains the original fictional demonstration. The private workspace is `/`.

## Run locally

Install Node.js 22+ and pnpm, then from the repository root:

```sh
pnpm install --frozen-lockfile
cp .env.example .env
pnpm migrate
pnpm seed
pnpm start
```

Open `http://127.0.0.1:4310`. Select Alex or Jordan for Jasper Finance. Casey belongs to a separate example brokerage. Seeds are explicit, repeatable and disabled in production/Supabase mode. `pnpm start` also applies pending migrations. Never run two application processes against the same local PGlite directory. Use PostgreSQL for multiple server processes.

```sh
pnpm test
```

The test suite uses temporary/in-memory databases and a loopback HTTP server on port 4311. It does not reset the saved workspace. On macOS local records default to `~/Library/Application Support/Mandate/development-data`; other platforms use `.data/mandate`. `DATA_DIR` overrides this. Keep database and dependencies outside iCloud/OneDrive-synced folders. Closing a tab, signing out or restarting the server retains them. Theme preference is the only workspace value stored in localStorage.

## Delivery boundary

The working local mode is a **fictional demonstration**, not a secure environment for real borrower files: the broker picker intentionally lets the person at this computer impersonate any fictional account. It creates server-side sessions and exercises tenant policies, but is not credential authentication. It binds only to loopback and is prohibited when `NODE_ENV=production`.

Hosted configuration uses maintained Supabase Auth email/password verification, a private HTTP-only secure cookie and server-resolved user membership. Set `AUTH_MODE=supabase`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `DATABASE_URL`, `APP_ORIGIN` and `NODE_ENV=production`. Create organisations and users through trusted administration and set `users.auth_id` to the corresponding Supabase user UUID. There is deliberately no public self-assignment of organisation membership. Session expiry requires sign-in again; refresh-token storage and onboarding are future operational work.

No hosted Supabase project, identity accounts, production database, TLS endpoint, backups or deployment credentials were supplied. Those integrations require deployment validation before real data. Do not expose the local broker picker publicly. Uploaded supported CSVs are private database records, downloaded only through authorised API routes. Other document formats and hosted object storage are not implemented. No lender is contacted automatically.

## Partner integration

`MODEL/prototype/deal-analysis.js` and its three illustrative lender definitions remain the original comparator. `server/analysis.js` loads it without changing its rules and preserves its summary/comparisons in each run. `document-upload-ui.js` exposes its existing `parseCsv`, `convertRow` and `addUploadedDocument` through `window.MandateCSV`; `MandateParserOnly` suppresses DOM wiring on the server. The original browser journey still runs.

The additive deterministic catalogue adapter compares confirmed profiles against imported mandate versions. It produces **no numeric match scores**. Ordering is ascending failed recorded restrictions, then unresolved checks, then provider name. All eight original reference providers and eight explicit fictional package providers are available. Historical hand-authored percentages retain their source label. Replace the adapter boundary with the partner's verified production engine when it exists; preserve result IDs, engine version, scales, reasons, input and mandate snapshots. The earlier `/api/v1/deals/analyze` document is a draft, not an implemented endpoint.

Unknown fields stay unknown. Supporting financial periods and wider borrower information are imported as typed-category source records linked to each deal; the reviewed headline fields remain versioned. Only the supported borrower CSV schema is extracted. The reference-table importer is administrative and must not be passed to the borrower upload endpoint.

## Data and transactions

`001_workspace.sql` creates organisations, users, sessions, providers, immutable mandate versions, deals, profile versions, private documents, matching runs/results, deal/provider relationships, append-only events/notes, package snapshots/allocations, indications/terms/commitments/funding, checklist tasks, report snapshots, source records and idempotency records. `002_integrity_and_preferences.sql` adds tenant-qualified history references, selected proposals/terms, revision integrity and immutable run evidence. Flexible profile/facility/term attributes and allocations use JSONB; exact allocation and funding amounts use integer cents.

Every tenant query runs inside a transaction with `SET LOCAL ROLE mandate_app` and organisation context resolved from the authenticated user. RLS is applied to the normal application role. The runtime role has no delete grants, and immutable history tables also reject update/delete through triggers. Status plus event, document plus profile, and matching-result saves are atomic. Deal and provider versions reject stale edits. Every POST mutation accepts an `Idempotency-Key`; a repeated identical request returns its saved result, and reusing a key for different content is rejected.

The server's database connection must have permission to set the application role and to manage sessions. Its credentials never reach the browser. Use a separate migration/admin account and narrowly granted connection role in deployment; do not expose SQL or the database port to clients. PostgreSQL backup, restore, encrypted storage, retention and incident procedures must be established and tested before production. Back up the stopped local data directory; verify restoration to a separate directory. Do not copy a live single-process database as a production backup strategy.

## Funding search

The deterministic solver enumerates provider/facility inclusion sets and uses integer-cent flow with lower bounds. It enforces whole-transaction restrictions, facility restrictions where meaning is explicitly recorded, participation minimums/maximums, provider-wide caps, shared capital pools, compatible uses/types/security, documented exclusivity and co-lending restrictions, currency and provided timing/geography constraints. It does not turn a small participation into a fictional smaller borrower request.

Unknown hold limits exclude a provider from package arithmetic. Unknown/stale available capital can support an explicitly exploratory proposal when hold limits exist; it never means committed funds. Capacity is fresh for 90 days, dated no later than the search. Security sharing and arranger/agent/trustee appointments remain open checks unless explicitly documented. Accepting “GSA” alone does not demonstrate intercreditor compatibility. Cost is not ranked without comparable transaction-specific terms.

At most 22 eligible provider/facility edges and 65,536 inclusion sets are assessed. Search results disclose whether exhaustive. Larger searches are bounded and do not prove infeasibility. Returned options favour fewer unresolved checks then fewer lenders, using stable tie-breaking; they are not “best in market” or approval forecasts. Three distinct alternatives are shown when available. No five-lender cap exists.

A cash-at-close request uses explicit facility draw amounts, less debt payoffs and fees, checked against requested net cash. Proposed facility limits are still solved independently. A revolver limit is never automatically closing cash. Indicated, conditional, committed and funded measures are displayed separately. Arranger roles add no money to coverage. Record each actual economic participation once; revise its evidence rather than add a duplicate commitment. Multiple funding tranches remain separate received amounts capped by the facility limit.

## Brokerage history

Counts use distinct deal/provider relationships and explicit recorded milestones, including legacy CONTACTED transitions. Repeated runs and contacts do not inflate counts. Terms do not imply an unrecorded interest or contact. Interest/decline rates divide outcomes among contacted relationships by contacted relationships; both milestones may exist, so percentages need not sum to 100%. Median response uses the first recorded contact and first subsequent interest/decline, and includes the sample size. Industry/size use original historical profile snapshots. Reports discussing previous deals exclude the current transaction. Empty samples display “Not enough data.”

## Suggested walkthrough

1. Open Southern Manufacturing Acquisition: verify NZ$8m, EBITDA NZ$5.4m and five independently tracked providers with original example scores.
2. Create a draft and upload the five Kowhai borrower CSVs from Documents & review. Review competing values by file and row, confirm the profile, compare and save matches. Reload the page: the same deal and activity remain.
3. Change a provider status. For Declined, optionally select the reason and add a note; leaving the reason blank is supported. Schedule a follow-up, then visit Notes & history and Follow-ups.
4. Open Aotearoa Manufacturing Acquisition (NZ$30m), compare and save. In Funding & terms search all options for a single-provider proposal and club alternatives. Select the multi-provider preference for club-only options; pins, exclusions and locked amounts are available. Six lenders are supported.
5. Select a preferred proposal with a reason. Record actual terms, then separate commitment or funding evidence. Add conditions to the checklist and complete them with evidence. These entries do not automatically change the overall deal stage.
6. From any result create a shareable or internal report. Preview it and use Print / Save as PDF. The saved report has its original input/mandate context. Internal history is excluded from shareable versions.
7. View a capital provider for event-derived history, then add a new sourced mandate version. Old scores/reports stay unchanged; rerun comparison before building new packages.
8. Sign out and choose Casey: Jasper's deals, documents, reports and statistics are inaccessible through the API and RLS.
