import type { Env } from "./types/guestbook";

export function getConfig(env: Env) {
  return {
    allowedOrigin: env.ALLOWED_ORIGIN,
    turnstileSiteKey: env.TURNSTILE_SITE_KEY,
    rateLimitSeconds: Math.max(Number(env.RATE_LIMIT_SECONDS ?? "5"), 1),
    dailyEntryLimit: Math.max(Number(env.DAILY_ENTRY_LIMIT ?? "1"), 1)
  };
}
