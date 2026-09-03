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
  it("maps each kind and keeps weekdays sorted", () => {
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
  });
});

describe("phaseCycleFromInput", () => {
  it("wraps a bounded duration in one ACTIVE phase, repeat once", () => {
    expect(phaseCycleFromInput({ kind: "weeks", value: 2 })).toEqual({
      phases: [{ kind: "active", duration: { kind: "weeks", value: 2 } }],
      repeat: { mode: "once" },
    });
  });

  it("maps ongoing to forever and until to a dated phase", () => {
    expect(phaseCycleFromInput({ kind: "ongoing" }).phases[0].duration).toEqual(
      {
        kind: "forever",
      },
    );
    expect(
      phaseCycleFromInput({ kind: "until", date: "2026-12-31" }).phases[0]
        .duration,
    ).toEqual({ kind: "until", date: "2026-12-31" });
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
      duration: { kind: "weeks", value: 2 },
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

  it("encodes daily as {} and ongoing as a forever phase", () => {
    const data = toCreateData({
      anchorDate: "2026-09-07",
      recurrence: { kind: "daily" },
      duration: { kind: "ongoing" },
      doseTimes: [{ kind: "relative", anchor: "dinner" }],
    });
    expect(data.recurrence.config).toEqual({});
    expect(data.phaseCycle.phases[0]).toMatchObject({
      durationKind: "forever",
      durationValue: null,
    });
    expect(data.doseTimes[0]).toEqual({
      orderIndex: 0,
      kind: "relative",
      clockValue: null,
      relativeAnchor: "dinner",
    });
  });

  it("encodes an `until` duration with its date", () => {
    const data = toCreateData({
      anchorDate: "2026-09-07",
      recurrence: { kind: "interval_days", interval: 2 },
      duration: { kind: "until", date: "2026-10-01" },
      doseTimes: [{ kind: "clock", value: "22:00" }],
    });
    expect(data.recurrence).toMatchObject({
      type: "interval_days",
      config: { interval: 2 },
    });
    expect(data.phaseCycle.phases[0]).toMatchObject({
      durationKind: "until",
      durationValue: null,
      durationUntil: "2026-10-01",
    });
  });
});
