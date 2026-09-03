import type {
  DoseTimeSpec,
  PhaseCycle,
  RecurrenceRule,
} from "@/domain/scheduling";
import type {
  DurationInput,
  TreatmentCategoryValue,
} from "@/lib/validation/treatment";

export type DraftRecurrence =
  | { kind: "daily" }
  | { kind: "specific_weekdays"; weekdays: number[] }
  | { kind: "interval_days"; interval: number }
  | { kind: "times_per_week"; count: number };

export type CycleSegment = {
  phase: "active" | "break";
  unit: "days" | "weeks" | "months";
  value: number;
};

export type DraftWindow =
  | { kind: "simple"; duration: DurationInput }
  | {
      kind: "cycle";
      segments: CycleSegment[];
      repeat:
        | { mode: "once" }
        | { mode: "count"; count: number }
        | { mode: "until"; date: string }
        | { mode: "forever" };
    };

/** The wizard's working copy. Structurally a superset of `CreateTreatmentInput`
 * (optional text fields are held as "" and coerced away by the schema). */
export interface WizardDraft {
  name: string;
  category: TreatmentCategoryValue;
  instructionsText: string;
  doseText: string;
  anchorDate: string;
  recurrence: DraftRecurrence;
  window: DraftWindow;
  doseTimes: Array<
    { kind: "clock"; value: string } | { kind: "relative"; anchor: string }
  >;
}

export function initialDraft(today: string): WizardDraft {
  return {
    name: "",
    category: "medication",
    instructionsText: "",
    doseText: "",
    anchorDate: today,
    recurrence: { kind: "daily" },
    window: { kind: "simple", duration: { kind: "weeks", value: 2 } },
    doseTimes: [{ kind: "clock", value: "08:00" }],
  };
}

/** A persisted treatment reduced to what the wizard needs, for the edit flow. */
export interface TreatmentRecord {
  name: string;
  category: TreatmentCategoryValue;
  instructionsText: string | null;
  doseText: string | null;
  anchorDate: string;
  recurrence: RecurrenceRule;
  phaseCycle: PhaseCycle;
  doseTimes: DoseTimeSpec[];
}

/** Seed a wizard draft from an existing treatment (edit mode). */
export function draftFromRecord(record: TreatmentRecord): WizardDraft {
  return {
    name: record.name,
    category: record.category,
    instructionsText: record.instructionsText ?? "",
    doseText: record.doseText ?? "",
    anchorDate: record.anchorDate,
    recurrence: recurrenceToDraft(record.recurrence),
    window: windowFromCycle(record.phaseCycle),
    doseTimes: record.doseTimes.map((d) =>
      d.kind === "clock"
        ? { kind: "clock", value: d.value }
        : { kind: "relative", anchor: d.anchor },
    ),
  };
}

function recurrenceToDraft(rule: RecurrenceRule): DraftRecurrence {
  switch (rule.type) {
    case "daily":
      return { kind: "daily" };
    case "specific_weekdays":
      return { kind: "specific_weekdays", weekdays: [...rule.weekdays] };
    case "interval_days":
      return { kind: "interval_days", interval: rule.interval };
    case "times_per_week":
      return rule.weekdays && rule.weekdays.length > 0
        ? { kind: "specific_weekdays", weekdays: [...rule.weekdays] }
        : { kind: "times_per_week", count: rule.count };
  }
}

/** A single ACTIVE phase repeating once is "simple"; anything else is a cycle. */
function windowFromCycle(cycle: PhaseCycle): DraftWindow {
  const simple =
    cycle.repeat.mode === "once" &&
    cycle.phases.length === 1 &&
    cycle.phases[0].kind === "active";

  if (simple) {
    const d = cycle.phases[0].duration;
    switch (d.kind) {
      case "days":
        return { kind: "simple", duration: { kind: "days", value: d.value } };
      case "weeks":
        return { kind: "simple", duration: { kind: "weeks", value: d.value } };
      case "months":
        return { kind: "simple", duration: { kind: "months", value: d.value } };
      case "until":
        return { kind: "simple", duration: { kind: "until", date: d.date } };
      case "forever":
        return { kind: "simple", duration: { kind: "ongoing" } };
    }
  }

  return {
    kind: "cycle",
    segments: cycle.phases.map((p) => ({
      phase: p.kind,
      unit:
        p.duration.kind === "weeks"
          ? "weeks"
          : p.duration.kind === "months"
            ? "months"
            : "days",
      value: "value" in p.duration ? p.duration.value : 1,
    })),
    repeat:
      cycle.repeat.mode === "count"
        ? { mode: "count", count: cycle.repeat.count }
        : cycle.repeat.mode === "until"
          ? { mode: "until", date: cycle.repeat.date }
          : { mode: cycle.repeat.mode },
  };
}

export const WIZARD_STEPS = [
  "Basics",
  "Schedule",
  "Duration",
  "Dose times",
  "Review",
] as const;

/** Which step a server-side field error belongs to. */
export const FIELD_STEP: Record<string, number> = {
  name: 0,
  category: 0,
  instructionsText: 0,
  doseText: 0,
  recurrence: 1,
  anchorDate: 2,
  window: 2,
  doseTimes: 3,
};
