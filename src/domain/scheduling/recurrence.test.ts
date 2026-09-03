import { describe, expect, it } from "vitest";

import { eachDate, plainDate } from "../time";

import { RecurrenceNeedsConfirmationError } from "./errors";
import { type RecurrenceRule, isOn, needsConfirmation } from "./recurrence";

const ANCHOR = plainDate("2026-09-07"); // a Monday

/** Every date in [from, to) for which the rule is on. */
function onDates(rule: RecurrenceRule, from: string, to: string): string[] {
  const hits: string[] = [];
  for (const d of eachDate(plainDate(from), plainDate(to))) {
    if (isOn(rule, d)) hits.push(d);
  }
  return hits;
}

describe("daily", () => {
  const rule: RecurrenceRule = { type: "daily", anchor: ANCHOR };

  it("is on every day from the anchor onward", () => {
    expect(onDates(rule, "2026-09-07", "2026-09-12")).toEqual([
      "2026-09-07",
      "2026-09-08",
      "2026-09-09",
      "2026-09-10",
      "2026-09-11",
    ]);
  });

  it("is still on far past the anchor", () => {
    expect(isOn(rule, plainDate("2027-05-01"))).toBe(true);
  });

  it("is off before the anchor", () => {
    expect(isOn(rule, plainDate("2026-09-06"))).toBe(false);
  });
});

describe("specific_weekdays", () => {
  it("fires Monday–Friday", () => {
    const rule: RecurrenceRule = {
      type: "specific_weekdays",
      weekdays: [1, 2, 3, 4, 5],
      anchor: ANCHOR,
    };
    expect(onDates(rule, "2026-09-07", "2026-09-21")).toEqual([
      "2026-09-07",
      "2026-09-08",
      "2026-09-09",
      "2026-09-10",
      "2026-09-11",
      "2026-09-14",
      "2026-09-15",
      "2026-09-16",
      "2026-09-17",
      "2026-09-18",
    ]);
  });

  it("fires on Mon/Wed/Fri only", () => {
    const rule: RecurrenceRule = {
      type: "specific_weekdays",
      weekdays: [1, 3, 5],
      anchor: ANCHOR,
    };
    expect(onDates(rule, "2026-09-07", "2026-09-14")).toEqual([
      "2026-09-07",
      "2026-09-09",
      "2026-09-11",
    ]);
  });
});

describe("interval_days", () => {
  const rule: RecurrenceRule = {
    type: "interval_days",
    interval: 2,
    anchor: ANCHOR,
  };

  it("fires every other day, counted from the fixed anchor", () => {
    // Runs straight through what would later be a break (Sep 17–21): the
    // parity never resets. Sep 23 is on (offset 16), Sep 22 is off (offset 15).
    expect(onDates(rule, "2026-09-07", "2026-10-02")).toEqual([
      "2026-09-07",
      "2026-09-09",
      "2026-09-11",
      "2026-09-13",
      "2026-09-15",
      "2026-09-17",
      "2026-09-19",
      "2026-09-21",
      "2026-09-23",
      "2026-09-25",
      "2026-09-27",
      "2026-09-29",
      "2026-10-01",
    ]);
  });

  it("is off the day before the anchor even though parity would match", () => {
    // 2026-09-05 has the same parity as the anchor but precedes it.
    expect(isOn(rule, plainDate("2026-09-05"))).toBe(false);
  });

  it("supports every-3rd-day", () => {
    const every3: RecurrenceRule = {
      type: "interval_days",
      interval: 3,
      anchor: ANCHOR,
    };
    expect(onDates(every3, "2026-09-07", "2026-09-17")).toEqual([
      "2026-09-07",
      "2026-09-10",
      "2026-09-13",
      "2026-09-16",
    ]);
  });

  it("rejects a non-positive interval", () => {
    const bad: RecurrenceRule = {
      type: "interval_days",
      interval: 0,
      anchor: ANCHOR,
    };
    expect(() => isOn(bad, plainDate("2026-09-07"))).toThrow(RangeError);
  });
});

describe("times_per_week", () => {
  it("with named weekdays behaves exactly like specific_weekdays", () => {
    const rule: RecurrenceRule = {
      type: "times_per_week",
      count: 2,
      weekdays: [2, 6], // Tue + Sat
      anchor: ANCHOR,
    };
    expect(needsConfirmation(rule)).toBe(false);
    expect(onDates(rule, "2026-09-07", "2026-09-21")).toEqual([
      "2026-09-08",
      "2026-09-12",
      "2026-09-15",
      "2026-09-19",
    ]);
  });

  it("without weekdays needs confirmation and refuses to evaluate", () => {
    const rule: RecurrenceRule = {
      type: "times_per_week",
      count: 3,
      anchor: ANCHOR,
    };
    expect(needsConfirmation(rule)).toBe(true);
    expect(() => isOn(rule, plainDate("2026-09-09"))).toThrow(
      RecurrenceNeedsConfirmationError,
    );
  });

  it("treats an empty weekday list as still needing confirmation", () => {
    const rule: RecurrenceRule = {
      type: "times_per_week",
      count: 3,
      weekdays: [],
      anchor: ANCHOR,
    };
    expect(needsConfirmation(rule)).toBe(true);
  });
});
