import { describe, expect, it } from "vitest";
import { buildGithubPublishUrl, splitDraftError } from "./readme-draft";

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
  it("pre-fills short READMEs and falls back for long ones", () => {
    expect(buildGithubPublishUrl("alex-morgan-demo", "signal-cache", "# Hi").prefilled).toBe(
      true,
    );
    const long = buildGithubPublishUrl("alex-morgan-demo", "signal-cache", "x".repeat(8000));
    expect(long.prefilled).toBe(false);
    expect(long.url).toBe(
      "https://github.com/alex-morgan-demo/signal-cache/edit/main/README.md",
    );
  });
});
