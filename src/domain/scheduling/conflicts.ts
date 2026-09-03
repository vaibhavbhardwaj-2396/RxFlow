import type { HhMm } from "./dose-time";

export interface OccurrenceSlot {
  treatmentId: string;
  localDate: string;
  localTime: HhMm;
}

export interface TimeCluster {
  localTime: HhMm;
  /** Distinct treatment ids that land on this exact local time, in first-seen order. */
  treatmentIds: string[];
}

/**
 * Group occurrences by local date and exact local time, keeping only the times
 * where **two or more different treatments** coincide.
 *
 * This is a neutral scheduling observation — "these land at the same minute" —
 * never a claim about whether taking them together is safe. Exact-minute match
 * only: no fuzzy window, so the result is unambiguous.
 */
export function findTimeConflicts(
  occurrences: ReadonlyArray<OccurrenceSlot>,
): Map<string, TimeCluster[]> {
  // date -> time -> ordered distinct treatment ids
  const byDate = new Map<string, Map<HhMm, string[]>>();

  for (const o of occurrences) {
    let byTime = byDate.get(o.localDate);
    if (!byTime) {
      byTime = new Map();
      byDate.set(o.localDate, byTime);
    }
    const ids = byTime.get(o.localTime) ?? [];
    if (!ids.includes(o.treatmentId)) ids.push(o.treatmentId);
    byTime.set(o.localTime, ids);
  }

  const result = new Map<string, TimeCluster[]>();
  for (const [date, byTime] of byDate) {
    const clusters: TimeCluster[] = [];
    for (const [localTime, treatmentIds] of byTime) {
      if (treatmentIds.length >= 2) clusters.push({ localTime, treatmentIds });
    }
    if (clusters.length > 0) {
      clusters.sort((a, b) => a.localTime.localeCompare(b.localTime));
      result.set(date, clusters);
    }
  }
  return result;
}
