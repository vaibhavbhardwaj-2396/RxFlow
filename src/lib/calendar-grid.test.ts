import { describe, expect, it } from "vitest";

import { plainDate } from "@/domain/time";

import {
  inSameMonth,
  monthGrid,
  shiftMonth,
  startOfMonth,
  startOfWeek,
  weekDays,
} from "./calendar-grid";

describe("startOfWeek", () => {
  it("returns the Monday of the week", () => {
    // 2026-09-09 is a Wednesday.
    expect(startOfWeek(plainDate("2026-09-09"))).toBe("2026-09-07");
    // A Monday maps to itself.
    expect(startOfWeek(plainDate("2026-09-07"))).toBe("2026-09-07");
    // A Sunday belongs to the week that started six days earlier.
    expect(startOfWeek(plainDate("2026-09-13"))).toBe("2026-09-07");
  });
});

describe("weekDays", () => {
  it("lists Monday through Sunday", () => {
    expect(weekDays(plainDate("2026-09-09"))).toEqual([
      "2026-09-07",
      "2026-09-08",
      "2026-09-09",
      "2026-09-10",
      "2026-09-11",
      "2026-09-12",
      "2026-09-13",
    ]);
  });
});

describe("monthGrid", () => {
  it("is always 6 rows of 7 days", () => {
    const grid = monthGrid(plainDate("2026-09-15"));
    expect(grid).toHaveLength(6);
    expect(grid.every((row) => row.length === 7)).toBe(true);
  });

  it("starts on the Monday on or before the 1st and spills into adjacent months", () => {
    // September 2026 starts on a Tuesday, so the grid opens on Mon 31 Aug.
    const grid = monthGrid(plainDate("2026-09-15"));
    expect(grid[0][0]).toBe("2026-08-31");
    expect(grid[0][1]).toBe("2026-09-01");
    expect(grid.at(-1)?.at(-1)).toBe("2026-10-11");
  });

  it("handles a non-leap February", () => {
    const grid = monthGrid(plainDate("2027-02-10"));
    const flat = grid.flat();
    expect(flat).toContain("2027-02-28");
    expect(flat).not.toContain("2027-02-29");
    expect(flat[0]).toBe("2027-02-01"); // 1 Feb 2027 is a Monday
  });
});

describe("startOfMonth / shiftMonth / inSameMonth", () => {
  it("navigates months", () => {
    expect(startOfMonth(plainDate("2026-09-15"))).toBe("2026-09-01");
    expect(shiftMonth(plainDate("2026-09-15"), 1)).toBe("2026-10-15");
    expect(shiftMonth(plainDate("2026-01-31"), 1)).toBe("2026-02-28");
  });

  it("tests month membership by year-month prefix", () => {
    expect(inSameMonth(plainDate("2026-09-30"), plainDate("2026-09-01"))).toBe(
      true,
    );
    expect(inSameMonth(plainDate("2026-10-01"), plainDate("2026-09-15"))).toBe(
      false,
    );
  });
});
