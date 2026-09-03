"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  type RecurrenceRule,
  type Weekday,
  generateOccurrences,
} from "@/domain/scheduling";
import { addDays, plainDate } from "@/domain/time";
import { INITIAL_HORIZON_DAYS } from "@/lib/treatment-mapping";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/client";
import { getRequestClock } from "@/server/time/request-clock";

import {
  doseSpecsFromRows,
  occurrenceCreateRows,
  phaseCycleFromRows,
} from "./mappers";

export interface ConfirmScheduleResult {
  error?: string;
}

/**
 * Resolve a "N times a week" treatment: the user picks which weekdays, the
 * recurrence becomes `specific_weekdays`, occurrences are generated, and the
 * treatment goes active.
 */
export async function confirmScheduleAction(
  treatmentId: string,
  weekdaysInput: unknown,
): Promise<ConfirmScheduleResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in again." };
  const userId = session.user.id;

  const weekdays = Array.isArray(weekdaysInput)
    ? [...new Set(weekdaysInput.map(Number))]
        .filter((n) => Number.isInteger(n) && n >= 1 && n <= 7)
        .sort((a, b) => a - b)
    : [];
  if (weekdays.length === 0) return { error: "Pick at least one day." };

  const treatment = await prisma.treatment.findFirst({
    where: { id: treatmentId, userId, deletedAt: null },
    include: {
      recurrence: true,
      phaseCycle: { include: { phases: { orderBy: { orderIndex: "asc" } } } },
      doseTimes: { orderBy: { orderIndex: "asc" } },
      user: { select: { settings: { select: { defaultTimes: true } } } },
    },
  });
  if (!treatment?.recurrence?.needsConfirmation || !treatment.phaseCycle) {
    return { error: "That treatment doesn't need a schedule choice." };
  }

  const clock = await getRequestClock();
  const anchor = plainDate(treatment.anchorDate);
  const newVersion = treatment.scheduleVersion + 1;
  const defaultTimes = (treatment.user.settings?.defaultTimes ?? {}) as Record<
    string,
    string
  >;

  const rule: RecurrenceRule = {
    type: "specific_weekdays",
    anchor,
    weekdays: weekdays as Weekday[],
  };

  const occurrences = generateOccurrences({
    anchor,
    recurrenceRule: rule,
    phaseCycle: phaseCycleFromRows(
      treatment.phaseCycle,
      treatment.phaseCycle.phases,
    ),
    doseTimes: doseSpecsFromRows(treatment.doseTimes),
    timezone: treatment.timezone,
    defaultTimes,
    scheduleVersion: newVersion,
    range: { from: anchor, to: addDays(anchor, INITIAL_HORIZON_DAYS) },
  });

  await prisma.$transaction([
    prisma.recurrenceRule.update({
      where: { treatmentId },
      data: {
        type: "specific_weekdays",
        config: { weekdays } as Prisma.InputJsonValue,
        needsConfirmation: false,
      },
    }),
    prisma.treatment.update({
      where: { id: treatmentId },
      data: {
        status: "active",
        confirmedAt: clock.now().toJSDate(),
        scheduleVersion: newVersion,
      },
    }),
    prisma.scheduledOccurrence.createMany({
      data: occurrenceCreateRows(occurrences, treatmentId, userId),
    }),
  ]);

  revalidatePath("/treatments");
  revalidatePath(`/treatments/${treatmentId}`);
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  redirect(`/treatments/${treatmentId}`);
}
