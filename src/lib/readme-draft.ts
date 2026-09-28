export type ReadmeDraftInput = {
  accessCode: string;
  githubOwner: string;
  repositoryName: string;
  description: string;
  existingReadme: string;
};

const ERROR_MARKER = "[[error]]";
const MAX_PREFILL_URL_LENGTH = 7000;

/** Builds a GitHub link that opens a new README pre-filled with the content, when it fits in a URL. */
export function buildGithubPublishUrl(
  githubOwner: string,
  repositoryName: string,
  content: string,
): { url: string; prefilled: boolean } {
  const owner = githubOwner.trim().replace(/^@/, "");
  const repo = repositoryName.trim().replace(/^.*\//, "");
  const base = `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const prefillUrl = `${base}/new/main?filename=README.md&value=${encodeURIComponent(content)}`;
  if (prefillUrl.length <= MAX_PREFILL_URL_LENGTH) return { url: prefillUrl, prefilled: true };
  return { url: `${base}/edit/main/README.md`, prefilled: false };
}

/** Splits streamed text into the draft and an optional in-stream error. */
export function splitDraftError(text: string): { draft: string; error: string | null } {
  const index = text.indexOf(ERROR_MARKER);
  if (index === -1) return { draft: text, error: null };
  return {
    draft: text.slice(0, index).trimEnd(),
    error: text.slice(index + ERROR_MARKER.length).trim(),
  };
}

/** Streams a README draft from the server, calling onText with the accumulated text. */
export async function streamReadmeDraft(
  input: ReadmeDraftInput,
  onText: (text: string) => void,
  signal: AbortSignal,
): Promise<string> {
  const response = await fetch("/api/readme-draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });

  if (!response.ok || !response.body) {
    const detail = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(detail?.error ?? `The draft request failed (${response.status}).`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
    onText(splitDraftError(text).draft);
  }
  const { draft, error } = splitDraftError(text);
  if (error) throw new Error(error);
  return draft;
}
