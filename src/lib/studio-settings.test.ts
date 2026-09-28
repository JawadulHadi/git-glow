import { describe, expect, it } from "vitest";
import { hashCode } from "./studio-settings.server";

describe("hashCode", () => {
  it("is stable and never returns the code itself", () => {
    expect(hashCode("correct-horse")).toBe(hashCode("correct-horse"));
    expect(hashCode("correct-horse")).not.toContain("correct-horse");
    expect(hashCode("a")).not.toBe(hashCode("b"));
  });
});
