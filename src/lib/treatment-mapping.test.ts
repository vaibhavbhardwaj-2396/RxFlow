import { describe, expect, it } from "vitest";

import { plainDate } from "@/domain/time";

import {
  doseSpecsFromInput,
  phaseCycleFromInput,
  recurrenceRuleFromInput,
  toCreateData,
} from "./treatment-mapping";

const anchor = plainDate("2026-09-07");

describe("recurrenceRuleFromInput", () => {
  it("maps every kind", () => {
    expect(recurrenceRuleFromInput({ kind: "daily" }, anchor)).toEqual({
      type: "daily",
      anchor,
    });
    expect(
      recurrenceRuleFromInput(
        { kind: "specific_weekdays", weekdays: [5, 1, 3] },
        anchor,
      ),
    ).toEqual({ type: "specific_weekdays", anchor, weekdays: [1, 3, 5] });
    expect(
      recurrenceRuleFromInput({ kind: "interval_days", interval: 2 }, anchor),
    ).toEqual({ type: "interval_days", anchor, interval: 2 });
    expect(
      recurrenceRuleFromInput({ kind: "times_per_week", count: 3 }, anchor),
    ).toEqual({ type: "times_per_week", anchor, count: 3 });
  });
});

describe("phaseCycleFromInput", () => {
  it("wraps a simple duration in one ACTIVE phase, repeat once", () => {
    expect(
      phaseCycleFromInput({
        kind: "simple",
        duration: { kind: "weeks", value: 2 },
      }),
    ).toEqual({
      phases: [{ kind: "active", duration: { kind: "weeks", value: 2 } }],
      repeat: { mode: "once" },
    });
  });

  it("maps ongoing → forever and until → dated", () => {
    expect(
      phaseCycleFromInput({ kind: "simple", duration: { kind: "ongoing" } })
        .phases[0].duration,
    ).toEqual({ kind: "forever" });
    expect(
      phaseCycleFromInput({
        kind: "simple",
        duration: { kind: "until", date: "2026-12-31" },
      }).phases[0].duration,
    ).toEqual({ kind: "until", date: "2026-12-31" });
  });

  it("builds a multi-phase cycle from segments + repeat", () => {
    expect(
      phaseCycleFromInput({
        kind: "cycle",
        segments: [
          { phase: "active", unit: "days", value: 20 },
          { phase: "break", unit: "days", value: 7 },
          { phase: "active", unit: "days", value: 20 },
        ],
        repeat: { mode: "count", count: 2 },
      }),
    ).toEqual({
      phases: [
        { kind: "active", duration: { kind: "days", value: 20 } },
        { kind: "break", duration: { kind: "days", value: 7 } },
        { kind: "active", duration: { kind: "days", value: 20 } },
      ],
      repeat: { mode: "count", count: 2 },
    });
  });
});

describe("doseSpecsFromInput", () => {
  it("passes clock and relative specs through", () => {
    expect(
      doseSpecsFromInput([
        { kind: "clock", value: "08:00" },
        { kind: "relative", anchor: "dinner" },
      ]),
    ).toEqual([
      { kind: "clock", value: "08:00" },
      { kind: "relative", anchor: "dinner" },
    ]);
  });
});

describe("toCreateData", () => {
  it("produces nested rows for a Mon–Fri / 2-week / 08:00 treatment", () => {
    const data = toCreateData({
      anchorDate: "2026-09-07",
      recurrence: { kind: "specific_weekdays", weekdays: [3, 1, 2, 5, 4] },
      window: { kind: "simple", duration: { kind: "weeks", value: 2 } },
      doseTimes: [{ kind: "clock", value: "08:00" }],
    });

    expect(data.recurrence).toEqual({
      type: "specific_weekdays",
      config: { weekdays: [1, 2, 3, 4, 5] },
      recurrenceAnchor: "2026-09-07",
      needsConfirmation: false,
    });
    expect(data.phaseCycle).toEqual({
      repeatMode: "once",
      repeatCount: null,
      repeatUntil: null,
      phases: [
        {
          orderIndex: 0,
          kind: "active",
          durationKind: "weeks",
          durationValue: 2,
          durationUntil: null,
        },
      ],
    });
    expect(data.doseTimes).toEqual([
      {
        orderIndex: 0,
        kind: "clock",
        clockValue: "08:00",
        relativeAnchor: null,
      },
    ]);
  });

  it("flags a bare times_per_week as needing confirmation and generates no phases oddities", () => {
    const data = toCreateData({
      anchorDate: "2026-09-07",
      recurrence: { kind: "times_per_week", count: 3 },
      window: { kind: "simple", duration: { kind: "ongoing" } },
      doseTimes: [{ kind: "clock", value: "21:00" }],
    });
    expect(data.recurrence).toEqual({
      type: "times_per_week",
      config: { count: 3 },
      recurrenceAnchor: "2026-09-07",
      needsConfirmation: true,
    });
  });

  it("writes multi-phase cycle rows with the repeat mode", () => {
    const data = toCreateData({
      anchorDate: "2026-09-07",
      recurrence: { kind: "daily" },
      window: {
        kind: "cycle",
        segments: [
          { phase: "active", unit: "days", value: 10 },
          { phase: "break", unit: "weeks", value: 1 },
        ],
        repeat: { mode: "until", date: "2026-12-01" },
      },
      doseTimes: [{ kind: "clock", value: "22:00" }],
    });
    expect(data.phaseCycle.repeatMode).toBe("until");
    expect(data.phaseCycle.repeatUntil).toBe("2026-12-01");
    expect(data.phaseCycle.phases).toEqual([
      {
        orderIndex: 0,
        kind: "active",
        durationKind: "days",
        durationValue: 10,
        durationUntil: null,
      },
      {
        orderIndex: 1,
        kind: "break",
        durationKind: "weeks",
        durationValue: 1,
        durationUntil: null,
      },
    ]);
  });
});
