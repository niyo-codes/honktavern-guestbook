CREATE TABLE IF NOT EXISTS entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  fingerprint_hash TEXT NOT NULL,
  moderation_status TEXT NOT NULL DEFAULT 'visible'
    CHECK (moderation_status IN ('visible', 'hidden', 'deleted')),
  hidden_at INTEGER,
  deleted_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_entries_visible_created
  ON entries (moderation_status, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_entries_fingerprint_created
  ON entries (fingerprint_hash, created_at DESC);

CREATE TABLE IF NOT EXISTS abuse_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  fingerprint_hash TEXT,
  created_at INTEGER NOT NULL,
  metadata TEXT
);

CREATE INDEX IF NOT EXISTS idx_abuse_events_fingerprint_created
  ON abuse_events (fingerprint_hash, created_at DESC);
