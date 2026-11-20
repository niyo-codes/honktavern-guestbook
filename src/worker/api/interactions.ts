import type { Env } from "../types/guestbook";
import { errorResponse, json, methodNotAllowed } from "../http";
import { createIpFingerprint } from "../services/fingerprint";
import { requireAdmin } from "./admin";

function utcDay(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getGuestbookState(
  request: Request,
  env: Env
): Promise<Response> {
  if (request.method !== "GET") return methodNotAllowed("GET");

  const fingerprint = await createIpFingerprint(request, env.FINGERPRINT_SALT);
  const day = utcDay();

  const [settings, likes, visitorLike] = await Promise.all([
    env.DB.prepare(
      "SELECT greeting, greeting_updated_at FROM guestbook_settings WHERE id = 1"
    ).first<{ greeting: string; greeting_updated_at: number | null }>(),
    env.DB.prepare(
      "SELECT COUNT(*) AS count FROM guestbook_likes"
    ).first<{ count: number }>(),
    env.DB.prepare(
      "SELECT 1 AS liked FROM guestbook_likes WHERE ip_fingerprint = ?1 AND like_day = ?2 LIMIT 1"
    ).bind(fingerprint, day).first<{ liked: number }>()
  ]);

  return json({
    ok: true,
    greeting: settings?.greeting ?? "",
    greetingUpdatedAt: settings?.greeting_updated_at ?? null,
    totalLikes: Number(likes?.count ?? 0),
    likedToday: Boolean(visitorLike?.liked)
  });
}

export async function likeGuestbook(
  request: Request,
  env: Env
): Promise<Response> {
  if (request.method !== "POST") return methodNotAllowed("POST");

  const fingerprint = await createIpFingerprint(request, env.FINGERPRINT_SALT);
  const day = utcDay();
  const now = Date.now();

  const result = await env.DB.prepare(
    `INSERT OR IGNORE INTO guestbook_likes
      (ip_fingerprint, like_day, created_at)
     VALUES (?1, ?2, ?3)`
  ).bind(fingerprint, day, now).run();

  const total = await env.DB.prepare(
    "SELECT COUNT(*) AS count FROM guestbook_likes"
  ).first<{ count: number }>();

  const accepted = Number(result.meta.changes ?? 0) > 0;

  return json({
    ok: true,
    liked: accepted,
    totalLikes: Number(total?.count ?? 0),
    message: accepted
      ? "Thanks for the like!"
      : "You've already left a like today."
  });
}

export async function updateGreeting(
  request: Request,
  env: Env
): Promise<Response> {
  if (request.method !== "PUT") return methodNotAllowed("PUT");
  const denied = await requireAdmin(request, env);
  if (denied) return denied;

  let body: { greeting?: unknown };
  try {
    body = (await request.json()) as { greeting?: unknown };
  } catch {
    return errorResponse("Invalid request body.", 400);
  }

  const greeting = typeof body.greeting === "string"
    ? body.greeting.trim()
    : "";

  if (greeting.length > 1000) {
    return errorResponse("Greeting must be 1000 characters or fewer.", 400);
  }

  const now = Date.now();

  await env.DB.prepare(
    `INSERT INTO guestbook_settings (id, greeting, greeting_updated_at)
     VALUES (1, ?1, ?2)
     ON CONFLICT(id) DO UPDATE SET
       greeting = excluded.greeting,
       greeting_updated_at = excluded.greeting_updated_at`
  ).bind(greeting, now).run();

  return json({
    ok: true,
    greeting,
    greetingUpdatedAt: now
  });
}
