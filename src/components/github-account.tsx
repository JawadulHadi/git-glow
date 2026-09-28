import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Github, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import {
  completeGithubConnect,
  disconnectGithub,
  getGithubAccount,
  startGithubConnect,
} from "@/lib/github-account.functions";

export const githubAccountKey = ["github-account"] as const;

function waitForCode(popup: Window): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      window.clearInterval(poll);
    };
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; connectorId?: string; code?: unknown } | null;
      if (event.origin !== window.location.origin || event.source !== popup) return;
      if (data?.connectorId !== "github") return;
      if (data.type === "appUserConnectorOAuthComplete") {
        cleanup();
        resolve(typeof data.code === "string" ? data.code : null);
      } else if (data.type === "appUserConnectorOAuthFailed") {
        cleanup();
        reject(new Error("GitHub didn't finish connecting."));
      }
    };
    const poll = window.setInterval(() => {
      if (!popup.closed) return;
      cleanup();
      reject(new Error("The GitHub window closed before connecting."));
    }, 500);
    window.addEventListener("message", onMessage);
  });
}

/** Lets the signed-in visitor connect their own GitHub account. */
export function GithubAccount({ compact = false }: { compact?: boolean }) {
  const { session, ready } = useSession();
  const queryClient = useQueryClient();
  const fetchAccount = useServerFn(getGithubAccount);
  const start = useServerFn(startGithubConnect);
  const complete = useServerFn(completeGithubConnect);
  const disconnect = useServerFn(disconnectGithub);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const account = useQuery({
    queryKey: [...githubAccountKey, session?.user.id],
    queryFn: () => fetchAccount(),
    enabled: Boolean(session),
  });

  async function connect() {
    setMessage(null);
    const popup = window.open("", "github-connect", "width=600,height=720");
    if (!popup) {
      setMessage("Your browser blocked the GitHub window. Allow pop-ups and try again.");
      return;
    }
    setBusy(true);
    try {
      const { authorizationUrl } = await start();
      const pending = waitForCode(popup);
      popup.location.href = authorizationUrl;
      const code = await pending;
      if (code) {
        const result = await complete({ data: { code } });
        setMessage(result.login ? `Connected as @${result.login}.` : "GitHub connected.");
      }
      await queryClient.invalidateQueries({ queryKey: githubAccountKey });
    } catch (error) {
      popup.close();
      setMessage(error instanceof Error ? error.message : "GitHub didn't connect.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDisconnect() {
    setBusy(true);
    try {
      await disconnect();
      setMessage("GitHub disconnected.");
      await queryClient.invalidateQueries({ queryKey: githubAccountKey });
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return null;

  const box = compact
    ? "space-y-2"
    : "rounded-md border border-border bg-background/40 p-4 space-y-2";

  if (!session) {
    return (
      <div className={box}>
        <p className="text-sm text-muted-foreground">
          Sign in to connect your own GitHub account and work with your real repositories.
        </p>
        <Button asChild size="sm" variant="outline">
          <Link to="/auth">Sign in</Link>
        </Button>
      </div>
    );
  }

  const data = account.data;
  return (
    <div className={box}>
      {account.isLoading ? (
        <p className="text-sm text-muted-foreground">Checking your GitHub connection…</p>
      ) : data?.connected ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm">
            <Github className="size-4" aria-hidden="true" />
            Connected{data.login ? ` as @${data.login}` : ""}
          </p>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleDisconnect}
            disabled={busy}
          >
            Disconnect
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {data?.reconnectRequired
              ? "Your GitHub access needs to be renewed."
              : "Connect GitHub so the studio can read and publish to your repositories."}
          </p>
          <Button type="button" size="sm" onClick={connect} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Github />}
            {data?.reconnectRequired ? "Reconnect GitHub" : "Connect GitHub"}
          </Button>
        </div>
      )}
      {message ? (
        <p className="text-xs text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
