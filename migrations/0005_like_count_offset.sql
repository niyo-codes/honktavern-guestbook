-- Add an operator-controlled baseline for the guestbook's accumulated like total.
-- Visitor likes remain one-per-fingerprint-per-UTC-day in guestbook_likes.
ALTER TABLE guestbook_settings ADD COLUMN like_count_offset INTEGER NOT NULL DEFAULT 0;
