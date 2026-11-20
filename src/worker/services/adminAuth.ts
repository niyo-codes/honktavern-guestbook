import type { Env } from "../types/guestbook";

const COOKIE = "honk_admin";
const SESSION_TTL = 8 * 60 * 60 * 1000;

function encode(value: string): string {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decode(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  return atob(padded);
}

async function sign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  const bytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return encode(String.fromCharCode(...new Uint8Array(bytes)));
}

async function verifySignature(value: string, signature: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  try {
    return await crypto.subtle.verify(
      "HMAC",
      key,
      Uint8Array.from(atob(decode(signature)), (char) => char.charCodeAt(0)),
      new TextEncoder().encode(value)
    );
  } catch {
    return false;
  }
}

export async function createAdminSession(env: Env): Promise<string> {
  if (!env.ADMIN_SESSION_SECRET) throw new Error("Admin session secret is not configured.");
  const payload = encode(JSON.stringify({ exp: Date.now() + SESSION_TTL }));
  const signature = await sign(payload, env.ADMIN_SESSION_SECRET);
  return `${payload}.${signature}`;
}

export async function isAdmin(request: Request, env: Env): Promise<boolean> {
  if (!env.ADMIN_SESSION_SECRET) return false;
  const cookie = request.headers.get("Cookie") ?? "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!match) return false;

  const [payload, signature] = match[1].split(".");
  if (!payload || !signature) return false;

  try {
    const data = JSON.parse(decode(payload)) as { exp?: number };
    if (!data.exp || data.exp < Date.now()) return false;
    return await verifySignature(payload, signature, env.ADMIN_SESSION_SECRET);
  } catch {
    return false;
  }
}

export function sessionCookie(token: string): string {
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL / 1000}`;
}

export function clearedSessionCookie(): string {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}
