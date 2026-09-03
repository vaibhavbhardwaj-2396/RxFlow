import type {
  DoseTime as DoseTimeRow,
  PhaseCycle as PhaseCycleRow,
  RecurrenceRule as RecurrenceRuleRow,
  TreatmentPhase as TreatmentPhaseRow,
} from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  doseSpecsFromRows,
  phaseCycleFromRows,
  recurrenceRuleFromRow,
} from "./mappers";

const ruleRow = (over: Partial<RecurrenceRuleRow>): RecurrenceRuleRow => ({
  id: "r1",
  treatmentId: "t1",
  type: "daily",
  config: {},
  recurrenceAnchor: "2026-09-07",
  needsConfirmation: false,
  ...over,
});

const cycleRow = (over: Partial<PhaseCycleRow> = {}): PhaseCycleRow => ({
  id: "c1",
  treatmentId: "t1",
  repeatMode: "once",
  repeatCount: null,
  repeatUntil: null,
  ...over,
});

const phaseRow = (over: Partial<TreatmentPhaseRow>): TreatmentPhaseRow => ({
  id: "p1",
  phaseCycleId: "c1",
  orderIndex: 0,
  kind: "active",
  durationKind: "days",
  durationValue: 14,
  durationUntil: null,
  ruleOverride: null,
  label: null,
  ...over,
});

const doseRow = (over: Partial<DoseTimeRow>): DoseTimeRow => ({
  id: "d1",
  treatmentId: "t1",
  orderIndex: 0,
  kind: "clock",
  clockValue: "08:00",
  relativeAnchor: null,
  label: null,
  ...over,
});

describe("recurrenceRuleFromRow", () => {
  it("round-trips every recurrence type", () => {
    expect(recurrenceRuleFromRow(ruleRow({ type: "daily" }))).toEqual({
      type: "daily",
      anchor: "2026-09-07",
    });
    expect(
      recurrenceRuleFromRow(
        ruleRow({ type: "specific_weekdays", config: { weekdays: [1, 3, 5] } }),
      ),
    ).toEqual({
      type: "specific_weekdays",
      anchor: "2026-09-07",
      weekdays: [1, 3, 5],
    });
    expect(
      recurrenceRuleFromRow(
        ruleRow({ type: "interval_days", config: { interval: 2 } }),
      ),
    ).toEqual({ type: "interval_days", anchor: "2026-09-07", interval: 2 });
    expect(
      recurrenceRuleFromRow(
        ruleRow({ type: "times_per_week", config: { count: 3 } }),
      ),
    ).toEqual({
      type: "times_per_week",
      anchor: "2026-09-07",
      count: 3,
      weekdays: undefined,
    });
  });
});

describe("phaseCycleFromRows", () => {
  it("orders phases and maps the repeat mode", () => {
    const cycle = phaseCycleFromRows(
      cycleRow({ repeatMode: "count", repeatCount: 3 }),
      [
        phaseRow({
          orderIndex: 1,
          kind: "break",
          durationKind: "days",
          durationValue: 7,
        }),
        phaseRow({
          orderIndex: 0,
          kind: "active",
          durationKind: "days",
          durationValue: 20,
        }),
      ],
    );
    expect(cycle).toEqual({
      phases: [
        { kind: "active", duration: { kind: "days", value: 20 } },
        { kind: "break", duration: { kind: "days", value: 7 } },
      ],
      repeat: { mode: "count", count: 3 },
    });
  });

  it("maps a forever phase and an until cycle", () => {
    expect(
      phaseCycleFromRows(cycleRow(), [
        phaseRow({ durationKind: "forever", durationValue: null }),
      ]).phases[0].duration,
    ).toEqual({ kind: "forever" });

    expect(
      phaseCycleFromRows(
        cycleRow({ repeatMode: "until", repeatUntil: "2026-12-31" }),
        [phaseRow({})],
      ).repeat,
    ).toEqual({ mode: "until", date: "2026-12-31" });
  });
});

describe("doseSpecsFromRows", () => {
  it("orders and maps clock + relative rows", () => {
    expect(
      doseSpecsFromRows([
        doseRow({
          orderIndex: 1,
          kind: "relative",
          clockValue: null,
          relativeAnchor: "dinner",
        }),
        doseRow({ orderIndex: 0, kind: "clock", clockValue: "08:00" }),
      ]),
    ).toEqual([
      { kind: "clock", value: "08:00" },
      { kind: "relative", anchor: "dinner" },
    ]);
  });
});
