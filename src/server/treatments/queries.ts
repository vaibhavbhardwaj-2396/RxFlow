import {
  type AdherenceEventType,
  type AdherenceSummary,
  type OccurrenceStatus,
  summariseCounts,
} from "@/domain/adherence";
import { plainDate } from "@/domain/time";
import {
  describeDoseTimes,
  describeRecurrence,
  describeWindow,
} from "@/lib/schedule-summary";
import { type PhaseProgress, phaseProgress } from "@/lib/phase-progress";
import { type UpcomingChange, upcomingChanges } from "@/lib/phase-transitions";
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
  needsConfirmation: boolean;
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
      where: { userId },
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
      needsConfirmation: t.recurrence?.needsConfirmation ?? false,
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

export interface OccurrenceLine {
  id: string;
  localDate: string;
  localTime: string;
  status: OccurrenceStatus;
}

export interface AdherenceHistoryLine {
  localDate: string;
  localTime: string;
  type: AdherenceEventType;
}

export interface TreatmentDetail {
  id: string;
  name: string;
  category: string;
  status: string;
  needsConfirmation: boolean;
  weeklyCount: number | null;
  remindersEnabled: boolean;
  instructionsText: string | null;
  doseText: string | null;
  startedOn: string;
  scheduleVersion: number;
  recurrenceSummary: string;
  windowSummary: string;
  doseSummary: string;
  progress: PhaseProgress;
  nextChange: UpcomingChange | null;
  adherence: AdherenceSummary;
  upcoming: OccurrenceLine[];
  recent: OccurrenceLine[];
  history: AdherenceHistoryLine[];
}

/** Everything the `/treatments/[id]` page shows, or `null` if not the user's. */
export async function getTreatmentDetail(
  userId: string,
  id: string,
  today: string,
): Promise<TreatmentDetail | null> {
  const t = await prisma.treatment.findFirst({
    where: { id, userId },
    include: {
      recurrence: true,
      phaseCycle: { include: { phases: { orderBy: { orderIndex: "asc" } } } },
      doseTimes: { orderBy: { orderIndex: "asc" } },
    },
  });
  if (!t) return null;

  const [statusGroups, upcoming, recent, events, settings] = await Promise.all([
    prisma.scheduledOccurrence.groupBy({
      by: ["status"],
      where: { treatmentId: id },
      _count: { _all: true },
    }),
    prisma.scheduledOccurrence.findMany({
      where: { treatmentId: id, localDate: { gte: today } },
      orderBy: [{ localDate: "asc" }, { localTime: "asc" }],
      take: 8,
      select: { id: true, localDate: true, localTime: true, status: true },
    }),
    prisma.scheduledOccurrence.findMany({
      where: { treatmentId: id, localDate: { lt: today } },
      orderBy: [{ localDate: "desc" }, { localTime: "desc" }],
      take: 8,
      select: { id: true, localDate: true, localTime: true, status: true },
    }),
    prisma.adherenceEvent.findMany({
      where: { occurrence: { treatmentId: id } },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        type: true,
        occurrence: { select: { localDate: true, localTime: true } },
      },
    }),
    prisma.userSettings.findUnique({
      where: { userId },
      select: { defaultTimes: true },
    }),
  ]);

  const defaultTimes = (settings?.defaultTimes ?? {}) as Record<string, string>;
  const counts = Object.fromEntries(
    statusGroups.map((g) => [g.status, g._count._all]),
  ) as Partial<Record<OccurrenceStatus, number>>;

  const rule = t.recurrence ? recurrenceRuleFromRow(t.recurrence) : null;
  const cycle = t.phaseCycle
    ? phaseCycleFromRows(t.phaseCycle, t.phaseCycle.phases)
    : null;
  const specs = doseSpecsFromRows(t.doseTimes);
  const config = (t.recurrence?.config ?? {}) as { count?: number };

  return {
    id: t.id,
    name: t.name,
    category: t.category,
    status: t.status,
    needsConfirmation: t.recurrence?.needsConfirmation ?? false,
    weeklyCount:
      t.recurrence?.type === "times_per_week" &&
      typeof config.count === "number"
        ? config.count
        : null,
    remindersEnabled: t.remindersEnabled,
    instructionsText: t.instructionsText,
    doseText: t.doseText,
    startedOn: t.anchorDate,
    scheduleVersion: t.scheduleVersion,
    recurrenceSummary: rule ? describeRecurrence(rule) : "—",
    windowSummary: cycle ? describeWindow(plainDate(t.anchorDate), cycle) : "—",
    doseSummary:
      specs.length > 0 ? describeDoseTimes(specs, defaultTimes) : "—",
    progress: cycle
      ? phaseProgress(plainDate(t.anchorDate), cycle, plainDate(today))
      : {
          state: "active",
          label: "",
          fraction: null,
          dayOfPhase: null,
          phaseLength: null,
        },
    nextChange:
      cycle && !t.recurrence?.needsConfirmation
        ? (upcomingChanges(
            t.id,
            t.name,
            plainDate(t.anchorDate),
            cycle,
            plainDate(today),
          )[0] ?? null)
        : null,
    adherence: summariseCounts(counts),
    upcoming,
    recent,
    history: events.map((e) => ({
      localDate: e.occurrence.localDate,
      localTime: e.occurrence.localTime,
      type: e.type,
    })),
  };
}
