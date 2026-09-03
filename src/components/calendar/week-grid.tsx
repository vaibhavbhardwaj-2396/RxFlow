import { DateTime } from "luxon";
import Link from "next/link";

import { cn } from "@/lib/cn";
import type { OccurrenceStatus } from "@/domain/adherence";
import type { WeekGrid } from "@/server/occurrences/queries";

const DOT: Record<OccurrenceStatus, string> = {
  completed: "bg-accent",
  skipped: "bg-ink-faint",
  missed: "bg-danger",
  scheduled: "border border-ink-faint",
  reminder_sent: "border border-ink-faint",
};

interface WeekGridViewProps {
  grid: WeekGrid;
  days: string[];
  today: string;
  now?: string;
}

export function WeekGridView({ grid, days, today, now }: WeekGridViewProps) {
  const dayHref = (d: string) => {
    const params = new URLSearchParams({ view: "day", date: d });
    if (now) params.set("now", now);
    return `/calendar?${params.toString()}`;
  };

  if (grid.treatments.length === 0) {
    return (
      <p className="rounded-2xl border border-line bg-surface px-4 py-8 text-center text-sm text-ink-muted">
        Nothing scheduled this week.
      </p>
    );
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <table className="w-full min-w-[32rem] border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-canvas" />
            {days.map((d) => (
              <th key={d} className="px-1 pb-2">
                <Link
                  href={dayHref(d)}
                  className={cn(
                    "block rounded-md py-1 text-center",
                    d === today ? "text-accent" : "text-ink-muted",
                  )}
                >
                  <span className="block text-[0.6rem] uppercase tracking-wide">
                    {DateTime.fromISO(d, { zone: "utc" }).toFormat("ccc")}
                  </span>
                  <span className="font-medium">
                    {DateTime.fromISO(d, { zone: "utc" }).toFormat("d")}
                  </span>
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.treatments.map((t) => (
            <tr key={t.id}>
              <th className="sticky left-0 z-10 whitespace-nowrap bg-canvas py-2 pr-3 text-left align-middle font-medium">
                <Link
                  href={`/treatments/${t.id}`}
                  className="text-ink hover:text-accent"
                >
                  {t.name}
                </Link>
              </th>
              {days.map((d) => {
                const doses = grid.cells[t.id]?.[d] ?? [];
                return (
                  <td
                    key={d}
                    className={cn(
                      "border-t border-line px-1 py-2 align-middle",
                      d === today && "bg-accent-soft/40",
                    )}
                  >
                    <Link
                      href={dayHref(d)}
                      className="flex min-h-6 flex-wrap items-center justify-center gap-0.5"
                      aria-label={`${doses.length} dose${doses.length === 1 ? "" : "s"}`}
                    >
                      {doses.slice(0, 4).map((dose, i) => (
                        <span
                          key={i}
                          title={`${dose.time} · ${dose.status}`}
                          className={cn(
                            "size-2 rounded-full",
                            DOT[dose.status],
                          )}
                        />
                      ))}
                      {doses.length > 4 && (
                        <span className="text-[0.6rem] text-ink-faint">
                          +{doses.length - 4}
                        </span>
                      )}
                    </Link>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
