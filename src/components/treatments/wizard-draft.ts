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
