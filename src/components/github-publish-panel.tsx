import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Copy, ExternalLink, Github, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { GithubAccount } from "@/components/github-account";
import { appDocs } from "@/lib/app-docs";
import {
  parseTopics,
  publishToGithub,
  type PublishFile,
  type PublishInput,
  type PublishStep,
} from "@/lib/publish";

const fieldClass =
  "w-full rounded-md border border-border bg-background/70 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

type Props = {
  accessCode: string;
  owner: string;
  repo: string;
  /** Markdown to publish as README.md. */
  readme?: string;
  /** Extra docs pages, for example a code report. */
  files?: PublishFile[];
};

function StepList({ title, steps }: { title: string; steps: PublishStep[] }) {
  if (!steps.length) return null;
  return (
    <div className="space-y-2">
      <p className="font-mono text-[10px] uppercase text-muted-foreground">{title}</p>
      <ul className="space-y-1.5">
        {steps.map((step) => (
          <li key={`${title}-${step.label}`} className="flex items-start gap-2 text-sm">
            {step.ok ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-label="Done" />
            ) : (
              <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-label="Failed" />
            )}
            <span className="min-w-0">
              <span className="font-medium">{step.label}</span>
              <span className="text-muted-foreground"> · {step.detail}</span>
              {step.url ? (
                <a
                  href={step.url}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-1 inline-flex items-center text-primary"
                >
                  <ExternalLink className="size-3" aria-label="Open on GitHub" />
                </a>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GithubPublishPanel({ accessCode, owner, repo, readme, files = [] }: Props) {
  const [includeReadme, setIncludeReadme] = useState(Boolean(readme));
  const [includeBrand, setIncludeBrand] = useState(true);
  const [includeAppDocs, setIncludeAppDocs] = useState(false);
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [topics, setTopics] = useState("");
  const [tag, setTag] = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (input: PublishInput) => publishToGithub(input),
    onSuccess: (result) => {
      if (result.repoUrl) window.open(result.repoUrl, "_blank", "noopener");
    },
  });

  const allFiles = [...files, ...(includeAppDocs ? appDocs : [])];

  function handlePublish() {
    mutation.mutate({
      accessCode,
      owner: owner.trim().replace(/^@/, ""),
      repo: repo.trim().replace(/^.*\//, ""),
      readme: includeReadme && readme ? readme : undefined,
      description: description.trim() || undefined,
      topics: parseTopics(topics),
      release: tag.trim() ? { tag: tag.trim(), name: tag.trim(), notes: releaseNotes } : undefined,
      files: allFiles.length ? allFiles : undefined,
      brand: includeBrand
        ? { title: repo.trim() || "Repository", tagline: tagline.trim() || description.trim() }
        : undefined,
    });
  }

  async function copyForWiki(file: PublishFile) {
    await navigator.clipboard.writeText(file.content);
    setCopiedPath(file.path);
    window.setTimeout(() => setCopiedPath(null), 2000);
  }

  const canPublish = Boolean(accessCode && owner && repo) && !mutation.isPending;

  return (
    <section className="glass-panel space-y-5 p-5 sm:p-6" aria-label="Publish to GitHub">
      <div className="border-b border-border pb-4">
        <p className="font-mono text-[10px] uppercase text-primary">Publish</p>
        <h2 className="mt-1 font-display text-xl font-semibold">
          Publish to {owner || "owner"}/{repo || "repository"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Publishes with your own GitHub account, checks the repository, then opens it.
        </p>
      </div>

      <GithubAccount />

      <div className="space-y-3">
        {readme ? (
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={includeReadme}
              onCheckedChange={(value) => setIncludeReadme(value === true)}
            />
            Publish README.md
          </label>
        ) : null}
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={includeBrand}
            onCheckedChange={(value) => setIncludeBrand(value === true)}
          />
          Add banner and logo (SVG, stored in the repo)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={includeAppDocs}
            onCheckedChange={(value) => setIncludeAppDocs(value === true)}
          />
          Include the studio documentation in docs/
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Repository description</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={350}
            placeholder="Event-driven cache service with explicit invalidation"
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Topics</span>
          <input
            value={topics}
            onChange={(e) => setTopics(e.target.value)}
            placeholder="typescript, cache, redis"
            className={fieldClass}
          />
        </label>
        {includeBrand ? (
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-sm font-medium">Banner tagline</span>
            <input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              maxLength={90}
              placeholder="Uses the description when left empty"
              className={fieldClass}
            />
          </label>
        ) : null}
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Release tag</span>
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="v1.0.0 (optional)"
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Release notes</span>
          <textarea
            value={releaseNotes}
            onChange={(e) => setReleaseNotes(e.target.value)}
            rows={2}
            placeholder="What changed in this release"
            className={fieldClass}
          />
        </label>
      </div>

      {allFiles.length ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Docs pages</p>
          <ul className="space-y-1.5">
            {allFiles.map((file) => (
              <li
                key={file.path}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-background/40 px-3 py-2"
              >
                <span className="truncate font-mono text-xs">{file.path}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => copyForWiki(file)}>
                  <Copy /> {copiedPath === file.path ? "Copied" : "Copy for wiki"}
                </Button>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            GitHub doesn't let apps write Wiki pages, so paste these in by hand.
          </p>
        </div>
      ) : null}

      <Button type="button" onClick={handlePublish} disabled={!canPublish}>
        {mutation.isPending ? <Loader2 className="animate-spin" /> : <Github />}
        {mutation.isPending ? "Publishing…" : "Publish to GitHub"}
      </Button>
      {!accessCode ? (
        <p className="text-xs text-muted-foreground">
          Enter the owner access code above to publish.
        </p>
      ) : null}

      {mutation.error ? (
        <p className="text-sm text-destructive" role="alert">
          {mutation.error.message}
        </p>
      ) : null}
      {mutation.data ? (
        <div className="grid gap-5 rounded-md border border-border bg-background/40 p-4 sm:grid-cols-2">
          <StepList title="Published" steps={mutation.data.steps} />
          <StepList title="Confirmed on GitHub" steps={mutation.data.checks} />
        </div>
      ) : null}
    </section>
  );
}
