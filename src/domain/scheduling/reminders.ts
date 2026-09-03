import { DateTime } from "luxon";

/** A do-not-disturb window in the user's local time. `end < start` wraps midnight. */
export interface QuietHours {
  start: string; // "HH:mm"
  end: string; // "HH:mm"
}

function minutesOfDay(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Is `localMinutes` (since local midnight) inside the quiet window? */
export function inQuietHours(localMinutes: number, quiet: QuietHours): boolean {
  const start = minutesOfDay(quiet.start);
  const end = minutesOfDay(quiet.end);
  if (start === end) return false;
  return start < end
    ? localMinutes >= start && localMinutes < end
    : localMinutes >= start || localMinutes < end;
}

/**
 * When a reminder for `scheduledAt` should fire: `leadMinutes` earlier, then
 * pushed to the end of the quiet window if it would land inside it. Pure; always
 * returns a UTC instant.
 */
export function reminderFireAt(
  scheduledAt: DateTime,
  leadMinutes: number,
  quietHours: QuietHours | null,
  timezone: string,
): DateTime {
  const fire = scheduledAt.minus({ minutes: Math.max(0, leadMinutes) });
  if (!quietHours) return fire.toUTC();

  const local = fire.setZone(timezone);
  const mins = local.hour * 60 + local.minute;
  if (!inQuietHours(mins, quietHours)) return fire.toUTC();

  const endMins = minutesOfDay(quietHours.end);
  let target = local.startOf("day").plus({ minutes: endMins });
  if (target <= local) target = target.plus({ days: 1 });
  return target.toUTC();
}
