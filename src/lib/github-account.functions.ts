import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type GithubAccount =
  | { connected: false; reconnectRequired?: boolean }
  | { connected: true; login: string | null };

export const startGithubConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { authorizeAppUserOAuth } = await import("@/integrations/lovable/appUserConnector");
    const { getGithubConnection, GATEWAY_BASE_URL, GITHUB_CONNECTOR, GITHUB_SCOPES } = await import(
      "./app-user-connections.server"
    );
    const clientKey = process.env["GITHUB_APP_USER_CONNECTOR_CLIENT_API_KEY"];
    if (!clientKey) throw new Error("GitHub sign-in is not configured yet.");
    const request = getRequest();
    const url = new URL(request.url);
    const sandboxHost =
      url.hostname === "localhost" ? request.headers.get("x-forwarded-host") : null;
    const returnUrl = new URL(
      "/oauth/github/return",
      sandboxHost ? `https://${sandboxHost}` : url.origin,
    ).toString();
    const existing = await getGithubConnection(context.userId);
    const { authorizationUrl } = await authorizeAppUserOAuth({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectorId: GITHUB_CONNECTOR,
      appUserId: context.userId,
      clientAPIKey: clientKey,
      returnUrl,
      connectionAPIKey: existing?.key,
      credentialsConfiguration: { scopes: GITHUB_SCOPES },
    });
    return { authorizationUrl };
  });

export const completeGithubConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ code: z.string().min(1).max(500) }).parse(input))
  .handler(async ({ data, context }) => {
    const { exchangeAppUserOAuthCode, callAsAppUser } = await import(
      "@/integrations/lovable/appUserConnector"
    );
    const { saveGithubConnection, GATEWAY_BASE_URL, GITHUB_CONNECTOR } = await import(
      "./app-user-connections.server"
    );
    const { connectionAPIKey, connectorId } = await exchangeAppUserOAuthCode(
      GATEWAY_BASE_URL,
      data.code,
    );
    if (connectorId !== GITHUB_CONNECTOR) throw new Error("The connection returned the wrong service.");
    const res = await callAsAppUser({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectionAPIKey,
      connectorId: GITHUB_CONNECTOR,
      path: "/user",
      init: { headers: { Accept: "application/vnd.github+json" } },
    });
    const login = res.ok ? ((await res.json()) as { login?: string }).login ?? null : null;
    await saveGithubConnection(context.userId, connectionAPIKey, login);
    return { ok: true, login };
  });

export const getGithubAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<GithubAccount> => {
    const { getGithubConnection, GATEWAY_BASE_URL, GITHUB_CONNECTOR, GITHUB_SCOPES } = await import(
      "./app-user-connections.server"
    );
    const { callAsAppUser, appUserReconnectRequired } = await import(
      "@/integrations/lovable/appUserConnector"
    );
    const connection = await getGithubConnection(context.userId);
    if (!connection) return { connected: false };
    const res = await callAsAppUser({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectionAPIKey: connection.key,
      connectorId: GITHUB_CONNECTOR,
      path: "/user",
      init: { headers: { Accept: "application/vnd.github+json" } },
      requiredScopes: GITHUB_SCOPES,
    });
    if (await appUserReconnectRequired(res)) return { connected: false, reconnectRequired: true };
    if (!res.ok) {
      console.error(`GitHub account check failed [${res.status}]: ${await res.text()}`);
      return { connected: true, login: connection.login };
    }
    const user = (await res.json()) as { login?: string };
    return { connected: true, login: user.login ?? connection.login };
  });

export const disconnectGithub = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { disconnectAppUser } = await import("@/integrations/lovable/appUserConnector");
    const { getGithubConnection, deleteGithubConnection, GATEWAY_BASE_URL, GITHUB_CONNECTOR } =
      await import("./app-user-connections.server");
    const connection = await getGithubConnection(context.userId);
    if (connection) {
      await disconnectAppUser({
        gatewayBaseUrl: GATEWAY_BASE_URL,
        connectionAPIKey: connection.key,
        connectorId: GITHUB_CONNECTOR,
      });
      await deleteGithubConnection(context.userId);
    }
    return { ok: true };
  });
