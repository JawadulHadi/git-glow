import { splitDraftError } from "./readme-draft";

export type CodeReportInput = {
  accessCode: string;
  repositoryUrl: string;
  npmPackage: string;
  pypiPackage: string;
  code: string;
};

/** Streams a code report from the server, calling onText with the accumulated text. */
export async function streamCodeReport(
  input: CodeReportInput,
  onText: (text: string) => void,
  signal: AbortSignal,
): Promise<string> {
  const response = await fetch("/api/code-report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
  if (!response.ok || !response.body) {
    const detail = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(detail?.error ?? `The report request failed (${response.status}).`);
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
