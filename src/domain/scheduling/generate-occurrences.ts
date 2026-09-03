import { DateTime } from "luxon";

import { type PlainDate, addDays, eachDate, maxDate, minDate } from "../time";

import {
  type DoseTimeSpec,
  type TimeSpecSnapshot,
  resolveDoseTime,
} from "./dose-time";
import { InvalidWallTimeError } from "./errors";
import { type PhaseCycle, expandPhaseCycle } from "./phase-cycle";
import { type RecurrenceRule, isOn, needsConfirmation } from "./recurrence";

export interface GenerateInput {
  /** The treatment's anchor date — where the phase cursor starts. */
  anchor: PlainDate;
  /** The recurrence rule; its own `anchor` drives interval parity. */
  recurrenceRule: RecurrenceRule;
  phaseCycle: PhaseCycle;
  /** One or more dose times per on-day. */
  doseTimes: DoseTimeSpec[];
  /** IANA zone the wall times are read in. */
  timezone: string;
  /** The user's dose-anchor → `"HH:mm"` map, for relative dose times. */
  defaultTimes: Record<string, string>;
  scheduleVersion: number;
  /** Inclusive local-date bounds of the rolling horizon to generate within. */
  range: { from: PlainDate; to: PlainDate };
}

export interface GeneratedOccurrence {
  phaseIndex: number;
  scheduleVersion: number;
  localDate: PlainDate;
  localTime: string;
  timezone: string;
  /** ISO-8601 UTC instant, e.g. `"2026-10-04T14:30:00.000Z"`. */
  scheduledAt: string;
  timeSpecSnapshot: TimeSpecSnapshot;
  status: "scheduled";
}

/**
 * The one pure function the rest of the app calls. Intersects the recurrence
 * rule with the ACTIVE phase windows and attaches dose times, emitting a flat,
 * deterministic, timezone-resolved list. No IDs — the persistence layer adds
 * those. No `Date.now()` — the caller passes an explicit `range`.
 */
export function generateOccurrences(
  input: GenerateInput,
): GeneratedOccurrence[] {
  const {
    anchor,
    recurrenceRule,
    phaseCycle,
    doseTimes,
    timezone,
    defaultTimes,
    scheduleVersion,
    range,
  } = input;

  if (needsConfirmation(recurrenceRule)) return [];
  if (doseTimes.length === 0) return [];

  const horizonEnd = addDays(range.to, 1);
  const windows = expandPhaseCycle(phaseCycle, anchor, horizonEnd);

  const occurrences: GeneratedOccurrence[] = [];

  for (const window of windows) {
    if (window.kind !== "active") continue;

    const from = maxDate(window.start, range.from);
    const to = minDate(window.end, horizonEnd);

    for (const date of eachDate(from, to)) {
      if (!isOn(recurrenceRule, date)) continue;

      for (const spec of doseTimes) {
        const { localTime, snapshot } = resolveDoseTime(spec, defaultTimes);
        occurrences.push({
          phaseIndex: window.index,
          scheduleVersion,
          localDate: date,
          localTime,
          timezone,
          scheduledAt: toInstant(date, localTime, timezone),
          timeSpecSnapshot: snapshot,
          status: "scheduled",
        });
      }
    }
  }

  occurrences.sort((a, b) =>
    a.scheduledAt < b.scheduledAt ? -1 : a.scheduledAt > b.scheduledAt ? 1 : 0,
  );
  return occurrences;
}

/** Wall time on a local date, in `timezone`, as a UTC ISO instant — using that
 * zone's offset rules for that date, so DST elsewhere stays correct. */
function toInstant(
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
