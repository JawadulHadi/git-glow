import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export const GITHUB_CONNECTOR = "github";
export const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev";
export const GITHUB_SCOPES = ["read:user", "repo"];

function key(): Buffer {
  const raw = process.env["APP_USER_CONNECTION_KEY_SECRET"];
  if (!raw) throw new Error("APP_USER_CONNECTION_KEY_SECRET is not set");
  return Buffer.from(raw, "base64");
}

export function encryptConnectionKey(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ct]).toString("base64");
}

export function decryptConnectionKey(stored: string): string {
  const buf = Buffer.from(stored, "base64");
  const decipher = createDecipheriv("aes-256-gcm", key(), buf.subarray(0, 12));
  decipher.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString("utf8");
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function saveGithubConnection(
  userId: string,
  connectionKey: string,
  login: string | null,
): Promise<void> {
  const db = await admin();
  const { error } = await db.from("app_user_connections").upsert(
    {
      user_id: userId,
      connector_id: GITHUB_CONNECTOR,
      connection_key_ciphertext: encryptConnectionKey(connectionKey),
      github_login: login,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,connector_id" },
  );
  if (error) throw error;
}

export async function getGithubConnection(
  userId: string,
): Promise<{ key: string; login: string | null } | null> {
  const db = await admin();
  const { data, error } = await db
    .from("app_user_connections")
    .select("connection_key_ciphertext, github_login")
    .eq("user_id", userId)
    .eq("connector_id", GITHUB_CONNECTOR)
    .maybeSingle();
  if (error) throw error;
  return data
    ? { key: decryptConnectionKey(data.connection_key_ciphertext), login: data.github_login }
    : null;
}

export async function deleteGithubConnection(userId: string): Promise<void> {
  const db = await admin();
  const { error } = await db
    .from("app_user_connections")
    .delete()
    .eq("user_id", userId)
    .eq("connector_id", GITHUB_CONNECTOR);
  if (error) throw error;
}
