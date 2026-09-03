import { DateTime } from "luxon";

import type { ComingUpDay } from "@/server/occurrences/queries";

export function ComingUp({ days }: { days: ComingUpDay[] }) {
  if (days.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
        Coming up
      </h2>
      <ul className="flex flex-col gap-1 text-sm">
        {days.map((day) => (
          <li
            key={day.localDate}
            className="flex justify-between rounded-lg border border-line bg-surface px-3 py-2"
          >
            <span className="text-ink">
              {DateTime.fromISO(day.localDate, { zone: "utc" }).toFormat(
                "cccc d LLL",
              )}
            </span>
            <span className="text-ink-muted">
              {day.count} dose{day.count === 1 ? "" : "s"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
