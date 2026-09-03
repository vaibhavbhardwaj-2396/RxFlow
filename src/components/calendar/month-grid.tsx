import { DateTime } from "luxon";
import Link from "next/link";

import { inSameMonth } from "@/lib/calendar-grid";
import { cn } from "@/lib/cn";
import type { MonthGrid } from "@/server/occurrences/queries";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface MonthGridViewProps {
  grid: MonthGrid;
  weeks: string[][];
  monthAnchor: string;
  today: string;
  now?: string;
}

export function MonthGridView({
  grid,
  weeks,
  monthAnchor,
  today,
  now,
}: MonthGridViewProps) {
  const dayHref = (d: string) => {
    const params = new URLSearchParams({ view: "day", date: d });
    if (now) params.set("now", now);
    return `/calendar?${params.toString()}`;
  };
  const pct = (n: number, total: number) => `${(n / total) * 100}%`;

  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-7 gap-1 text-center text-[0.6rem] uppercase tracking-wide text-ink-faint">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 gap-1">
          {week.map((d) => {
            const cell = grid.byDate[d];
            const transitions = grid.transitions[d] ?? [];
            const inMonth = inSameMonth(d, monthAnchor);

            return (
              <Link
                key={d}
                href={dayHref(d)}
                className={cn(
                  "flex min-h-16 flex-col gap-1 rounded-md border p-1",
                  inMonth
                    ? "border-line bg-surface"
                    : "border-transparent opacity-50",
                  d === today && "ring-1 ring-accent",
                )}
              >
                <span
                  className={cn(
                    "text-[0.7rem]",
                    d === today
                      ? "font-semibold text-accent"
                      : "text-ink-muted",
                  )}
                >
                  {DateTime.fromISO(d, { zone: "utc" }).toFormat("d")}
                </span>

                {cell && cell.total > 0 && (
                  <>
                    <span className="flex h-1 overflow-hidden rounded-full bg-line">
                      <span
                        className="bg-accent"
                        style={{ width: pct(cell.completed, cell.total) }}
                      />
                      <span
                        className="bg-ink-faint"
                        style={{ width: pct(cell.skipped, cell.total) }}
                      />
                      <span
                        className="bg-danger/60"
                        style={{ width: pct(cell.missed, cell.total) }}
                      />
                    </span>
                    <span className="text-[0.6rem] text-ink-faint">
                      {cell.total}
                    </span>
                  </>
                )}

                {transitions.length > 0 && (
                  <span
                    title={transitions
                      .map(
                        (t) =>
                          `${t.treatment} — ${t.kind === "break-start" ? "break starts" : "resumes"}`,
                      )
                      .join("\n")}
                    className={cn(
                      "mt-auto h-1 w-full rounded-full",
                      transitions.some((t) => t.kind === "break-start")
                        ? "bg-warn"
                        : "bg-ok",
                    )}
                  />
                )}
              </Link>
            );
          })}
        </div>
      ))}

      <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[0.65rem] text-ink-faint">
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-warn" /> break starts
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-ok" /> resumes
        </span>
      </p>
    </div>
  );
}
