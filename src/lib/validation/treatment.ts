import { z } from "zod";

import { plainDate } from "@/domain/time";

/** Treatment categories — kept in step with the Prisma `TreatmentCategory` enum. */
export const TREATMENT_CATEGORIES = [
  "medication",
  "supplement",
  "topical",
  "therapy",
  "other",
] as const;
export type TreatmentCategoryValue = (typeof TREATMENT_CATEGORIES)[number];

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the date picker.")
  .refine((value) => {
    try {
      plainDate(value);
      return true;
    } catch {
      return false;
    }
  }, "That isn't a real date.");

const hhmm = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a 24-hour time like 08:00.");

const weekday = z.number().int().min(1).max(7);

const emptyToUndefined = (max: number) =>
  z
    .string()
    .trim()
    .transform((s) => (s.length === 0 ? undefined : s))
    .refine(
      (s) => s === undefined || s.length <= max,
      `Keep this under ${max} characters.`,
    )
    .optional();

export const recurrenceInputSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("daily") }),
  z.object({
    kind: z.literal("specific_weekdays"),
    weekdays: z
      .array(weekday)
      .min(1, "Pick at least one day.")
      .max(7)
      .refine((ds) => new Set(ds).size === ds.length, "Days must be unique."),
  }),
  z.object({
    kind: z.literal("interval_days"),
    interval: z
      .number()
      .int()
      .min(2, "Every day already has its own option — use 2 or more here.")
      .max(30),
  }),
  z.object({
    kind: z.literal("times_per_week"),
    count: z.number().int().min(2, "Use 2–7.").max(7, "Use 2–7."),
  }),
]);

export const durationInputSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("days"),
    value: z.number().int().min(1).max(3650),
  }),
  z.object({
    kind: z.literal("weeks"),
    value: z.number().int().min(1).max(520),
  }),
  z.object({
    kind: z.literal("months"),
    value: z.number().int().min(1).max(120),
  }),
  z.object({ kind: z.literal("until"), date: isoDate }),
  z.object({ kind: z.literal("ongoing") }),
]);

export const doseTimeInputSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("clock"), value: hhmm }),
  z.object({ kind: z.literal("relative"), anchor: z.string().min(1).max(40) }),
]);

const cycleSegmentSchema = z.object({
  phase: z.enum(["active", "break"]),
  unit: z.enum(["days", "weeks", "months"]),
  value: z.number().int().min(1).max(365),
});

const cycleRepeatSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("once") }),
  z.object({
    mode: z.literal("count"),
    count: z.number().int().min(1).max(52),
  }),
  z.object({ mode: z.literal("until"), date: isoDate }),
  z.object({ mode: z.literal("forever") }),
]);

export const windowInputSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("simple"), duration: durationInputSchema }),
  z.object({
    kind: z.literal("cycle"),
    segments: z
      .array(cycleSegmentSchema)
      .min(1, "Add at least one segment.")
      .max(8, "Eight segments is the maximum.")
      .refine(
        (segs) => segs.some((s) => s.phase === "active"),
        "A cycle needs at least one active segment.",
      ),
    repeat: cycleRepeatSchema,
  }),
]);

export const createTreatmentSchema = z
  .object({
    name: z.string().trim().min(1, "Give the treatment a name.").max(120),
    category: z.enum(TREATMENT_CATEGORIES),
    instructionsText: emptyToUndefined(2000),
    doseText: emptyToUndefined(200),
    anchorDate: isoDate,
    recurrence: recurrenceInputSchema,
    window: windowInputSchema,
    doseTimes: z
      .array(doseTimeInputSchema)
      .min(1, "Add at least one dose time.")
      .max(6, "Six dose times is the maximum."),
  })
  .refine(
    (v) =>
      v.window.kind !== "simple" ||
      v.window.duration.kind !== "until" ||
      v.window.duration.date >= v.anchorDate,
    {
      message: "The end date can't be before the start date.",
      path: ["window"],
    },
  )
  .refine(
    (v) =>
      v.window.kind !== "cycle" ||
      v.window.repeat.mode !== "until" ||
      v.window.repeat.date >= v.anchorDate,
    {
      message: "The end date can't be before the start date.",
      path: ["window"],
    },
  );

export type CreateTreatmentInput = z.infer<typeof createTreatmentSchema>;
export type RecurrenceInput = z.infer<typeof recurrenceInputSchema>;
export type DurationInput = z.infer<typeof durationInputSchema>;
export type WindowInput = z.infer<typeof windowInputSchema>;
export type DoseTimeInput = z.infer<typeof doseTimeInputSchema>;

/** Flatten Zod issues to a `{ topLevelField: firstMessage }` map for forms. */
export function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
