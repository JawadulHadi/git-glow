import { describe, expect, it } from "vitest";
import { splitDraftError } from "./readme-draft";

describe("splitDraftError", () => {
  it("returns the full draft when no error is present", () => {
    expect(splitDraftError("# Title")).toEqual({ draft: "# Title", error: null });
  });

  it("separates an in-stream error from the draft", () => {
    expect(splitDraftError("# Title\n[[error]]Failed")).toEqual({
      draft: "# Title",
      error: "Failed",
    });
  });
});
