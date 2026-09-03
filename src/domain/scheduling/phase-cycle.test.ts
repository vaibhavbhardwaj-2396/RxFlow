import { describe, expect, it } from "vitest";

import { plainDate } from "../time";

import { InvalidDurationError, InvalidPhaseCycleError } from "./errors";
import { type PhaseCycle, expandPhaseCycle } from "./phase-cycle";

const ANCHOR = plainDate("2026-09-07");
const FAR = plainDate("2030-01-01");

function days(value: number) {
  return { kind: "days", value } as const;
}
function weeks(value: number) {
  return { kind: "weeks", value } as const;
}

describe("expandPhaseCycle — once", () => {
  it("walks the template a single time", () => {
    const cycle: PhaseCycle = {
      phases: [
        { kind: "active", duration: days(10) },
        { kind: "break", duration: days(5) },
        { kind: "active", duration: days(10) },
      ],
      repeat: { mode: "once" },
    };

    expect(expandPhaseCycle(cycle, ANCHOR, FAR)).toEqual([
      { index: 0, kind: "active", start: "2026-09-07", end: "2026-09-17" },
      { index: 1, kind: "break", start: "2026-09-17", end: "2026-09-22" },
      { index: 2, kind: "active", start: "2026-09-22", end: "2026-10-02" },
    ]);
  });

  it("stops the walk at a `forever` step and carries labels", () => {
    const cycle: PhaseCycle = {
      phases: [
        { kind: "active", duration: { kind: "forever" }, label: "maintenance" },
        { kind: "break", duration: days(5) },
      ],
      repeat: { mode: "once" },
    };

    expect(expandPhaseCycle(cycle, ANCHOR, plainDate("2026-12-01"))).toEqual([
      {
        index: 0,
        kind: "active",
        start: "2026-09-07",
        end: "2026-12-01",
        label: "maintenance",
      },
    ]);
  });
});

describe("expandPhaseCycle — count", () => {
  it("repeats the whole template n times with monotonic indices", () => {
    const cycle: PhaseCycle = {
      phases: [
        { kind: "active", duration: weeks(1) },
        { kind: "break", duration: weeks(1) },
      ],
      repeat: { mode: "count", count: 2 },
    };

    expect(expandPhaseCycle(cycle, ANCHOR, FAR)).toEqual([
      { index: 0, kind: "active", start: "2026-09-07", end: "2026-09-14" },
      { index: 1, kind: "break", start: "2026-09-14", end: "2026-09-21" },
      { index: 2, kind: "active", start: "2026-09-21", end: "2026-09-28" },
      { index: 3, kind: "break", start: "2026-09-28", end: "2026-10-05" },
    ]);
  });

  it("rejects a count below 1", () => {
    const cycle: PhaseCycle = {
      phases: [{ kind: "active", duration: days(1) }],
      repeat: { mode: "count", count: 0 },
    };
    expect(() => expandPhaseCycle(cycle, ANCHOR, FAR)).toThrow(
      InvalidPhaseCycleError,
    );
  });
});

describe("expandPhaseCycle — until / forever", () => {
  it("clamps the last window to the day after `until`", () => {
    const cycle: PhaseCycle = {
      phases: [{ kind: "active", duration: days(10) }],
      repeat: { mode: "until", date: plainDate("2026-09-20") },
    };

    expect(expandPhaseCycle(cycle, ANCHOR, FAR)).toEqual([
      { index: 0, kind: "active", start: "2026-09-07", end: "2026-09-17" },
      { index: 1, kind: "active", start: "2026-09-17", end: "2026-09-21" },
    ]);
  });

  it("fills to the horizon and always terminates", () => {
    const cycle: PhaseCycle = {
      phases: [
        { kind: "active", duration: days(10) },
        { kind: "break", duration: days(5) },
      ],
      repeat: { mode: "forever" },
    };

    expect(expandPhaseCycle(cycle, ANCHOR, plainDate("2026-10-05"))).toEqual([
      { index: 0, kind: "active", start: "2026-09-07", end: "2026-09-17" },
      { index: 1, kind: "break", start: "2026-09-17", end: "2026-09-22" },
      { index: 2, kind: "active", start: "2026-09-22", end: "2026-10-02" },
      { index: 3, kind: "break", start: "2026-10-02", end: "2026-10-05" },
    ]);
  });
});

describe("expandPhaseCycle — validation", () => {
  it("rejects an empty template", () => {
    expect(() =>
      expandPhaseCycle({ phases: [], repeat: { mode: "once" } }, ANCHOR, FAR),
    ).toThrow(InvalidPhaseCycleError);
  });

  it("rejects a zero-length step", () => {
    const cycle: PhaseCycle = {
      phases: [{ kind: "active", duration: days(0) }],
      repeat: { mode: "once" },
    };
    expect(() => expandPhaseCycle(cycle, ANCHOR, FAR)).toThrow(
      InvalidDurationError,
    );
  });

  it("rejects a step whose `until` would not advance the cursor", () => {
    const cycle: PhaseCycle = {
      phases: [
        {
          kind: "active",
          duration: { kind: "until", date: plainDate("2020-01-01") },
        },
      ],
      repeat: { mode: "once" },
    };
    expect(() => expandPhaseCycle(cycle, ANCHOR, FAR)).toThrow(
      InvalidPhaseCycleError,
    );
  });

  it("handles a leading calendar-month step across a short February", () => {
    const cycle: PhaseCycle = {
      phases: [{ kind: "active", duration: { kind: "months", value: 2 } }],
      repeat: { mode: "once" },
    };
    expect(expandPhaseCycle(cycle, plainDate("2026-01-31"), FAR)).toEqual([
      { index: 0, kind: "active", start: "2026-01-31", end: "2026-03-31" },
    ]);
  });
});
