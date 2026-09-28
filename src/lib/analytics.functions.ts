import { createServerFn } from "@tanstack/react-start";
import { createHash } from "node:crypto";
import { z } from "zod";

const visitSchema = z.object({
  sessionId: z.string().uuid(),
  page: z.enum(["readme", "code-report"]),
});

export const recordStudioVisit = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => visitSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sessionHash = createHash("sha256").update(data.sessionId, "utf8").digest("hex");
    const { error } = await supabaseAdmin
      .from("studio_visits")
      .upsert({ session_hash: sessionHash, page: data.page }, { onConflict: "session_hash,page" });
    if (error) throw new Error("The visit could not be recorded.");
    return { ok: true };
  });