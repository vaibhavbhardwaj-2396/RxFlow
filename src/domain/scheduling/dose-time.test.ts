import { describe, expect, it } from "vitest";

import { UnknownDoseAnchorError } from "./errors";
import { resolveDoseTime } from "./dose-time";

const DEFAULT_TIMES = {
  morning: "08:00",
  dinner: "20:00",
  beforeSleep: "22:30",
};

describe("resolveDoseTime", () => {
  it("passes a clock time straight through", () => {
    expect(
      resolveDoseTime({ kind: "clock", value: "08:00" }, DEFAULT_TIMES),
    ).toEqual({
      localTime: "08:00",
      snapshot: { kind: "clock", value: "08:00" },
    });
  });

  it("resolves a relative anchor and records what it resolved from", () => {
    expect(
      resolveDoseTime({ kind: "relative", anchor: "dinner" }, DEFAULT_TIMES),
    ).toEqual({
      localTime: "20:00",
      snapshot: { kind: "relative", anchor: "dinner", resolvedFrom: "20:00" },
    });
  });

  it("throws for an anchor with no configured default", () => {
    expect(() =>
      resolveDoseTime(
        { kind: "relative", anchor: "after_dinner" },
        DEFAULT_TIMES,
      ),
    ).toThrow(UnknownDoseAnchorError);
  });

  it("rejects a malformed clock time", () => {
    expect(() =>
      resolveDoseTime({ kind: "clock", value: "8am" }, DEFAULT_TIMES),
    ).toThrow(/HH:mm/);
    expect(() =>
      resolveDoseTime({ kind: "clock", value: "24:00" }, DEFAULT_TIMES),
    ).toThrow(/HH:mm/);
  });

  it("rejects a malformed default time behind a valid anchor", () => {
    expect(() =>
      resolveDoseTime(
        { kind: "relative", anchor: "dinner" },
        { dinner: "8 PM" },
      ),
    ).toThrow(/HH:mm/);
  });
});
