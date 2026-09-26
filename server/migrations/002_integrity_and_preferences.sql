ALTER TABLE match_results ADD UNIQUE(organisation_id,id);
ALTER TABLE deal_matches ADD FOREIGN KEY(organisation_id,original_result_id) REFERENCES match_results(organisation_id,id), ADD FOREIGN KEY(organisation_id,latest_result_id) REFERENCES match_results(organisation_id,id);
ALTER TABLE funding_records ADD UNIQUE(organisation_id,id);
ALTER TABLE funding_records ADD FOREIGN KEY(organisation_id,supersedes_id) REFERENCES funding_records(organisation_id,id), ADD UNIQUE(supersedes_id);
ALTER TABLE packages ADD UNIQUE(organisation_id,id);
ALTER TABLE deals ADD preferred_package_id text, ADD preferred_alternative integer, ADD preferred_terms_id text;
ALTER TABLE deals ADD FOREIGN KEY(organisation_id,preferred_package_id) REFERENCES packages(organisation_id,id), ADD FOREIGN KEY(organisation_id,preferred_terms_id) REFERENCES funding_records(organisation_id,id);
ALTER TABLE profile_versions ADD FOREIGN KEY(organisation_id,actor_user_id) REFERENCES users(organisation_id,id);
ALTER TABLE deal_events ADD FOREIGN KEY(organisation_id,provider_id) REFERENCES capital_providers(organisation_id,id);
ALTER TABLE reports ADD FOREIGN KEY(organisation_id,provider_id) REFERENCES capital_providers(organisation_id,id);
-- A caller cannot rewrite input snapshots while marking a run saved.
CREATE FUNCTION preserve_run() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF ROW(NEW.id,NEW.organisation_id,NEW.deal_id,NEW.profile_version,NEW.snapshot,NEW.engine_version,NEW.created_at) IS DISTINCT FROM ROW(OLD.id,OLD.organisation_id,OLD.deal_id,OLD.profile_version,OLD.snapshot,OLD.engine_version,OLD.created_at) THEN RAISE EXCEPTION 'Matching evidence is immutable'; END IF;
 RETURN NEW; END $$;
CREATE TRIGGER preserve_run BEFORE UPDATE ON matching_runs FOR EACH ROW EXECUTE FUNCTION preserve_run();
CREATE INDEX ON matching_runs(organisation_id,deal_id,created_at DESC);
CREATE INDEX ON funding_records(organisation_id,deal_id,deal_match_id,kind);
CREATE INDEX ON reports(organisation_id,deal_id,created_at DESC);
