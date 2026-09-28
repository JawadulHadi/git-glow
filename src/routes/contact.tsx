import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { PageIntro } from "@/components/page-intro";
import { contactLinks } from "@/lib/portfolio-data";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact · Jawad Ul Hadi" },
      {
        name: "description",
        content:
          "Contact Jawad Ul Hadi about backend leadership, architecture, and resilient AI systems.",
      },
      { property: "og:title", content: "Contact · Jawad Ul Hadi" },
      {
        property: "og:description",
        content: "Discuss backend leadership, system architecture, or resilient AI products.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <>
      <PageIntro eyebrow="Contact / 04" title="Let’s build something resilient.">
        Open to conversations about backend leadership, architecture reviews, AI integration, and
        production reliability.
      </PageIntro>
      <section className="mx-auto max-w-7xl px-5 pb-24 lg:px-10">
        <div className="divide-y divide-border border-y border-border">
          {contactLinks.map((link, index) => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel={link.href.startsWith("http") ? "noreferrer" : undefined}
              className="group flex items-center justify-between py-7"
            >
              <div className="flex items-center gap-5">
                <span className="font-mono text-[10px] text-muted-foreground">0{index + 1}</span>
                <span className="font-display text-3xl font-semibold sm:text-4xl">
                  {link.label}
                </span>
              </div>
              <ArrowUpRight
                className="size-6 text-primary transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
