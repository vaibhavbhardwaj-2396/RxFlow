import { plainDate } from "@/domain/time";
import {
  describeDoseTimes,
  describeRecurrence,
  describeWindow,
} from "@/lib/schedule-summary";
import { prisma } from "@/server/db/client";

import {
  doseSpecsFromRows,
  phaseCycleFromRows,
  recurrenceRuleFromRow,
} from "./mappers";

export interface TreatmentListItem {
  id: string;
  name: string;
  category: string;
  status: string;
  recurrenceSummary: string;
  windowSummary: string;
  doseSummary: string;
  occurrenceCount: number;
  nextOccurrenceDate: string | null;
}

/** Everything the treatments list page needs, as plain view-models. */
export async function listTreatmentsForUser(
  userId: string,
  today: string,
): Promise<TreatmentListItem[]> {
  const [rows, upcoming, settings] = await Promise.all([
    prisma.treatment.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        recurrence: true,
        phaseCycle: { include: { phases: { orderBy: { orderIndex: "asc" } } } },
        doseTimes: { orderBy: { orderIndex: "asc" } },
        _count: { select: { occurrences: true } },
      },
    }),
    prisma.scheduledOccurrence.groupBy({
      by: ["treatmentId"],
      where: { userId, status: "scheduled", localDate: { gte: today } },
      _min: { localDate: true },
    }),
    prisma.userSettings.findUnique({
      where: { userId },
      select: { defaultTimes: true },
    }),
  ]);

  const nextByTreatment = new Map(
    upcoming.map((u) => [u.treatmentId, u._min.localDate]),
  );
  const defaultTimes = (settings?.defaultTimes ?? {}) as Record<string, string>;

  return rows.map((t) => {
    const rule = t.recurrence ? recurrenceRuleFromRow(t.recurrence) : null;
    const cycle = t.phaseCycle
      ? phaseCycleFromRows(t.phaseCycle, t.phaseCycle.phases)
      : null;
    const specs = doseSpecsFromRows(t.doseTimes);

    return {
      id: t.id,
      name: t.name,
      category: t.category,
      status: t.status,
      recurrenceSummary: rule ? describeRecurrence(rule) : "—",
      windowSummary: cycle
        ? describeWindow(plainDate(t.anchorDate), cycle)
        : "—",
      doseSummary:
        specs.length > 0 ? describeDoseTimes(specs, defaultTimes) : "—",
      occurrenceCount: t._count.occurrences,
      nextOccurrenceDate: nextByTreatment.get(t.id) ?? null,
    };
  });
}
