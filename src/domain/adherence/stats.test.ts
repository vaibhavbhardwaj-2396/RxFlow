import { describe, expect, it } from "vitest";

import { summariseStatuses } from "./stats";

describe("summariseStatuses", () => {
  it("counts an empty day as all zeros", () => {
    expect(summariseStatuses([])).toEqual({
      total: 0,
      completed: 0,
      skipped: 0,
      missed: 0,
      pending: 0,
    });
  });

  it("buckets every status, folding reminder_sent into pending", () => {
    expect(
      summariseStatuses([
        "completed",
        "completed",
        "skipped",
        "missed",
        "scheduled",
        "reminder_sent",
      ]),
    ).toEqual({
      total: 6,
      completed: 2,
      skipped: 1,
      missed: 1,
      pending: 2,
    });
  });
});
