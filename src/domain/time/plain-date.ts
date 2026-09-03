import { DateTime } from "luxon";

/**
 * A calendar date with no time and no zone — "the 7th of September 2026", not an
 * instant. The scheduling engine reasons in these: a recurrence rule is "on" a
 * date, a phase window spans dates. Only at the very end does a date + a
 * wall-clock time + a zone collapse into a UTC instant.
 *
 * Stored as an ISO `YYYY-MM-DD` string and branded so it can't be mixed up with
 * an arbitrary string or an ISO timestamp. Construct with {@link plainDate}.
 */
export type PlainDate = string & { readonly __brand: "PlainDate" };

/** ISO weekday, Luxon's numbering: 1 = Monday … 7 = Sunday. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** The date as a Luxon `DateTime` pinned to UTC midnight — never leaves this file. */
function at(date: PlainDate): DateTime {
  return DateTime.fromISO(date, { zone: "utc" });
}

function iso(dt: DateTime): PlainDate {
  const date = dt.toISODate();
  if (date === null) {
    throw new Error(`plain-date: arithmetic produced an invalid date`);
  }
  return date as PlainDate;
}

/**
 * Validate and brand a `YYYY-MM-DD` string, or take the calendar date of a
 * `DateTime` (in that `DateTime`'s own zone). Throws on anything else.
 */
export function plainDate(input: string | DateTime): PlainDate {
  if (input instanceof DateTime) {
    if (!input.isValid) {
      throw new Error(
        `plainDate: invalid DateTime — ${input.invalidReason ?? "unknown"}`,
      );
    }
    return iso(input);
  }
  if (!ISO_DATE.test(input)) {
    throw new Error(
      `plainDate: expected "YYYY-MM-DD", got ${JSON.stringify(input)}`,
    );
  }
  const dt = DateTime.fromISO(input, { zone: "utc" });
  if (!dt.isValid) {
    throw new Error(
      `plainDate: not a real date — ${input} (${dt.invalidReason ?? "unknown"})`,
    );
  }
  return input as PlainDate;
}

/** `n` days after `date`. `n` may be negative. */
export function addDays(date: PlainDate, n: number): PlainDate {
  return iso(at(date).plus({ days: n }));
}

/**
 * `n` calendar months after `date`, via Luxon — "2 months" from 31 Jan is
 * 31 Mar, and 1 month from 31 Jan is 28/29 Feb (clamped). `n` may be negative.
 */
export function addMonths(date: PlainDate, n: number): PlainDate {
  return iso(at(date).plus({ months: n }));
}

/** Whole calendar days from `a` to `b` (positive when `b` is later). */
export function daysBetween(a: PlainDate, b: PlainDate): number {
  return Math.round(at(b).diff(at(a), "days").days);
}

/** ISO weekday of `date`: 1 = Monday … 7 = Sunday. */
export function weekday(date: PlainDate): Weekday {
  return at(date).weekday as Weekday;
}

/** `-1` if `a` is earlier, `1` if later, `0` if the same day. */
export function compareDate(a: PlainDate, b: PlainDate): -1 | 0 | 1 {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** The earliest of the given dates. Requires at least one argument. */
export function minDate(...dates: PlainDate[]): PlainDate {
  return dates.reduce((min, d) => (d < min ? d : min));
}

/** The latest of the given dates. Requires at least one argument. */
export function maxDate(...dates: PlainDate[]): PlainDate {
  return dates.reduce((max, d) => (d > max ? d : max));
}

/** Every date from `fromInclusive` up to (but not including) `toExclusive`. */
export function* eachDate(
  fromInclusive: PlainDate,
  toExclusive: PlainDate,
): Generator<PlainDate> {
  let cursor = fromInclusive;
  while (cursor < toExclusive) {
    yield cursor;
    cursor = addDays(cursor, 1);
  }
}
