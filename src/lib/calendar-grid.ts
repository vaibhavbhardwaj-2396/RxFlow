import { DateTime } from "luxon";

import { type PlainDate, addDays } from "@/domain/time";

const at = (d: PlainDate) => DateTime.fromISO(d, { zone: "utc" });
const iso = (x: DateTime) => x.toISODate() as PlainDate;
const mondayOf = (x: DateTime) =>
  x.minus({ days: x.weekday - 1 }).startOf("day");

/** Monday of the ISO week containing `date`. */
export function startOfWeek(date: PlainDate): PlainDate {
  return iso(mondayOf(at(date)));
}

/** The first of `date`'s month. */
export function startOfMonth(date: PlainDate): PlainDate {
  return iso(at(date).startOf("month"));
}

/** `n` calendar months on from `date` (keeps day-of-month, clamps). */
export function shiftMonth(date: PlainDate, n: number): PlainDate {
  return iso(at(date).plus({ months: n }));
}

/** The 7 dates (Mon…Sun) of the ISO week containing `date`. */
export function weekDays(date: PlainDate): PlainDate[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/**
 * A 6×7 calendar grid covering `date`'s month, Monday-first, with leading and
 * trailing spill days from the adjacent months.
 */
export function monthGrid(date: PlainDate): PlainDate[][] {
  const gridStart = startOfWeek(startOfMonth(date));
  return Array.from({ length: 6 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => addDays(gridStart, w * 7 + d)),
  );
}

/** Whether two `YYYY-MM-DD` dates fall in the same calendar month. */
export function inSameMonth(date: string, month: string): boolean {
  return date.slice(0, 7) === month.slice(0, 7);
}
