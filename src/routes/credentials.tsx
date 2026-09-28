import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { PageIntro } from "@/components/page-intro";
import { capabilities } from "@/lib/portfolio-data";

export const Route = createFileRoute("/credentials")({
  head: () => ({ meta: [
    { title: "Credentials · Jawad Ul Hadi" },
    { name: "description", content: "Backend architecture capabilities and selected verified credentials from Jawad Ul Hadi." },
    { property: "og:title", content: "Credentials · Jawad Ul Hadi" },
    { property: "og:description", content: "Architecture, AI systems, reliability, and performance engineering capabilities." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ], links: [{ rel: "canonical", href: "/credentials" }] }),
  component: CredentialsPage,
});

const credentials = [
  { title: "Artificial Intelligence Fundamentals", issuer: "IBM SkillsBuild", href: "https://www.credly.com/badges/37f8ca56-518e-4ffc-8b70-dd29db910bab/linked_in_profile" },
  { title: "Cloud Computing Fundamentals", issuer: "IBM SkillsBuild", href: "https://www.credly.com/badges/1da9246d-550e-4463-8926-4dd9b0661602/linked_in_profile" },
  { title: "Cybersecurity Fundamentals", issuer: "IBM SkillsBuild", href: "https://www.credly.com/badges/50af0df4-e762-4d0e-8e0a-71eb809c9588/linked_in_profile" },
] as const;

function CredentialsPage() {
  return <>
    <PageIntro eyebrow="Capabilities / 03" title="Depth over a wall of logos.">
      The operating range behind the work: system boundaries, AI orchestration, reliability patterns, and performance engineering.
    </PageIntro>
    <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-10">
      <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2">
        {capabilities.map(([area, capability]) => <article key={area} className="bg-background p-7"><h2 className="font-display text-2xl font-semibold">{area}</h2><p className="mt-4 leading-relaxed text-muted-foreground">{capability}</p></article>)}
      </div>
      <div className="mt-16"><p className="font-mono text-[11px] uppercase text-primary">Selected credentials</p><h2 className="mt-3 font-display text-4xl font-semibold">Verified at the source.</h2>
        <div className="mt-8 divide-y divide-border border-y border-border">{credentials.map((credential) => <a key={credential.title} href={credential.href} target="_blank" rel="noreferrer" className="group flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-medium">{credential.title}</h3><p className="mt-1 text-sm text-muted-foreground">{credential.issuer}</p></div><span className="inline-flex items-center gap-2 text-sm text-primary">View credential <ExternalLink className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span></a>)}</div>
      </div>
    </section>
  </>;
}