import type {
  DoseTimeSpec,
  PhaseCycle,
  RecurrenceRule,
} from "@/domain/scheduling";
import type { TreatmentCategoryValue } from "@/lib/validation/treatment";

/** The wizard's working copy. Structurally a superset of `CreateTreatmentInput`
 * (optional text fields are held as "" and coerced away by the schema). */
export interface WizardDraft {
  name: string;
  category: TreatmentCategoryValue;
  instructionsText: string;
  doseText: string;
  anchorDate: string;
  recurrence:
    | { kind: "daily" }
    | { kind: "specific_weekdays"; weekdays: number[] }
    | { kind: "interval_days"; interval: number };
  duration:
    | { kind: "days"; value: number }
    | { kind: "weeks"; value: number }
    | { kind: "months"; value: number }
    | { kind: "until"; date: string }
    | { kind: "ongoing" };
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
    duration: { kind: "weeks", value: 2 },
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
    duration: durationToDraft(record.phaseCycle),
    doseTimes: record.doseTimes.map((d) =>
      d.kind === "clock"
        ? { kind: "clock", value: d.value }
        : { kind: "relative", anchor: d.anchor },
    ),
  };
}

/** True when the wizard can't represent this cycle yet (M6 territory). */
export function isCycleEditable(cycle: PhaseCycle): boolean {
  return cycle.repeat.mode === "once" && cycle.phases.length === 1;
}

function recurrenceToDraft(rule: RecurrenceRule): WizardDraft["recurrence"] {
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
        : { kind: "daily" };
  }
}

function durationToDraft(cycle: PhaseCycle): WizardDraft["duration"] {
  const duration = cycle.phases[0]?.duration;
  switch (duration?.kind) {
    case "days":
      return { kind: "days", value: duration.value };
    case "weeks":
      return { kind: "weeks", value: duration.value };
    case "months":
      return { kind: "months", value: duration.value };
    case "until":
      return { kind: "until", date: duration.date };
    default:
      return { kind: "ongoing" };
  }
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
  duration: 2,
  doseTimes: 3,
};
