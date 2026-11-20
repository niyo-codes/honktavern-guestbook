export async function createVisitorFingerprint(
  request: Request,
  salt: string
): Promise<string> {
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const userAgent = request.headers.get("User-Agent") ?? "unknown";
  const material = `${salt}:\n${ip}\n${userAgent}`;

  return digest(material);
}

/**
 * Interaction fingerprint deliberately excludes User-Agent so a visitor
 * cannot bypass the one-like-per-day rule merely by changing browsers.
 * The raw IP is never stored.
 */
export async function createIpFingerprint(
  request: Request,
  salt: string
): Promise<string> {
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  return digest(`${salt}:like:\n${ip}`);
}

async function digest(material: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(material)
  );

  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
