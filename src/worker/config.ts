import type { Env } from "./types/guestbook";

export function getConfig(env: Env) {
  const rateLimitSeconds = Number(env.RATE_LIMIT_SECONDS ?? "5");
  const dailyEntryLimit = Number(env.DAILY_ENTRY_LIMIT ?? "1");

  return {
    allowedOrigin: env.ALLOWED_ORIGIN,
    turnstileSiteKey: env.TURNSTILE_SITE_KEY,
    rateLimitSeconds: Math.max(Number.isFinite(rateLimitSeconds) ? rateLimitSeconds : 5, 1),
    // 0 is an explicit temporary/test-mode value meaning "disable the 24-hour entry gate".
    dailyEntryLimit: Math.max(
      Number.isFinite(dailyEntryLimit) ? dailyEntryLimit : 1,
      0
    )
  };
}
