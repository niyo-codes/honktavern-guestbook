export type ModerationStatus = "visible" | "hidden" | "deleted";

export interface GuestbookEntry {
  id: number;
  name: string;
  message: string;
  created_at: number;
  moderation_status: ModerationStatus;
}

export interface EntryCursor {
  createdAt: number;
  id: number;
}

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  TURNSTILE_SECRET: string;
  FINGERPRINT_SALT: string;
  TURNSTILE_SITE_KEY: string;
  ALLOWED_ORIGIN: string;
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
  RATE_LIMIT_SECONDS?: string;
  DAILY_ENTRY_LIMIT?: string;
}
