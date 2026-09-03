import {
  type PlainDate,
  type Weekday,
  compareDate,
  daysBetween,
  weekday,
} from "../time";

import { RecurrenceNeedsConfirmationError } from "./errors";

export type { Weekday };

/**
 * One recurrence rule per treatment. Evaluated purely on the calendar from a
 * fixed anchor — it knows nothing about phases, breaks, or timezones.
 *
 * `anchor` is the `recurrenceAnchor`: the day the pattern is measured from
 * ("starting Monday"). It is fixed for the life of the treatment and, crucially,
 * does **not** move when a break phase ends — so an interval rhythm counts
 * straight through inactive days rather than restarting.
 */
export type RecurrenceRule = { anchor: PlainDate } & (
  | { type: "daily" }
  | { type: "specific_weekdays"; weekdays: Weekday[] }
  | { type: "interval_days"; interval: number }
  | { type: "times_per_week"; count: number; weekdays?: Weekday[] }
);

/**
 * True when the rule can't produce occurrences yet: a "3× per week" with no
 * named days. Exact weekdays always win over inference — the UI must ask.
 */
export function needsConfirmation(rule: RecurrenceRule): boolean {
  return rule.type === "times_per_week" && (rule.weekdays?.length ?? 0) === 0;
}

/**
 * Does this rule fire on local date `date`? Pure: depends only on the calendar
 * and the fixed anchor. Throws {@link RecurrenceNeedsConfirmationError} for an
 * unresolved `times_per_week` — callers guard with {@link needsConfirmation}.
 */
export function isOn(rule: RecurrenceRule, date: PlainDate): boolean {
  if (compareDate(date, rule.anchor) < 0) return false;

  switch (rule.type) {
    case "daily":
      return true;
    case "specific_weekdays":
      return rule.weekdays.includes(weekday(date));
    case "interval_days":
      if (!Number.isInteger(rule.interval) || rule.interval < 1) {
        throw new RangeError(
          `interval_days: interval must be a positive integer, got ${rule.interval}`,
        );
      }
      return daysBetween(rule.anchor, date) % rule.interval === 0;
    case "times_per_week":
      if (rule.weekdays === undefined || rule.weekdays.length === 0) {
        throw new RecurrenceNeedsConfirmationError();
      }
      return rule.weekdays.includes(weekday(date));
  }
}
