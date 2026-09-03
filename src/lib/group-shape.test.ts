import { describe, expect, it } from "vitest";

import { type GroupShapeInput, isNamedGroup } from "./group-shape";

const base: GroupShapeInput = {
  title: "Tretinoin",
  kind: "ongoing",
  color: null,
  archivedAt: null,
  hasPrescription: false,
  treatmentNames: ["Tretinoin"],
};

describe("isNamedGroup", () => {
  it("a solo plan whose title matches its treatment is a shadow", () => {
    expect(isNamedGroup(base)).toBe(false);
  });

  it("2+ treatments is always a group", () => {
    expect(
      isNamedGroup({ ...base, treatmentNames: ["Tretinoin", "Moisturiser"] }),
    ).toBe(true);
  });

  it("an empty user-made plan is a group", () => {
    expect(isNamedGroup({ ...base, title: "Travel", treatmentNames: [] })).toBe(
      true,
    );
  });

  it("a renamed solo plan is a group", () => {
    expect(isNamedGroup({ ...base, title: "Skincare" })).toBe(true);
  });

  it("kind/color/archive/prescription each promote a solo plan to a group", () => {
    expect(isNamedGroup({ ...base, kind: "course" })).toBe(true);
    expect(isNamedGroup({ ...base, color: "rose" })).toBe(true);
    expect(isNamedGroup({ ...base, archivedAt: new Date() })).toBe(true);
    expect(isNamedGroup({ ...base, hasPrescription: true })).toBe(true);
  });
});
