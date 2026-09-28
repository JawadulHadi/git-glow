import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { Copy, KeyRound, Loader2, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  claimOwnership,
  getOwnerOverview,
  resetAccessCode,
  setAccessCode,
} from "@/lib/owner.functions";

export const Route = createFileRoute("/_authenticated/owner")({
  head: () => ({
    meta: [
      { title: "Owner panel · repo.io" },
      { name: "description", content: "Manage the studio access code and see usage." },
      { property: "og:title", content: "Owner panel · repo.io" },
      { property: "og:description", content: "Manage the studio access code and see usage." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OwnerPanel,
});

const fieldClass =
  "w-full rounded-md border border-border bg-background/70 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

const kindLabel: Record<string, string> = {
  readme: "README draft",
  report: "Code report",
  publish: "Publish",
};

function formatDay(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${formatDay(date.toISOString())} ${time}`;
}

function OwnerPanel() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchOverview = useServerFn(getOwnerOverview);
  const claim = useServerFn(claimOwnership);
  const saveCode = useServerFn(setAccessCode);
  const resetCode = useServerFn(resetAccessCode);
  const [code, setCode] = useState("");
  const [revealed, setRevealed] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const overview = useQuery({ queryKey: ["owner-overview"], queryFn: () => fetchOverview() });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["owner-overview"] });

  const claimMutation = useMutation({ mutationFn: () => claim(), onSuccess: refresh });
  const saveMutation = useMutation({
    mutationFn: (value: string) => saveCode({ data: { code: value } }),
    onSuccess: () => {
      setCode("");
      setRevealed(null);
      setNotice("New access code saved. It works right away.");
      void refresh();
    },
  });
  const resetMutation = useMutation({
    mutationFn: () => resetCode(),
    onSuccess: (result) => {
      setRevealed(result.code);
      setNotice("Access code reset. Copy it now — it won't be shown again.");
      void refresh();
    },
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveMutation.mutate(code);
  }

  const data = overview.data;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-5 py-12 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase text-primary">Owner</p>
          <h1 className="mt-1 font-display text-3xl font-semibold">Owner panel</h1>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={signOut}>
          <LogOut /> Sign out
        </Button>
      </div>

      {overview.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : overview.error ? (
        <p className="text-sm text-destructive" role="alert">
          {overview.error.message}
        </p>
      ) : data?.status === "claimable" ? (
        <section className="glass-panel space-y-3 p-6">
          <h2 className="font-display text-xl font-semibold">Claim this studio</h2>
          <p className="text-sm text-muted-foreground">
            No owner is set yet. The first account to claim it becomes the only owner.
          </p>
          <Button
            type="button"
            onClick={() => claimMutation.mutate()}
            disabled={claimMutation.isPending}
          >
            {claimMutation.isPending ? <Loader2 className="animate-spin" /> : null} Make me the
            owner
          </Button>
          {claimMutation.error ? (
            <p className="text-sm text-destructive">{claimMutation.error.message}</p>
          ) : null}
        </section>
      ) : data?.status === "forbidden" ? (
        <section className="glass-panel p-6">
          <h2 className="font-display text-xl font-semibold">Owner only</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This account isn't the studio owner. You can still use the studio and connect GitHub.
          </p>
        </section>
      ) : data?.status === "owner" ? (
        <>
          <section className="glass-panel space-y-4 p-6">
            <div className="flex items-center gap-2">
              <KeyRound className="size-4 text-primary" aria-hidden="true" />
              <h2 className="font-display text-xl font-semibold">Access code</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {data.codeSource === "panel" && data.codeUpdatedAt
                ? `Set in this panel on ${formatDateTime(data.codeUpdatedAt)}.`
                : data.codeSource === "site-secret"
                  ? "Using the original code from setup. Set a new one here to take over."
                  : "No access code is set, so AI features are locked."}
            </p>
            <form onSubmit={handleSave} className="flex flex-col gap-2 sm:flex-row">
              <input
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                minLength={8}
                maxLength={128}
                placeholder="New access code (at least 8 characters)"
                autoComplete="new-password"
                className={fieldClass}
              />
              <Button type="submit" disabled={code.length < 8 || saveMutation.isPending}>
                Save code
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => resetMutation.mutate()}
                disabled={resetMutation.isPending}
              >
                <RefreshCw /> Reset
              </Button>
            </form>
            {revealed ? (
              <div className="flex items-center justify-between gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2">
                <code className="font-mono text-sm">{revealed}</code>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => navigator.clipboard.writeText(revealed)}
                >
                  <Copy /> Copy
                </Button>
              </div>
            ) : null}
            {notice ? (
              <p className="text-sm text-primary" role="status">
                {notice}
              </p>
            ) : null}
            {saveMutation.error || resetMutation.error ? (
              <p className="text-sm text-destructive" role="alert">
                {(saveMutation.error ?? resetMutation.error)?.message}
              </p>
            ) : null}
          </section>

          <section className="grid gap-3 sm:grid-cols-4">
            {[
              ["README drafts", data.totals.readme],
              ["Code reports", data.totals.report],
              ["Publishes", data.totals.publish],
              ["Failed", data.totals.failed],
            ].map(([label, value]) => (
              <div key={label} className="glass-panel p-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 font-display text-3xl font-semibold">{value}</p>
                <p className="text-[10px] text-muted-foreground">Last 14 days</p>
              </div>
            ))}
          </section>

          <section className="glass-panel p-6">
            <h2 className="font-display text-lg font-semibold">Per day</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="py-1.5">Date</th>
                    <th>README</th>
                    <th>Report</th>
                    <th>Publish</th>
                    <th>Failed</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.days].reverse().map((d) => (
                    <tr key={d.day} className="border-t border-border/60">
                      <td className="py-1.5 font-mono text-xs">{formatDay(d.day)}</td>
                      <td>{d.readme}</td>
                      <td>{d.report}</td>
                      <td>{d.publish}</td>
                      <td>{d.failed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="glass-panel p-6">
            <h2 className="font-display text-lg font-semibold">Last 20 requests</h2>
            {data.recent.length ? (
              <ul className="mt-3 space-y-1.5 text-sm">
                {data.recent.map((event) => (
                  <li
                    key={event.createdAt + event.kind}
                    className="flex justify-between gap-3 border-t border-border/60 pt-1.5"
                  >
                    <span>{kindLabel[event.kind] ?? event.kind}</span>
                    <span className={event.ok ? "text-muted-foreground" : "text-destructive"}>
                      {event.ok ? "OK" : "Failed"} · {formatDateTime(event.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No requests yet.</p>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
