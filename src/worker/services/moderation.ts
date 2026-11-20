import type { Env, ModerationStatus } from "../types/guestbook";

const VALID_STATUSES: ModerationStatus[] = ["visible", "hidden", "deleted"];

export async function setModerationStatus(
  env: Env,
  entryId: number,
  status: ModerationStatus
) {
  if (!VALID_STATUSES.includes(status)) {
    throw new Error("Invalid moderation status.");
  }

  if (status === "visible") {
    return env.DB.prepare(
      "UPDATE entries SET moderation_status = ?1 WHERE id = ?2"
    ).bind(status, entryId).run();
  }

  if (status === "hidden") {
    return env.DB.prepare(
      "UPDATE entries SET moderation_status = ?1, hidden_at = ?2 WHERE id = ?3"
    ).bind(status, Date.now(), entryId).run();
  }

  return env.DB.prepare(
    "UPDATE entries SET moderation_status = ?1, deleted_at = ?2 WHERE id = ?3"
  ).bind(status, Date.now(), entryId).run();
}
