import { DateTime } from "luxon";

import { type PhaseCycle, expandPhaseCycle } from "@/domain/scheduling";
import {
  type PlainDate,
  addDays,
  compareDate,
  daysBetween,
  maxDate,
} from "@/domain/time";

export interface PhaseProgress {
  state: "upcoming" | "active" | "break" | "finished";
  /** "Day 5 of 14" · "Day 30" · "Break · day 2 of 7" · "Starts 12 Sep 2026" · "Finished" */
  label: string;
  /** 0..1 for a progress bar; `null` when the phase has no fixed length. */
  fraction: number | null;
  dayOfPhase: number | null;
  phaseLength: number | null;
}

const HORIZON_DAYS = 800;

/** Where `today` sits within a treatment's phase cycle. Pure. */
export function phaseProgress(
  anchor: PlainDate,
  cycle: PhaseCycle,
  today: PlainDate,
): PhaseProgress {
  if (compareDate(today, anchor) < 0) {
    return {
      state: "upcoming",
      label: `Starts ${fmtDate(anchor)}`,
      fraction: null,
      dayOfPhase: null,
      phaseLength: null,
    };
  }

  const horizonEnd = addDays(maxDate(today, anchor), HORIZON_DAYS);
  const window = expandPhaseCycle(cycle, anchor, horizonEnd).find(
    (w) => compareDate(w.start, today) <= 0 && compareDate(today, w.end) < 0,
  );

  if (!window) {
    return {
      state: "finished",
      label: "Finished",
      fraction: 1,
      dayOfPhase: null,
      phaseLength: null,
    };
  }

  const dayOfPhase = daysBetween(window.start, today) + 1;
  const template = cycle.phases[window.index % cycle.phases.length];
  const phaseLength =
    template.duration.kind === "forever"
      ? null
      : daysBetween(window.start, window.end);
  const fraction =
    phaseLength && phaseLength > 0
      ? Math.min(1, Math.max(0, dayOfPhase / phaseLength))
      : null;

  const noun = window.kind === "break" ? "Break · day" : "Day";
  const label =
    phaseLength !== null
      ? `${noun} ${dayOfPhase} of ${phaseLength}`
      : `${noun} ${dayOfPhase}`;

  return {
    state: window.kind === "break" ? "break" : "active",
    label,
    fraction,
    dayOfPhase,
    phaseLength,
  };
}

function fmtDate(date: PlainDate): string {
  return DateTime.fromISO(date, { zone: "utc" }).toFormat("d LLL yyyy");
}
