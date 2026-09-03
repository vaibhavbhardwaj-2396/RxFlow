import type {
  DoseTimeSpec,
  Duration,
  PhaseCycle,
  RecurrenceRule,
  Weekday,
} from "@/domain/scheduling";
import { needsConfirmation } from "@/domain/scheduling";
import { type PlainDate, plainDate } from "@/domain/time";

import type {
  DoseTimeInput,
  DurationInput,
  RecurrenceInput,
  WindowInput,
} from "./validation/treatment";

// Pure transforms from validated wizard input to the domain shapes the engine
// takes, plus the plain row-shaped objects a `treatment.create` writes. No
// Prisma, no I/O — shared by the client preview and the server action.

/**
 * How far past a treatment's anchor the first occurrence batch is generated.
 * Bounded plans shorter than this materialise in full; open-ended plans get this
 * much runway and the M7 tick job rolls it forward. Shared so the client preview
 * shows exactly what the server will persist.
 */
export const INITIAL_HORIZON_DAYS = 90;

export function recurrenceRuleFromInput(
  input: RecurrenceInput,
  anchor: PlainDate,
): RecurrenceRule {
  switch (input.kind) {
    case "daily":
      return { type: "daily", anchor };
    case "specific_weekdays":
      return {
        type: "specific_weekdays",
        anchor,
        weekdays: sortWeekdays(input.weekdays),
      };
    case "interval_days":
      return { type: "interval_days", anchor, interval: input.interval };
    case "times_per_week":
      return {
        type: "times_per_week",
        anchor,
        count: input.count,
        ...(input.weekdays && input.weekdays.length > 0
          ? { weekdays: sortWeekdays(input.weekdays) }
          : {}),
      };
  }
}

function durationFromInput(input: DurationInput): Duration {
  switch (input.kind) {
    case "days":
      return { kind: "days", value: input.value };
    case "weeks":
      return { kind: "weeks", value: input.value };
    case "months":
      return { kind: "months", value: input.value };
    case "until":
      return { kind: "until", date: plainDate(input.date) };
    case "ongoing":
      return { kind: "forever" };
  }
}

/** The active-availability model for a treatment. `simple` → one ACTIVE phase,
 * `repeat: once`; `cycle` → the user's ACTIVE/BREAK segments + repeat. */
export function phaseCycleFromInput(window: WindowInput): PhaseCycle {
  if (window.kind === "simple") {
    return {
      phases: [
        { kind: "active", duration: durationFromInput(window.duration) },
      ],
      repeat: { mode: "once" },
    };
  }
  return {
    phases: window.segments.map((s) => ({
      kind: s.phase,
      duration: { kind: s.unit, value: s.value },
    })),
    repeat:
      window.repeat.mode === "count"
        ? { mode: "count", count: window.repeat.count }
        : window.repeat.mode === "until"
          ? { mode: "until", date: plainDate(window.repeat.date) }
          : { mode: window.repeat.mode },
  };
}

export function doseSpecsFromInput(inputs: DoseTimeInput[]): DoseTimeSpec[] {
  return inputs.map((d) =>
    d.kind === "clock"
      ? { kind: "clock", value: d.value }
      : { kind: "relative", anchor: d.anchor },
  );
}

export interface TreatmentCreateData {
  recurrence: {
    type: string;
    config: Record<string, unknown>;
    recurrenceAnchor: string;
    needsConfirmation: boolean;
  };
  phaseCycle: {
    repeatMode: string;
    repeatCount: number | null;
    repeatUntil: string | null;
    phases: Array<{
      orderIndex: number;
      kind: "active" | "break";
      durationKind: string;
      durationValue: number | null;
      durationUntil: string | null;
    }>;
  };
  doseTimes: Array<{
    orderIndex: number;
    kind: string;
    clockValue: string | null;
    relativeAnchor: string | null;
  }>;
}

export function toCreateData(input: {
  anchorDate: string;
  recurrence: RecurrenceInput;
  window: WindowInput;
  doseTimes: DoseTimeInput[];
}): TreatmentCreateData {
  const anchor = plainDate(input.anchorDate);
  const rule = recurrenceRuleFromInput(input.recurrence, anchor);
  const cycle = phaseCycleFromInput(input.window);

  return {
    recurrence: {
      type: rule.type,
      config: configFromRule(rule),
      recurrenceAnchor: input.anchorDate,
      needsConfirmation: needsConfirmation(rule),
    },
    phaseCycle: {
      repeatMode: cycle.repeat.mode,
      repeatCount: cycle.repeat.mode === "count" ? cycle.repeat.count : null,
      repeatUntil: cycle.repeat.mode === "until" ? cycle.repeat.date : null,
      phases: cycle.phases.map((p, orderIndex) => ({
        orderIndex,
        kind: p.kind,
        durationKind: p.duration.kind,
        durationValue: "value" in p.duration ? p.duration.value : null,
        durationUntil: p.duration.kind === "until" ? p.duration.date : null,
      })),
    },
    doseTimes: input.doseTimes.map((d, orderIndex) => ({
      orderIndex,
      kind: d.kind,
      clockValue: d.kind === "clock" ? d.value : null,
      relativeAnchor: d.kind === "relative" ? d.anchor : null,
    })),
  };
}

export function configFromRule(rule: RecurrenceRule): Record<string, unknown> {
  switch (rule.type) {
    case "daily":
      return {};
    case "specific_weekdays":
      return { weekdays: sortWeekdays(rule.weekdays) };
    case "interval_days":
      return { interval: rule.interval };
    case "times_per_week":
      return rule.weekdays
        ? { count: rule.count, weekdays: sortWeekdays(rule.weekdays) }
        : { count: rule.count };
  }
}

function sortWeekdays(weekdays: readonly number[]): Weekday[] {
  return [...weekdays].sort((a, b) => a - b) as Weekday[];
}
