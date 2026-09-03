import { describe, expect, it } from "vitest";

import type { PhaseCycle } from "@/domain/scheduling";
import { plainDate } from "@/domain/time";

import { phaseTransitionsInRange } from "./phase-transitions";

const anchor = plainDate("2026-09-07");

const ointmentB: PhaseCycle = {
  phases: [
    { kind: "active", duration: { kind: "days", value: 20 } },
    { kind: "break", duration: { kind: "days", value: 7 } },
    { kind: "active", duration: { kind: "days", value: 20 } },
  ],
  repeat: { mode: "once" },
};

describe("phaseTransitionsInRange", () => {
  it("marks the break start and end of a 20 / 7 / 20 cycle", () => {
    expect(
      phaseTransitionsInRange(
        anchor,
        ointmentB,
        plainDate("2026-09-01"),
        plainDate("2026-11-01"),
      ),
    ).toEqual([
      { date: "2026-09-27", kind: "break-start" },
      { date: "2026-10-04", kind: "break-end" },
    ]);
  });

  it("only reports transitions inside the window", () => {
    // A range that ends before the break starts sees nothing.
    expect(
      phaseTransitionsInRange(
        anchor,
        ointmentB,
        plainDate("2026-09-01"),
        plainDate("2026-09-20"),
      ),
    ).toEqual([]);

    // A range covering only the resume day sees just break-end.
    expect(
      phaseTransitionsInRange(
        anchor,
        ointmentB,
        plainDate("2026-10-01"),
        plainDate("2026-10-10"),
      ),
    ).toEqual([{ date: "2026-10-04", kind: "break-end" }]);
  });

  it("has no transitions for a single continuous active phase", () => {
    expect(
      phaseTransitionsInRange(
        anchor,
        {
          phases: [{ kind: "active", duration: { kind: "forever" } }],
          repeat: { mode: "once" },
        },
        plainDate("2026-09-01"),
        plainDate("2027-09-01"),
      ),
    ).toEqual([]);
  });
});
