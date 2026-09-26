CREATE INDEX ON deal_events(organisation_id,provider_id,occurred_at DESC);
CREATE INDEX ON deal_notes(organisation_id,deal_id,created_at DESC);
CREATE INDEX ON documents(organisation_id,deal_id,created_at DESC);
CREATE INDEX ON tasks(organisation_id,completed,due_at);
CREATE INDEX ON packages(organisation_id,deal_id,created_at DESC);
