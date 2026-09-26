# Persistent Deal Workspaces and Provider Intelligence

## Purpose and scope

Build the next layer of Mandate for New Zealand commercial debt advisers: save matching results as permanent deal workspaces, track each capital provider independently, keep broker notes and follow-ups, and derive factual intelligence from historical interactions.

This document is an implementation specification, not a claim that the features are implemented. Preserve existing extraction and matching behaviour. Do not build a generic CRM, replace matching scores with behavioural scores, or introduce machine learning.

## Phase 1 — Repository inspection

Inspected `main` at commit `1fd8dd0d211df37b75d10a410bf16e314ca6720d`.

| Area | Actual repository state |
| --- | --- |
| Frontend | Static HTML, vanilla JavaScript and CSS in `MODEL/prototype/` |
| Entry point | `index.html`; README instructs users to open this in a browser |
| Styling | `styles.css`, `layout.css`; existing cards, tables, navigation, light/dark themes |
| Deal data | In-memory `deals` object in `app.js`, containing three fictional businesses |
| Matching output | Hard-coded `deals[id].matches` arrays; qualitative overlap labels, provider names and illustrative criteria |
| Matching display | `renderDeal()` builds the potential lender fit cards; `renderLenders()` displays the same sample arrays |
| Extraction | No extraction implementation found; summary is assembled from sample fields and upload is disabled |
| Persistence | Deal changes and activity are held in memory; localStorage is used for theme preference |
| History | Global `activityItems` array; `advanceStage()` changes overall deal stage and prepends sample activity |
| Backend / database / auth | None found |
| Build / migrations / tests | No package manifest, database migrations or automated test suite found |

The request describes a working extraction and matching engine, but that engine is not in the inspected checkout. Locate its branch, repository or service contract before integrating production matching. Do not invent numeric scores from the current qualitative labels.

Integrate a **Save deal** action immediately after matching output becomes available. In this checkout the corresponding presentation point is `renderDeal()` beside the lender fit section. The future adapter must consume the real engine's existing output, without copying its decision rules. Reuse `renderDeals()`, `renderDeal()`, `renderLenders()`, `renderActivity()` and existing styles for the new views. Replace global sample activity with authenticated, deal-specific history when production storage is connected.

A production backend, database and authentication layer are necessary because browser-only storage cannot enforce brokerage isolation. If the real engine already has these, reuse them. Otherwise select a small backend compatible with the deployment environment; PostgreSQL with row-level security is a suitable proposal, not an existing dependency. Keep the vanilla frontend unless a concrete integration constraint requires otherwise.

## Workflow and interface

Upload → existing extraction → existing matching → Save deal → Deal Workspace → provider status / notes / follow-ups → complete history.

Prefill the save form from extracted fields; request only missing information such as a useful deal name. Disable duplicate submissions, show progress and retryable errors, and navigate to the saved workspace only after commit succeeds.

The dashboard shows name, NZD amount, industry, creation date, overall stage, assigned broker, provider count, and counts contacted, interested, declined and terms received. Label current-status counts clearly; historical milestone counts belong in provider intelligence. Allow simple stage, broker and industry filters and creation-date or amount sorting. Define dashboard “contacted” as ever contacted, explicitly labelled, so moving to WAITING does not erase that count.

The workspace shows a concise financial summary and a Capital Matches table: provider, original score, editable status, last action, next follow-up and assigned broker. Persist changes immediately; show saving and error states, preserve unsaved input on failure, and reconcile concurrent edits. Offer inline notes and follow-up editing. On DECLINED, open a small optional reason/note panel with an explicit “Save without reason” action. Surface overdue and upcoming follow-ups above the table. Include loading, empty, inaccessible and error states; preserve keyboard access and responsive layouts.

## Phase 2 — Storage and migrations

Use the actual backend's existing naming and type conventions. The following is a logical schema, not an executable migration. IDs should be stable generated identifiers; timestamps use UTC and are displayed in the broker's timezone. Monetary values use fixed-precision decimal with NZD currency, never binary float. Unknown financial fields remain null rather than zero. Preserve the original extracted JSON alongside normalized fields.

