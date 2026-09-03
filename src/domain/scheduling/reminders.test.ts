import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";

import { inQuietHours, reminderFireAt } from "./reminders";

const IST = "Asia/Kolkata";
// A dose at 22:30 IST = 17:00Z; at 08:00 IST = 02:30Z.
const at = (isoLocal: string, zone = IST) =>
  DateTime.fromISO(isoLocal, { zone });

describe("inQuietHours", () => {
  it("handles a daytime window", () => {
    expect(inQuietHours(13 * 60, { start: "12:00", end: "14:00" })).toBe(true);
    expect(inQuietHours(11 * 60, { start: "12:00", end: "14:00" })).toBe(false);
    expect(inQuietHours(14 * 60, { start: "12:00", end: "14:00" })).toBe(false);
  });

  it("handles an overnight window", () => {
    const q = { start: "22:00", end: "07:00" };
    expect(inQuietHours(23 * 60, q)).toBe(true);
    expect(inQuietHours(3 * 60, q)).toBe(true);
    expect(inQuietHours(7 * 60, q)).toBe(false);
    expect(inQuietHours(12 * 60, q)).toBe(false);
  });
});

describe("reminderFireAt", () => {
  it("fires `leadMinutes` before the dose when there is no quiet window", () => {
    const fire = reminderFireAt(at("2026-09-07T08:00"), 15, null, IST);
    expect(fire.toISO()).toBe("2026-09-07T02:15:00.000Z");
  });

  it("leaves a reminder that lands outside quiet hours alone", () => {
    // 08:00 dose, 15m lead → 07:45 IST, quiet ends 07:00 → unaffected.
    const fire = reminderFireAt(
      at("2026-09-07T08:00"),
      15,
      { start: "22:00", end: "07:00" },
      IST,
    );
    expect(fire.setZone(IST).toFormat("HH:mm")).toBe("07:45");
  });

  it("pushes an evening reminder to the morning end of the quiet window", () => {
    // 22:30 dose, 15m lead → 22:15 IST, inside 22:00–07:00 → 07:00 next day.
    const fire = reminderFireAt(
      at("2026-09-07T22:30"),
      15,
      { start: "22:00", end: "07:00" },
      IST,
    );
    expect(fire.setZone(IST).toISO()).toBe("2026-09-08T07:00:00.000+05:30");
  });

  it("pushes an early-morning reminder to the same-day end of the window", () => {
    // 07:30 dose, 60m lead → 06:30 IST, inside window → 07:00 same day.
    const fire = reminderFireAt(
      at("2026-09-07T07:30"),
      60,
      { start: "22:00", end: "07:00" },
      IST,
    );
    expect(fire.setZone(IST).toISO()).toBe("2026-09-07T07:00:00.000+05:30");
  });

  it("respects a daytime quiet window", () => {
    const fire = reminderFireAt(
      at("2026-09-07T13:10"),
      15,
      { start: "12:00", end: "14:00" },
      IST,
    );
    expect(fire.setZone(IST).toFormat("HH:mm")).toBe("14:00");
  });
});
