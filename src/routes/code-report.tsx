import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, type FormEvent } from "react";
import { Check, Copy, Download, Loader2, ScanSearch, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GithubPublishPanel } from "@/components/github-publish-panel";
import { GithubAccount } from "@/components/github-account";
import { useStudioVisit } from "@/hooks/use-studio-visit";
import { streamCodeReport } from "@/lib/code-report";
import { parseRepoUrl } from "@/lib/sources";

export const Route = createFileRoute("/code-report")({
  head: () => ({
    meta: [
      { title: "Code report · repo.io" },
      {
        name: "description",
        content:
          "Short, sourced reports on a repository's history, releases and packages, with AI interpretation kept separate.",
      },
      { property: "og:title", content: "Code report · repo.io" },
      {
        property: "og:description",
        content:
          "Verified repository facts from GitHub, GitLab, Bitbucket, npm and PyPI, plus a labelled AI summary.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CodeReportPage,
});

const fieldClass =
  "w-full rounded-md border border-border bg-background/70 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

function CodeReportPage() {
  useStudioVisit("code-report");
  const [accessCode, setAccessCode] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState(
    "https://github.com/alex-morgan-demo/signal-cache",
  );
  const [npmPackage, setNpmPackage] = useState("");
  const [pypiPackage, setPypiPackage] = useState("");
  const [code, setCode] = useState("");
  const [report, setReport] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const repo = parseRepoUrl(repositoryUrl);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const controller = new AbortController();
    controllerRef.current = controller;
    setError(null);
    setReport("");
    setIsRunning(true);
    try {
      await streamCodeReport(
        { accessCode, repositoryUrl, npmPackage, pypiPackage, code },
        setReport,
        controller.signal,
      );
    } catch (caught) {
      if (!controller.signal.aborted)
        setError(caught instanceof Error ? caught.message : "The report could not be created.");
    } finally {
      setIsRunning(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(report);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([report], { type: "text/markdown" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "CODE_REPORT.md";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-12 lg:px-10 lg:py-16">
      <header className="max-w-3xl">
        <h1 className="font-display text-5xl font-semibold leading-none text-balance sm:text-6xl">
          A short, sourced report on any project.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Verified facts come from GitHub, GitLab, Bitbucket, npm and PyPI, and each one links to
          its source. The AI interpretation is kept separate.
        </p>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]">
        <form onSubmit={handleSubmit} className="glass-panel space-y-5 p-5 sm:p-6">
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
          <GithubAccount />
          <p className="-mt-2 text-xs text-muted-foreground">
            With GitHub connected, reports read your repositories directly, including private ones.
          </p>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Repository link</span>
            <input
              value={repositoryUrl}
              onChange={(e) => setRepositoryUrl(e.target.value)}
              placeholder="https://github.com/owner/repository"
              className={fieldClass}
            />
            <span className="block text-xs text-muted-foreground">
              {repositoryUrl && !repo
                ? "Use a GitHub, GitLab or Bitbucket link."
                : "The default is a fictional example. Replace it with a real repository."}
            </span>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium">npm package</span>
              <input
                value={npmPackage}
                onChange={(e) => setNpmPackage(e.target.value)}
                placeholder="Optional"
                className={fieldClass}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">PyPI package</span>
              <input
                value={pypiPackage}
                onChange={(e) => setPypiPackage(e.target.value)}
                placeholder="Optional"
                className={fieldClass}
              />
            </label>
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Code excerpt</span>
            <span className="block text-xs text-muted-foreground">
              Optional. Not stored, and used only for this report.
            </span>
            <textarea
              rows={8}
              maxLength={20000}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={`${fieldClass} font-mono text-xs`}
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isRunning}>
              {isRunning ? <Loader2 className="animate-spin" /> : <ScanSearch />}
              {isRunning ? "Building report…" : "Create report"}
            </Button>
            {isRunning ? (
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
          <p className="text-xs text-muted-foreground">Each report uses AI credits.</p>
        </form>

        <section
          className="glass-panel flex min-h-[36rem] flex-col p-5 sm:p-6"
          aria-label="Code report"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <h2 className="font-display text-xl font-semibold">CODE_REPORT.md</h2>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!report || isRunning}
                onClick={handleCopy}
              >
                {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!report || isRunning}
                onClick={handleDownload}
              >
                <Download /> Download
              </Button>
            </div>
          </div>
          {report ? (
            <pre className="flex-1 overflow-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground/90">
              {report}
            </pre>
          ) : (
            <div className="grid flex-1 place-items-center rounded-md border border-dashed border-border bg-background/35 p-8 text-center text-sm text-muted-foreground">
              {isRunning ? "Collecting sources…" : "Your report will appear here."}
            </div>
          )}
        </section>
      </div>

      {report && !isRunning && repo?.host === "github" ? (
        <div className="mt-6">
          <GithubPublishPanel
            accessCode={accessCode}
            owner={repo.owner}
            repo={repo.repo}
            files={[{ path: "docs/CODE_REPORT.md", content: report }]}
          />
        </div>
      ) : null}
    </div>
  );
}
