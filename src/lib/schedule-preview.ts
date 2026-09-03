import {
  type GeneratedOccurrence,
  generateOccurrences,
  needsConfirmation,
} from "@/domain/scheduling";
import { type PlainDate, addDays, plainDate } from "@/domain/time";

import {
  INITIAL_HORIZON_DAYS,
  doseSpecsFromInput,
  phaseCycleFromInput,
  recurrenceRuleFromInput,
} from "./treatment-mapping";
import { createTreatmentSchema } from "./validation/treatment";

export type SchedulePreview =
  | { kind: "incomplete" }
  | { kind: "error"; message: string }
  | {
      kind: "ok";
      occurrences: GeneratedOccurrence[];
      anchor: PlainDate;
      rule: ReturnType<typeof recurrenceRuleFromInput>;
      cycle: ReturnType<typeof phaseCycleFromInput>;
      specs: ReturnType<typeof doseSpecsFromInput>;
      /** True when the schedule can't be generated until the user picks days. */
      needsDayChoice: boolean;
    };

/**
 * Turn a wizard draft into the same occurrence list the server will persist —
 * used by the treatment wizard's Review step and by the prescription plan
 * builder's cards. Pure: no `Clock`, no I/O.
 */
export function previewSchedule(
  draft: unknown,
  timezone: string,
  defaultTimes: Record<string, string>,
): SchedulePreview {
  const parsed = createTreatmentSchema.safeParse(draft);
  if (!parsed.success) return { kind: "incomplete" };
  const d = parsed.data;

  try {
    const anchor = plainDate(d.anchorDate);
    const rule = recurrenceRuleFromInput(d.recurrence, anchor);
    const cycle = phaseCycleFromInput(d.window);
    const specs = doseSpecsFromInput(d.doseTimes);
    const needsDayChoice = needsConfirmation(rule);
    const occurrences = needsDayChoice
      ? []
      : generateOccurrences({
          anchor,
          recurrenceRule: rule,
          phaseCycle: cycle,
          doseTimes: specs,
          timezone,
          defaultTimes,
          scheduleVersion: 1,
          range: { from: anchor, to: addDays(anchor, INITIAL_HORIZON_DAYS) },
        });
    return {
      kind: "ok",
      occurrences,
      anchor,
      rule,
      cycle,
      specs,
      needsDayChoice,
    };
  } catch (e) {
    return {
      kind: "error",
      message: e instanceof Error ? e.message : "Could not build the schedule.",
    };
  }
}
