import { useSuspenseQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { activityLevel, formatEuropeanDate } from "@/lib/github-activity";
import { githubActivityQueryOptions } from "@/lib/github-query";

const levelClass = [
  "bg-activity-0",
  "bg-activity-1",
  "bg-activity-2",
  "bg-activity-3",
  "bg-activity-4",
] as const;

export function ActivityGrid({ compact = false }: { compact?: boolean }) {
  const { data } = useSuspenseQuery(githubActivityQueryOptions());
  const visibleDays = compact ? data.days.slice(-56) : data.days;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase text-primary">Verified public GitHub activity</p>
          <p className="mt-1 text-sm text-muted-foreground">Recent public events from GitHub. Private work is not attributed.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 font-mono text-[10px] text-success">
          <span className="size-1.5 rounded-full bg-success" /> Live
        </span>
      </div>
      <div className={`mt-6 grid grid-flow-col grid-rows-7 gap-1.5 ${compact ? "auto-cols-fr" : "auto-cols-[minmax(10px,1fr)]"}`}>
        {visibleDays.map((day) => {
          const level = activityLevel(day.count);
          return (
            <span
              key={day.date}
              className={`aspect-square min-w-2 rounded-[3px] ${levelClass[level]}`}
              title={`${formatEuropeanDate(day.date)}: ${day.count} public event${day.count === 1 ? "" : "s"}`}
              aria-label={`${formatEuropeanDate(day.date)}: ${day.count} public GitHub events`}
            />
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] text-muted-foreground">
        <span>{data.eventCount} recent public events returned by GitHub</span>
        <a className="inline-flex items-center gap-1 text-primary hover:text-foreground" href="https://github.com/JawadulHadi" target="_blank" rel="noreferrer">
          Verify on GitHub <ExternalLink className="size-3" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}