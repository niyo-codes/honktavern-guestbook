import type { Env } from "./types/guestbook";
import { getConfig } from "./config";
import { listEntries, createEntry } from "./api/entries";
import { health, databaseHealth } from "./api/health";
import { getGuestbookState, likeGuestbook, updateGreeting } from "./api/interactions";
import { adminLogin, adminLogout } from "./api/admin";
import {
  moderation,
  moderationStatusContract
} from "./api/moderation";
import { corsHeaders, isAllowedOrigin, json } from "./http";

function withCors(response: Response, request: Request, env: Env): Response {
  const headers = new Headers(response.headers);
  const cors = corsHeaders(request, env);

  for (const [key, value] of cors.entries()) {
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

    if (!url.pathname.startsWith("/api/")) {
      const assetResponse = await env.ASSETS.fetch(request);
      return withCors(assetResponse, request, env);
    }

    if (!isAllowedOrigin(request, env)) {
      return new Response("Origin not allowed", { status: 403 });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request, env)
      });
    }

    try {
      let response: Response;

      switch (url.pathname) {
        case "/api/health":
          response = request.method === "GET"
            ? await health()
            : new Response("Method not allowed", { status: 405 });
          break;

        case "/api/health/db":
          response = request.method === "GET"
            ? await databaseHealth(env)
            : new Response("Method not allowed", { status: 405 });
          break;

        case "/api/config":
          response = request.method === "GET"
            ? json({
                ok: true,
                turnstileSiteKey: getConfig(env).turnstileSiteKey
              })
            : new Response("Method not allowed", { status: 405 });
          break;

        case "/api/guestbook":
          response = request.method === "GET"
            ? await getGuestbookState(request, env)
            : new Response("Method not allowed", { status: 405 });
          break;

        case "/api/likes":
          response = await likeGuestbook(request, env);
          break;

        case "/api/admin/login":
          response = await adminLogin(request, env);
          break;

        case "/api/admin/logout":
          response = await adminLogout(request, env);
          break;

        case "/api/admin/greeting":
          response = await updateGreeting(request, env);
          break;

        case "/api/entries":
          response =
            request.method === "GET"
              ? await listEntries(request, env)
              : await createEntry(request, env);
          break;

        case "/api/moderation":
          response = await moderation(request, env);
          break;

        case "/api/moderation/status":
          response = await moderationStatusContract(request, env);
          break;

        default:
          response = json({ ok: false, error: "Not found" }, 404);
      }

      return withCors(response, request, env);
    } catch (error) {
      console.error("API request failed", error);

      return withCors(
        json(
          {
            ok: false,
            error: "The guestbook service is temporarily unavailable."
          },
          500
        ),
        request,
        env
      );
    }
  }
};
