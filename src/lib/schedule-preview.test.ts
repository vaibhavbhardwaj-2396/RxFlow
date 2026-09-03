import { describe, expect, it } from "vitest";

import { previewSchedule } from "./schedule-preview";

const TZ = "Asia/Kolkata";
const TIMES = { morning: "08:00", dinner: "20:00" };

const base = {
  name: "Multivitamin",
  category: "supplement",
  instructionsText: "",
  doseText: "",
  anchorDate: "2026-09-07",
  recurrence: { kind: "daily" },
  window: { kind: "simple", duration: { kind: "weeks", value: 2 } },
  doseTimes: [{ kind: "clock", value: "08:00" }],
};

describe("previewSchedule", () => {
  it("returns incomplete for a draft that fails validation", () => {
    expect(previewSchedule({ ...base, name: "" }, TZ, TIMES).kind).toBe(
      "incomplete",
    );
  });

  it("generates the occurrence list for a valid daily draft", () => {
    const result = previewSchedule(base, TZ, TIMES);
    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.occurrences).toHaveLength(14);
    expect(result.needsDayChoice).toBe(false);
    expect(result.occurrences[0]?.localDate).toBe("2026-09-07");
  });

  it("flags a times-per-week draft with no chosen days and generates nothing", () => {
    const result = previewSchedule(
      { ...base, recurrence: { kind: "times_per_week", count: 3 } },
      TZ,
      TIMES,
    );
    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.needsDayChoice).toBe(true);
    expect(result.occurrences).toHaveLength(0);
  });
});
