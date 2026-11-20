import type { EntryCursor, Env, GuestbookEntry } from "../types/guestbook";
import { getConfig } from "../config";
import { errorResponse, json, methodNotAllowed } from "../http";
import { createVisitorFingerprint } from "../services/fingerprint";
import { isRateLimited, recordAbuseEvent } from "../services/rateLimit";
import { verifyTurnstile } from "../services/turnstile";
import { validateEntryInput } from "../services/validation";
import { requireAdmin } from "./admin";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function encodeCursor(cursor: EntryCursor): string {
  return btoa(JSON.stringify(cursor));
}

function decodeCursor(value: string | null): EntryCursor | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(atob(value)) as EntryCursor;
    return typeof parsed.createdAt === "number" && typeof parsed.id === "number"
      ? parsed
      : null;
  } catch {
    return null;
  }
}

export async function listEntries(request: Request, env: Env): Promise<Response> {
  if (request.method !== "GET") {
    return methodNotAllowed("GET");
  }

  const url = new URL(request.url);
  const moderationView = url.searchParams.get("moderation") === "all";
  if (moderationView) {
    const denied = await requireAdmin(request, env);
    if (denied) return denied;
  }

  const requestedLimit = Number(url.searchParams.get("limit") ?? DEFAULT_LIMIT);
  const limit = Math.min(
    Math.max(
      Number.isFinite(requestedLimit) ? requestedLimit : DEFAULT_LIMIT,
      1
    ),
    MAX_LIMIT
  );
  const cursor = decodeCursor(url.searchParams.get("cursor"));

  const statement = cursor
    ? env.DB.prepare(
        `SELECT id, name, world, message, created_at, moderation_status
         FROM entries
         WHERE ${moderationView ? "1 = 1" : "moderation_status = 'visible'"}
           AND (created_at < ?1 OR (created_at = ?1 AND id < ?2))
         ORDER BY created_at DESC, id DESC
         LIMIT ?3`
      ).bind(cursor.createdAt, cursor.id, limit + 1)
    : env.DB.prepare(
        `SELECT id, name, world, message, created_at, moderation_status
         FROM entries
         WHERE ${moderationView ? "1 = 1" : "moderation_status = 'visible'"}
         ORDER BY created_at DESC, id DESC
         LIMIT ?1`
      ).bind(limit + 1);

  const rows = await statement.all<GuestbookEntry>();
  const hasMore = rows.results.length > limit;
  const entries = rows.results.slice(0, limit);
  const last = entries.at(-1);

  return json({
    ok: true,
    entries,
    nextCursor:
      hasMore && last
        ? encodeCursor({ createdAt: last.created_at, id: last.id })
        : null
  });
}

export async function createEntry(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return methodNotAllowed("POST");
  }

  let body: {
    name?: unknown;
    message?: unknown;
    turnstileToken?: unknown;
    website?: unknown;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return errorResponse("Invalid request body.", 400);
  }

  if (body.website) {
    return errorResponse("Spam detected.", 400);
  }

  const validation = validateEntryInput(body.name, body.message);
  if (!validation.ok) {
    return errorResponse(validation.error, 400);
  }

  const token =
    typeof body.turnstileToken === "string" ? body.turnstileToken : "";

  if (!token) {
    return errorResponse("Verification required.", 400);
  }

  const fingerprint = await createVisitorFingerprint(
    request,
    env.FINGERPRINT_SALT
  );
  const config = getConfig(env);

  if (
    await isRateLimited(
      env.DB,
      fingerprint,
      config.rateLimitSeconds
    )
  ) {
    return errorResponse("Please wait before trying again.", 429);
  }

  if (!(await verifyTurnstile(token, env.TURNSTILE_SECRET))) {
    await recordAbuseEvent(env.DB, "turnstile_failed", fingerprint);
    return errorResponse("Verification failed. Please try again.", 400);
  }

  if (config.dailyEntryLimit > 0) {
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

    if (Number(dailyCount?.count ?? 0) >= config.dailyEntryLimit) {
      await recordAbuseEvent(env.DB, "daily_limit", fingerprint);
      return errorResponse(
        "You've already signed the guestbook today. Come back tomorrow!",
        429
      );
    }
  }

  const now = Date.now();

  await recordAbuseEvent(env.DB, "submission_attempt", fingerprint);

  const result = await env.DB
    .prepare(
      `INSERT INTO entries
       (name, world, message, created_at, fingerprint_hash, moderation_status)
       VALUES (?1, ?2, ?3, ?4, ?5, 'visible')`
    )
    .bind(validation.name, validation.world, validation.message, now, fingerprint)
    .run();

  return json(
    {
      ok: true,
      entry: {
        id: result.meta.last_row_id,
        name: validation.name,
        world: validation.world,
        message: validation.message,
        created_at: now,
        moderation_status: "visible"
      }
    },
    201
  );
}
