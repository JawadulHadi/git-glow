import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type UsageDay = {
  day: string;
  opens: number;
  visitors: number;
  readme: number;
  report: number;
  publish: number;
  failed: number;
};
export type UsageEvent = { kind: string; ok: boolean; createdAt: string };

export type OwnerOverview =
  | { status: "claimable" }
  | { status: "forbidden" }
  | {
      status: "owner";
      codeSource: "panel" | "site-secret" | "none";
      codeUpdatedAt: string | null;
      totals: { readme: number; report: number; publish: number; failed: number };
      visits: { opens: number; visitors: number; reportConversion: number };
      days: UsageDay[];
      recent: UsageEvent[];
    };

async function isOwner(
  supabase: {
    rpc: (
      fn: "has_role",
      args: { _user_id: string; _role: "owner" },
    ) => PromiseLike<{ data: boolean | null }>;
  },
  userId: string,
) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "owner" });
  return data === true;
}

async function ownerExists(): Promise<boolean> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "owner");
  return (count ?? 0) > 0;
}

export const getOwnerOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<OwnerOverview> => {
    if (!(await isOwner(context.supabase, context.userId))) {
      return { status: (await ownerExists()) ? "forbidden" : "claimable" };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getStoredCodeInfo } = await import("./studio-settings.server");
    const code = await getStoredCodeInfo();
    const since = new Date(Date.now() - 13 * 86400000);
    since.setUTCHours(0, 0, 0, 0);
    const { data: events } = await supabaseAdmin
      .from("usage_events")
      .select("kind, ok, created_at")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(5000);
    const { data: visits } = await supabaseAdmin
      .from("studio_visits")
      .select("session_hash, page, created_at")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(5000);
    const rows = events ?? [];
    const visitRows = visits ?? [];
    const days: UsageDay[] = [];
    for (let i = 0; i < 14; i += 1) {
      const d = new Date(since.getTime() + i * 86400000);
      days.push({
        day: d.toISOString().slice(0, 10),
        opens: 0,
        visitors: 0,
        readme: 0,
        report: 0,
        publish: 0,
        failed: 0,
      });
    }
    const visitorHashes = new Set<string>();
    for (const visit of visitRows) {
      visitorHashes.add(visit.session_hash);
      const day = days.find((d) => d.day === visit.created_at.slice(0, 10));
      if (day) day.opens += 1;
    }
    for (const day of days) {
      day.visitors = new Set(
        visitRows
          .filter((visit) => visit.created_at.slice(0, 10) === day.day)
          .map((visit) => visit.session_hash),
      ).size;
    }
    const totals = { readme: 0, report: 0, publish: 0, failed: 0 };
    for (const row of rows) {
      const day = days.find((d) => d.day === row.created_at.slice(0, 10));
      const kind = row.kind as "readme" | "report" | "publish";
      if (!row.ok) {
        totals.failed += 1;
        if (day) day.failed += 1;
      } else if (kind in totals) {
        totals[kind] += 1;
        if (day) day[kind] += 1;
      }
    }
    return {
      status: "owner",
      codeSource: code.hash
        ? "panel"
        : process.env["README_STUDIO_ACCESS_CODE"]
          ? "site-secret"
          : "none",
      codeUpdatedAt: code.updatedAt,
      totals,
      visits: {
        opens: visitRows.length,
        visitors: visitorHashes.size,
        reportConversion: visitorHashes.size
          ? Math.round((totals.report / visitorHashes.size) * 1000) / 10
          : 0,
      },
      days,
      recent: rows.slice(0, 20).map((r) => ({ kind: r.kind, ok: r.ok, createdAt: r.created_at })),
    };
  });

/** The first signed-in account can claim the studio; afterwards ownership is fixed. */
export const claimOwnership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (await ownerExists()) throw new Error("This studio already has an owner.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "owner" });
    if (error) throw new Error("Could not claim the studio. Please try again.");
    return { ok: true };
  });

export const setAccessCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ code: z.string().min(8, "Use at least 8 characters.").max(128) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    if (!(await isOwner(context.supabase, context.userId)))
      throw new Error("Only the owner can do this.");
    const { storeAccessCode } = await import("./studio-settings.server");
    await storeAccessCode(data.code);
    return { ok: true };
  });

/** Generates a fresh random code, stores it, and shows it to the owner once. */
export const resetAccessCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await isOwner(context.supabase, context.userId)))
      throw new Error("Only the owner can do this.");
    const { randomBytes } = await import("node:crypto");
    const code = randomBytes(12).toString("base64url");
    const { storeAccessCode } = await import("./studio-settings.server");
    await storeAccessCode(code);
    return { code };
  });
