import { type PhaseCycle, expandPhaseCycle } from "@/domain/scheduling";
import { type PlainDate, addDays, compareDate, maxDate } from "@/domain/time";

export interface PhaseTransition {
  date: PlainDate;
  /** `break-start` — doses stop that day; `break-end` — doses resume that day. */
  kind: "break-start" | "break-end";
}

/**
 * The days within `[from, to)` where a treatment enters or leaves a break
 * window. Pure — reads only the cycle and the calendar.
 */
export function phaseTransitionsInRange(
  anchor: PlainDate,
  cycle: PhaseCycle,
  from: PlainDate,
  to: PlainDate,
): PhaseTransition[] {
  const horizonEnd = addDays(maxDate(to, anchor), 400);
  const inRange = (d: PlainDate) =>
    compareDate(from, d) <= 0 && compareDate(d, to) < 0;

  const out: PhaseTransition[] = [];
  for (const window of expandPhaseCycle(cycle, anchor, horizonEnd)) {
    if (window.kind !== "break") continue;
    if (inRange(window.start))
      out.push({ date: window.start, kind: "break-start" });
    if (inRange(window.end)) out.push({ date: window.end, kind: "break-end" });
  }
  return out;
}
