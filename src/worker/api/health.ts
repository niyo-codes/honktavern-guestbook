import type { Env } from "../types/guestbook";

export async function health(): Promise<Response> {
  return Response.json({
    ok: true,
    service: "honktavern-guestbook",
    timestamp: Date.now()
  });
}

export async function databaseHealth(env: Env): Promise<Response> {
  try {
    await env.DB.prepare("SELECT 1").first();
    return Response.json({
      ok: true,
      database: "reachable",
      timestamp: Date.now()
    });
  } catch {
    return Response.json(
      { ok: false, database: "unreachable", timestamp: Date.now() },
      { status: 503 }
    );
  }
}
