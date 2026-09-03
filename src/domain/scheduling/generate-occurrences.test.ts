import { describe, expect, it } from "vitest";

import { type PlainDate, eachDate, plainDate } from "../time";

import { type DoseTimeSpec } from "./dose-time";
import { InvalidWallTimeError, UnknownDoseAnchorError } from "./errors";
import { type PhaseCycle } from "./phase-cycle";
import { type RecurrenceRule } from "./recurrence";
import {
  type GenerateInput,
  type GeneratedOccurrence,
  generateOccurrences,
} from "./generate-occurrences";

const IST = "Asia/Kolkata";
const DEFAULT_TIMES = {
  morning: "08:00",
  dinner: "20:00",
  beforeSleep: "22:30",
};
const ANCHOR = plainDate("2026-09-07"); // Monday

function daily(anchor: PlainDate = ANCHOR): RecurrenceRule {
  return { type: "daily", anchor };
}

function activeOnce(days: number): PhaseCycle {
  return {
    phases: [{ kind: "active", duration: { kind: "days", value: days } }],
    repeat: { mode: "once" },
  };
}

function run(overrides: Partial<GenerateInput> = {}): GeneratedOccurrence[] {
  return generateOccurrences({
    anchor: ANCHOR,
    recurrenceRule: daily(),
    phaseCycle: activeOnce(5),
    doseTimes: [{ kind: "clock", value: "08:00" }],
    timezone: IST,
    defaultTimes: DEFAULT_TIMES,
    scheduleVersion: 1,
    range: { from: ANCHOR, to: plainDate("2026-09-30") },
    ...overrides,
  });
}

const localDates = (os: GeneratedOccurrence[]) => os.map((o) => o.localDate);

function datesInSpans(spans: Array<[string, string]>): string[] {
  const out: string[] = [];
  for (const [start, endExclusive] of spans) {
    for (const d of eachDate(plainDate(start), plainDate(endExclusive)))
      out.push(d);
  }
  return out;
}

