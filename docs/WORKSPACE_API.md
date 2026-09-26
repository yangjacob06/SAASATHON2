# Implemented workspace API

All `/api` routes except auth config/login require the HTTP-only session cookie. Organisation comes from `users.organisation_id` resolved by the server. Sending an organisation ID does not grant access. Mutating requests require an exact allowed `Origin`. Stateful deal/provider mutations also require `Idempotency-Key`.

| Method / path | Purpose |
| --- | --- |
| GET `/api/auth/config` | Mode and fictional accounts in local demo only |
| POST `/api/login` | `{user_id}` in local demo, `{email,password}` in hosted Supabase mode |
| POST `/api/logout` | Clear current session |
| GET `/api/bootstrap` | Current brokerage dashboard data and accessible directory |
| POST `/api/deals` | Persist `{deal_name,profile}` as an incomplete draft |
| GET `/api/deals/:id` | Authorised profile, history, results, notes, facilities, package and evidence snapshots |
| POST `/api/deals/:id/:action` | Transactional action listed below; always supply current `version` |
| GET `/api/providers/:id/history` | Brokerage-only outcome statistics; optional `exclude_deal_id` |
| POST `/api/providers/:id/mandates` | Append `{id,effective_from,data}` sourced mandate version |
| GET `/api/documents/:id` | Authorised private CSV download |
| GET `/api/reports/:id` | Immutable internal/shareable report snapshot |
| GET `/api/reports/:id.pdf` | Tenant-authorised PDF download rendered from that saved report snapshot |

Actions: `profile`, `upload`, `resolve`, `confirm`, `analyze`, `save-matches`, `provider`, `note`, `workflow`, `package`, `choose-package`, `funding`, `choose-terms`, `task`, `report`.

```json
{
  "version": 3,
  "match_id": "saved-relationship-id",
  "match_version": 2,
  "status": "DECLINED",
  "decline_reason": "LEVERAGE_TOO_HIGH",
  "note": "Broker-entered supporting explanation",
  "next_follow_up_at": null
}
```

Send that body to `POST /api/deals/:id/provider`. Provider status and events commit together. A concurrent version conflict returns 409; reload and review rather than silently overwrite. Validation returns 422, unauthenticated access 401, and inaccessible resources 404. Same-key identical retry returns the original response without duplicating events.

`upload` accepts `{version,files:[{name,content}]}`, up to five supported UTF-8 borrower CSVs, each 1 MB. `resolve` accepts `{version,field,document_id,row}` or current value when document_id is null. Both retain original files and provenance; profile changes invalidate confirmation and dependent comparisons.

`analyze` requires a confirmed profile and snapshots both the original comparator output and additive catalogue criteria. `save-matches` accepts a `run_id` and attaches every provider result to the existing deal; it creates no duplicate deal. Repeated runs retain original relationship scores, while `latest_result_id` points to the current result. Absent providers remain visible as earlier relationships.

`package` accepts `run_id`, `name`, and `options:{pinned:[],excluded:[],locks:{"provider-id:facility-id":6000000}}`. Monetary input is NZD with at most two decimals; output uses exact integer cents. The result is a saved immutable search/scenario snapshot. `choose-package` records `package_id`, zero-based `alternative` and `reason`. Profile or mandate changes require a fresh comparison/scenario.

`funding` accepts `match_id`, `facility_id`, `kind` (indication/terms/commitment/funding), `amount`, `state`, optional `expires_at`, optional `supersedes_id`, and `data` containing a mandatory `source` plus actual quoted fields. Amounts are never inferred from interest status. Revisions append new evidence and do not overwrite earlier rows. `choose-terms` requires `record_id` and a reason.

`report` requires `result_id` and `audience` (shareable/internal). Shareable is the default. Profile and provider data are whitelisted; broker notes and historical intelligence do not enter shareable snapshots. Open the saved report, use **Download PDF** for the direct export or **Print preview** for the browser print dialog.

## Existing browser adapter contract

The original `window.MandateDealAnalysis.analyzeDeal(profile,lenders)` remains available under `/prototype`. `window.MandateCSV` is the additive pure-function extraction adapter, guarded by `MandateParserOnly` for server use. No call to the unimplemented `/api/v1/deals/analyze` draft is introduced. A future production engine must return stable provider IDs, mandate version IDs, score/scale/version, reasons and evidence; it must not overwrite already saved result records. See `server/types.d.ts`, `validation.js` and `analysis.js` for actual structures and validation boundaries.
