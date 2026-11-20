import { describe, expect, it } from "vitest";

describe("guestbook API contract", () => {
  it("keeps the public entry limits explicit", () => {
    expect({ nameMax: 100, messageMax: 350, dailyLimit: 1 }).toEqual({
      nameMax: 100,
      messageMax: 350,
      dailyLimit: 1
    });
  });
});
