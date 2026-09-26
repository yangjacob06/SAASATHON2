# Mandate

Subscription software for New Zealand commercial finance advisers and
brokers: prepare private-credit deal summaries, match non-bank lenders, and
track each application from first draft to settlement.

## Running locally

```bash
npm install
npm run db:setup
npm run db:seed   # demo@mandate.test / demo1234, with 3 sample applications
npm run dev       # http://localhost:3310
```

No external services are required to run the app. Everything degrades
gracefully with no keys configured:

- **Database** — SQLite at `.data/dev.db`. Set `DATABASE_URL` to point at
  Postgres (e.g. Supabase) instead.
- **AI deal summaries** — a deterministic summary built from the form fields.
  Set `OPENAI_API_KEY` to have uploaded PDFs read and a richer summary
  drafted by the model.
- **Billing** — a mock checkout that activates the chosen plan directly. Set
  `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_STARTER` and
  `STRIPE_PRICE_PRO` to use real Stripe Checkout in test mode.
- **File storage** — uploaded PDFs and logos are written to `.data/uploads/`.
  Point `lib/storage.ts` at Supabase Storage (or S3) for production; nothing
  else in the app needs to change.

See `.env.example` for the full list.

## Structure

- `lib/db.ts` — the Postgres/SQLite driver. Every query is written once in
  Postgres-style SQL; the SQLite adapter rewrites placeholders.
- `lib/auth.ts` — email/password auth over database-backed sessions.
- `lib/billing.ts` — plans, trial state, and the Stripe/stub billing provider.
- `lib/lenders.ts` — the lender matching engine (explainable, rule-based).
- `lib/ai/summary.ts` — deal summary generation, with a deterministic fallback.
- `lib/actions/` — server actions called directly from forms.
- `db/migrations/` — schema, applied in order by `npm run db:setup`.
- `scripts/db-seed.mjs` — the demo adviser account and lender directory.
