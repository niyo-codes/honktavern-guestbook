-- Interactive guestbook controls: greeting state and one like per IP fingerprint per UTC day.
-- Keep migrations append-only.

CREATE TABLE IF NOT EXISTS guestbook_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  greeting TEXT NOT NULL DEFAULT '',
  greeting_updated_at INTEGER
);

INSERT OR IGNORE INTO guestbook_settings (id, greeting, greeting_updated_at)
VALUES (1, '', NULL);

CREATE TABLE IF NOT EXISTS guestbook_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_fingerprint TEXT NOT NULL,
  like_day TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_guestbook_likes_ip_day
  ON guestbook_likes (ip_fingerprint, like_day);

CREATE INDEX IF NOT EXISTS idx_guestbook_likes_created
  ON guestbook_likes (created_at DESC);
