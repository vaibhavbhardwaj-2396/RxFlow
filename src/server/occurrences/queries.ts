import {
  type AdherenceSummary,
  type OccurrenceStatus,
  isPending,
  summariseStatuses,
} from "@/domain/adherence";
import {
  type DayPart,
  DAY_PART_LABEL,
  DAY_PART_ORDER,
  dayPart,
} from "@/lib/day-buckets";
import { prisma } from "@/server/db/client";

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

export interface ComingUpDay {
  localDate: string;
  count: number;
}

export interface TodayBoard {
  treatmentCount: number;
  sections: DaySection[];
  adherence: AdherenceSummary;
  comingUp: ComingUpDay[];
}

export async function getTodayBoard(
  userId: string,
  today: string,
  now: Date,
): Promise<TodayBoard> {
  const [treatmentCount, occurrences, comingUpRows] = await Promise.all([
    prisma.treatment.count({ where: { userId, deletedAt: null } }),
    prisma.scheduledOccurrence.findMany({
      where: { userId, localDate: today },
      orderBy: [{ localTime: "asc" }, { scheduledAt: "asc" }],
      select: {
        id: true,
        localTime: true,
        status: true,
        scheduledAt: true,
        treatment: { select: { name: true, doseText: true, category: true } },
      },
    }),
    prisma.scheduledOccurrence.groupBy({
      by: ["localDate"],
      where: { userId, status: "scheduled", localDate: { gt: today } },
      _count: { _all: true },
      orderBy: { localDate: "asc" },
      take: 3,
    }),
  ]);

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
    treatmentCount,
    sections,
    adherence: summariseStatuses(items.map((i) => i.status)),
    comingUp: comingUpRows.map((row) => ({
      localDate: row.localDate,
      count: row._count._all,
    })),
  };
}
