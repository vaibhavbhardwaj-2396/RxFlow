import { DateTime } from "luxon";

import type { PlainDate } from "../time";

import { InvalidWallTimeError } from "./errors";

/**
 * A wall time on a local date, read in `timezone`, as a UTC ISO instant — using
 * that zone's offset rules *for that date*, so DST transitions stay correct.
 *
 * Used at occurrence generation and again when a preference change (a default
 * time, the user's timezone) means future occurrences must re-resolve.
 */
export function wallTimeToInstant(
  date: PlainDate,
  localTime: string,
  timezone: string,
): string {
  const dt = DateTime.fromISO(`${date}T${localTime}`, { zone: timezone });
  if (!dt.isValid) {
    throw new InvalidWallTimeError(
      `${date} ${localTime} ${timezone} — ${dt.invalidReason ?? "invalid"}`,
    );
  }
  const instant = dt.toUTC().toISO();
  if (instant === null) {
    throw new InvalidWallTimeError(`${date} ${localTime} ${timezone}`);
  }
  return instant;
}
