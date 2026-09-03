import { type PlainDate, addDays, compareDate, minDate } from "../time";

import { type Duration, windowEndExclusive } from "./duration";
import { InvalidPhaseCycleError } from "./errors";

export type PhaseKind = "active" | "break";

/** One step in the repeating template — ACTIVE or BREAK, of an arbitrary length. */
export interface PhaseTemplate {
  kind: PhaseKind;
  duration: Duration;
  label?: string;
}

/** How the template list repeats. An indefinite regimen still needs a `count`
 * or `until` before reminders can be scheduled — the engine never invents an end. */
export type Repeat =
  | { mode: "once" }
  | { mode: "count"; count: number }
  | { mode: "until"; date: PlainDate }
  | { mode: "forever" };

export interface PhaseCycle {
  phases: PhaseTemplate[];
  repeat: Repeat;
}

/** A concrete dated span produced by expanding a cycle. `end` is exclusive. */
export interface PhaseWindow {
  index: number;
  kind: PhaseKind;
  start: PlainDate;
  end: PlainDate;
  label?: string;
}

/**
 * Expand a cycle into concrete dated windows by walking a cursor from `anchor`.
 * BREAK windows are emitted too (the timeline shows them) — they just advance
 * the cursor. The walk always terminates: `once`/`count` bound the passes,
 * `until`/`forever` stop at their date or the horizon, and a step that would not
 * advance the cursor is rejected.
 */
export function expandPhaseCycle(
  cycle: PhaseCycle,
  anchor: PlainDate,
  horizonEnd: PlainDate,
): PhaseWindow[] {
  if (cycle.phases.length === 0) {
    throw new InvalidPhaseCycleError("a cycle needs at least one phase");
  }
  if (cycle.repeat.mode === "count" && cycle.repeat.count < 1) {
    throw new InvalidPhaseCycleError(
      `repeat count must be >= 1, got ${cycle.repeat.count}`,
    );
  }

  const hardStop =
    cycle.repeat.mode === "until"
      ? minDate(addDays(cycle.repeat.date, 1), horizonEnd)
      : horizonEnd;
  const passes =
    cycle.repeat.mode === "once"
      ? 1
      : cycle.repeat.mode === "count"
        ? cycle.repeat.count
        : Number.POSITIVE_INFINITY;

  const windows: PhaseWindow[] = [];
  let cursor = anchor;
  let index = 0;

  for (let pass = 0; pass < passes; pass++) {
    for (const step of cycle.phases) {
      if (compareDate(cursor, hardStop) >= 0) return windows;

      const rawEnd = windowEndExclusive(cursor, step.duration, horizonEnd);
      if (compareDate(rawEnd, cursor) <= 0) {
        throw new InvalidPhaseCycleError(
          `phase ${index} (${step.kind}) does not advance the cursor`,
        );
      }

      windows.push({
        index,
        kind: step.kind,
        start: cursor,
        end: minDate(rawEnd, hardStop),
        ...(step.label !== undefined ? { label: step.label } : {}),
      });
      index += 1;
      cursor = rawEnd;

      if (step.duration.kind === "forever") return windows;
    }
  }

  return windows;
}
