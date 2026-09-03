import type {
  DoseTimeSpec,
  Duration,
  PhaseCycle,
  RecurrenceRule,
  Weekday,
} from "@/domain/scheduling";
import { type PlainDate, plainDate } from "@/domain/time";

import type {
  DoseTimeInput,
  DurationInput,
  RecurrenceInput,
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
  }
}

export function durationFromInput(input: DurationInput): Duration {
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

/** M2: one ACTIVE phase, `repeat: once`. */
export function phaseCycleFromInput(input: DurationInput): PhaseCycle {
  return {
    phases: [{ kind: "active", duration: durationFromInput(input) }],
    repeat: { mode: "once" },
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
  duration: DurationInput;
  doseTimes: DoseTimeInput[];
}): TreatmentCreateData {
  return {
    recurrence: {
      type: input.recurrence.kind,
      config: configFromInput(input.recurrence),
      recurrenceAnchor: input.anchorDate,
      needsConfirmation: false,
    },
    phaseCycle: {
      repeatMode: "once",
      repeatCount: null,
      repeatUntil: null,
      phases: [phaseFromDuration(input.duration)],
    },
    doseTimes: input.doseTimes.map((d, orderIndex) => ({
      orderIndex,
      kind: d.kind,
      clockValue: d.kind === "clock" ? d.value : null,
      relativeAnchor: d.kind === "relative" ? d.anchor : null,
    })),
  };
}

function configFromInput(input: RecurrenceInput): Record<string, unknown> {
  switch (input.kind) {
    case "daily":
      return {};
    case "specific_weekdays":
      return { weekdays: sortWeekdays(input.weekdays) };
    case "interval_days":
      return { interval: input.interval };
  }
}

function phaseFromDuration(
  input: DurationInput,
): TreatmentCreateData["phaseCycle"]["phases"][number] {
  const numeric =
    input.kind === "days" || input.kind === "weeks" || input.kind === "months";
  return {
    orderIndex: 0,
    kind: "active",
    durationKind: input.kind === "ongoing" ? "forever" : input.kind,
    durationValue: numeric ? input.value : null,
    durationUntil: input.kind === "until" ? input.date : null,
  };
}

function sortWeekdays(weekdays: number[]): Weekday[] {
  return [...weekdays].sort((a, b) => a - b) as Weekday[];
}
