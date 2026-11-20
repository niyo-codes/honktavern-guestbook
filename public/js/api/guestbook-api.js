const API_BASE = "/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {})
    }
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // Keep the original response status when the API is unavailable or malformed.
  }

  if (!response.ok) {
    const message =
      payload?.error || "The guestbook service is temporarily unavailable.";
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return payload;
}

export function listEntries(cursor = null) {
  const params = new URLSearchParams({ limit: "10" });
  if (cursor) params.set("cursor", cursor);
  return request(`/entries?${params}`);
}

export function submitEntry(payload) {
  return request("/entries", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function health() {
  return request("/health");
}
