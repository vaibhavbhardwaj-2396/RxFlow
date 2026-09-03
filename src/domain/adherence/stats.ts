import type { OccurrenceStatus } from "./state";

/**
 * Neutral counts for a set of occurrences (a day, a treatment, a week). Not a
 * score — the UI decides how to phrase it. RxFlow never grades the user.
 */
export interface AdherenceSummary {
  total: number;
  completed: number;
  skipped: number;
  missed: number;
  /** Still waiting on the user: `scheduled` + `reminder_sent`. */
  pending: number;
}

/** Fold a `{ status: count }` map (e.g. a Prisma `groupBy`) into a summary. */
export function summariseCounts(
  counts: Partial<Record<OccurrenceStatus, number>>,
): AdherenceSummary {
  const at = (status: OccurrenceStatus) => counts[status] ?? 0;
  const pending = at("scheduled") + at("reminder_sent");
  return {
    completed: at("completed"),
    skipped: at("skipped"),
    missed: at("missed"),
    pending,
    total: at("completed") + at("skipped") + at("missed") + pending,
  };
}

export function summariseStatuses(
  statuses: OccurrenceStatus[],
): AdherenceSummary {
  const counts: Partial<Record<OccurrenceStatus, number>> = {};
  for (const status of statuses) {
    counts[status] = (counts[status] ?? 0) + 1;
  }
  return summariseCounts(counts);
}
