import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { githubProfileUrl } from "@/lib/portfolio-data";

const navigation = [
  { label: "Overview", to: "/" },
  { label: "Projects", to: "/projects" },
  { label: "Case study", to: "/case-study" },
  { label: "Credentials", to: "/credentials" },
  { label: "Contact", to: "/contact" },
] as const;

export function SiteShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="site-grid pointer-events-none fixed inset-0" aria-hidden="true" />
      <div className="ambient-wash pointer-events-none fixed inset-0" aria-hidden="true" />
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 lg:px-10">
          <Link to="/" className="group flex items-center gap-3" aria-label="Jawad Ul Hadi home">
            <span className="grid size-9 place-items-center rounded-md border border-primary/35 bg-primary/10 font-display text-sm font-bold text-primary transition-colors group-hover:bg-primary/15">
              JU
            </span>
            <span className="leading-tight">
              <span className="block font-display text-sm font-semibold">Jawad Ul Hadi</span>
              <span className="block font-mono text-[10px] text-muted-foreground">
                Backend Lead Engineer
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {navigation.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-secondary text-foreground" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:block">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="button-sweep border-border bg-card/60"
            >
              <a href={githubProfileUrl} target="_blank" rel="noreferrer">
                GitHub <ArrowUpRight aria-hidden="true" />
              </a>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </Button>
        </div>
        {menuOpen ? (
          <nav
            className="border-t border-border bg-background px-5 py-4 md:hidden"
            aria-label="Mobile navigation"
          >
            {navigation.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className="block border-b border-border/60 py-3 text-sm text-muted-foreground"
                activeProps={{ className: "text-primary" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>
      <main className="relative z-10">{children}</main>
      <footer className="relative z-10 border-t border-border/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <span>© 2026 Jawad Ul Hadi · Backend Lead Engineer</span>
          <div className="flex gap-5">
            <a
              className="transition-colors hover:text-foreground"
              href={githubProfileUrl}
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            <a
              className="transition-colors hover:text-foreground"
              href="mailto:jawadulhadicc@gmail.com"
            >
              Email
            </a>
            <Link className="transition-colors hover:text-foreground" to="/contact">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
