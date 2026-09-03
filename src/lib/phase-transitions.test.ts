import { describe, expect, it } from "vitest";

import type { PhaseCycle } from "@/domain/scheduling";
import { plainDate } from "@/domain/time";

import { phaseTransitionsInRange, upcomingChanges } from "./phase-transitions";

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

describe("upcomingChanges", () => {
  const foreverActive: PhaseCycle = {
    phases: [{ kind: "active", duration: { kind: "forever" } }],
    repeat: { mode: "once" },
  };

  it("surfaces Ointment B's break start and resume with days-away", () => {
    const changes = upcomingChanges(
      "t1",
      "Ointment B",
      anchor,
      ointmentB,
      plainDate("2026-09-24"),
      45,
    );
    expect(changes.map((c) => [c.kind, c.date, c.daysAway])).toEqual([
      ["break-start", "2026-09-27", 3],
      ["break-end", "2026-10-04", 10],
      ["ends", "2026-10-24", 30],
    ]);
    expect(changes[0].label).toBe("Ointment B — break starts 27 Sep");
  });

  it("reports a bounded treatment finishing", () => {
    const changes = upcomingChanges(
      "t2",
      "Ointment A",
      anchor,
      {
        phases: [{ kind: "active", duration: { kind: "months", value: 2 } }],
        repeat: { mode: "once" },
      },
      plainDate("2026-10-20"),
      30,
    );
    expect(changes).toEqual([
      {
        treatmentId: "t2",
        treatmentName: "Ointment A",
        date: "2026-11-07",
        daysAway: 18,
        kind: "ends",
        label: "Ointment A finishes 7 Nov",
      },
    ]);
  });

  it("reports a future treatment starting", () => {
    const changes = upcomingChanges(
      "t3",
      "New pill",
      plainDate("2026-09-20"),
      foreverActive,
      plainDate("2026-09-07"),
      45,
    );
    expect(changes).toEqual([
      {
        treatmentId: "t3",
        treatmentName: "New pill",
        date: "2026-09-20",
        daysAway: 13,
        kind: "starts",
        label: "New pill starts 20 Sep",
      },
    ]);
  });

  it("is empty for an ongoing daily treatment", () => {
    expect(
      upcomingChanges(
        "t4",
        "Vitamin",
        anchor,
        foreverActive,
        plainDate("2026-09-10"),
      ),
    ).toEqual([]);
  });
});
