import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, type FormEvent } from "react";
import { Check, Copy, Github, Loader2, Sparkles, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageIntro } from "@/components/page-intro";
import { buildGithubPublishUrl, streamReadmeDraft, withBrandHeader } from "@/lib/readme-draft";

export const Route = createFileRoute("/readme-studio")({
  head: () => ({
    meta: [
      { title: "README studio | Jawad Ul Hadi" },
      {
        name: "description",
        content: "Owner tool for drafting branded repository READMEs for Jawad Ul Hadi's projects.",
      },
      { property: "og:title", content: "README studio | Jawad Ul Hadi" },
      { property: "og:description", content: "Draft polished, on-brand repository READMEs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReadmeStudio,
});

const fieldClass =
  "w-full rounded-md border border-border bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

function ReadmeStudio() {
  const [accessCode, setAccessCode] = useState("");
  const [repositoryName, setRepositoryName] = useState("");
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
    setIsDrafting(true);
    try {
      await streamReadmeDraft(
        { accessCode, repositoryName, description, existingReadme },
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
    await navigator.clipboard.writeText(withBrandHeader(draft));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function handlePublish() {
    const content = withBrandHeader(draft);
    const { url, prefilled } = buildGithubPublishUrl(repositoryName, content);
    if (prefilled) {
      setPublishNote("GitHub opened with your README ready. Review it and commit.");
    } else {
      await navigator.clipboard.writeText(content);
      setPublishNote(
        "This README is too long to pre-fill, so it's copied. Paste it into the GitHub editor that opened.",
      );
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-16 lg:px-10">
      <PageIntro eyebrow="Owner tool" title="README studio">
        Share a repository description and its current README, and get a polished draft in your
        brand voice. Missing details are flagged, never invented.
      </PageIntro>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="glass-panel space-y-5 rounded-lg p-6">
          <label className="block space-y-2">
            <span className="text-sm font-medium">Owner access code</span>
            <input
              type="password"
              required
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              className={fieldClass}
              autoComplete="current-password"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Repository name</span>
            <input
              required
              value={repositoryName}
              onChange={(e) => setRepositoryName(e.target.value)}
              placeholder="qeloma-verdict"
              className={fieldClass}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Repository description</span>
            <textarea
              required
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What it does, who it's for, the stack and how it runs."
              className={fieldClass}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Existing README (optional)</span>
            <textarea
              rows={10}
              value={existingReadme}
              onChange={(e) => setExistingReadme(e.target.value)}
              placeholder="Paste the current README markdown here."
              className={`${fieldClass} font-mono text-xs`}
            />
          </label>
          <div className="flex gap-3">
            <Button type="submit" disabled={isDrafting}>
              {isDrafting ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {isDrafting ? "Drafting…" : "Draft README"}
            </Button>
            {isDrafting && (
              <Button
                type="button"
                variant="outline"
                onClick={() => controllerRef.current?.abort()}
              >
                <Square /> Stop
              </Button>
            )}
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </form>

        <section
          className="glass-panel flex min-h-96 flex-col rounded-lg p-6"
          aria-label="Draft README"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold">Draft</h2>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!draft || isDrafting}
                onClick={handleCopy}
              >
                {copied ? <Check /> : <Copy />}
                {copied ? "Copied" : "Copy markdown"}
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!draft || isDrafting}
                onClick={handlePublish}
              >
                <Github /> Publish to GitHub
              </Button>
            </div>
          </div>
          {publishNote && <p className="mb-3 text-xs text-muted-foreground">{publishNote}</p>}
          {draft ? (
            <pre className="flex-1 overflow-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground/90">
              {draft}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">
              {isDrafting
                ? "Thinking through the structure…"
                : "Your drafted README will appear here."}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
