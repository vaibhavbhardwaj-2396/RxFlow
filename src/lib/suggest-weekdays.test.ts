import { describe, expect, it } from "vitest";

import { suggestWeekdays } from "./suggest-weekdays";

describe("suggestWeekdays", () => {
  it("spreads N days across the week", () => {
    expect(suggestWeekdays(2)).toEqual([1, 4]);
    expect(suggestWeekdays(3)).toEqual([1, 3, 5]);
    expect(suggestWeekdays(4)).toEqual([1, 3, 5, 7]);
    expect(suggestWeekdays(7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("clamps out-of-range counts", () => {
    expect(suggestWeekdays(1)).toEqual([1, 4]);
    expect(suggestWeekdays(9)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("returns unique, ascending weekday numbers", () => {
    for (let n = 2; n <= 7; n++) {
      const days = suggestWeekdays(n);
      expect(days).toHaveLength(n);
      expect([...days].sort((a, b) => a - b)).toEqual(days);
      expect(new Set(days).size).toBe(n);
      expect(days.every((d) => d >= 1 && d <= 7)).toBe(true);
    }
  });
});
