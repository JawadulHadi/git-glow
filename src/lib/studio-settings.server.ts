import { createHash, timingSafeEqual } from "node:crypto";

export function hashCode(code: string): string {
  return createHash("sha256").update(code, "utf8").digest("hex");
}

function sameHash(a: string, b: string): boolean {
  const x = Buffer.from(a, "hex");
  const y = Buffer.from(b, "hex");
  return x.length === y.length && timingSafeEqual(x, y);
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function getStoredCodeInfo(): Promise<{ hash: string | null; updatedAt: string | null }> {
  const db = await admin();
  const { data } = await db
    .from("studio_settings")
    .select("access_code_hash, updated_at")
    .eq("id", 1)
    .maybeSingle();
  return { hash: data?.access_code_hash ?? null, updatedAt: data?.updated_at ?? null };
}

export async function storeAccessCode(code: string): Promise<void> {
  const db = await admin();
  const { error } = await db
    .from("studio_settings")
    .upsert({ id: 1, access_code_hash: hashCode(code), updated_at: new Date().toISOString() });
  if (error) throw error;
}

/** Checks a code against the stored hash, falling back to the original site secret. */
export async function accessCodeValid(code: string): Promise<boolean | "unconfigured"> {
  const { hash } = await getStoredCodeInfo();
  const expected = hash ?? (process.env["README_STUDIO_ACCESS_CODE"] ? hashCode(process.env["README_STUDIO_ACCESS_CODE"]) : null);
  if (!expected) return "unconfigured";
  return sameHash(hashCode(code), expected);
}

export type UsageKind = "readme" | "report" | "publish";

export async function recordUsage(kind: UsageKind, ok: boolean): Promise<void> {
  try {
    const db = await admin();
    await db.from("usage_events").insert({ kind, ok });
  } catch (error) {
    console.error("Usage record failed", error);
  }
}
