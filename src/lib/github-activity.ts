export type GithubRepository = {
  name: string;
  html_url: string;
  description: string | null;
  pushed_at: string;
  updated_at: string;
  language: string | null;
};

export type GithubEvent = {
  id: string;
  type: string;
  created_at: string;
  repo: { name: string };
};

export type ActivityDay = {
  date: string;
  count: number;
};

export type PublicActivity = {
  days: ActivityDay[];
  repositories: GithubRepository[];
  eventCount: number;
  fetchedAt: string;
  unavailable?: boolean;
};

const toDay = (value: string) => value.slice(0, 10);

export function buildActivityDays(events: GithubEvent[], dayCount = 84): ActivityDay[] {
  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  const counts = new Map<string, number>();

  for (const event of events) {
    const day = toDay(event.created_at);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  return Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(end);
    date.setUTCDate(end.getUTCDate() - (dayCount - index - 1));
    const key = date.toISOString().slice(0, 10);
    return { date: key, count: counts.get(key) ?? 0 };
  });
}

export function formatEuropeanDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function activityLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}
