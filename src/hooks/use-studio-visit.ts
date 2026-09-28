import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { recordStudioVisit } from "@/lib/analytics.functions";

const sessionKey = "repo-io-visit-session";

function getVisitSessionId(): string {
  const existing = window.sessionStorage.getItem(sessionKey);
  if (existing) return existing;
  const created = crypto.randomUUID();
  window.sessionStorage.setItem(sessionKey, created);
  return created;
}

export function useStudioVisit(page: "readme" | "code-report") {
  const recordVisit = useServerFn(recordStudioVisit);
  useEffect(() => {
    void recordVisit({ data: { sessionId: getVisitSessionId(), page } });
  }, [page, recordVisit]);
}
