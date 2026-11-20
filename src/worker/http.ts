import type { Env } from "./types/guestbook";

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

export function errorResponse(message: string, status: number): Response {
  return json({ ok: false, error: message }, status);
}

export function methodNotAllowed(allow: string): Response {
  const response = errorResponse("Method not allowed", 405);
  response.headers.set("Allow", allow);
  return response;
}

export function corsHeaders(request: Request, env: Env): Headers {
  const headers = new Headers();
  const origin = request.headers.get("Origin");

  if (origin && origin === env.ALLOWED_ORIGIN) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }

  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("Access-Control-Max-Age", "86400");
  return headers;
}
