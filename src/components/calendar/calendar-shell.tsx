import { ChevronLeft, ChevronRight } from "lucide-react";
import { DateTime } from "luxon";
import Link from "next/link";
import type { ReactNode } from "react";

import { addDays, plainDate } from "@/domain/time";
import { shiftMonth, startOfWeek } from "@/lib/calendar-grid";
import { cn } from "@/lib/cn";

import { DateJump } from "./date-jump";

export type CalendarView = "day" | "week" | "month";

const VIEWS: CalendarView[] = ["day", "week", "month"];

interface CalendarShellProps {
  view: CalendarView;
  date: string;
  today: string;
  now?: string;
  children: ReactNode;
}

function calendarHref(view: CalendarView, date: string, now?: string) {
  const params = new URLSearchParams({ view, date });
  if (now) params.set("now", now);
  return `/calendar?${params.toString()}`;
}

function step(view: CalendarView, date: string, direction: 1 | -1): string {
  if (view === "day") return addDays(plainDate(date), direction);
  if (view === "week") return addDays(plainDate(date), direction * 7);
  return shiftMonth(plainDate(date), direction);
}

function periodLabel(view: CalendarView, date: string): string {
  const dt = DateTime.fromISO(date, { zone: "utc" });
  if (view === "day") return dt.toFormat("cccc d LLLL yyyy");
  if (view === "month") return dt.toFormat("LLLL yyyy");
  const start = DateTime.fromISO(startOfWeek(plainDate(date)), { zone: "utc" });
  const end = start.plus({ days: 6 });
  const sameMonth = start.month === end.month;
  return `${start.toFormat("d")}${sameMonth ? "" : ` ${start.toFormat("LLL")}`} – ${end.toFormat("d LLL yyyy")}`;
}

export function CalendarShell({
  view,
  date,
  today,
  now,
  children,
}: CalendarShellProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
          Calendar
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
          {periodLabel(view, date)}
        </h1>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-line bg-surface p-0.5 text-sm">
          {VIEWS.map((v) => (
            <Link
              key={v}
              href={calendarHref(v, date, now)}
              aria-current={v === view ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-1 capitalize",
                v === view
                  ? "bg-accent-soft font-medium text-accent"
                  : "text-ink-muted hover:text-ink",
              )}
            >
              {v}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href={calendarHref(view, step(view, date, -1), now)}
            aria-label="Previous"
            className="rounded-md border border-line bg-surface p-1.5 text-ink-muted hover:bg-surface-sunken"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </Link>
          <Link
            href={calendarHref(view, today, now)}
            className="rounded-md border border-line bg-surface px-2.5 py-1.5 text-sm text-ink-muted hover:bg-surface-sunken"
          >
            Today
          </Link>
          <Link
            href={calendarHref(view, step(view, date, 1), now)}
            aria-label="Next"
            className="rounded-md border border-line bg-surface p-1.5 text-ink-muted hover:bg-surface-sunken"
          >
            <ChevronRight className="size-4" aria-hidden />
          </Link>
          <DateJump date={date} />
        </div>
      </div>

      {children}
    </div>
  );
}
