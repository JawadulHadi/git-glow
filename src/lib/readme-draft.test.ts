import { describe, expect, it } from "vitest";
import { buildGithubPublishUrl, splitDraftError, withBrandHeader } from "./readme-draft";

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

describe("publishing helpers", () => {
  it("adds the brand banner and mark", () => {
    const result = withBrandHeader("# Title");
    expect(result).toContain("/brand/banner.png");
    expect(result).toContain("/brand/logo-mark.png");
    expect(result.endsWith("# Title\n")).toBe(true);
  });

  it("pre-fills short READMEs and falls back for long ones", () => {
    expect(buildGithubPublishUrl("qeloma-ocr", "# Hi").prefilled).toBe(true);
    const long = buildGithubPublishUrl("qeloma-ocr", "x".repeat(8000));
    expect(long.prefilled).toBe(false);
    expect(long.url).toBe("https://github.com/JawadulHadi/qeloma-ocr/edit/main/README.md");
  });
});
