# Mandate

Marketplace software for New Zealand commercial finance advisers and private
credit lenders: prepare deal summaries, match lending criteria, and track
applications from first draft to settlement. Joining and using Mandate is
free; Mandate charges a success fee only when a facility settles.

## Running locally

```bash
npm install
npm run db:setup
npm run db:seed   # requires MANDATE_DEMO_PASSWORD; creates 3 sample applications
npm run dev       # http://localhost:3310
```

No external services are required to run the app. Everything degrades
gracefully with no keys configured:

- **Database** — SQLite at `.data/dev.db`. Set `DATABASE_URL` to point at
  Postgres (e.g. Supabase) instead.
- **AI deal summaries** — a deterministic summary built from the form fields.
  Set `OPENAI_API_KEY` to have uploaded PDFs read and a richer summary
  drafted by the model.
- **File storage** — uploaded PDFs and logos are written to `.data/uploads/`.
  Point `lib/storage.ts` at Supabase Storage (or S3) for production; nothing
  else in the app needs to change.
- **Lender partners** — funds request access at `/lenders`; set
  `MANDATE_ADMIN_EMAIL` to the exact account allowed to review and activate
  applications. Activated funds maintain their criteria and receive deals only
  after an adviser explicitly shares them. Shared deal briefs exclude source
  documents.
- **Settlement fees** — `FEE_BPS` and `FEE_PAYER` in `lib/fees.ts` are the
  single pricing configuration. Recording settlement snapshots the funded
  amount and calculated fee in the ledger. The ledger does not process or mark
  payments as collected.

See `.env.example` for the full list.

## Structure

- `lib/db.ts` — the Postgres/SQLite driver. Every query is written once in
  Postgres-style SQL; the SQLite adapter rewrites placeholders.
- `lib/auth.ts` — email/password auth over database-backed sessions.
- `lib/fees.ts` — settlement fee configuration and shared fee formatting.
- `lib/lenders.ts` — the lender matching engine (explainable, rule-based).
- `lib/ai/summary.ts` — deal summary generation, with a deterministic fallback.
- `lib/actions/` — server actions called directly from forms.
- `db/migrations/` — schema, applied in order by `npm run db:setup`.
- `scripts/db-seed.mjs` — the demo adviser account and lender directory.
