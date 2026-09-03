import { DateTime } from "luxon";

import { type PhaseCycle, expandPhaseCycle } from "@/domain/scheduling";
import {
  type PlainDate,
  addDays,
  compareDate,
  daysBetween,
  maxDate,
} from "@/domain/time";

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

export interface UpcomingChange {
  treatmentId: string;
  treatmentName: string;
  date: PlainDate;
  daysAway: number;
  kind: "starts" | "break-start" | "break-end" | "ends";
  label: string;
}

const fmt = (d: PlainDate) =>
  DateTime.fromISO(d, { zone: "utc" }).toFormat("d LLL");

/**
 * Schedule shifts for one treatment in the next `horizonDays`: it starting,
 * a break starting or ending, or the whole plan finishing. Pure.
 */
export function upcomingChanges(
  treatmentId: string,
  treatmentName: string,
  anchor: PlainDate,
  cycle: PhaseCycle,
  today: PlainDate,
  horizonDays = 45,
): UpcomingChange[] {
  const to = addDays(today, horizonDays);
  const windows = expandPhaseCycle(
    cycle,
    anchor,
    addDays(maxDate(to, anchor), 400),
  );
  const out: UpcomingChange[] = [];

  const push = (
    date: PlainDate,
    kind: UpcomingChange["kind"],
    label: string,
  ) => {
    if (compareDate(today, date) <= 0 && compareDate(date, to) < 0) {
      out.push({
        treatmentId,
        treatmentName,
        date,
        daysAway: daysBetween(today, date),
        kind,
        label,
      });
    }
  };

  if (compareDate(today, anchor) < 0) {
    push(anchor, "starts", `${treatmentName} starts ${fmt(anchor)}`);
  }

  for (const window of windows) {
    if (window.kind !== "break") continue;
    push(
      window.start,
      "break-start",
      `${treatmentName} — break starts ${fmt(window.start)}`,
    );
    push(
      window.end,
      "break-end",
      `${treatmentName} — resumes ${fmt(window.end)}`,
    );
  }

  // A cycle with no `forever` phase and a bounded repeat finishes when its last
  // window ends.
  const openEnded =
    cycle.repeat.mode === "forever" ||
    cycle.phases.some((p) => p.duration.kind === "forever");
  if (!openEnded && windows.length > 0) {
    const end = windows[windows.length - 1].end;
    push(end, "ends", `${treatmentName} finishes ${fmt(end)}`);
  }

  return out.sort((a, b) => compareDate(a.date, b.date));
}
