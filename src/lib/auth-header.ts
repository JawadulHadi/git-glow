import { supabase } from "@/integrations/supabase/client";

/** Adds the signed-in bearer token (when present) to request headers for studio API routes. */
export async function authHeaders(
  base: Record<string, string> = {},
): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { ...base, Authorization: `Bearer ${token}` } : base;
}
