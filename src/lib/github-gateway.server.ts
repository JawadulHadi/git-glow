const GATEWAY_URL = "https://connector-gateway.lovable.dev/github";

export type GithubResult<T> =
  { ok: true; status: number; data: T } | { ok: false; status: number; message: string };

/** Calls the GitHub REST API through the gateway, as the visitor when userKey is given. */
export async function githubRequest<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
  userKey?: string,
): Promise<GithubResult<T>> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  // A visitor's own GitHub connection wins; the shared connection is only a public-read fallback.
  const githubKey = userKey ?? process.env["GITHUB_API_KEY"];
  if (!lovableKey || !githubKey) {
    return { ok: false, status: 500, message: "GitHub is not connected to this studio." };
  }
  const response = await fetch(`${GATEWAY_URL}/${path.replace(/^\//, "")}`, {
    method: init.method ?? "GET",
    headers: {
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": githubKey,
    },
    body: init.body === undefined ? null : JSON.stringify(init.body),
  });
  const text = await response.text();
  if (!response.ok) {
    let message = text.slice(0, 300);
    try {
      message = (JSON.parse(text) as { message?: string }).message ?? message;
    } catch {
      // keep raw text
    }
    console.error(`GitHub request failed [${response.status}] ${path}: ${message}`);
    return { ok: false, status: response.status, message };
  }
  return { ok: true, status: response.status, data: (text ? JSON.parse(text) : null) as T };
}

export function repoPath(owner: string, repo: string): string {
  return `repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
}
