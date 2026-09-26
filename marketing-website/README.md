# Mandate

Subscription software for New Zealand commercial finance advisers and
brokers: prepare private-credit deal summaries, match non-bank lenders, and
track each application from first draft to settlement.

## Running locally

```bash
npm install
npm run db:setup
npm run db:seed   # both demo accounts, lender directory, and sample deal history
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
- **File storage** — local development writes to `.data/uploads/`; Vercel
  deployments write documents and logos to a connected **private Vercel Blob**
  store. Connect the store to the Vercel project so its Blob credentials are
  available to deployments. Files are referenced by private pathname, not public URL.

## Demo accounts

- `fresh@mandate.test` / `demo1234` — a newly purchased account with an empty dashboard.
- `demo@mandate.test` / `demo1234` — six months of clearly labelled fictional deal and lender history.

The seeded history shows deals handled, settlements, average request size, lender response time, and deals matched. Seed data is fictional and must not be represented as real performance.

## Synthetic analysis flow

The application accepts the original `field,value,currency,period_end` synthetic
CSV documents as well as PDFs, including a browser folder picker. When a
supported synthetic CSV is on file, generating the deal analysis runs the
fictional Kauri Capital, Harbour Funding, and Tui Credit Partners comparison
plus the original multi-provider package solver. The PDF export includes match
checks, package options, exclusion reasons, and source conflicts. Pricing,
fees, and final terms are marked as unavailable where fixtures do not provide
them. All lender profiles, mandates, and CSV examples are fictional, not live
terms or credit recommendations.

## Vercel setup

Configure `DATABASE_URL` for the production Postgres database and run
`npm run db:setup` to apply pending migrations. Run `npm run db:seed` to add
the demo users, fictional lenders, and sample history. Connect a private Vercel
Blob store to the project for document uploads; uploads fail with a setup
message until Blob credentials are available. The app's Server Action upload
limit is 4 MB to stay within the Vercel function request limit; large production
file uploads need a direct-to-storage upload endpoint.

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
