import { describe, expect, it } from "vitest";
import { formatDate, formatFacts, formatNumber, parseRepoUrl } from "./sources";
import { buildBannerSvg, escapeXml, withBrandHeader, BRAND_BANNER_PATH } from "./brand";
import { parseTopics } from "./publish";

describe("parseRepoUrl", () => {
  it("parses GitHub, GitLab groups and Bitbucket", () => {
    expect(parseRepoUrl("https://github.com/alex-morgan-demo/signal-cache.git")).toEqual({
      host: "github",
      owner: "alex-morgan-demo",
      repo: "signal-cache",
    });
    expect(parseRepoUrl("gitlab.com/group/sub/app/-/tree/main")).toEqual({
      host: "gitlab",
      owner: "group/sub",
      repo: "app",
    });
    expect(parseRepoUrl("https://bitbucket.org/team/tool")).toEqual({
      host: "bitbucket",
      owner: "team",
      repo: "tool",
    });
  });
  it("rejects other hosts and incomplete links", () => {
    expect(parseRepoUrl("https://example.com/a/b")).toBeNull();
    expect(parseRepoUrl("https://github.com/only-owner")).toBeNull();
  });
});

describe("formatting", () => {
  it("uses DD/MM/YYYY and European numbers", () => {
    expect(formatDate("2026-09-03T10:00:00Z")).toBe("03/09/2026");
    expect(formatNumber(12345.5)).toBe("12.345,5");
  });
  it("links every fact and marks unavailable sources", () => {
    const md = formatFacts([
      {
        source: "GitHub · a/b",
        url: "https://github.com/a/b",
        available: true,
        lines: [{ text: "Release v1", url: "https://x" }],
      },
      {
        source: "npm · c",
        url: "https://npmjs.com/c",
        available: false,
        note: "not found or not public.",
        lines: [],
      },
    ]);
    expect(md).toContain("- Release v1 ([source](https://x))");
    expect(md).toContain("- Unavailable: not found or not public.");
  });
});

describe("brand", () => {
  it("escapes banner text", () => {
    expect(escapeXml("<a & b>")).toBe("&lt;a &amp; b&gt;");
    expect(buildBannerSvg("x<y", "t")).toContain("x&lt;y");
  });
  it("adds the header once", () => {
    const once = withBrandHeader("# Title", "repo");
    expect(once).toContain(BRAND_BANNER_PATH);
    expect(withBrandHeader(once, "repo")).toBe(once);
  });
});

describe("parseTopics", () => {
  it("normalises and deduplicates", () => {
    expect(parseTopics("TypeScript, Redis Cache, typescript, ")).toEqual([
      "typescript",
      "redis-cache",
    ]);
  });
});
