import { DateTime } from "luxon";

/**
 * The single source of "now" for the entire application.
 *
 * Nothing in the domain or server layers should call `Date.now()`,
 * `new Date()` or `DateTime.now()` directly — they take a `Clock`. That makes
 * every schedule calculation deterministic in tests and lets the dev toolbar
 * travel to any date without waiting for real time to pass.
 */
export interface Clock {
  /** The current instant as a UTC Luxon `DateTime`. */
  now(): DateTime;
}

/** Real wall-clock time. The only clock used in production. */
export const systemClock: Clock = {
  now: () => DateTime.utc(),
};

/**
 * A clock frozen at a fixed instant. Used by tests and by the dev-only
 * time-travel toolbar.
 */
export function fixedClock(instant: DateTime | Date | string): Clock {
  const dt = toUtcDateTime(instant);
  if (!dt.isValid) {
    throw new Error(
      `fixedClock: invalid instant — ${dt.invalidReason ?? "unknown"}`,
    );
  }
  const frozen = dt;
  return { now: () => frozen };
}

function toUtcDateTime(instant: DateTime | Date | string): DateTime {
  if (instant instanceof DateTime) return instant.toUTC();
  if (instant instanceof Date) return DateTime.fromJSDate(instant).toUTC();
  // A bare "YYYY-MM-DD" is interpreted as midnight UTC on that day.
  return DateTime.fromISO(instant, { zone: "utc" });
}

/**
 * The user's local calendar date ("YYYY-MM-DD") right now, in their timezone.
 * This is the anchor for "what do I need to do today".
 */
export function localToday(clock: Clock, timezone: string): string {
  return clock.now().setZone(timezone).toISODate() ?? "";
}
