import { describe, expect, it } from "vitest";

import { findTimeConflicts } from "./conflicts";

describe("findTimeConflicts", () => {
  it("flags two treatments at the same local time on the same day", () => {
    const result = findTimeConflicts([
      { treatmentId: "a", localDate: "2026-09-07", localTime: "20:00" },
      { treatmentId: "b", localDate: "2026-09-07", localTime: "20:00" },
      { treatmentId: "c", localDate: "2026-09-07", localTime: "08:00" },
    ]);
    expect(result.get("2026-09-07")).toEqual([
      { localTime: "20:00", treatmentIds: ["a", "b"] },
    ]);
  });

  it("does not flag a single treatment dosing twice at one time", () => {
    const result = findTimeConflicts([
      { treatmentId: "a", localDate: "2026-09-07", localTime: "20:00" },
      { treatmentId: "a", localDate: "2026-09-07", localTime: "20:00" },
    ]);
    expect(result.size).toBe(0);
  });

  it("keeps conflicts separate per day and sorts clusters by time", () => {
    const result = findTimeConflicts([
      { treatmentId: "a", localDate: "2026-09-08", localTime: "22:00" },
      { treatmentId: "b", localDate: "2026-09-08", localTime: "22:00" },
      { treatmentId: "a", localDate: "2026-09-08", localTime: "08:00" },
      { treatmentId: "b", localDate: "2026-09-08", localTime: "08:00" },
      { treatmentId: "a", localDate: "2026-09-09", localTime: "08:00" },
    ]);
    expect(result.get("2026-09-08")?.map((c) => c.localTime)).toEqual([
      "08:00",
      "22:00",
    ]);
    expect(result.has("2026-09-09")).toBe(false);
  });

  it("does not flag a near-miss (19:59 vs 20:00)", () => {
    const result = findTimeConflicts([
      { treatmentId: "a", localDate: "2026-09-07", localTime: "19:59" },
      { treatmentId: "b", localDate: "2026-09-07", localTime: "20:00" },
    ]);
    expect(result.size).toBe(0);
  });

  it("collects three-way overlaps in first-seen order", () => {
    const result = findTimeConflicts([
      { treatmentId: "c", localDate: "2026-09-07", localTime: "22:30" },
      { treatmentId: "a", localDate: "2026-09-07", localTime: "22:30" },
      { treatmentId: "b", localDate: "2026-09-07", localTime: "22:30" },
    ]);
    expect(result.get("2026-09-07")?.[0].treatmentIds).toEqual(["c", "a", "b"]);
  });
});
