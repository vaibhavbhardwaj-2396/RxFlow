import { describe, expect, it } from "vitest";

import type { PhaseCycle, RecurrenceRule } from "@/domain/scheduling";
import { plainDate } from "@/domain/time";

import {
  describeDoseTimes,
  describeRecurrence,
  describeWindow,
} from "./schedule-summary";

const anchor = plainDate("2026-09-07");
const DEFAULT_TIMES = { dinner: "20:00", beforeSleep: "22:30" };

describe("describeRecurrence", () => {
  it.each<[RecurrenceRule, string]>([
    [{ type: "daily", anchor }, "Every day"],
    [{ type: "interval_days", anchor, interval: 2 }, "Every other day"],
    [{ type: "interval_days", anchor, interval: 3 }, "Every 3 days"],
    [
      { type: "specific_weekdays", anchor, weekdays: [1, 2, 3, 4, 5] },
      "Weekdays",
    ],
    [{ type: "specific_weekdays", anchor, weekdays: [6, 7] }, "Weekends"],
    [
      { type: "specific_weekdays", anchor, weekdays: [1, 3, 5] },
      "Mondays, Wednesdays & Fridays",
    ],
    [
      { type: "specific_weekdays", anchor, weekdays: [2, 6] },
      "Tuesdays & Saturdays",
    ],
  ])("%o -> %s", (r, expected) => {
    expect(describeRecurrence(r)).toBe(expected);
  });
});

const activeOnce = (
  duration: PhaseCycle["phases"][number]["duration"],
): PhaseCycle => ({
  phases: [{ kind: "active", duration }],
  repeat: { mode: "once" },
});

describe("describeWindow", () => {
  it("shows a bounded day range", () => {
    expect(
      describeWindow(anchor, activeOnce({ kind: "days", value: 14 })),
    ).toBe("7 Sep – 20 Sep 2026");
  });

  it("shows a bounded week range", () => {
    expect(
      describeWindow(anchor, activeOnce({ kind: "weeks", value: 2 })),
    ).toBe("7 Sep – 20 Sep 2026");
  });

  it("shows a calendar-month range", () => {
    expect(
      describeWindow(anchor, activeOnce({ kind: "months", value: 2 })),
    ).toBe("7 Sep – 6 Nov 2026");
  });

  it("shows an until range", () => {
    expect(
      describeWindow(
        anchor,
        activeOnce({ kind: "until", date: plainDate("2026-12-31") }),
      ),
    ).toBe("7 Sep – 31 Dec 2026");
  });

  it("shows ongoing", () => {
    expect(describeWindow(anchor, activeOnce({ kind: "forever" }))).toBe(
      "From 7 Sep 2026 · ongoing",
    );
  });

  it("adds the year to the start when the range crosses new year", () => {
    expect(
      describeWindow(
        plainDate("2026-12-20"),
        activeOnce({ kind: "weeks", value: 4 }),
      ),
    ).toBe("20 Dec 2026 – 16 Jan 2027");
  });

  it("describes a repeating cycle by its segments", () => {
    expect(
      describeWindow(anchor, {
        phases: [
          { kind: "active", duration: { kind: "days", value: 20 } },
          { kind: "break", duration: { kind: "days", value: 7 } },
          { kind: "active", duration: { kind: "days", value: 20 } },
        ],
        repeat: { mode: "once" },
      }),
    ).toBe("20 days on · 7 off · 20 on");

    expect(
      describeWindow(anchor, {
        phases: [
          { kind: "active", duration: { kind: "weeks", value: 1 } },
          { kind: "break", duration: { kind: "weeks", value: 1 } },
        ],
        repeat: { mode: "count", count: 3 },
      }),
    ).toBe("1 week on · 1 off, ×3");

    expect(
      describeWindow(anchor, {
        phases: [
          { kind: "active", duration: { kind: "days", value: 10 } },
          { kind: "break", duration: { kind: "days", value: 5 } },
        ],
        repeat: { mode: "forever" },
      }),
    ).toBe("10 days on · 5 off, ongoing");
  });
});

describe("describeDoseTimes", () => {
  it("shows a single clock time", () => {
    expect(
      describeDoseTimes([{ kind: "clock", value: "08:00" }], DEFAULT_TIMES),
    ).toBe("08:00");
  });

  it("resolves and labels relative anchors", () => {
    expect(
      describeDoseTimes(
        [
          { kind: "relative", anchor: "dinner" },
          { kind: "relative", anchor: "beforeSleep" },
        ],
        DEFAULT_TIMES,
      ),
    ).toBe("Dinner (20:00) & Before sleep (22:30)");
  });

  it("mixes clock and relative", () => {
    expect(
      describeDoseTimes(
        [
          { kind: "clock", value: "08:00" },
          { kind: "relative", anchor: "dinner" },
        ],
        DEFAULT_TIMES,
      ),
    ).toBe("08:00 & Dinner (20:00)");
  });

  it("shows the bare label when the anchor has no default", () => {
    expect(
      describeDoseTimes(
        [{ kind: "relative", anchor: "afterLunch" }],
        DEFAULT_TIMES,
      ),
    ).toBe("After lunch");
  });
});
