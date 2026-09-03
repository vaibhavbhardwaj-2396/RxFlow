import { describe, expect, it } from "vitest";

import { plainDate } from "../time";

import { InvalidWallTimeError } from "./errors";
import { wallTimeToInstant } from "./wall-time";

const d = (s: string) => plainDate(s);

describe("wallTimeToInstant", () => {
  it("converts an IST wall time to the right UTC instant (+05:30)", () => {
    expect(wallTimeToInstant(d("2026-10-04"), "20:00", "Asia/Kolkata")).toBe(
      "2026-10-04T14:30:00.000Z",
    );
  });

  it("uses the zone's offset for that date (London BST vs GMT)", () => {
    expect(wallTimeToInstant(d("2026-07-01"), "09:00", "Europe/London")).toBe(
      "2026-07-01T08:00:00.000Z",
    );
    expect(wallTimeToInstant(d("2026-01-01"), "09:00", "Europe/London")).toBe(
      "2026-01-01T09:00:00.000Z",
    );
  });

  it("throws on an unknown zone", () => {
    expect(() =>
      wallTimeToInstant(d("2026-01-01"), "09:00", "Mars/Base"),
    ).toThrow(InvalidWallTimeError);
  });

  it("throws on a malformed time", () => {
    expect(() =>
      wallTimeToInstant(d("2026-01-01"), "25:00", "Asia/Kolkata"),
    ).toThrow(InvalidWallTimeError);
  });
});
