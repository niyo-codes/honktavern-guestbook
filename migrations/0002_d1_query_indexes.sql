-- Query-performance hardening for the Stage 0 guestbook schema.
--
-- Keep migrations append-only. Do not edit 0001 after it has been applied.

CREATE INDEX IF NOT EXISTS idx_entries_fingerprint_status_created
  ON entries (fingerprint_hash, moderation_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_abuse_events_fingerprint_type_created
  ON abuse_events (fingerprint_hash, event_type, created_at DESC);
