export type PublishFile = { path: string; content: string };

export type PublishInput = {
  accessCode: string;
  owner: string;
  repo: string;
  readme?: string;
  description?: string;
  topics?: string[];
  release?: { tag: string; name: string; notes: string };
  files?: PublishFile[];
  brand?: { title: string; tagline: string };
};

export type PublishStep = { label: string; ok: boolean; detail: string; url?: string };

export type PublishResult = { steps: PublishStep[]; checks: PublishStep[] };

/** Turns a comma-separated list into valid GitHub topics (lowercase, hyphens, max 20). */
export function parseTopics(value: string): string[] {
  const topics = value
    .split(",")
    .map((topic) =>
      topic
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 50),
    )
    .filter(Boolean);
  return [...new Set(topics)].slice(0, 20);
}

/** Sends the publish request to the studio server. */
export async function publishToGithub(input: PublishInput): Promise<PublishResult> {
  const response = await fetch("/api/github-publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = (await response.json().catch(() => null)) as (PublishResult & { error?: string }) | null;
  if (!response.ok || !body) throw new Error(body?.error ?? `Publishing failed (${response.status}).`);
  return body;
}
