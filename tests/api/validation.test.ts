import { describe, expect, it } from "vitest";
import { validateEntryInput } from "../../src/worker/services/validation";

describe("entry validation", () => {
  it("trims valid values", () => {
    expect(validateEntryInput("  Goos @ Raiden  ", "  Hello from the Tavern!  ")).toEqual({
      ok: true,
      name: "Goos",
      world: "Raiden",
      message: "Hello from the Tavern!"
    });
  });

  it("rejects invalid names", () => {
    expect(validateEntryInput("x", "Hello from the Tavern!").ok).toBe(false);
    expect(validateEntryInput("Goos @ NotAWorld", "Hello from the Tavern!").ok).toBe(false);
    expect(validateEntryInput("a".repeat(101) + " @ Raiden", "Hello from the Tavern!").ok).toBe(false);
  });

  it("rejects invalid messages", () => {
    expect(validateEntryInput("Goos @ Raiden", "short").ok).toBe(false);
    expect(validateEntryInput("Goos @ Raiden", "x".repeat(351)).ok).toBe(false);
  });
});
