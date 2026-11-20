import type { EntryCursor, Env, GuestbookEntry } from "../types/guestbook";
import { createVisitorFingerprint } from "../services/fingerprint";
import { isRateLimited, recordAbuseEvent } from "../services/rateLimit";
import { verifyTurnstile } from "../services/turnstile";

const NAME_MIN = 2;
const NAME_MAX = 100;
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 350;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function jsonError(message: string, status: number): Response {
  return Response.json({ ok: false, error: message }, { status });
}

function encodeCursor(cursor: EntryCursor): string {
  return btoa(JSON.stringify(cursor));
}

function decodeCursor(value: string | null): EntryCursor | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(atob(value)) as EntryCursor;
    if (
      typeof parsed.createdAt !== "number" ||
      typeof parsed.id !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function listEntries(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const requestedLimit = Number(url.searchParams.get("limit") ?? DEFAULT_LIMIT);
  const limit = Math.min(
    Math.max(Number.isFinite(requestedLimit) ? requestedLimit : DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );
  const cursor = decodeCursor(url.searchParams.get("cursor"));

  const query = cursor
    ? `SELECT id, name, message, created_at, moderation_status
       FROM entries
       WHERE moderation_status = 'visible'
         AND (created_at < ?1 OR (created_at = ?1 AND id < ?2))
       ORDER BY created_at DESC, id DESC
       LIMIT ?3`
    : `SELECT id, name, message, created_at, moderation_status
       FROM entries
       WHERE moderation_status = 'visible'
       ORDER BY created_at DESC, id DESC
       LIMIT ?1`;

  const statement = cursor
    ? env.DB.prepare(query).bind(cursor.createdAt, cursor.id, limit + 1)
    : env.DB.prepare(query).bind(limit + 1);

  const rows = await statement.all<GuestbookEntry>();
  const hasMore = rows.results.length > limit;
  const entries = rows.results.slice(0, limit);
  const last = entries.at(-1);

  return Response.json({
    ok: true,
    entries,
    nextCursor:
      hasMore && last
        ? encodeCursor({ createdAt: last.created_at, id: last.id })
        : null
  });
}

export async function createEntry(
  request: Request,
  env: Env
): Promise<Response> {
  if (request.method !== "POST") {
    return jsonError("Method not allowed", 405);
  }

  const fingerprint = await createVisitorFingerprint(
    request,
    env.FINGERPRINT_SALT
  );

  const rateLimitSeconds = Number(env.RATE_LIMIT_SECONDS ?? "5");
  if (await isRateLimited(env.DB, fingerprint, rateLimitSeconds)) {
    return jsonError("Please wait before trying again.", 429);
  }

  await recordAbuseEvent(env.DB, "submission_attempt", fingerprint);

  let body: {
    name?: unknown;
    message?: unknown;
    turnstileToken?: unknown;
    website?: unknown;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  if (body.website) {
    return jsonError("Spam detected.", 400);
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const message =
    typeof body.message === "string" ? body.message.trim() : "";
  const token =
    typeof body.turnstileToken === "string" ? body.turnstileToken : "";

  if (name.length < NAME_MIN || name.length > NAME_MAX) {
    return jsonError("Name must be 2–100 characters.", 400);
  }

  if (message.length < MESSAGE_MIN || message.length > MESSAGE_MAX) {
    return jsonError("Message must be 10–350 characters.", 400);
  }

  if (!(await verifyTurnstile(token, env.TURNSTILE_SECRET))) {
    return jsonError("Verification failed. Please try again.", 400);
  }

  const dailyLimit = Math.max(Number(env.DAILY_ENTRY_LIMIT ?? "1"), 1);
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;

  const dailyCount = await env.DB
    .prepare(
      `SELECT COUNT(*) AS count
       FROM entries
       WHERE fingerprint_hash = ?1
         AND created_at >= ?2
         AND moderation_status != 'deleted'`
    )
    .bind(fingerprint, cutoff)
    .first<{ count: number }>();

  if (Number(dailyCount?.count ?? 0) >= dailyLimit) {
    return jsonError(
      "You've already signed the guestbook today. Come back tomorrow!",
      429
    );
  }

  const now = Date.now();

  const result = await env.DB
    .prepare(
      `INSERT INTO entries
       (name, message, created_at, fingerprint_hash, moderation_status)
       VALUES (?1, ?2, ?3, ?4, 'visible')`
    )
    .bind(name, message, now, fingerprint)
    .run();

  return Response.json(
    {
      ok: true,
      entry: {
        id: result.meta.last_row_id,
        name,
        message,
        created_at: now,
        moderation_status: "visible"
      }
    },
    { status: 201 }
  );
}
