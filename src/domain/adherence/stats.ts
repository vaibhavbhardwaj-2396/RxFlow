import { type OccurrenceStatus, isPending } from "./state";

/**
 * Neutral counts for a set of occurrences (a day, a treatment, a week). Not a
 * score — the UI decides how to phrase it. Regimen never grades the user.
 */
export interface AdherenceSummary {
  total: number;
  completed: number;
  skipped: number;
  missed: number;
  /** Still waiting on the user: `scheduled` + `reminder_sent`. */
  pending: number;
}

export function summariseStatuses(
  statuses: OccurrenceStatus[],
): AdherenceSummary {
  const summary: AdherenceSummary = {
    total: statuses.length,
    completed: 0,
    skipped: 0,
    missed: 0,
    pending: 0,
  };
  for (const status of statuses) {
    if (status === "completed") summary.completed += 1;
    else if (status === "skipped") summary.skipped += 1;
    else if (status === "missed") summary.missed += 1;
    else if (isPending(status)) summary.pending += 1;
  }
  return summary;
}
