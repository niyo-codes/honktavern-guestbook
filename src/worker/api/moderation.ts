import type { Env } from "../types/guestbook";
import { errorResponse, json, methodNotAllowed } from "../http";

export async function moderation(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return methodNotAllowed("POST");
  }

  // Stage 0 boundary only. Do not expose moderation mutations until
  // authenticated Worker sessions are implemented.
  return errorResponse("Moderation API is not enabled yet.", 501);
}

export async function moderationStatusContract(
  _request: Request,
  _env: Env
): Promise<Response> {
  return json({
    ok: true,
    supportedStatuses: ["visible", "hidden", "deleted"],
    enabled: false
  });
}
