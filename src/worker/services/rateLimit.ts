const RATE_LIMIT_EVENT_TYPES = ["submission_attempt", "turnstile_failed"] as const;

export async function isRateLimited(
  db: D1Database,
  fingerprintHash: string,
  windowSeconds: number
): Promise<boolean> {
  const cutoff = Date.now() - windowSeconds * 1000;

  const row = await db
    .prepare(
      `SELECT 1
       FROM abuse_events
       WHERE fingerprint_hash = ?1
         AND created_at >= ?2
         AND event_type IN (?3, ?4)
       LIMIT 1`
    )
    .bind(
      fingerprintHash,
      cutoff,
      RATE_LIMIT_EVENT_TYPES[0],
      RATE_LIMIT_EVENT_TYPES[1]
    )
    .first();

  return Boolean(row);
}

export async function recordAbuseEvent(
  db: D1Database,
  eventType: string,
  fingerprintHash: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO abuse_events
       (event_type, fingerprint_hash, created_at, metadata)
       VALUES (?1, ?2, ?3, ?4)`
    )
    .bind(
      eventType,
      fingerprintHash,
      Date.now(),
      metadata ? JSON.stringify(metadata) : null
    )
    .run();
}
