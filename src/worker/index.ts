import type { Env } from "./types/guestbook";
import { health, databaseHealth } from "./api/health";
import { createEntry, listEntries } from "./api/entries";

function corsHeaders(request: Request, env: Env): HeadersInit {
  const origin = request.headers.get("Origin");
  const allowed = env.ALLOWED_ORIGIN;

  return {
    "Access-Control-Allow-Origin":
      origin && allowed && origin === allowed ? origin : allowed,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}

function withCors(response: Response, request: Request, env: Env): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders(request, env))) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      if (request.method === "OPTIONS") {
        return withCors(new Response(null, { status: 204 }), request, env);
      }

      try {
        let response: Response;

        if (url.pathname === "/api/health" && request.method === "GET") {
          response = await health();
        } else if (
          url.pathname === "/api/health/db" &&
          request.method === "GET"
        ) {
          response = await databaseHealth(env);
        } else if (
          url.pathname === "/api/entries" &&
          request.method === "GET"
        ) {
          response = await listEntries(request, env);
        } else if (
          url.pathname === "/api/entries" &&
          request.method === "POST"
        ) {
          response = await createEntry(request, env);
        } else {
          response = Response.json(
            { ok: false, error: "Not found" },
            { status: 404 }
          );
        }

        return withCors(response, request, env);
      } catch (error) {
        console.error("API request failed", error);
        return withCors(
          Response.json(
            { ok: false, error: "The guestbook service is temporarily unavailable." },
            { status: 500 }
          ),
          request,
          env
        );
      }
    }

    return env.ASSETS.fetch(request);
  }
};
