import { useRef, useState, type FormEvent } from "react";
import { Check, Copy, Github, Loader2, Sparkles, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GithubPublishPanel } from "@/components/github-publish-panel";
import { buildGithubPublishUrl, streamReadmeDraft } from "@/lib/readme-draft";

const fieldClass =
  "w-full rounded-md border border-border bg-background/70 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

export function ReadmeStudio() {
  const [accessCode, setAccessCode] = useState("");
  const [githubOwner, setGithubOwner] = useState("alex-morgan-demo");
  const [repositoryName, setRepositoryName] = useState("signal-cache");
  const [description, setDescription] = useState("");
  const [existingReadme, setExistingReadme] = useState("");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDrafting, setIsDrafting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [publishNote, setPublishNote] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const controller = new AbortController();
    controllerRef.current = controller;
    setError(null);
    setDraft("");
    setPublishNote(null);
    setIsDrafting(true);
    try {
      await streamReadmeDraft(
        { accessCode, githubOwner, repositoryName, description, existingReadme },
        setDraft,
        controller.signal,
      );
    } catch (caught) {
      if (!controller.signal.aborted) {
        setError(caught instanceof Error ? caught.message : "Something went wrong while drafting.");
      }
    } finally {
      setIsDrafting(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(draft.trim() + "\n");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function handlePublish() {
    const content = draft.trim() + "\n";
    const { url, prefilled } = buildGithubPublishUrl(githubOwner, repositoryName, content);
    if (prefilled) {
      setPublishNote("GitHub opened with the README ready for review and commit.");
    } else {
      await navigator.clipboard.writeText(content);
      setPublishNote("The README was copied. Paste it into the GitHub editor that opened.");
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-12 lg:px-10 lg:py-16">
      <header className="max-w-3xl">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5 font-mono text-[10px] uppercase text-muted-foreground">
          <span className="size-1.5 rounded-full bg-success" /> Private drafting workspace
        </div>
        <h1 className="font-display text-5xl font-semibold leading-none text-balance sm:text-6xl">
          Turn repository context into a README people can use.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Provide the facts you trust. The studio returns clear Markdown, preserves existing
          technical details, and marks anything missing instead of inventing it.
        </p>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]">
        <form onSubmit={handleSubmit} className="glass-panel space-y-5 p-5 sm:p-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <p className="font-mono text-[10px] uppercase text-primary">Input</p>
              <h2 className="mt-1 font-display text-xl font-semibold">Repository details</h2>
            </div>
            <span className="rounded-full bg-secondary px-2.5 py-1 font-mono text-[10px] text-muted-foreground">
              Fictional example
            </span>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Owner access code</span>
            <input
              type="password"
              required
              value={accessCode}
              onChange={(event) => setAccessCode(event.target.value)}
              className={fieldClass}
              autoComplete="current-password"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium">GitHub owner</span>
              <input
                required
                value={githubOwner}
                onChange={(event) => setGithubOwner(event.target.value)}
                placeholder="alex-morgan-demo"
                className={fieldClass}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Repository name</span>
              <input
                required
                value={repositoryName}
                onChange={(event) => setRepositoryName(event.target.value)}
                placeholder="signal-cache"
                className={fieldClass}
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Repository description</span>
            <textarea
              required
              rows={5}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="A TypeScript cache service for event-driven applications, with Redis persistence and explicit invalidation rules."
              className={fieldClass}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Existing README</span>
            <span className="block text-xs text-muted-foreground">
              Optional — paste Markdown only.
            </span>
            <textarea
              rows={9}
              value={existingReadme}
              onChange={(event) => setExistingReadme(event.target.value)}
              placeholder="# Signal Cache&#10;&#10;Current setup notes and usage examples…"
              className={`${fieldClass} font-mono text-xs`}
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isDrafting}>
              {isDrafting ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {isDrafting ? "Drafting…" : "Draft README"}
            </Button>
            {isDrafting ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => controllerRef.current?.abort()}
              >
                <Square /> Stop
              </Button>
            ) : null}
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </form>

        <section
          className="glass-panel flex min-h-[42rem] flex-col p-5 sm:p-6"
          aria-label="Draft README"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <p className="font-mono text-[10px] uppercase text-primary">Output</p>
              <h2 className="mt-1 font-display text-xl font-semibold">README.md</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!draft || isDrafting}
                onClick={handleCopy}
              >
                {copied ? <Check /> : <Copy />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!draft || isDrafting}
                onClick={handlePublish}
              >
                <Github /> Open in GitHub editor
              </Button>
            </div>
          </div>
          {publishNote ? <p className="mb-3 text-xs text-muted-foreground">{publishNote}</p> : null}
          {draft ? (
            <pre className="flex-1 overflow-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground/90">
              {draft}
            </pre>
          ) : (
            <div className="grid flex-1 place-items-center rounded-md border border-dashed border-border bg-background/35 p-8 text-center">
              <div className="max-w-sm">
                <p className="font-display text-lg font-semibold">
                  {isDrafting ? "Building the document…" : "Your draft will appear here"}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  The output stays plain Markdown, ready to review, copy, or open in GitHub.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
      {draft && !isDrafting ? (
        <div className="mt-6">
          <GithubPublishPanel
            accessCode={accessCode}
            owner={githubOwner}
            repo={repositoryName}
            readme={draft.trim() + "\n"}
          />
        </div>
      ) : null}
    </div>
  );
}
