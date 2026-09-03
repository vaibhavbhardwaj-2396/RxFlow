import { describe, expect, it } from "vitest";

import type { PhaseCycle } from "@/domain/scheduling";
import { plainDate } from "@/domain/time";

import { phaseProgress } from "./phase-progress";

const anchor = plainDate("2026-09-07");

const activeOnce = (
  duration: PhaseCycle["phases"][number]["duration"],
): PhaseCycle => ({
  phases: [{ kind: "active", duration }],
  repeat: { mode: "once" },
});

describe("phaseProgress — single bounded active phase", () => {
  const cycle = activeOnce({ kind: "days", value: 14 });

  it("is day 1 on the anchor", () => {
    expect(phaseProgress(anchor, cycle, plainDate("2026-09-07"))).toMatchObject(
      {
        state: "active",
        label: "Day 1 of 14",
        dayOfPhase: 1,
        phaseLength: 14,
      },
    );
  });

  it("is day 8 a week in", () => {
    expect(phaseProgress(anchor, cycle, plainDate("2026-09-14")).label).toBe(
      "Day 8 of 14",
    );
  });

  it("is day 14 on the last active day", () => {
    const p = phaseProgress(anchor, cycle, plainDate("2026-09-20"));
    expect(p.label).toBe("Day 14 of 14");
    expect(p.fraction).toBe(1);
  });

  it("is finished the day after the window ends", () => {
    expect(phaseProgress(anchor, cycle, plainDate("2026-09-21"))).toMatchObject(
      {
        state: "finished",
        label: "Finished",
      },
    );
  });

  it("is upcoming before the anchor", () => {
    expect(phaseProgress(anchor, cycle, plainDate("2026-09-06"))).toEqual({
      state: "upcoming",
      label: "Starts 7 Sep 2026",
      fraction: null,
      dayOfPhase: null,
      phaseLength: null,
    });
  });
});

describe("phaseProgress — unbounded phase", () => {
  it("counts days with no total and no fraction", () => {
    const p = phaseProgress(
      anchor,
      activeOnce({ kind: "forever" }),
      plainDate("2026-10-07"),
    );
    expect(p).toMatchObject({
      state: "active",
      label: "Day 31",
      fraction: null,
      phaseLength: null,
    });
  });
});

describe("phaseProgress — repeating cycle with a break", () => {
  const cycle: PhaseCycle = {
    phases: [
      { kind: "active", duration: { kind: "days", value: 5 } },
      { kind: "break", duration: { kind: "days", value: 3 } },
    ],
    repeat: { mode: "count", count: 2 },
  };

  it("reports the break window", () => {
    // active Sep 7–11, break Sep 12–14, active Sep 15–19, break Sep 20–22
    expect(phaseProgress(anchor, cycle, plainDate("2026-09-13"))).toMatchObject(
      {
        state: "break",
        label: "Break · day 2 of 3",
      },
    );
  });

  it("reports the second active window", () => {
    expect(phaseProgress(anchor, cycle, plainDate("2026-09-16")).label).toBe(
      "Day 2 of 5",
    );
  });
});
