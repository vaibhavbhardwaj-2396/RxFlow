import { describe, expect, it } from "vitest";

import { dayPart } from "./day-buckets";

describe("dayPart", () => {
  it.each([
    ["00:00", "morning"],
    ["08:00", "morning"],
    ["11:59", "morning"],
    ["12:00", "afternoon"],
    ["16:59", "afternoon"],
    ["17:00", "evening"],
    ["20:59", "evening"],
    ["21:00", "night"],
    ["22:30", "night"],
    ["23:59", "night"],
  ] as const)("%s -> %s", (time, part) => {
    expect(dayPart(time)).toBe(part);
  });
});
