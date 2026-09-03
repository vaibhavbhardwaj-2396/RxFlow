import { describe, expect, it } from "vitest";

import { plainDate } from "../time";

import { type Duration, windowEndExclusive } from "./duration";
import { InvalidDurationError } from "./errors";

const START = plainDate("2026-09-07");
const FAR = plainDate("2030-01-01"); // a horizon well past every window here

describe("windowEndExclusive", () => {
  it("adds an exact number of days", () => {
    expect(windowEndExclusive(START, { kind: "days", value: 10 }, FAR)).toBe(
      "2026-09-17",
    );
  });

  it("adds an exact number of weeks", () => {
    expect(windowEndExclusive(START, { kind: "weeks", value: 2 }, FAR)).toBe(
      "2026-09-21",
    );
  });

  it("uses calendar-month arithmetic — 31 Jan + 2 months is 31 Mar", () => {
    expect(
      windowEndExclusive(
        plainDate("2026-01-31"),
        { kind: "months", value: 2 },
        FAR,
      ),
    ).toBe("2026-03-31");
  });

  it("clamps a month add to the shorter month (leap year)", () => {
    expect(
      windowEndExclusive(
        plainDate("2028-01-31"),
        { kind: "months", value: 1 },
        FAR,
      ),
    ).toBe("2028-02-29");
  });

  it("treats `until` as an inclusive end date", () => {
    expect(
      windowEndExclusive(
        START,
        { kind: "until", date: plainDate("2026-09-20") },
        FAR,
      ),
    ).toBe("2026-09-21");
  });

  it("runs `forever` to the horizon", () => {
    expect(windowEndExclusive(START, { kind: "forever" }, FAR)).toBe(
      "2030-01-01",
    );
  });

  it.each([
    { kind: "days", value: 0 } as Duration,
    { kind: "weeks", value: -1 } as Duration,
    { kind: "months", value: 1.5 } as Duration,
  ])("rejects a non-positive or fractional %o", (duration) => {
    expect(() => windowEndExclusive(START, duration, FAR)).toThrow(
      InvalidDurationError,
    );
  });
});
