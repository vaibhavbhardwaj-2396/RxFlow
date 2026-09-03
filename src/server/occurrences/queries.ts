import {
  type AdherenceSummary,
  type OccurrenceStatus,
  isPending,
  summariseStatuses,
} from "@/domain/adherence";
import { type PlainDate, addDays, plainDate } from "@/domain/time";
import {
  type DayPart,
  DAY_PART_LABEL,
  DAY_PART_ORDER,
  dayPart,
} from "@/lib/day-buckets";
import { phaseTransitionsInRange } from "@/lib/phase-transitions";
import { prisma } from "@/server/db/client";
import { phaseCycleFromRows } from "@/server/treatments/mappers";

export interface OccurrenceCardVM {
  id: string;
  treatmentName: string;
  doseText: string | null;
  category: string;
  localTime: string;
  status: OccurrenceStatus;
  overdue: boolean;
}

export interface DaySection {
  part: DayPart;
  label: string;
  items: OccurrenceCardVM[];
}

export interface DayBoard {
  sections: DaySection[];
  adherence: AdherenceSummary;
}

/** One local date's doses, grouped by time of day. Shared by the dashboard and
 * the calendar's Day view. */
export async function getDayBoard(
  userId: string,
  date: string,
  now: Date,
): Promise<DayBoard> {
  const occurrences = await prisma.scheduledOccurrence.findMany({
    where: { userId, localDate: date },
    orderBy: [{ localTime: "asc" }, { scheduledAt: "asc" }],
    select: {
      id: true,
      localTime: true,
      status: true,
      scheduledAt: true,
      treatment: { select: { name: true, doseText: true, category: true } },
    },
  });

  const items: OccurrenceCardVM[] = occurrences.map((o) => ({
    id: o.id,
    treatmentName: o.treatment.name,
    doseText: o.treatment.doseText,
    category: o.treatment.category,
    localTime: o.localTime,
    status: o.status,
    overdue: isPending(o.status) && o.scheduledAt.getTime() < now.getTime(),
  }));

  const sections: DaySection[] = DAY_PART_ORDER.map((part) => ({
    part,
    label: DAY_PART_LABEL[part],
    items: items.filter((i) => dayPart(i.localTime) === part),
  })).filter((section) => section.items.length > 0);

  return {
    sections,
    adherence: summariseStatuses(items.map((i) => i.status)),
  };
}

export interface ComingUpDay {
  localDate: string;
  count: number;
}

export interface TodayBoard extends DayBoard {
  treatmentCount: number;
  comingUp: ComingUpDay[];
}

export async function getTodayBoard(
  userId: string,
  today: string,
  now: Date,
): Promise<TodayBoard> {
  const [board, treatmentCount, comingUpRows] = await Promise.all([
    getDayBoard(userId, today, now),
    prisma.treatment.count({ where: { userId, deletedAt: null } }),
    prisma.scheduledOccurrence.groupBy({
      by: ["localDate"],
      where: { userId, status: "scheduled", localDate: { gt: today } },
      _count: { _all: true },
      orderBy: { localDate: "asc" },
      take: 3,
    }),
  ]);

  return {
    ...board,
    treatmentCount,
    comingUp: comingUpRows.map((row) => ({
      localDate: row.localDate,
      count: row._count._all,
    })),
  };
}

// --- calendar ------------------------------------------------------------

export interface WeekCellDose {
  time: string;
  status: OccurrenceStatus;
}

export interface WeekGrid {
  treatments: Array<{ id: string; name: string }>;
  /** treatmentId → localDate → that day's doses. */
  cells: Record<string, Record<string, WeekCellDose[]>>;
}

export async function getWeekGrid(
  userId: string,
  days: string[],
): Promise<WeekGrid> {
  const rows = await prisma.scheduledOccurrence.findMany({
    where: { userId, localDate: { in: days } },
    orderBy: [{ localDate: "asc" }, { localTime: "asc" }],
    select: {
      localDate: true,
      localTime: true,
      status: true,
      treatmentId: true,
      treatment: { select: { name: true } },
    },
  });

  const names = new Map<string, string>();
  const cells: WeekGrid["cells"] = {};
  for (const r of rows) {
    names.set(r.treatmentId, r.treatment.name);
    const byDate = (cells[r.treatmentId] ??= {});
    (byDate[r.localDate] ??= []).push({ time: r.localTime, status: r.status });
  }

  return {
    treatments: [...names.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    cells,
  };
}

export interface MonthDayCell {
  total: number;
  completed: number;
  skipped: number;
  missed: number;
  pending: number;
}

export interface MonthTransition {
  kind: "break-start" | "break-end";
  treatment: string;
}

export interface MonthGrid {
  byDate: Record<string, MonthDayCell>;
  transitions: Record<string, MonthTransition[]>;
}

export async function getMonthGrid(
  userId: string,
  days: string[],
): Promise<MonthGrid> {
  const [statusRows, treatments] = await Promise.all([
    prisma.scheduledOccurrence.groupBy({
      by: ["localDate", "status"],
      where: { userId, localDate: { in: days } },
      _count: { _all: true },
    }),
    prisma.treatment.findMany({
      where: { userId, deletedAt: null },
      select: {
        name: true,
        anchorDate: true,
        phaseCycle: {
          include: { phases: { orderBy: { orderIndex: "asc" } } },
        },
      },
    }),
  ]);

  const byDate: Record<string, MonthDayCell> = {};
  for (const row of statusRows) {
    const cell = (byDate[row.localDate] ??= {
      total: 0,
      completed: 0,
      skipped: 0,
      missed: 0,
      pending: 0,
    });
    const n = row._count._all;
    cell.total += n;
    if (row.status === "completed") cell.completed += n;
    else if (row.status === "skipped") cell.skipped += n;
    else if (row.status === "missed") cell.missed += n;
    else cell.pending += n;
  }

  const from: PlainDate = plainDate(days[0]);
  const toExclusive: PlainDate = addDays(plainDate(days[days.length - 1]), 1);
  const transitions: MonthGrid["transitions"] = {};
  for (const t of treatments) {
    if (!t.phaseCycle) continue;
    const cycle = phaseCycleFromRows(t.phaseCycle, t.phaseCycle.phases);
    for (const tr of phaseTransitionsInRange(
      plainDate(t.anchorDate),
      cycle,
      from,
      toExclusive,
    )) {
      (transitions[tr.date] ??= []).push({
        kind: tr.kind,
        treatment: t.name,
      });
    }
  }

  return { byDate, transitions };
}
