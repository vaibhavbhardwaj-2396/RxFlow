import { describe, expect, it } from "vitest";

import { createTreatmentSchema, fieldErrorsOf } from "./treatment";

const base = {
  name: "Multivitamin A",
  category: "supplement" as const,
  anchorDate: "2026-09-07",
  recurrence: { kind: "specific_weekdays" as const, weekdays: [1, 2, 3, 4, 5] },
  duration: { kind: "weeks" as const, value: 2 },
  doseTimes: [{ kind: "clock" as const, value: "08:00" }],
};

describe("createTreatmentSchema", () => {
  it("accepts a well-formed treatment", () => {
    const parsed = createTreatmentSchema.parse(base);
    expect(parsed.name).toBe("Multivitamin A");
    expect(parsed.recurrence).toEqual({
      kind: "specific_weekdays",
      weekdays: [1, 2, 3, 4, 5],
    });
  });

  it("coerces blank instructions / dose text to undefined", () => {
    const parsed = createTreatmentSchema.parse({
      ...base,
      instructionsText: "   ",
      doseText: "",
    });
    expect(parsed.instructionsText).toBeUndefined();
    expect(parsed.doseText).toBeUndefined();
  });

  it.each([
    { kind: "daily" },
    { kind: "interval_days", interval: 2 },
    { kind: "interval_days", interval: 3 },
  ])("accepts recurrence %o", (recurrence) => {
    expect(
      createTreatmentSchema.safeParse({ ...base, recurrence }).success,
    ).toBe(true);
  });

  it.each([
    { kind: "days", value: 10 },
    { kind: "months", value: 2 },
    { kind: "until", date: "2026-12-31" },
    { kind: "ongoing" },
  ])("accepts duration %o", (duration) => {
    expect(createTreatmentSchema.safeParse({ ...base, duration }).success).toBe(
      true,
    );
  });

  it("accepts a relative dose time", () => {
    const parsed = createTreatmentSchema.parse({
      ...base,
      doseTimes: [{ kind: "relative", anchor: "dinner" }],
    });
    expect(parsed.doseTimes[0]).toEqual({ kind: "relative", anchor: "dinner" });
  });

  it("rejects an empty weekday list", () => {
    const result = createTreatmentSchema.safeParse({
      ...base,
      recurrence: { kind: "specific_weekdays", weekdays: [] },
    });
    expect(result.success).toBe(false);
  });

  it("rejects interval_days of 1", () => {
    const result = createTreatmentSchema.safeParse({
      ...base,
      recurrence: { kind: "interval_days", interval: 1 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects an `until` date before the anchor", () => {
    const result = createTreatmentSchema.safeParse({
      ...base,
      anchorDate: "2026-09-07",
      duration: { kind: "until", date: "2026-09-01" },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrorsOf(result.error).duration).toMatch(/before the start/i);
    }
  });

  it("rejects more than six dose times", () => {
    const result = createTreatmentSchema.safeParse({
      ...base,
      doseTimes: Array.from({ length: 7 }, () => ({
        kind: "clock",
        value: "08:00",
      })),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed clock time", () => {
    const result = createTreatmentSchema.safeParse({
      ...base,
      doseTimes: [{ kind: "clock", value: "8am" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an impossible anchor date", () => {
    const result = createTreatmentSchema.safeParse({
      ...base,
      anchorDate: "2026-02-30",
    });
    expect(result.success).toBe(false);
  });
});
