import type { ReactNode } from "react";

export function PageIntro({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-12 pt-16 lg:px-10 lg:pb-16 lg:pt-24">
      <p className="font-mono text-[11px] uppercase text-primary">{eyebrow}</p>
      <h1 className="mt-5 max-w-4xl font-display text-5xl font-semibold leading-[0.98] text-balance sm:text-6xl lg:text-7xl">
        {title}
      </h1>
      <div className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}