| Entity | Required fields and rules |
| --- | --- |
| organisations | id, name, created_at |
| users | id linked to authenticated identity, organisation_id, name, email, created_at; membership derived server-side |
| deals | id, organisation_id, created_by_user_id, assigned_user_id, deal_name, borrower_name or borrower_alias, amount_requested, currency, industry, revenue, ebitda, existing_debt, leverage, purpose, desired_term, security, location, overall_stage, extracted_data_json, created_at, updated_at, version |
| capital_providers | Reuse real provider records if available; otherwise id, name, verification state and timestamps. Prototype names are fictional and must not become verified providers automatically |
| provider_mandates | id, provider_id, min_deal_size, max_deal_size, sectors, excluded_sectors, target_return_min/max, min_term/max_term, max_leverage, min_ebitda, accepted_security, financing_purposes, available_capital, deployment_deadline, appetite_level, effective_from, effective_to, created_at |
| deal_matches | id, organisation_id, deal_id, provider_id, provider_mandate_id nullable, match_score nullable, score_scale, match_reasons_json, mandate_snapshot_json, status, decline_reason nullable, last_contacted_at, next_follow_up_at, assigned_user_id, matched_at, created_at, updated_at, version |
| deal_events | id, organisation_id, deal_id, deal_match_id nullable, provider_id nullable, actor_user_id, event_type, previous_status nullable, new_status nullable, metadata_json, created_at, monotonic sequence |
| deal_notes | id, organisation_id, deal_id, deal_match_id nullable, provider_id nullable, user_id, note_text, created_at |

A unique constraint on `(organisation_id, deal_id, provider_id)` establishes one provider relationship per deal. If the engine returns multiple mandates for a provider, preserve all candidate evidence in the snapshot and choose the engine-designated result; do not silently discard or recompute scores. Agree this adapter contract with the existing engine before implementation.

Enforce composite foreign keys that include organisation_id for deals, matches, notes, events and assigned users. A relationship note must reference the same provider as its match. Actor identity, organisation and timestamps are assigned by the server. An idempotency key scoped to organisation and save operation prevents duplicate deals on retries.

Controlled provider statuses:

`NOT_CONTACTED`, `CONTACTED`, `WAITING`, `INTERESTED`, `TERMS_RECEIVED`, `DECLINED`, `CLOSED`, `WITHDRAWN`.

Controlled decline reasons:

`DEAL_TOO_SMALL`, `DEAL_TOO_LARGE`, `WRONG_SECTOR`, `LEVERAGE_TOO_HIGH`, `RETURN_TOO_LOW`, `SECURITY_UNSUITABLE`, `TERM_UNSUITABLE`, `NO_CAPITAL_AVAILABLE`, `TIMING`, `OTHER`.

Controlled events include `DEAL_CREATED`, `PROVIDER_MATCHED`, `STATUS_CHANGED`, `PROVIDER_CONTACTED`, `NOTE_ADDED`, `FOLLOW_UP_SET`, `DECLINE_RECORDED`, `TERMS_RECEIVED`, `DEAL_CLOSED`, plus explicit deal-stage and assignment changes. Overall stage is separate from each provider's status; closing one provider relationship must not silently close the whole deal.

Index organisation/deal, organisation/provider, organisation/status, organisation/assigned broker, organisation/next follow-up, and organisation/deal/event timestamp plus sequence. Add indexes supporting mandate effective dates. Prevent overlapping effective intervals for the same mandate lineage. Create new mandate versions; only close the prior validity interval. Never overwrite historical terms, match evidence or scores. Snapshot provider name and relevant terms so later renames and mandate changes do not alter explanations.

Events are append-only: runtime roles have no UPDATE/DELETE privileges, database protection rejects modification, and foreign keys do not cascade-delete history. Correct errors through new events. Archive deals rather than removing their history. Migration and administrator access must be separately controlled.

## Phase 3 — Save matching results

Define an adapter around the engine's actual output: extracted deal fields, stable provider IDs, original score and scale, reasons, matched_at, mandate version and exact mandate context used by the engine. Freeze context at match time, not by fetching the latest mandate during save. Never trust client-supplied provider scores or organisation IDs: resolve an authorised stored matching run or validate an authenticated server-to-server result.

In one transaction, validate identity and input, resolve idempotency, insert the deal, insert every provider relationship with NOT_CONTACTED status, and append DEAL_CREATED and PROVIDER_MATCHED events. Roll back everything if any write fails. Return the stable deal ID and persisted records. Retry returns the original result. A matching run with five distinct providers produces five rows. Do not recalculate historical scores when opening a workspace or updating a mandate.

## Phases 4–7 — Workspace operations and history

Suggested API contracts, subject to the selected backend's conventions:

