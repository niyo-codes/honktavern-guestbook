export const LIMITS = {
  nameMin: 2,
  nameMax: 100,
  messageMin: 10,
  messageMax: 350
} as const;

export function validateEntryInput(name: unknown, message: unknown) {
  const cleanName = typeof name === "string" ? name.trim() : "";
  const cleanMessage = typeof message === "string" ? message.trim() : "";

  if (cleanName.length < LIMITS.nameMin || cleanName.length > LIMITS.nameMax) {
    return { ok: false as const, error: "Name must be 2–100 characters." };
  }

  if (
    cleanMessage.length < LIMITS.messageMin ||
    cleanMessage.length > LIMITS.messageMax
  ) {
    return { ok: false as const, error: "Message must be 10–350 characters." };
  }

  return { ok: true as const, name: cleanName, message: cleanMessage };
}
