import type { Env } from "../types/guestbook";
import { errorResponse, json, methodNotAllowed } from "../http";
import { requireAdmin } from "./admin";

export async function moderation(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return methodNotAllowed("POST");

  const denied = await requireAdmin(request, env);
  if (denied) return denied;

  let body: { entryId?: unknown; action?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return errorResponse("Invalid request body.", 400);
  }

  const entryId = Number(body.entryId);
  const action = body.action;

  if (!Number.isInteger(entryId) || entryId < 1) {
    return errorResponse("Invalid entry ID.", 400);
  }

  if (action !== "hide" && action !== "delete" && action !== "restore") {
    return errorResponse("Unsupported moderation action.", 400);
  }

  const now = Date.now();
  const column = action === "hide"
    ? "hidden_at"
    : action === "delete"
      ? "deleted_at"
      : null;
  const status = action === "hide"
    ? "hidden"
    : action === "delete"
      ? "deleted"
      : "visible";

  if (column) {
    await env.DB.prepare(
      `UPDATE entries
       SET moderation_status = ?1, ${column} = ?2
       WHERE id = ?3`
    ).bind(status, now, entryId).run();
  } else {
    await env.DB.prepare(
      "UPDATE entries SET moderation_status = 'visible', hidden_at = NULL, deleted_at = NULL WHERE id = ?1"
    ).bind(entryId).run();
  }

  await env.DB.prepare(
    `INSERT INTO moderation_events (entry_id, action, actor, created_at)
     VALUES (?1, ?2, 'admin', ?3)`
  ).bind(entryId, action, now).run();

  return json({ ok: true, entryId, status });
}

export async function moderationStatusContract(
  request: Request,
  env: Env
): Promise<Response> {
  if (request.method !== "GET") return methodNotAllowed("GET");
  const authenticated = await requireAdmin(request, env);

  return json({
    ok: true,
    supportedStatuses: ["visible", "hidden", "deleted"],
    enabled: !authenticated,
    authenticated: !authenticated
  });
}
