-- Deal fields needed by the original synthetic mandate comparison.
ALTER TABLE applications ADD COLUMN industry TEXT NOT NULL DEFAULT '';
ALTER TABLE applications ADD COLUMN security TEXT NOT NULL DEFAULT '[]';

-- Preserve each lender contact and response so the six-month demo dashboard
-- can calculate history from recorded events instead of invented aggregates.
CREATE TABLE IF NOT EXISTS application_lender_events (
  id                    TEXT PRIMARY KEY,
  application_lender_id TEXT NOT NULL REFERENCES application_lenders (id) ON DELETE CASCADE,
  event_type            TEXT NOT NULL,
  stage                 TEXT NOT NULL,
  occurred_at           TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS lender_events_match_idx ON application_lender_events (application_lender_id, occurred_at);