| Operation | Proposed route | Behaviour |
| --- | --- | --- |
| Save matching run | `POST /api/deals` | Authorised matching-run reference, deal name, idempotency key; atomic save |
| Dashboard | `GET /api/deals` | Tenant-scoped filters, pagination and aggregate counts |
| Workspace | `GET /api/deals/:id` | Summary and provider relationships |
| Stage / broker | `PATCH /api/deals/:id` | Validated update plus event |
| Provider status | `PATCH /api/deals/:id/matches/:matchId/status` | Controlled status, optional decline detail, expected version |
| Contact / follow-up | `PATCH /api/deals/:id/matches/:matchId/follow-up` | Contact date, next follow-up, optional note, expected version |
| Add note | `POST /api/deals/:id/notes` | Deal or relationship note plus NOTE_ADDED event |
| Notes | `GET /api/deals/:id/notes` | Tenant-scoped, paginated |
| Timeline | `GET /api/deals/:id/events` | Newest first, stable timestamp/sequence pagination |
| Provider history | `GET /api/providers/:id/history` | Current organisation only; counts, rates, breakdowns and factual insights |

Status changes use a transaction and row lock or version check. Read actual previous status, update current status, append STATUS_CHANGED containing both values, actor and timestamp, and append applicable semantic events. Repeating the same status is a no-op, not another milestone. Conflicts return a recoverable conflict response rather than overwriting another broker's work.

CONTACTED records contact activity and last_contacted_at. Explicit later contact actions can create further PROVIDER_CONTACTED events. TERMS_RECEIVED creates its semantic event. DECLINED stores the optional controlled reason and optional free-text note atomically with history. Reopening clears the current decline reason but retains the historical decline event. Validate contact timestamps and distinguish a contact occurrence time from the server event-recording timestamp for backdated entries.

Notes are stored as plain text and safely rendered. Each note insertion and NOTE_ADDED event must succeed together. Follow-up changes record old/new dates and any note reference in metadata. Clearing a follow-up also creates an event. Validate date formats and lengths; allow overdue follow-ups to remain visible. Keep note contents out of public error messages and logs.

Display timeline entries such as “ABC Credit marked Interested by Jack”, “Pacific Fund declined — leverage too high”, and “Follow-up scheduled for 30 September”. Derive them from persisted events, not a separate mutable activity feed. Keep status transitions, assignment changes, contact occurrences and note references explainable months later.

## Phase 8 — Historical provider intelligence

Aggregate exclusively within the authenticated organisation. Count distinct deal/provider relationships, not event rows, to avoid inflation from repeated contacts or reopened statuses. Display current states separately from historical milestones.

- Matched: total distinct relationships.
- Contacted: relationships with an explicit contact event; never assume contact from a current WAITING or INTERESTED state.
- Interested: relationships that have explicitly reached INTERESTED at least once.
- Declined, terms received and closed: relationships that explicitly reached the respective status at least once. A relationship may count in multiple historical milestones.
- Interest rate: contacted relationships with an explicit interest outcome divided by contacted relationships.
- Decline rate: contacted relationships with an explicit decline outcome divided by contacted relationships.
- Zero denominator: show “Not enough data”, not a fabricated percentage. Show numerator and denominator beside every rate. Interest and decline rates need not sum to 100% when relationships reopen.
- Industry breakdown: use saved deal industry, with unknown values grouped explicitly.
- Size bands: NZD <1m, 1m–<5m, 5m–<10m and ≥10m; unknown separately. Do not mix currencies without an explicit conversion policy.
- Common reasons: count distinct relationships per historical decline reason; display sample sizes.
- Response time: median elapsed time from first recorded contact occurrence to first subsequent explicit INTERESTED or DECLINED outcome per relationship. Exclude missing or negative intervals; show sample count. Keep event ordering stable and use occurrence timestamps for backdated contacts.
- Most recent interaction: latest provider-specific meaningful contact/status/note event; do not label a matching event as lender contact.

Generate statements from these same aggregates: “Your firm has approached ABC Credit on 8 previous transactions”, “Interested in 6 of the last 8 contacted manufacturing transactions”, or “4 transactions declined because of leverage”. For “last 8”, select the most recent contacted relationships in the specified industry before calculating outcomes. When shown inside an active deal, exclude that deal from claims about previous transactions. Show actual samples if fewer than eight exist. Never fabricate historical outcomes or imply predictive accuracy. Keep intelligence separate from the engine score.

## Security and validation

Authenticate every deal, match, note, timeline and history endpoint. Resolve organisation membership from the trusted session; never accept a caller's organisation_id as authorisation. Tenant-scope all database queries and aggregates. For PostgreSQL, apply and test row-level security to brokerage tables with transaction-local trusted identity; the application's runtime role must not bypass those policies. Verify connection pooling cannot leak tenant context.

