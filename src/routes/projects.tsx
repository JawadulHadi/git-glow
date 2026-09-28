import { Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { ActivityGrid } from "@/components/activity-grid";
import { PageIntro } from "@/components/page-intro";
import { githubActivityQueryOptions } from "@/lib/github-query";
import { formatEuropeanDate } from "@/lib/github-activity";
import { projects } from "@/lib/portfolio-data";

export const Route = createFileRoute("/projects")({
  loader: ({ context }) => context.queryClient.ensureQueryData(githubActivityQueryOptions()),
  head: () => ({
    meta: [
      { title: "Projects · Jawad Ul Hadi" },
      {
        name: "description",
        content:
          "Public backend and AI projects by Jawad Ul Hadi, with verified GitHub activity and curated technical milestones.",
      },
      { property: "og:title", content: "Projects · Jawad Ul Hadi" },
      {
        property: "og:description",
        content:
          "Verified public work across decision systems, OCR, document intelligence, and realtime voice.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/projects" }],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  return (
    <>
      <PageIntro eyebrow="Public work / 01" title="Architecture made inspectable.">
        Four public projects show how I approach trustworthy decisions, document intelligence,
        deterministic fallback, and realtime interfaces.
      </PageIntro>
      <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-10">
        <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2">
          {projects.map((project, index) => (
            <ProjectPanel key={project.name} project={project} index={index} />
          ))}
        </div>
      </section>
      <section className="border-y border-border bg-surface/45">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-16 lg:grid-cols-5 lg:px-10 lg:py-20">
          <div className="glass-panel p-6 lg:col-span-3">
            <Suspense fallback={<div className="h-52 animate-pulse rounded-md bg-secondary" />}>
              <ActivityGrid />
            </Suspense>
          </div>
          <div className="glass-panel p-6 lg:col-span-2">
            <p className="font-mono text-[10px] uppercase text-primary">Curated project activity</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Selected outcomes from the supplied profile. This is editorial context, not a commit
              graph.
            </p>
            <ol className="mt-7 space-y-6 border-l border-border pl-5">
              {[
                [
                  "AI integration",
                  "Built a provider-agnostic layer for OpenAI, Gemini, and Anthropic.",
                ],
                [
                  "Resilience",
                  "Designed retry, retrieval fallback, and rule-based output as a three-stage recovery model.",
                ],
                [
                  "Performance",
                  "Reduced dashboard response time from 12 seconds to under 2 seconds.",
                ],
                ["Operations", "Delivered zero-downtime migrations on live production systems."],
              ].map(([title, text]) => (
                <li key={title} className="relative">
                  <span className="absolute -left-[25px] top-1 size-2 rounded-full bg-success ring-4 ring-background" />
                  <p className="font-mono text-[10px] uppercase text-success">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </>
  );
}

function ProjectPanel({ project, index }: { project: (typeof projects)[number]; index: number }) {
  const { data } = useSuspenseQuery(githubActivityQueryOptions());
  const repository = data.repositories.find((item) => item.name === project.shortName);
  return (
    <a
      href={project.href}
      target="_blank"
      rel="noreferrer"
      className="group bg-background p-7 transition-colors hover:bg-secondary/65"
    >
      <div className="flex justify-between font-mono text-[10px] uppercase text-muted-foreground">
        <span>
          0{index + 1} · {project.focus}
        </span>
        <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </div>
      <h2 className="mt-10 font-display text-3xl font-semibold">{project.name}</h2>
      <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">{project.description}</p>
      <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-border pt-4 font-mono text-[10px] text-muted-foreground">
        <span className="text-primary">Public repository</span>
        {repository?.language ? <span>{repository.language}</span> : null}
        {repository ? (
          <span>Last push {formatEuropeanDate(repository.pushed_at)}</span>
        ) : (
          <span>Repository details unavailable</span>
        )}
      </div>
    </a>
  );
}
