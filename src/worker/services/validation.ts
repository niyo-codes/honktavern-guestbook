export const LIMITS = {
  nameMin: 2,
  nameMax: 100,
  messageMin: 10,
  messageMax: 350
} as const;

import { findFfxivWorld } from "../data/ffxiv-worlds";

export function parseCharacterIdentity(value: string) {
  const match = value.match(/^(.*?)\s*@\s*([A-Za-z]+)$/);
  if (!match) {
    return { ok: false as const, error: "Enter your character name followed by @ and your Home World (for example, Nonyio Niyo @ Raiden)." };
  }

  const characterName = match[1].trim();
  const world = findFfxivWorld(match[2]);

  if (!world) {
    return { ok: false as const, error: "That does not look like a current FFXIV World." };
  }

  return { ok: true as const, name: characterName, world: world.name };
}

export function validateEntryInput(name: unknown, message: unknown) {
  const cleanName = typeof name === "string" ? name.trim() : "";
  const cleanMessage = typeof message === "string" ? message.trim() : "";

  if (cleanName.length < LIMITS.nameMin || cleanName.length > LIMITS.nameMax) {
    return { ok: false as const, error: "Name must be 2–100 characters." };
  }

  const identity = parseCharacterIdentity(cleanName);
  if (!identity.ok) return identity;

  if (
    cleanMessage.length < LIMITS.messageMin ||
    cleanMessage.length > LIMITS.messageMax
  ) {
    return { ok: false as const, error: "Message must be 10–350 characters." };
  }

  return { ok: true as const, name: identity.name, world: identity.world, message: cleanMessage };
}