Validate nested IDs together, including assignment membership and provider/match consistency. Return a consistent not-found response for inaccessible records. Protect private extraction results, attachments and matching runs with the same authorisation boundary. Use private object storage and short-lived authorised document access if documents are later connected. Render untrusted note and borrower strings safely, protect cookie-authenticated mutations against CSRF, and avoid caching tenant data under shared keys.

No browser-only persistence implementation can satisfy production multi-tenant security. Demo seeds and production data must be kept separate.

## Phase 9 — Tests and optional demo seed

| Test | Required assertion |
| --- | --- |
| Five matches | Save creates one deal, five independent relationships, correct snapshots and creation/matching events |
| Independent statuses | All five providers can hold different values without changing one another |
| Refresh | Reload via API/browser retains changed status |
| Status event | Exact previous/new status, actor and timestamp persisted atomically |
| Decline | Every allowed reason, absent reason and optional note survive reload |
| Notes | Both deal and relationship notes persist with correct ownership and event |
| Follow-up | Contact date, next follow-up, note and clearing persist |
| Timeline | Newest-first ordering is stable even with equal timestamps |
| Statistics | Multiple deals, repeated contacts, reopened statuses, industry/size bands and zero samples aggregate correctly |
| Historical evidence | New mandate versions and provider renames do not alter saved scores, reasons or snapshots |
| Isolation | Organisation A cannot list, read, mutate, assign into or aggregate organisation B's records; test direct IDs and nested routes |
| Regression | Existing extraction/matching fixtures produce identical output before and after integration |
| Atomicity | Injected write failure leaves neither partial current state nor orphan history |
| Retry / concurrency | Duplicate saves return one deal; concurrent status edits produce a conflict or serialised correct events |
| Append-only | Runtime UPDATE/DELETE of history fails; deal deletion cannot cascade away events |

Use unit tests for adapters, validation and statistics, database integration tests for transaction and tenant behaviour, and browser tests for save → edit → reload. After every major phase, rerun matching regression checks and confirm the prototype still opens. Once a backend exists, add its startup and health checks. Current qualitative sample arrays can serve as prototype regression fixtures, but are not proof that an absent production engine still works.

Optional seed: Southern Manufacturing Acquisition, NZD 8,000,000, Manufacturing, EBITDA NZD 5,400,000, acquisition purpose, 3-year term and 2.3x leverage. Providers: ABC Private Credit 94% INTERESTED; Southern Capital 89% WAITING; Harbour Credit 84% DECLINED with LEVERAGE_TOO_HIGH; Pacific Capital 79% CONTACTED; Kauri Private Credit 74% NOT_CONTACTED. These numeric scores are explicitly fictional seed values, not converted from existing demo labels.

Create several older fictional deals for the same providers and chronological contact/outcome events. Derive displayed statistics from seeded rows rather than hard-coding desired figures. Use an explicit demo organisation and an idempotent, opt-in development seed command; refuse production seeding by default.

## Delivery sequence and acceptance

1. Verify the real engine location and stack; agree its output adapter and regression fixtures.
2. Introduce additive schema migrations, constraints, indexes and tenant policies using that stack.
3. Implement atomic, idempotent saving from existing match results.
4. Extend existing dashboard and workspace components using existing CSS.
5. Add transactional per-provider status changes and immutable events.
6. Add notes, decline reasons and follow-ups.
7. Render the persisted chronological timeline.
8. Add tenant-scoped historical aggregates and factual insight templates.
9. Complete the acceptance tests and optional isolated demo seed.

Deliver the final code with an explicit list of schema changes, actual API routes/components, assumptions, remaining TODOs, migration commands, startup commands and test commands. Do not describe planned APIs as implemented.

## Running the current checkout and remaining work

The current prototype runs by opening `MODEL/prototype/index.html` in a browser and choosing **Explore the demo**, as described in the root README. Its sample changes reset on reload; it does not yet save permanent deals.

There are no migrations, backend startup commands or automated test commands to run in this checkout. This document adds none. Exact migration and test instructions must be supplied when the backend and database are implemented, including required environment variables, applying migrations to a clean database, existing-user organisation backfill, optional seed instructions and a smoke test of the complete workflow. Do not invent runnable commands before those files exist.

Outstanding: locate the production extraction/matching implementation, confirm deployment/auth/database choices if no existing stack is available, then implement phases 2–9. This documentation change intentionally leaves the existing runnable prototype intact.
