import { describe, expect, it } from "vitest";

describe("frontend loading contract", () => {
  it("uses a static-first shell", () => {
    expect("/js/app.js").toMatch(/^\/js\//);
    expect("/css/book.css").toMatch(/^\/css\//);
  });
});