describe("generateOccurrences — basics", () => {
  it("daily over a one-month window, 08:00 Asia/Kolkata", () => {
    const result = run({
      phaseCycle: {
        phases: [{ kind: "active", duration: { kind: "months", value: 1 } }],
        repeat: { mode: "once" },
      },
      range: { from: ANCHOR, to: plainDate("2026-12-31") },
    });

    expect(result).toHaveLength(30); // Sep 7 .. Oct 6 inclusive
    expect(result[0]).toMatchObject({
      phaseIndex: 0,
      scheduleVersion: 1,
      localDate: "2026-09-07",
      localTime: "08:00",
      timezone: IST,
      scheduledAt: "2026-09-07T02:30:00.000Z", // 08:00 IST = 02:30 UTC
      timeSpecSnapshot: { kind: "clock", value: "08:00" },
      status: "scheduled",
    });
    expect(result.at(-1)?.localDate).toBe("2026-10-06");
    expect(result.every((o) => o.phaseIndex === 0)).toBe(true);
  });

  it("Monday–Friday over a two-week active window", () => {
    const result = run({
      recurrenceRule: {
        type: "specific_weekdays",
        weekdays: [1, 2, 3, 4, 5],
        anchor: ANCHOR,
      },
      phaseCycle: activeOnce(14),
    });

    expect(localDates(result)).toEqual([
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

  it("preserves the start date as the first occurrence", () => {
    const result = run();
    expect(result[0].localDate).toBe("2026-09-07");
  });
});

describe("generateOccurrences — recurrence × phase intersection", () => {
  it("continues an alternate-day rhythm straight through a break", () => {
    // interval-2 anchored Mon Sep 7, phases 10 ACTIVE / 5 BREAK / 10 ACTIVE.
    // The rhythm is measured from the fixed anchor, so it resumes on Sep 23
    // (offset 16) — NOT on Sep 22, the first day of the second active phase.
    const result = run({
      recurrenceRule: { type: "interval_days", interval: 2, anchor: ANCHOR },
      phaseCycle: {
        phases: [
          { kind: "active", duration: { kind: "days", value: 10 } },
          { kind: "break", duration: { kind: "days", value: 5 } },
          { kind: "active", duration: { kind: "days", value: 10 } },
        ],
        repeat: { mode: "once" },
      },
      range: { from: ANCHOR, to: plainDate("2026-10-31") },
    });

    expect(localDates(result)).toEqual([
      "2026-09-07",
      "2026-09-09",
      "2026-09-11",
      "2026-09-13",
      "2026-09-15",
      "2026-09-23",
      "2026-09-25",
      "2026-09-27",
      "2026-09-29",
      "2026-10-01",
    ]);
    // Nothing from the break window; phase index reflects the real window.
    expect(result.slice(0, 5).every((o) => o.phaseIndex === 0)).toBe(true);
    expect(result.slice(5).every((o) => o.phaseIndex === 2)).toBe(true);
  });

  it.each([
    {
      name: "10 / 5 / 10",
      phases: [
        { kind: "active", duration: { kind: "days", value: 10 } },
        { kind: "break", duration: { kind: "days", value: 5 } },
        { kind: "active", duration: { kind: "days", value: 10 } },
      ],
      repeat: { mode: "once" },
      spans: [
        ["2026-09-07", "2026-09-17"],
        ["2026-09-22", "2026-10-02"],
      ],
    },
    {
      name: "3 ON / 4 OFF, ×2",
      phases: [
        { kind: "active", duration: { kind: "days", value: 3 } },
        { kind: "break", duration: { kind: "days", value: 4 } },
      ],
      repeat: { mode: "count", count: 2 },
      spans: [
        ["2026-09-07", "2026-09-10"],
        ["2026-09-14", "2026-09-17"],
      ],
    },
    {
      name: "1 week ON / 1 week OFF, ×3",
      phases: [
        { kind: "active", duration: { kind: "weeks", value: 1 } },
        { kind: "break", duration: { kind: "weeks", value: 1 } },
      ],
      repeat: { mode: "count", count: 3 },
      spans: [
        ["2026-09-07", "2026-09-14"],
        ["2026-09-21", "2026-09-28"],
        ["2026-10-05", "2026-10-12"],
      ],
    },
  ] as Array<{
    name: string;
    phases: unknown;
    repeat: unknown;
    spans: Array<[string, string]>;
  }>)(
    "emits exactly the active days for arbitrary phase lengths ($name)",
    ({ phases, repeat, spans }) => {
      const result = run({
        phaseCycle: { phases, repeat } as PhaseCycle,
        range: { from: ANCHOR, to: plainDate("2026-12-31") },
      });
      expect(localDates(result)).toEqual(datesInSpans(spans));
    },
  );

  it("handles a 20 / 10 / 20 cycle", () => {
    const result = run({
      phaseCycle: {
        phases: [
          { kind: "active", duration: { kind: "days", value: 20 } },
          { kind: "break", duration: { kind: "days", value: 10 } },
          { kind: "active", duration: { kind: "days", value: 20 } },
        ],
        repeat: { mode: "once" },
      },
      range: { from: ANCHOR, to: plainDate("2026-12-31") },
    });
    expect(result).toHaveLength(40);
    expect(localDates(result)).toEqual(
      datesInSpans([
        ["2026-09-07", "2026-09-27"],
        ["2026-10-07", "2026-10-27"],
      ]),
    );
  });
});

describe("generateOccurrences — repeat modes", () => {
  it("count repeats the template a fixed number of times", () => {
    const result = run({
      phaseCycle: {
        phases: [
          { kind: "active", duration: { kind: "days", value: 3 } },
          { kind: "break", duration: { kind: "days", value: 4 } },
        ],
        repeat: { mode: "count", count: 2 },
      },
      range: { from: ANCHOR, to: plainDate("2026-12-31") },
    });
    expect(localDates(result)).toEqual([
      "2026-09-07",
      "2026-09-08",
      "2026-09-09",
      "2026-09-14",
      "2026-09-15",
      "2026-09-16",
    ]);
  });

  it("until stops on the right day", () => {
    const result = run({
      phaseCycle: {
        phases: [
          { kind: "active", duration: { kind: "days", value: 3 } },
          { kind: "break", duration: { kind: "days", value: 4 } },
        ],
        repeat: { mode: "until", date: plainDate("2026-09-15") },
      },
      range: { from: ANCHOR, to: plainDate("2026-12-31") },
    });
    expect(localDates(result)).toEqual([
      "2026-09-07",
      "2026-09-08",
      "2026-09-09",
      "2026-09-14",
      "2026-09-15",
    ]);
  });

  it("forever fills to the range horizon and terminates", () => {
    const result = run({
      phaseCycle: {
        phases: [
          { kind: "active", duration: { kind: "days", value: 3 } },
          { kind: "break", duration: { kind: "days", value: 4 } },
        ],
        repeat: { mode: "forever" },
      },
      range: { from: ANCHOR, to: plainDate("2026-09-20") },
    });
    expect(localDates(result)).toEqual([
      "2026-09-07",
      "2026-09-08",
      "2026-09-09",
      "2026-09-14",
      "2026-09-15",
      "2026-09-16",
    ]);
  });

  it("an ongoing plan (single forever ACTIVE phase, daily) is horizon-bounded and returns promptly", () => {
    // The wizard's "Ongoing — no end date yet" maps to this shape. Regression
    // guard: `expandPhaseCycle` must stop at the range horizon, not loop.
    const start = Date.now();
    const result = run({
      phaseCycle: {
        phases: [{ kind: "active", duration: { kind: "forever" } }],
        repeat: { mode: "once" },
      },
      range: { from: ANCHOR, to: plainDate("2026-12-06") }, // 90 days
    });
    expect(Date.now() - start).toBeLessThan(1000);
    expect(result).toHaveLength(91); // inclusive of both ends
    expect(result[0].localDate).toBe("2026-09-07");
    expect(result.at(-1)?.localDate).toBe("2026-12-06");
  });
});

describe("generateOccurrences — calendar edges", () => {
  it("honours a calendar-month window boundary", () => {
    const result = run({
      anchor: plainDate("2026-01-31"),
      recurrenceRule: daily(plainDate("2026-01-31")),
      phaseCycle: {
        phases: [{ kind: "active", duration: { kind: "months", value: 2 } }],
        repeat: { mode: "once" },
      },
      range: { from: plainDate("2026-01-31"), to: plainDate("2026-06-01") },
    });
    expect(result).toHaveLength(59);
    expect(result[0].localDate).toBe("2026-01-31");
    expect(result.at(-1)?.localDate).toBe("2026-03-30");
  });

  it("includes the leap day", () => {
    const result = run({
      anchor: plainDate("2028-02-28"),
      recurrenceRule: daily(plainDate("2028-02-28")),
      phaseCycle: activeOnce(3),
      range: { from: plainDate("2028-02-28"), to: plainDate("2028-03-31") },
    });
    expect(localDates(result)).toEqual([
      "2028-02-28",
      "2028-02-29",
      "2028-03-01",
    ]);
  });

  it("throws a clear error for an unusable timezone rather than emitting a bad instant", () => {
    expect(() => run({ timezone: "Not/AZone" })).toThrow(InvalidWallTimeError);
  });

  it("converts wall time using the zone's rules for that date (US spring-forward)", () => {
    const result = run({
      anchor: plainDate("2026-03-06"),
      recurrenceRule: daily(plainDate("2026-03-06")),
      phaseCycle: activeOnce(5),
      doseTimes: [{ kind: "clock", value: "09:00" }],
      timezone: "America/New_York",
      range: { from: plainDate("2026-03-06"), to: plainDate("2026-03-10") },
    });
    expect(result.map((o) => o.scheduledAt)).toEqual([
      "2026-03-06T14:00:00.000Z", // EST, UTC-5
      "2026-03-07T14:00:00.000Z",
      "2026-03-08T13:00:00.000Z", // EDT from here, UTC-4
      "2026-03-09T13:00:00.000Z",
      "2026-03-10T13:00:00.000Z",
    ]);
  });
});

describe("generateOccurrences — dose times", () => {
  it("emits one occurrence per dose time per on-day, ordered by instant", () => {
    const result = run({
      phaseCycle: activeOnce(2),
      doseTimes: [
        { kind: "clock", value: "20:00" },
        { kind: "clock", value: "08:00" },
      ],
    });
    expect(result.map((o) => ({ d: o.localDate, t: o.localTime }))).toEqual([
      { d: "2026-09-07", t: "08:00" },
      { d: "2026-09-07", t: "20:00" },
      { d: "2026-09-08", t: "08:00" },
      { d: "2026-09-08", t: "20:00" },
    ]);
  });

  it("resolves a relative dose time and snapshots what it resolved from", () => {
    const result = run({
      phaseCycle: activeOnce(1),
      doseTimes: [{ kind: "relative", anchor: "dinner" }],
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      localTime: "20:00",
      scheduledAt: "2026-09-07T14:30:00.000Z",
      timeSpecSnapshot: {
        kind: "relative",
        anchor: "dinner",
        resolvedFrom: "20:00",
      },
    });
  });

  it("throws when a relative anchor has no configured default", () => {
    expect(() =>
      run({
        doseTimes: [{ kind: "relative", anchor: "brunch" }] as DoseTimeSpec[],
      }),
    ).toThrow(UnknownDoseAnchorError);
  });
});

describe("generateOccurrences — range and regeneration", () => {
  it("clips generation to the requested range on both ends", () => {
    const result = run({
      phaseCycle: {
        phases: [{ kind: "active", duration: { kind: "months", value: 1 } }],
        repeat: { mode: "once" },
      },
      range: { from: plainDate("2026-09-10"), to: plainDate("2026-09-15") },
    });
    expect(localDates(result)).toEqual([
      "2026-09-10",
      "2026-09-11",
      "2026-09-12",
      "2026-09-13",
      "2026-09-14",
      "2026-09-15",
    ]);
  });

  it("regenerates only forward when re-run with a later range and a new version", () => {
    const result = run({
      phaseCycle: {
        phases: [{ kind: "active", duration: { kind: "months", value: 1 } }],
        repeat: { mode: "once" },
      },
      scheduleVersion: 3,
      range: { from: plainDate("2026-09-20"), to: plainDate("2026-10-31") },
    });
    expect(result[0].localDate).toBe("2026-09-20");
    expect(result.at(-1)?.localDate).toBe("2026-10-06");
    expect(result.every((o) => o.scheduleVersion === 3)).toBe(true);
  });

  it("returns nothing for a recurrence that still needs confirmation", () => {
    const result = run({
      recurrenceRule: { type: "times_per_week", count: 3, anchor: ANCHOR },
    });
    expect(result).toEqual([]);
  });

  it("returns nothing when there are no dose times", () => {
    expect(run({ doseTimes: [] })).toEqual([]);
  });
});
