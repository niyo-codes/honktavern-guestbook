const API_BASE = "/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {})
    }
  });

  let payload = null;
  try { payload = await response.json(); } catch {}

  if (!response.ok) {
    const error = new Error(
      payload?.error || "The guestbook service is temporarily unavailable."
    );
    error.status = response.status;
    throw error;
  }

  return payload;
}

export function getConfig() { return request("/config"); }

export function getGuestbookState() { return request("/guestbook"); }

export function likeGuestbook() {
  return request("/likes", { method: "POST" });
}

export function listEntries(cursor = null) {
  const params = new URLSearchParams({ limit: "5" });
  if (cursor) params.set("cursor", cursor);
  return request(`/entries?${params}`);
}

export function submitEntry(payload) {
  return request("/entries", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function adminLogin(password) {
  return request("/admin/login", {
    method: "POST",
    body: JSON.stringify({ password })
  });
}

export function adminLogout() {
  return request("/admin/logout", { method: "POST" });
}

export function updateGreeting(greeting) {
  return request("/admin/greeting", {
    method: "PUT",
    body: JSON.stringify({ greeting })
  });
}

export function getModerationStatus() {
  return request("/moderation/status");
}

export function moderateEntry(entryId, action) {
  return request("/moderation", {
    method: "POST",
    body: JSON.stringify({ entryId, action })
  });
}
