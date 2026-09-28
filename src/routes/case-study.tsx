import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Database, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageIntro } from "@/components/page-intro";

export const Route = createFileRoute("/case-study")({
  head: () => ({ meta: [
    { title: "Designing for AI failure · Jawad Ul Hadi" },
    { name: "description", content: "A three-stage backend resilience model for AI systems: retry, retrieval fallback, and rule-based output." },
    { property: "og:title", content: "Designing for AI failure" },
    { property: "og:description", content: "A practical architecture for predictable AI degradation." },
    { property: "og:type", content: "article" },
    { name: "twitter:card", content: "summary_large_image" },
  ], links: [{ rel: "canonical", href: "/case-study" }] }),
  component: CaseStudyPage,
});

const stages = [
  { number: "01", title: "Retry", icon: RefreshCw, text: "Recover transient failures with bounded retries, explicit timeouts, and observable attempts." },
  { number: "02", title: "Retrieval fallback", icon: Database, text: "Ground the response in available knowledge when the primary model path cannot complete safely." },
  { number: "03", title: "Rule-based floor", icon: ShieldCheck, text: "Return a deterministic minimum-quality response rather than exposing a model or provider failure." },
] as const;

function CaseStudyPage() {
  return <>
    <PageIntro eyebrow="Architecture note / 02" title="Designing for AI failure.">
      Production AI is a dependency with uncertain latency, availability, and output. This recovery model makes failure an explicit path through the system.
    </PageIntro>
    <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-10">
      <div className="relative grid gap-3 lg:grid-cols-3">
        <div className="architecture-line absolute left-[16%] right-[16%] top-11 hidden h-px lg:block" aria-hidden="true" />
        {stages.map((stage) => <article key={stage.number} className="glass-panel relative p-6">
          <div className="flex items-center justify-between"><span className="grid size-11 place-items-center rounded-md border border-primary/30 bg-primary/10 text-primary"><stage.icon className="size-5" aria-hidden="true" /></span><span className="font-mono text-[10px] text-muted-foreground">{stage.number} / 03</span></div>
          <h2 className="mt-10 font-display text-2xl font-semibold">{stage.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{stage.text}</p>
        </article>)}
      </div>
      <div className="mt-14 grid gap-10 border-y border-border py-12 lg:grid-cols-2">
        <div><p className="font-mono text-[10px] uppercase text-primary">Design principle</p><h2 className="mt-3 font-display text-3xl font-semibold">Every fallback is a product decision.</h2><p className="mt-4 leading-relaxed text-muted-foreground">The system does not hide uncertainty. It records which path produced the answer, preserves human oversight, and keeps recovery logic replaceable as models and retrieval systems change.</p></div>
        <ul className="space-y-4">{["Provider boundaries remain replaceable", "Failure states stay observable", "Deterministic output remains available", "Recovery paths can be tested independently"].map((item) => <li key={item} className="flex items-center gap-3 border-b border-border pb-4"><CheckCircle2 className="size-4 text-success" aria-hidden="true" /><span>{item}</span></li>)}</ul>
      </div>
      <div className="mt-10"><Button asChild className="button-sweep rounded-full"><Link to="/projects">See the public projects <ArrowRight /></Link></Button></div>
    </section>
  </>;
}