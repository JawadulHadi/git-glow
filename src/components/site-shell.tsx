import { Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="site-grid pointer-events-none fixed inset-0" aria-hidden="true" />
      <div className="ambient-wash pointer-events-none fixed inset-0" aria-hidden="true" />
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 lg:px-10">
          <Link to="/" className="group flex items-center gap-3" aria-label="README Studio home">
            <span className="grid size-9 place-items-center rounded-md border border-primary/35 bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
              <FileText className="size-4" aria-hidden="true" />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-sm font-semibold">README Studio</span>
              <span className="block font-mono text-[10px] text-muted-foreground">
                Private documentation workspace
              </span>
            </span>
          </Link>
          <nav className="flex items-center gap-1" aria-label="Main">
            <Button asChild variant="ghost" size="sm">
              <Link to="/">README</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/code-report">Code report</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="relative z-10">{children}</main>
      <footer className="relative z-10 border-t border-border/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <span>README Studio · Accurate documentation from trusted context</span>
          <span className="font-mono text-[10px] uppercase">Private access</span>
        </div>
      </footer>
    </div>
  );
}
