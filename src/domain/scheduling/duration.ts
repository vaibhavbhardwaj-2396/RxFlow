import { type PlainDate, addDays, addMonths } from "../time";

import { InvalidDurationError } from "./errors";

/**
 * How long a window lasts. `days`/`weeks` add exact counts; `months` is calendar
 * arithmetic (Luxon — "2 months" from 31 Jan is 31 Mar); `until` is an inclusive
 * end date; `forever` runs to the caller's rolling horizon.
 */
export type Duration =
  | { kind: "days"; value: number }
  | { kind: "weeks"; value: number }
  | { kind: "months"; value: number }
  | { kind: "until"; date: PlainDate }
  | { kind: "forever" };

/**
 * The exclusive end date of a window that starts on `start` and lasts
 * `duration`. `horizonEnd` is used only by `forever`.
 */
export function windowEndExclusive(
  start: PlainDate,
  duration: Duration,
  horizonEnd: PlainDate,
): PlainDate {
  switch (duration.kind) {
    case "days":
      return addDays(start, wholeCount(duration.value, "days"));
    case "weeks":
      return addDays(start, wholeCount(duration.value, "weeks") * 7);
    case "months":
      return addMonths(start, wholeCount(duration.value, "months"));
    case "until":
      return addDays(duration.date, 1);
    case "forever":
      return horizonEnd;
  }
}

function wholeCount(value: number, kind: string): number {
  if (!Number.isInteger(value) || value < 1) {
    throw new InvalidDurationError(
      `${kind} must be a positive whole number, got ${value}`,
    );
  }
  return value;
}
