import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/oauth/github/return")({
  ssr: false,
  head: () => ({ meta: [{ title: "Connecting GitHub" }, { name: "robots", content: "noindex" }] }),
  component: GithubReturn,
});

function GithubReturn() {
  const [message, setMessage] = useState("Finishing the GitHub connection…");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const notify = (
      type: "appUserConnectorOAuthComplete" | "appUserConnectorOAuthFailed",
      code?: string,
    ) => {
      window.opener?.postMessage(
        { type, connectorId: "github", code: code ?? null },
        window.location.origin,
      );
      window.close();
    };
    if (params.get("success") !== "true") {
      setMessage(params.get("error") ?? "GitHub didn't finish connecting.");
      notify("appUserConnectorOAuthFailed");
      return;
    }
    const code = params.get("code");
    if (!code) {
      if (params.get("offline_access_allowed") === "false") {
        notify("appUserConnectorOAuthComplete");
        return;
      }
      setMessage("GitHub finished without a connection code.");
      notify("appUserConnectorOAuthFailed");
      return;
    }
    notify("appUserConnectorOAuthComplete", code);
  }, []);

  return (
    <p className="mx-auto max-w-md px-5 py-20 text-center text-sm text-muted-foreground">
      {message}
    </p>
  );
}
