import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";

import {
  addDays,
  addMonths,
  compareDate,
  daysBetween,
  eachDate,
  maxDate,
  minDate,
  plainDate,
  weekday,
} from "./plain-date";

describe("plainDate", () => {
  it("accepts and brands a YYYY-MM-DD string", () => {
    expect(plainDate("2026-09-07")).toBe("2026-09-07");
  });

  it("takes the calendar date of a DateTime", () => {
    const dt = DateTime.fromISO("2026-09-07T23:30:00", {
      zone: "Asia/Kolkata",
    });
    expect(plainDate(dt)).toBe("2026-09-07");
  });

  it("rejects a non-date string", () => {
    expect(() => plainDate("not-a-date")).toThrow(/YYYY-MM-DD/);
  });

  it("rejects an invalid DateTime", () => {
    expect(() => plainDate(DateTime.invalid("test"))).toThrow(
      /invalid DateTime/,
    );
  });

  it("rejects an impossible date", () => {
    expect(() => plainDate("2026-13-01")).toThrow(/not a real date/);
    expect(() => plainDate("2026-02-30")).toThrow(/not a real date/);
  });

  it("rejects an ISO timestamp (wrong shape)", () => {
    expect(() => plainDate("2026-09-07T00:00:00Z")).toThrow(/YYYY-MM-DD/);
  });
});

describe("addDays", () => {
  it("crosses a month boundary", () => {
    expect(addDays(plainDate("2026-09-30"), 1)).toBe("2026-10-01");
  });

  it("crosses a year boundary", () => {
    expect(addDays(plainDate("2026-12-31"), 1)).toBe("2027-01-01");
  });

  it("goes backwards with a negative count", () => {
    expect(addDays(plainDate("2026-03-01"), -1)).toBe("2026-02-28");
  });

  it("lands on the leap day in 2028", () => {
    expect(addDays(plainDate("2028-02-28"), 1)).toBe("2028-02-29");
    expect(addDays(plainDate("2028-02-29"), 1)).toBe("2028-03-01");
  });
});

describe("addMonths", () => {
  it("keeps the day of month when it exists", () => {
    expect(addMonths(plainDate("2026-01-15"), 2)).toBe("2026-03-15");
  });

  it("keeps 31 Jan + 2 months as 31 Mar", () => {
    expect(addMonths(plainDate("2026-01-31"), 2)).toBe("2026-03-31");
  });

  it("clamps 31 Jan + 1 month to the end of February (leap year)", () => {
    expect(addMonths(plainDate("2028-01-31"), 1)).toBe("2028-02-29");
  });

  it("clamps 31 Jan + 1 month to 28 Feb in a common year", () => {
    expect(addMonths(plainDate("2026-01-31"), 1)).toBe("2026-02-28");
  });
});

describe("daysBetween", () => {
  it("is positive when the second date is later", () => {
    expect(daysBetween(plainDate("2026-09-07"), plainDate("2026-09-23"))).toBe(
      16,
    );
  });

  it("is negative when the second date is earlier", () => {
    expect(daysBetween(plainDate("2026-09-23"), plainDate("2026-09-07"))).toBe(
      -16,
    );
  });

  it("is zero for the same day", () => {
    expect(daysBetween(plainDate("2026-09-07"), plainDate("2026-09-07"))).toBe(
      0,
    );
  });

  it("counts straight across a month boundary", () => {
    expect(daysBetween(plainDate("2026-01-31"), plainDate("2026-03-31"))).toBe(
      59,
    );
  });
});

describe("weekday", () => {
  it("maps Monday to 1 and Sunday to 7", () => {
    // 2026-09-07 is a Monday.
    expect(weekday(plainDate("2026-09-07"))).toBe(1);
    expect(weekday(plainDate("2026-09-13"))).toBe(7);
  });
});

describe("compareDate / minDate / maxDate", () => {
  it("orders dates", () => {
    expect(compareDate(plainDate("2026-09-07"), plainDate("2026-09-08"))).toBe(
      -1,
    );
    expect(compareDate(plainDate("2026-09-08"), plainDate("2026-09-07"))).toBe(
      1,
    );
    expect(compareDate(plainDate("2026-09-07"), plainDate("2026-09-07"))).toBe(
      0,
    );
  });

  it("picks the earliest and latest", () => {
    const dates = [
      plainDate("2026-09-10"),
      plainDate("2026-09-01"),
      plainDate("2026-09-30"),
    ];
    expect(minDate(...dates)).toBe("2026-09-01");
    expect(maxDate(...dates)).toBe("2026-09-30");
  });
});

describe("eachDate", () => {
  it("yields every date in a half-open range", () => {
    const dates = [
      ...eachDate(plainDate("2026-09-07"), plainDate("2026-09-10")),
    ];
    expect(dates).toEqual(["2026-09-07", "2026-09-08", "2026-09-09"]);
  });

  it("yields nothing when from >= to", () => {
    expect([
      ...eachDate(plainDate("2026-09-10"), plainDate("2026-09-10")),
    ]).toEqual([]);
    expect([
      ...eachDate(plainDate("2026-09-11"), plainDate("2026-09-10")),
    ]).toEqual([]);
  });
});
