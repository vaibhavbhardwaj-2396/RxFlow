import { UnknownDoseAnchorError } from "./errors";

/** A wall-clock time of day, `"HH:mm"` in 24-hour form. */
export type HhMm = string;

/**
 * When a dose is taken on an on-day.
 * - `clock` — an exact wall time the user gave.
 * - `relative` — "after dinner", resolved against the user's default times at
 *   generation. Never shown as if it were exact.
 */
export type DoseTimeSpec =
  { kind: "clock"; value: HhMm } | { kind: "relative"; anchor: string };

/**
 * What actually got baked onto an occurrence. For `relative` it records the
 * time it resolved from, so the occurrence can be re-resolved if the user later
 * changes that default.
 */
export type TimeSpecSnapshot =
  | { kind: "clock"; value: HhMm }
  | { kind: "relative"; anchor: string; resolvedFrom: HhMm };

export interface ResolvedDoseTime {
  localTime: HhMm;
  snapshot: TimeSpecSnapshot;
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Resolve a dose spec to a concrete local time plus the snapshot to persist.
 * `defaultTimes` is the user's slug → `"HH:mm"` map. Throws
 * {@link UnknownDoseAnchorError} if a relative anchor has no default.
 */
export function resolveDoseTime(
  spec: DoseTimeSpec,
  defaultTimes: Record<string, string>,
): ResolvedDoseTime {
  if (spec.kind === "clock") {
    assertHhMm(spec.value, "dose time");
    return {
      localTime: spec.value,
      snapshot: { kind: "clock", value: spec.value },
    };
  }

  const resolvedFrom = defaultTimes[spec.anchor];
  if (resolvedFrom === undefined) {
    throw new UnknownDoseAnchorError(spec.anchor);
  }
  assertHhMm(resolvedFrom, `default time for "${spec.anchor}"`);
  return {
    localTime: resolvedFrom,
    snapshot: { kind: "relative", anchor: spec.anchor, resolvedFrom },
  };
}

function assertHhMm(value: string, what: string): void {
  if (!HHMM.test(value)) {
    throw new Error(`${what}: expected "HH:mm", got ${JSON.stringify(value)}`);
  }
}
