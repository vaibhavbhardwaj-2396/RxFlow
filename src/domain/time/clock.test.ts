import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";

import { fixedClock, localToday, systemClock } from "./clock";

describe("systemClock", () => {
  it("returns a valid UTC instant close to real time", () => {
    const now = systemClock.now();
    expect(now.isValid).toBe(true);
    expect(now.zoneName).toBe("UTC");
    expect(Math.abs(now.toMillis() - Date.now())).toBeLessThan(1000);
  });
});

describe("fixedClock", () => {
  it("freezes at an ISO instant", () => {
    const clock = fixedClock("2026-09-07T16:30:00.000Z");
    expect(clock.now().toISO()).toBe("2026-09-07T16:30:00.000Z");
  });

  it("treats a bare date as midnight UTC", () => {
    const clock = fixedClock("2026-09-07");
    expect(clock.now().toISO()).toBe("2026-09-07T00:00:00.000Z");
  });

  it("accepts a Luxon DateTime and normalises to UTC", () => {
    const kolkata = DateTime.fromISO("2026-09-07T22:00:00", {
      zone: "Asia/Kolkata",
    });
    const clock = fixedClock(kolkata);
    expect(clock.now().toISO()).toBe("2026-09-07T16:30:00.000Z");
  });

  it("returns the same instant on every call", () => {
    const clock = fixedClock("2026-09-07T16:30:00.000Z");
    expect(clock.now().toMillis()).toBe(clock.now().toMillis());
  });

  it("throws on an invalid instant", () => {
    expect(() => fixedClock("not-a-date")).toThrow(/invalid instant/i);
  });
});

describe("localToday", () => {
  it("resolves the local calendar date in the user's timezone", () => {
    // 22:00 IST on Sep 7 is still Sep 7 locally, but 16:30 UTC.
    const clock = fixedClock("2026-09-07T16:30:00.000Z");
    expect(localToday(clock, "Asia/Kolkata")).toBe("2026-09-07");
    expect(localToday(clock, "UTC")).toBe("2026-09-07");
  });

  it("rolls over the date correctly across timezones", () => {
    // 20:00 UTC on Sep 7 is already Sep 8 in Kolkata (+05:30).
    const clock = fixedClock("2026-09-07T20:00:00.000Z");
    expect(localToday(clock, "Asia/Kolkata")).toBe("2026-09-08");
    expect(localToday(clock, "America/Los_Angeles")).toBe("2026-09-07");
  });
});
