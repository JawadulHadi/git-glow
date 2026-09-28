export type RepoHost = "github" | "gitlab" | "bitbucket";

export type RepoRef = { host: RepoHost; owner: string; repo: string };

export type FactLine = { text: string; url: string };

export type SourceFacts = {
  source: string;
  url: string;
  available: boolean;
  note?: string;
  lines: FactLine[];
};

const HOSTS: Record<string, RepoHost> = {
  "github.com": "github",
  "gitlab.com": "gitlab",
  "bitbucket.org": "bitbucket",
};

/** Parses a GitHub, GitLab or Bitbucket repository link. GitLab keeps nested group paths. */
export function parseRepoUrl(value: string): RepoRef | null {
  let url: URL;
  try {
    url = new URL(value.trim().startsWith("http") ? value.trim() : `https://${value.trim()}`);
  } catch {
    return null;
  }
  const host = HOSTS[url.hostname.replace(/^www\./, "")];
  if (!host) return null;
  const parts = url.pathname
    .replace(/\.git$/, "")
    .split("/")
    .filter(Boolean);
  const stop = parts.indexOf("-");
  const segments = stop === -1 ? parts : parts.slice(0, stop);
  if (segments.length < 2) return null;
  if (host === "gitlab") {
    const repo = segments[segments.length - 1] ?? "";
    return { host, owner: segments.slice(0, -1).join("/"), repo };
  }
  return { host, owner: segments[0] ?? "", repo: segments[1] ?? "" };
}

const numberFormat = new Intl.NumberFormat("de-DE");

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

/** Formats an ISO date as DD/MM/YYYY (UTC). */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "unknown date";
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${date.getUTCFullYear()}`;
}

/** Renders collected facts as the "Verified facts" Markdown section. Every line links to its source. */
export function formatFacts(facts: SourceFacts[]): string {
  const blocks = facts.map((fact) => {
    const heading = `### ${fact.source}\n\n`;
    if (!fact.available)
      return `${heading}- Unavailable: ${fact.note ?? "the source could not be reached."}`;
    if (fact.lines.length === 0) return `${heading}- No public data found.`;
    return heading + fact.lines.map((line) => `- ${line.text} ([source](${line.url}))`).join("\n");
  });
  return `## Verified facts\n\n${blocks.join("\n\n")}\n\n`;
}
