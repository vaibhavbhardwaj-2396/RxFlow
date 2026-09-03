import { DateTime } from "luxon";

import type {
  DoseTimeSpec,
  PhaseCycle,
  RecurrenceRule,
} from "@/domain/scheduling";
import { type PlainDate, addDays } from "@/domain/time";

const WEEKDAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

/** "a", "a & b", "a, b & c". */
function joinList(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? "";
  return `${parts.slice(0, -1).join(", ")} & ${parts.at(-1)}`;
}

function fmtDate(date: PlainDate, withYear = true): string {
  return DateTime.fromISO(date, { zone: "utc" }).toFormat(
    withYear ? "d LLL yyyy" : "d LLL",
  );
}

/** "Dinner", "Before sleep", "After dinner" from a camelCase / snake_case slug. */
export function humaniseAnchor(anchor: string): string {
  const words = anchor
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** A plain-language name for the recurrence pattern. */
export function describeRecurrence(rule: RecurrenceRule): string {
  switch (rule.type) {
    case "daily":
      return "Every day";
    case "interval_days":
      return rule.interval === 2
        ? "Every other day"
        : `Every ${rule.interval} days`;
    case "specific_weekdays":
      return describeWeekdays(rule.weekdays);
    case "times_per_week":
      return rule.weekdays && rule.weekdays.length > 0
        ? describeWeekdays(rule.weekdays)
        : `${rule.count}× a week`;
  }
}

function describeWeekdays(weekdays: number[]): string {
  const set = [...new Set(weekdays)].sort((a, b) => a - b);
  const key = set.join(",");
  if (key === "1,2,3,4,5") return "Weekdays";
  if (key === "6,7") return "Weekends";
  if (key === "1,2,3,4,5,6,7") return "Every day";
  return joinList(set.map((wd) => `${WEEKDAY_NAMES[wd - 1]}s`));
}

/**
 * The active span in plain language. M2 treatments have one ACTIVE phase that
 * repeats `once`; richer cycles get a fuller description in M6.
 */
export function describeWindow(anchor: PlainDate, cycle: PhaseCycle): string {
  const [phase, ...rest] = cycle.phases;
  const isSimple =
    cycle.repeat.mode === "once" &&
    rest.length === 0 &&
    phase?.kind === "active";

  if (!isSimple || !phase) return "Repeating cycle";

  const start = fmtDate(anchor);
  const d = phase.duration;

  switch (d.kind) {
    case "forever":
      return `From ${start} · ongoing`;
    case "days":
      return rangeLabel(anchor, addDays(anchor, d.value - 1));
    case "weeks":
      return rangeLabel(anchor, addDays(anchor, d.value * 7 - 1));
    case "months": {
      const end = DateTime.fromISO(anchor, { zone: "utc" })
        .plus({ months: d.value })
        .minus({ days: 1 })
        .toISODate();
      return rangeLabel(anchor, (end ?? anchor) as PlainDate);
    }
    case "until":
      return rangeLabel(anchor, d.date);
  }
}

function rangeLabel(start: PlainDate, end: PlainDate): string {
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  return `${fmtDate(start, !sameYear)} – ${fmtDate(end)}`;
}

/** Dose times as a phrase: "08:00", "After dinner (20:00) & before sleep (22:30)". */
export function describeDoseTimes(
  specs: DoseTimeSpec[],
  defaultTimes: Record<string, string>,
): string {
  const parts = specs.map((spec) => {
    if (spec.kind === "clock") return spec.value;
    const time = defaultTimes[spec.anchor];
    const label = humaniseAnchor(spec.anchor);
    return time ? `${label} (${time})` : label;
  });
  return joinList(parts);
}
