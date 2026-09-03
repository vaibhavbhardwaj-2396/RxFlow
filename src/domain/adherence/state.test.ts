import { describe, expect, it } from "vitest";

import {
  type AdherenceAction,
  type OccurrenceStatus,
  InvalidAdherenceActionError,
  applyAdherenceAction,
  isPending,
  isSettled,
} from "./state";

describe("applyAdherenceAction", () => {
  it.each<[OccurrenceStatus, AdherenceAction, OccurrenceStatus, string]>([
    ["scheduled", "complete", "completed", "completed"],
    ["reminder_sent", "complete", "completed", "completed"],
    ["scheduled", "skip", "skipped", "skipped"],
    ["reminder_sent", "skip", "skipped", "skipped"],
    ["completed", "reopen", "scheduled", "reopened"],
    ["skipped", "reopen", "scheduled", "reopened"],
    ["missed", "reopen", "scheduled", "reopened"],
    ["skipped", "complete", "completed", "completed"],
    ["completed", "skip", "skipped", "skipped"],
    ["missed", "complete", "completed", "completed"],
    ["missed", "skip", "skipped", "skipped"],
  ])("%s + %s -> %s (event %s)", (from, action, status, event) => {
    expect(applyAdherenceAction(from, action)).toEqual({ status, event });
  });

  it.each<[OccurrenceStatus, AdherenceAction]>([
    ["completed", "complete"],
    ["skipped", "skip"],
    ["scheduled", "reopen"],
    ["reminder_sent", "reopen"],
  ])("rejects %s + %s", (from, action) => {
    expect(() => applyAdherenceAction(from, action)).toThrow(
      InvalidAdherenceActionError,
    );
  });
});

describe("isPending / isSettled", () => {
  it("classifies each status", () => {
    expect(isPending("scheduled")).toBe(true);
    expect(isPending("reminder_sent")).toBe(true);
    expect(isPending("completed")).toBe(false);
    expect(isPending("missed")).toBe(false);

    expect(isSettled("completed")).toBe(true);
    expect(isSettled("skipped")).toBe(true);
    expect(isSettled("missed")).toBe(false);
    expect(isSettled("scheduled")).toBe(false);
  });
});
