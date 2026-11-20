import type { Env } from "../types/guestbook";
import { errorResponse, json, methodNotAllowed } from "../http";
import {
  clearedSessionCookie,
  createAdminSession,
  isAdmin,
  sessionCookie
} from "../services/adminAuth";

export async function adminLogin(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return methodNotAllowed("POST");

  let body: { password?: unknown };
  try {
    body = (await request.json()) as { password?: unknown };
  } catch {
    return errorResponse("Invalid request body.", 400);
  }

  if (!env.ADMIN_PASSWORD || typeof body.password !== "string") {
    return errorResponse("Administration is not configured.", 503);
  }

  if (body.password !== env.ADMIN_PASSWORD) {
    return errorResponse("Invalid administrator credentials.", 401);
  }

  const token = await createAdminSession(env);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": sessionCookie(token)
    }
  });
}

export async function adminLogout(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return methodNotAllowed("POST");
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": clearedSessionCookie()
    }
  });
}

export async function requireAdmin(request: Request, env: Env): Promise<Response | null> {
  if (!(await isAdmin(request, env))) {
    return errorResponse("Administrator authentication required.", 401);
  }
  return null;
}
