import { describe, expect, test } from "vitest";
import {
  activityLevel,
  buildActivityDays,
  formatEuropeanDate,
  type GithubEvent,
} from "./github-activity";

describe("GitHub activity utilities", () => {
  test("groups events by UTC date", () => {
    const date = new Date();
    date.setUTCHours(12, 0, 0, 0);
    const events: GithubEvent[] = [
      {
        id: "1",
        type: "PushEvent",
        created_at: date.toISOString(),
        repo: { name: "Qeloma/qeloma-verdict" },
      },
      {
        id: "2",
        type: "IssuesEvent",
        created_at: date.toISOString(),
        repo: { name: "Qeloma/qeloma-ocr" },
      },
    ];
    const days = buildActivityDays(events, 1);
    expect(days).toHaveLength(1);
    expect(days[0]?.count).toBe(2);
  });

  test("maps counts to bounded visual levels", () => {
    expect([0, 1, 2, 4, 8].map(activityLevel)).toEqual([0, 1, 2, 3, 4]);
  });

  test("formats dates as DD/MM/YYYY", () => {
    expect(formatEuropeanDate("2026-09-28T12:00:00Z")).toBe("28/09/2026");
  });
});
