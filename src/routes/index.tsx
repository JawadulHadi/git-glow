import { Suspense } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Github } from "lucide-react";
import { ActivityGrid } from "@/components/activity-grid";
import { Button } from "@/components/ui/button";
import { githubActivityQueryOptions } from "@/lib/github-query";
import { githubProfileUrl, impact, projects } from "@/lib/portfolio-data";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(githubActivityQueryOptions()),
  head: () => ({
    meta: [
      { title: "Jawad Ul Hadi · Backend Lead Engineer" },
      {
        name: "description",
        content:
          "Backend lead engineer designing reliable multi-tenant SaaS, AI systems, and high-throughput services.",
      },
      { property: "og:title", content: "Jawad Ul Hadi · Backend Lead Engineer" },
      {
        property: "og:description",
        content: "Backend architecture, AI integration, and production reliability.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <section className="mx-auto grid min-h-[calc(100vh-4.5rem)] max-w-7xl items-center gap-14 px-5 py-16 lg:grid-cols-12 lg:px-10 lg:py-20">
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 font-mono text-[10px] text-muted-foreground backdrop-blur-xl">
            <span className="size-1.5 rounded-full bg-success" /> Backend Lead Engineer · Islamabad,
            Pakistan
          </div>
          <h1 className="mt-7 font-display text-6xl font-semibold leading-[0.9] text-balance sm:text-7xl lg:text-[5.6rem]">
            Jawad Ul Hadi
            <span className="mt-3 block text-primary">Systems that hold under load.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            I design backend platforms for multi-tenant SaaS, AI-enabled products, and
            high-throughput services—with reliability built into every boundary.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="button-sweep rounded-full">
              <Link to="/projects">
                Explore projects <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full bg-card/40">
              <a href={githubProfileUrl} target="_blank" rel="noreferrer">
                <Github aria-hidden="true" /> GitHub profile
              </a>
            </Button>
          </div>
          <div className="mt-12 grid max-w-2xl grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
            {impact.map((item) => (
              <div key={item.label} className="bg-card/80 px-5 py-4 backdrop-blur-xl">
                <p className="font-display text-2xl font-semibold text-foreground">{item.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-5">
          <div className="glass-panel p-5 sm:p-7">
            <Suspense fallback={<ActivitySkeleton />}>
              <ActivityGrid compact />
            </Suspense>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface/45">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-10 lg:py-20">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-[11px] uppercase text-primary">Selected open source</p>
              <h2 className="mt-3 font-display text-4xl font-semibold">The Qeloma suite</h2>
            </div>
            <Button asChild variant="ghost">
              <Link to="/projects">
                View all project evidence <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <div className="mt-9 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2">
            {projects.map((project, index) => (
              <a
                key={project.name}
                href={project.href}
                target="_blank"
                rel="noreferrer"
                className="group bg-background p-6 transition-colors hover:bg-secondary/70"
              >
                <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                  <span>
                    0{index + 1} / {project.focus}
                  </span>
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="mt-8 font-display text-2xl font-semibold">{project.name}</h3>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  {project.description}
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-10 lg:py-24">
        <div className="grid gap-8 border-y border-border py-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p className="font-mono text-[11px] uppercase text-primary">Technical case study</p>
            <h2 className="mt-4 font-display text-4xl font-semibold">Designing for AI failure</h2>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              A production resilience pattern that moves from retry to retrieval fallback to a
              deterministic rule-based floor.
            </p>
          </div>
          <div className="flex items-end lg:col-span-4 lg:justify-end">
            <Button asChild variant="outline" className="button-sweep">
              <Link to="/case-study">
                Read the architecture <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function ActivitySkeleton() {
  return (
    <div
      className="h-48 animate-pulse rounded-md bg-secondary"
      aria-label="Loading public GitHub activity"
    />
  );
}
