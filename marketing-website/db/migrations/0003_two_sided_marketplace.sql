-- Lender access is separately approved, and borrower data is shared deal by deal.
ALTER TABLE users ADD COLUMN account_type TEXT NOT NULL DEFAULT 'adviser';
ALTER TABLE users ADD COLUMN account_status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE users ADD COLUMN lender_id TEXT REFERENCES lenders(id);
ALTER TABLE lenders ADD COLUMN owner_user_id TEXT REFERENCES users(id);

CREATE TABLE IF NOT EXISTS lender_partner_applications (
  id                    TEXT PRIMARY KEY,
  user_id               TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  firm_name             TEXT NOT NULL,
  contact_name          TEXT NOT NULL,
  contact_email         TEXT NOT NULL,
  min_loan_cents        INTEGER NOT NULL,
  max_loan_cents        INTEGER NOT NULL,
  max_lvr_pct           REAL NOT NULL,
  regions               TEXT NOT NULL DEFAULT '[]',
  loan_types            TEXT NOT NULL DEFAULT '[]',
  pre_sales_requirement TEXT NOT NULL DEFAULT 'either',
  notes                 TEXT NOT NULL DEFAULT '',
  status                TEXT NOT NULL DEFAULT 'pending',
  created_at            TEXT NOT NULL,
  reviewed_at           TEXT
);

CREATE TABLE IF NOT EXISTS deal_shares (
  id             TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  lender_id      TEXT NOT NULL REFERENCES lenders(id) ON DELETE CASCADE,
  shared_by      TEXT NOT NULL REFERENCES users(id),
  shared_at      TEXT NOT NULL,
  revoked_at     TEXT,
  response       TEXT,
  response_note  TEXT NOT NULL DEFAULT '',
  responded_at   TEXT,
  UNIQUE(application_id, lender_id)
);
CREATE INDEX IF NOT EXISTS deal_shares_lender_idx ON deal_shares(lender_id, shared_at);

CREATE TABLE IF NOT EXISTS settlement_records (
  id                   TEXT PRIMARY KEY,
  application_id       TEXT NOT NULL UNIQUE REFERENCES applications(id) ON DELETE CASCADE,
  lender_id            TEXT REFERENCES lenders(id),
  facility_amount_cents INTEGER NOT NULL,
  fee_amount_cents     INTEGER NOT NULL,
  fee_bps              INTEGER NOT NULL,
  fee_payer            TEXT NOT NULL,
  settled_at           TEXT NOT NULL,
  reference            TEXT NOT NULL DEFAULT '',
  created_by           TEXT NOT NULL REFERENCES users(id),
  created_at           TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS settlement_lender_idx ON settlement_records(lender_id, settled_at);
