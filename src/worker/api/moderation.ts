import type { Env } from "../types/guestbook";

export async function moderationUnavailable(): Promise<Response> {
  return Response.json(
    {
      ok: false,
      error: "Moderation endpoints are not enabled in this rollout."
    },
    { status: 501 }
  );
}

export function assertModerationConfigured(env: Env): void {
  void env;
}
