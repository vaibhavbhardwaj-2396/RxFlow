import { describe, expect, it } from "vitest";

import { createTreatmentSchema, fieldErrorsOf } from "./treatment";

const base = {
  name: "Multivitamin A",
  category: "supplement" as const,
  anchorDate: "2026-09-07",
  recurrence: { kind: "specific_weekdays" as const, weekdays: [1, 2, 3, 4, 5] },
  window: {
    kind: "simple" as const,
    duration: { kind: "weeks" as const, value: 2 },
  },
  doseTimes: [{ kind: "clock" as const, value: "08:00" }],
};

describe("createTreatmentSchema", () => {
  it("accepts a well-formed treatment", () => {
    const parsed = createTreatmentSchema.parse(base);
    expect(parsed.name).toBe("Multivitamin A");
    expect(parsed.window).toEqual({
      kind: "simple",
      duration: { kind: "weeks", value: 2 },
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
    { kind: "times_per_week", count: 3 },
  ])("accepts recurrence %o", (recurrence) => {
    expect(
      createTreatmentSchema.safeParse({ ...base, recurrence }).success,
    ).toBe(true);
  });

  it.each([
    { kind: "simple", duration: { kind: "days", value: 10 } },
    { kind: "simple", duration: { kind: "until", date: "2026-12-31" } },
    { kind: "simple", duration: { kind: "ongoing" } },
    {
      kind: "cycle",
      segments: [
        { phase: "active", unit: "days", value: 20 },
        { phase: "break", unit: "days", value: 7 },
      ],
      repeat: { mode: "count", count: 2 },
    },
  ])("accepts window %o", (window) => {
    expect(createTreatmentSchema.safeParse({ ...base, window }).success).toBe(
      true,
    );
  });

  it("rejects times_per_week outside 2–7", () => {
    expect(
      createTreatmentSchema.safeParse({
        ...base,
        recurrence: { kind: "times_per_week", count: 1 },
      }).success,
    ).toBe(false);
    expect(
      createTreatmentSchema.safeParse({
        ...base,
        recurrence: { kind: "times_per_week", count: 8 },
      }).success,
    ).toBe(false);
  });

  it("rejects a cycle with no active segment", () => {
    expect(
      createTreatmentSchema.safeParse({
        ...base,
        window: {
          kind: "cycle",
          segments: [{ phase: "break", unit: "days", value: 7 }],
          repeat: { mode: "once" },
        },
      }).success,
    ).toBe(false);
  });

  it("rejects an empty weekday list", () => {
    const result = createTreatmentSchema.safeParse({
      ...base,
      recurrence: { kind: "specific_weekdays", weekdays: [] },
    });
    expect(result.success).toBe(false);
  });

  it("rejects an `until` date before the anchor", () => {
    const result = createTreatmentSchema.safeParse({
      ...base,
      anchorDate: "2026-09-07",
      window: {
        kind: "simple",
        duration: { kind: "until", date: "2026-09-01" },
      },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrorsOf(result.error).window).toMatch(/before the start/i);
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
