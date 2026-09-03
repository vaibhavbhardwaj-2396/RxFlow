import type {
  DoseTime as DoseTimeRow,
  PhaseCycle as PhaseCycleRow,
  Prisma,
  RecurrenceRule as RecurrenceRuleRow,
  TreatmentPhase as TreatmentPhaseRow,
} from "@prisma/client";
import { DateTime } from "luxon";

import type {
  DoseTimeSpec,
  Duration,
  GeneratedOccurrence,
  PhaseCycle,
  RecurrenceRule,
  Weekday,
} from "@/domain/scheduling";
import { plainDate } from "@/domain/time";

// Prisma rows -> domain, for the list/detail views and M4 regeneration. The
// input -> domain direction lives in `@/lib/treatment-mapping` (client-safe).

/** Generated occurrences -> `createMany` rows. Shared by create and edit. */
export function occurrenceCreateRows(
  occurrences: GeneratedOccurrence[],
  treatmentId: string,
  userId: string,
): Prisma.ScheduledOccurrenceCreateManyInput[] {
  return occurrences.map((o) => ({
    treatmentId,
    userId,
    scheduledAt: DateTime.fromISO(o.scheduledAt).toJSDate(),
    localDate: o.localDate,
    localTime: o.localTime,
    timezone: o.timezone,
    timeSpecSnapshot: o.timeSpecSnapshot as Prisma.InputJsonValue,
    phaseIndex: o.phaseIndex,
    scheduleVersion: o.scheduleVersion,
    status: "scheduled",
  }));
}

export function recurrenceRuleFromRow(row: RecurrenceRuleRow): RecurrenceRule {
  const anchor = plainDate(row.recurrenceAnchor);
  const config = (row.config ?? {}) as Record<string, unknown>;
  switch (row.type) {
    case "daily":
      return { type: "daily", anchor };
    case "specific_weekdays":
      return {
        type: "specific_weekdays",
        anchor,
        weekdays: toWeekdays(config.weekdays),
      };
    case "interval_days":
      return {
        type: "interval_days",
        anchor,
        interval: Number(config.interval),
      };
    case "times_per_week":
      return {
        type: "times_per_week",
        anchor,
        count: Number(config.count),
        weekdays:
          config.weekdays === undefined
            ? undefined
            : toWeekdays(config.weekdays),
      };
    default:
      throw new Error(`unknown recurrence type: ${row.type}`);
  }
}

export function phaseCycleFromRows(
  cycle: PhaseCycleRow,
  phases: TreatmentPhaseRow[],
): PhaseCycle {
  const ordered = [...phases].sort((a, b) => a.orderIndex - b.orderIndex);
  return {
    phases: ordered.map((p) => ({
      kind: p.kind,
      duration: durationFromRow(p),
      ...(p.label ? { label: p.label } : {}),
    })),
    repeat: repeatFromRow(cycle),
  };
}

export function doseSpecsFromRows(rows: DoseTimeRow[]): DoseTimeSpec[] {
  return [...rows]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((r) =>
      r.kind === "clock"
        ? { kind: "clock", value: r.clockValue ?? "" }
        : { kind: "relative", anchor: r.relativeAnchor ?? "" },
    );
}

function durationFromRow(p: TreatmentPhaseRow): Duration {
  switch (p.durationKind) {
    case "days":
      return { kind: "days", value: p.durationValue ?? 0 };
    case "weeks":
      return { kind: "weeks", value: p.durationValue ?? 0 };
    case "months":
      return { kind: "months", value: p.durationValue ?? 0 };
    case "until":
      if (!p.durationUntil) throw new Error("until phase without a date");
      return { kind: "until", date: plainDate(p.durationUntil) };
    case "forever":
      return { kind: "forever" };
    default:
      throw new Error(`unknown duration kind: ${p.durationKind}`);
  }
}

function repeatFromRow(cycle: PhaseCycleRow): PhaseCycle["repeat"] {
  switch (cycle.repeatMode) {
    case "once":
      return { mode: "once" };
    case "count":
      return { mode: "count", count: cycle.repeatCount ?? 1 };
    case "until":
      if (!cycle.repeatUntil) throw new Error("until cycle without a date");
      return { mode: "until", date: plainDate(cycle.repeatUntil) };
    case "forever":
      return { mode: "forever" };
    default:
      throw new Error(`unknown repeat mode: ${cycle.repeatMode}`);
  }
}

function toWeekdays(value: unknown): Weekday[] {
  return Array.isArray(value) ? (value.map(Number) as Weekday[]) : [];
}
