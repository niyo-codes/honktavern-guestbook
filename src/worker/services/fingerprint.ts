export async function createVisitorFingerprint(
  request: Request,
  salt: string
): Promise<string> {
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const userAgent = request.headers.get("User-Agent") ?? "unknown";
  const material = `${salt}:\n${ip}\n${userAgent}`;

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(material)
  );

  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
